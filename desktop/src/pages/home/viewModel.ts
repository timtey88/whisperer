import '@fontsource/roboto'
import { event, path } from '@tauri-apps/api'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { emit, listen } from '@tauri-apps/api/event'
import { basename } from '@tauri-apps/api/path'
import * as webview from '@tauri-apps/api/webviewWindow'
import * as dialog from '@tauri-apps/plugin-dialog'
import * as fs from '@tauri-apps/plugin-fs'
import { useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLocalStorage } from 'usehooks-ts'
import successSound from '~/assets/success.mp3'
import { TextFormat } from '~/components/FormatSelect'
import { AudioDevice } from '~/lib/audio'
import * as config from '~/lib/config'
import * as transcript from '~/lib/transcript'
import { useConfirmExit } from '~/lib/useConfirmExit'
import { NamedPath, ls, openPath, pathToNamedPath, startKeepAwake, stopKeepAwake, validateFileAndGetError, getSupportedFormatsString } from '~/lib/utils'
import { getX86Features } from '~/lib/x86Features'
import { ErrorModalContext } from '~/providers/ErrorModal'
import { useFilesContext } from '~/providers/FilesProvider'
import { useTranscription } from '~/providers/TranscriptionProvider'
import { ModelOptions, usePreferenceProvider } from '~/providers/Preference'
import { UpdaterContext } from '~/providers/Updater'

export interface BatchOptions {
	files: NamedPath[]
	format: TextFormat
	modelOptions: ModelOptions
}

export interface TranscriptionResult {
	fileName: string
	status: 'completed' | 'failed' | 'canceled' | 'incomplete'
	duration: number // in seconds
	startTime: number
	endTime: number
	error?: string
	modelPath?: string
	useGpu?: boolean
}

export function viewModel() {
	const location = useLocation()
	const [settingsVisible, setSettingsVisible] = useState(location.hash === '#settings')
	const navigate = useNavigate()
	const [isRecording, setIsRecording] = useState(false)
	const abortRef = useRef<boolean>(false)
	const [segments, setSegments] = useState<transcript.Segment[] | null>(null)
	const [summarizeSegments, setSummarizeSegments] = useState<transcript.Segment[] | null>(null)
	const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
	const [fileSize, setFileSize] = useState<number | null>(null)
	const [audioDuration] = useState<number | null>(null)
	const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null)
	const [showTranscriptionResult, setShowTranscriptionResult] = useState(false)
	const [transcriptTab, setTranscriptTab] = useLocalStorage<'transcript' | 'summary'>('prefs_transcript_tab', 'transcript')

	const { files, setFiles } = useFilesContext()
	const { 
		transcription, 
		startTranscription, 
		setSegments: setGlobalSegments,
		abortTranscription,
		completeTranscription,
		failTranscription,
		cancelTranscription
	} = useTranscription()
	const preference = usePreferenceProvider()
	const preferenceRef = useRef(preference)

	// Use global transcription state
	const loading = transcription.isActive
	const isAborting = transcription.isAborting
	const progress = transcription.current?.progress ?? null
	const currentPhase = transcription.current?.phase ?? 'Loading Model'

	useConfirmExit((segments?.length ?? 0) > 0 || loading)
	const [devices, setDevices] = useState<AudioDevice[]>([])
	const [inputDevice, setInputDevice] = useState<AudioDevice | null>(null)
	const [outputDevice, setOutputDevice] = useState<AudioDevice | null>(null)
	const [hasModels, setHasModels] = useState<boolean>(false)

	const { updateApp, availableUpdate } = useContext(UpdaterContext)
	const { setState: setErrorModal } = useContext(ErrorModalContext)

	async function onFilesChanged() {
		if (files.length === 1) {
			try {
				setAudio(new Audio(convertFileSrc(files[0].path)))
			} catch (error) {
				console.error('Failed to create audio:', error)
				setAudio(null)
			}
		} else {
			setAudio(null)
		}
	}

	function clearFiles() {
		setFiles([])
		setAudio(null)
		setSegments(null)
		setSummarizeSegments(null)
		setFileSize(null)
		setTranscriptionResult(null)
		setShowTranscriptionResult(false)
	}

	async function checkIfCrashedRecently() {
		const isCrashed = await invoke<boolean>('is_crashed_recently')
		if (isCrashed) {
			preference.setUseGpu(false)
			dialog.message('The application crashed recently. GPU acceleration has been disabled as a precaution.')
			await invoke('rename_crash_file')
		}
	}

	useEffect(() => {
		setFiles([])
		if (!(files.length === 1)) {
			setAudio(null)
		}
	}, [location])

	useEffect(() => {
		checkIfCrashedRecently()
	}, [])

	useEffect(() => {
		onFilesChanged()
	}, [files])



	useEffect(() => {
		preferenceRef.current = preference
	}, [preference])

	// Sync global transcription segments with local segments state for live updates
	useEffect(() => {
		if (transcription.current?.segments) {
			setSegments(transcription.current.segments)
		}
	}, [transcription.current?.segments])



	// handleNewSegment removed - now handled by TranscriptionProvider

	async function handleRecordFinish() {
		await listen<{ path: string; name: string }>('record_finish', (event) => {
			const { name, path } = event.payload
			preference.setHomeTabIndex(1)
			setFiles([{ name, path }])
			setIsRecording(false)
			transcribe(path)
		})
	}

	async function loadAudioDevices() {
		const newDevices = await invoke<AudioDevice[]>('get_audio_devices')
		const defaultInput = newDevices.find((d) => d.isDefault && d.isInput)
		const defaultOutput = newDevices.find((d) => d.isDefault && !d.isInput)
		if (defaultInput) {
			setInputDevice(defaultInput)
		}
		if (defaultOutput) {
			setOutputDevice(defaultOutput)
		}
		setDevices(newDevices)
	}

	async function onAbort() {
		abortTranscription()
		abortRef.current = true
		event.emit('abort_transcribe')
	}

	async function selectFiles() {
		const selected = await dialog.open({
			multiple: true,
			filters: [
				{
					name: 'Audio or Video files',
					extensions: [...config.audioExtensions, ...config.videoExtensions],
				},
			],
		})
		if (selected) {
			const newFiles: NamedPath[] = []
			for (const path of selected) {
				const name = await basename(path)
				newFiles.push({ path, name })
			}
			setFiles(newFiles)

			if (newFiles.length > 1) {
				navigate('/batch', { state: { files: newFiles } })
			}
		}
	}

	async function checkModelExists() {
		try {
			const configPath = await invoke<string>('get_models_folder')
			const entries = await ls(configPath)
			const filtered = entries.filter((e) => e.name?.endsWith('.bin'))
			if (filtered.length === 0) {
				// No models found - user needs to manually download models
				console.log('No models found. Please download a model manually from settings.')
				setHasModels(false)
			} else {
				// Models found - update state
				setHasModels(true)
				if (!preference.modelPath || !(await fs.exists(preference.modelPath))) {
					// if model path not found set another one as default
					const absPath = await path.join(configPath, filtered[0].name)
					preference.setModelPath(absPath)
				}
			}
		} catch (e) {
			console.error('Error checking models folder:', e)
			// Model folder might not exist yet, this is OK for manual setup
			setHasModels(false)
		}
	}

	async function handleDrop() {
		listen<{ paths: string[] }>('tauri://drag-drop', async (event) => {
			const newFiles: NamedPath[] = []
			const invalidFiles: string[] = []
			
			for (const path of event.payload.paths) {
				const file = await pathToNamedPath(path)
				const validation = validateFileAndGetError(file.name)
				
				if (validation.isValid) {
					newFiles.push({ name: file.name, path: file.path })
				} else {
					invalidFiles.push(file.name)
				}
			}
			
			// Show error for invalid files
			if (invalidFiles.length > 0) {
				const fileList = invalidFiles.join(', ')
				const errorMessage = invalidFiles.length === 1 
					? `Invalid file: ${fileList}. ${getSupportedFormatsString()}`
					: `Invalid files: ${fileList}. ${getSupportedFormatsString()}`
				
				toast.error(errorMessage, {
					duration: 5000,
					style: {
						maxWidth: '500px',
					},
				})
			}
			
			// Only set files if we have valid ones
			if (newFiles.length > 0) {
				setFiles(newFiles)
				if (newFiles.length > 1) {
					navigate('/batch', { state: { files: newFiles } })
				}
			} else if (invalidFiles.length > 0) {
				// Clear any existing files if all dropped files were invalid
				setFiles([])
			}
		})
	}

	async function checkVulkanOk() {
		try {
			await invoke('check_vulkan')
		} catch (error) {
			console.error(error)
			await dialog.message(
				`Your GPU is unsupported in this version of Whisperer. Please download a compatible version from the releases page.`,
				{
					kind: 'error',
				}
			)
		}
	}

	async function CheckCpuAndInit() {
		const features = await getX86Features()
		if (features) {
			const unsupported = Object.entries(features || {})
				.filter(([_, feature]) => feature.enabled && !feature.support)
				.map(([name]) => name)
			if (unsupported.length > 0) {
				// Found unsupported features
				await dialog.message(
					`Your CPU doesn't support some required features (${unsupported.join(
						','
					)}). The application may not work properly on this system.`,
					{
						kind: 'error',
					}
				)
				return // Don't run anything
			}
		}

		handleDrop()
		checkModelExists()
		handleRecordFinish()
		loadAudioDevices()
	}

	useEffect(() => {
		checkVulkanOk()
		CheckCpuAndInit()
	}, [])

	async function startRecord() {
		startKeepAwake()
		setSegments(null)
		setSummarizeSegments(null)
		setTranscriptTab('transcript')

		setIsRecording(true)
		const devices: AudioDevice[] = []
		if (inputDevice) {
			devices.push(inputDevice)
		}
		if (outputDevice) {
			devices.push(outputDevice)
		}
		invoke('start_record', { devices, storeInDocuments: preference.storeRecordInDocuments })
	}

	async function stopRecord() {
		emit('stop_record')
	}

	async function transcribe(path: string) {
		startKeepAwake()

		setSegments(null)
		setSummarizeSegments(null)
		setTranscriptTab('transcript')
		setShowTranscriptionResult(false) // Hide any previous result
		abortRef.current = false

		// Get file information and set up result tracking
		const fileName = await basename(path)
		const processStartTime = performance.now()

		// Start global transcription tracking
		startTranscription(
			{ fileName, filePath: path },
			{
				modelPath: preferenceRef.current.modelPath || undefined,
				useGpu: preferenceRef.current.useGpu || undefined,
				settings: { modelOptions: preferenceRef.current.modelOptions }
			}
		)
		
		// Basic audio file validation
		try {
			const fileInfo = await fs.stat(path)
			setFileSize(fileInfo.size)
			
			// Check if file is too small (likely corrupted or empty)
			if (fileInfo.size < 1024) { // Less than 1KB
				throw new Error(`Audio file is too small (${fileInfo.size} bytes). The file may be corrupted or empty.`)
			}
			
			// Check file extension for basic format validation
			const lowerPath = path.toLowerCase()
			const supportedExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.mp4', '.mov', '.avi', '.mkv', '.webm']
			const hasValidExtension = supportedExtensions.some(ext => lowerPath.endsWith(ext))
			
			if (!hasValidExtension) {
				console.warn('File extension may not be supported:', path)
			}
		} catch (error) {
			// If file validation fails, show error immediately
			const errorString = String(error)
			const processingDuration = Math.round((performance.now() - processStartTime) / 1000)
			
			setTranscriptionResult({
				fileName,
				status: 'failed',
				duration: processingDuration,
				startTime: Date.now(),
				endTime: Date.now(),
				error: errorString,
				modelPath: preferenceRef.current.modelPath || undefined,
				useGpu: preferenceRef.current.useGpu || undefined
			})
			setShowTranscriptionResult(true)
			
			// Update global state
			failTranscription(errorString, processingDuration)
			
			stopKeepAwake()
			setErrorModal?.({ log: errorString, open: true })
			return // Exit early if validation fails
		}

		const modelPath = preferenceRef.current.modelPath
		try {
			await invoke('load_model', { modelPath, gpuDevice: preferenceRef.current.gpuDevice, useGpu: preferenceRef.current.useGpu })
			
			const options = {
				path,
				...preferenceRef.current.modelOptions,
			}
			
			const diarizeOptions = { threshold: preferenceRef.current.diarizeThreshold, max_speakers: preferenceRef.current.maxSpeakers, enabled: preferenceRef.current.recognizeSpeakers }
			const res: transcript.Transcript = await invoke('transcribe', {
				options,
				modelPath,
				diarizeOptions,
				ffmpegOptions: preferenceRef.current.ffmpegOptions,
			})

			// Calculate time
			const processingDuration = Math.round((performance.now() - processStartTime) / 1000)
			console.info(`Transcribe took ${processingDuration} seconds.`)

			setSegments(res.segments)
			setGlobalSegments(res.segments)
			
			// Set successful transcription result for local display
			const transcriptionEndTime = Date.now()
			const transcriptionResult = {
				fileName,
				status: 'completed' as const,
				duration: processingDuration,
				startTime: transcriptionEndTime - (processingDuration * 1000),
				endTime: transcriptionEndTime,
				modelPath: modelPath || undefined,
				useGpu: preferenceRef.current.useGpu || undefined
			}
			setTranscriptionResult(transcriptionResult)
			setShowTranscriptionResult(true)
			
			// Complete global transcription (this will update history)
			completeTranscription(res.segments, processingDuration)
			
			toast.success(`Transcription completed in ${processingDuration} seconds`, { position: 'bottom-center' })
		} catch (error) {
			const processingDuration = Math.round((performance.now() - processStartTime) / 1000)
			const transcriptionEndTime = Date.now()
			
			if (abortRef.current) {
				// Transcription was canceled
				const transcriptionResult = {
					fileName,
					status: 'canceled' as const,
					duration: processingDuration,
					startTime: transcriptionEndTime - (processingDuration * 1000),
					endTime: transcriptionEndTime,
					modelPath: modelPath || undefined,
					useGpu: preferenceRef.current.useGpu || undefined
				}
				setTranscriptionResult(transcriptionResult)
				setShowTranscriptionResult(true)
				
				// Cancel global transcription (this will update history)
				cancelTranscription(processingDuration)
			} else {
				// Transcription failed - provide better error messages
				const errorString = String(error)
				let userFriendlyError = errorString
				
				// Check for common whisper encoding errors
				if (errorString.includes('failed to encode') || errorString.includes('whisper_full_with_state')) {
					userFriendlyError = `Audio encoding failed. This might be due to:
• Corrupted or invalid audio file
• Unsupported audio format
• File may be too short or empty
• Try converting to a different audio format (WAV, MP3, etc.)

Original error: ${errorString}`
				} else if (errorString.includes('audio file doesn\'t exist')) {
					userFriendlyError = `Audio file not found. Please check if the file exists and try again.`
				} else if (errorString.includes('no segments found')) {
					userFriendlyError = `No speech detected in the audio file. Please check if:
• The audio file contains spoken content
• The audio volume is sufficient
• The file is not corrupted`
				} else if (errorString.includes('failed to load model')) {
					userFriendlyError = `Model loading failed. Please check if:
• The model file exists and is not corrupted
• You have sufficient memory available
• Try restarting the application`
				}
				
				const transcriptionResult = {
					fileName,
					status: 'failed' as const,
					duration: processingDuration,
					startTime: transcriptionEndTime - (processingDuration * 1000),
					endTime: transcriptionEndTime,
					error: userFriendlyError,
					modelPath: modelPath || undefined,
					useGpu: preferenceRef.current.useGpu || undefined
				}
				setTranscriptionResult(transcriptionResult)
				setShowTranscriptionResult(true)
				
				// Fail global transcription (this will update history)
				failTranscription(userFriendlyError, processingDuration)
				
				stopKeepAwake()
				console.error('Transcription error: ', error)
				setErrorModal?.({ log: userFriendlyError, open: true })
			}
		} finally {
			stopKeepAwake()
			if (!abortRef.current) {
				// Focus back the window and play sound
				if (preferenceRef.current.soundOnFinish) {
					new Audio(successSound).play()
				}
				if (preferenceRef.current.focusOnFinish) {
					webview.getCurrentWebviewWindow().unminimize()
					webview.getCurrentWebviewWindow().setFocus()
				}
			}
		}

	}


	return {
		transcriptTab,
		setTranscriptTab,
		summarizeSegments,
		setSummarizeSegments,
		devices,
		setDevices,
		inputDevice,
		setInputDevice,
		outputDevice,
		setOutputDevice,
		isRecording,
		setIsRecording,
		startRecord,
		stopRecord,
		preference: preference,
		openPath,
		selectFiles,
		isAborting,
		settingsVisible,
		setSettingsVisible,
		loading,
		progress,
		currentPhase,
		fileSize,
		audioDuration,
		audio,
		setAudio,
		files,
		setFiles,
		availableUpdate,
		updateApp,
		segments,
		setSegments,
		transcribe,
		onAbort,
		transcriptionResult,
		setTranscriptionResult,
		showTranscriptionResult,
		setShowTranscriptionResult,
		clearFiles,
		hasModels,
	}
}
