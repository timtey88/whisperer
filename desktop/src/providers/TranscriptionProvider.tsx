import { ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { listen } from '@tauri-apps/api/event'
import { useHistory } from './HistoryProvider'

export interface CurrentTranscription {
	id: string
	fileName: string
	filePath: string
	progress: number
	phase: string
	startTime: number
	modelPath?: string
	useGpu?: boolean
	settings?: {
		modelOptions?: any
	}
	segments?: any[]
}

interface TranscriptionState {
	isActive: boolean
	current: CurrentTranscription | null
	isAborting: boolean
	error?: string
}

interface TranscriptionContextValue {
	transcription: TranscriptionState
	startTranscription: (file: { fileName: string; filePath: string }, options?: {
		modelPath?: string
		useGpu?: boolean
		settings?: any
	}) => string
	updateProgress: (progress: number, phase: string) => void
	setSegments: (segments: any[]) => void
	abortTranscription: () => void
	completeTranscription: (segments?: any[], processingDuration?: number) => void
	failTranscription: (error: string, processingDuration?: number) => void
	cancelTranscription: (processingDuration?: number) => void
	clearTranscription: () => void
}

const TranscriptionContext = createContext<TranscriptionContextValue | null>(null)

export function TranscriptionProvider({ children }: { children: ReactNode }) {
	const { addHistoryEntry, updateHistoryEntry, getProcessingEntry } = useHistory()
	
	// Use localStorage to persist transcription state across page navigation
	const [transcriptionState, setTranscriptionState] = useLocalStorage<TranscriptionState>('current_transcription', {
		isActive: false,
		current: null,
		isAborting: false,
		error: undefined
	})

	// Also keep state in memory for immediate updates
	const [memoryState, setMemoryState] = useState<TranscriptionState>(transcriptionState)

	// Sync memory state with localStorage
	useEffect(() => {
		setMemoryState(transcriptionState)
	}, [transcriptionState])

	// Set up Tauri event listeners for progress updates
	useEffect(() => {
		let progressUnlisten: (() => void) | undefined
		let segmentUnlisten: (() => void) | undefined

		const setupListeners = async () => {
			// Listen for transcription progress
			progressUnlisten = await listen('transcribe_progress', (event) => {
				const value = event.payload as number
				if (value >= 0 && value <= 100 && memoryState.current) {
					let phase = memoryState.current.phase
					// Update phase based on progress
					if (value >= 10 && value < 95) {
						phase = 'Transcribing'
					} else if (value >= 95) {
						phase = 'Post-Processing'
					}
					
					updateProgress(value, phase)
				}
			})

			// Listen for new segments
			segmentUnlisten = await listen<any>('new_segment', (event) => {
				const { payload } = event
				if (memoryState.current) {
					const updatedSegments = memoryState.current.segments ? [...memoryState.current.segments, payload] : [payload]
					setSegments(updatedSegments)
				}
			})
		}

		if (memoryState.isActive) {
			setupListeners()
		}

		return () => {
			progressUnlisten?.()
			segmentUnlisten?.()
		}
	}, [memoryState.isActive])

	// Check for orphaned processing entries on mount (browser refresh scenario)
	useEffect(() => {
		const processingEntry = getProcessingEntry()
		if (processingEntry && !memoryState.isActive) {
			// There's a processing entry but no active transcription - likely app was restarted
			// Mark it as incomplete
			updateHistoryEntry(processingEntry.id, {
				status: 'incomplete',
				endTime: Date.now(),
				duration: Math.round((Date.now() - processingEntry.startTime) / 1000)
			})
		}
	}, [])

	const updateState = (updates: Partial<TranscriptionState>) => {
		const newState = { ...memoryState, ...updates }
		setMemoryState(newState)
		setTranscriptionState(newState)
	}

	const startTranscription = (
		file: { fileName: string; filePath: string }, 
		options?: {
			modelPath?: string
			useGpu?: boolean
			settings?: any
		}
	) => {
		const startTime = Date.now()
		const id = `${startTime}-${Math.random().toString(36).substr(2, 9)}`
		
		const newTranscription: CurrentTranscription = {
			id,
			fileName: file.fileName,
			filePath: file.filePath,
			progress: 0,
			phase: 'Loading Model',
			startTime,
			modelPath: options?.modelPath,
			useGpu: options?.useGpu,
			settings: options?.settings
		}

		// Add processing entry to history immediately
		addHistoryEntry({
			fileName: file.fileName,
			filePath: file.filePath,
			status: 'processing',
			duration: 0,
			startTime,
			endTime: 0, // Will be set when completed
			progress: 0,
			phase: 'Loading Model',
			modelPath: options?.modelPath,
			useGpu: options?.useGpu,
			settings: options?.settings
		})

		updateState({
			isActive: true,
			current: newTranscription,
			isAborting: false,
			error: undefined
		})

		return id
	}

	const updateProgress = (progress: number, phase: string) => {
		if (!memoryState.current) return

		// Update transcription state
		updateState({
			current: {
				...memoryState.current,
				progress,
				phase
			}
		})

		// Update history entry with current progress
		const processingEntry = getProcessingEntry()
		if (processingEntry) {
			updateHistoryEntry(processingEntry.id, {
				progress,
				phase
			})
		}
	}

	const setSegments = (segments: any[]) => {
		if (!memoryState.current) return

		updateState({
			current: {
				...memoryState.current,
				segments
			}
		})
	}

	const abortTranscription = () => {
		updateState({
			isAborting: true
		})
	}

	const completeTranscription = (segments?: any[], processingDuration?: number) => {
		const processingEntry = getProcessingEntry()
		if (processingEntry && memoryState.current) {
			const endTime = Date.now()
			const duration = processingDuration || Math.round((endTime - processingEntry.startTime) / 1000)
			
			updateHistoryEntry(processingEntry.id, {
				status: 'completed',
				endTime,
				duration,
				progress: 100,
				phase: 'Completed',
				segments: segments || memoryState.current.segments
			})
		}

		// Clear both memory and localStorage state immediately
		const clearedState = {
			isActive: false,
			current: null,
			isAborting: false,
			error: undefined
		}
		setMemoryState(clearedState)
		setTranscriptionState(clearedState)
	}

	const failTranscription = (error: string, processingDuration?: number) => {
		const processingEntry = getProcessingEntry()
		if (processingEntry) {
			const endTime = Date.now()
			const duration = processingDuration || Math.round((endTime - processingEntry.startTime) / 1000)
			
			updateHistoryEntry(processingEntry.id, {
				status: 'failed',
				endTime,
				duration,
				error
			})
		}

		// Clear both memory and localStorage state immediately
		const clearedState = {
			isActive: false,
			current: null,
			isAborting: false,
			error
		}
		setMemoryState(clearedState)
		setTranscriptionState(clearedState)
	}

	const cancelTranscription = (processingDuration?: number) => {
		const processingEntry = getProcessingEntry()
		if (processingEntry) {
			const endTime = Date.now()
			const duration = processingDuration || Math.round((endTime - processingEntry.startTime) / 1000)
			
			updateHistoryEntry(processingEntry.id, {
				status: 'canceled',
				endTime,
				duration
			})
		}

		// Clear both memory and localStorage state immediately
		const clearedState = {
			isActive: false,
			current: null,
			isAborting: false,
			error: undefined
		}
		setMemoryState(clearedState)
		setTranscriptionState(clearedState)
	}

	const clearTranscription = () => {
		// Clear both memory and localStorage state immediately
		const clearedState = {
			isActive: false,
			current: null,
			isAborting: false,
			error: undefined
		}
		setMemoryState(clearedState)
		setTranscriptionState(clearedState)
	}

	const contextValue: TranscriptionContextValue = {
		transcription: memoryState,
		startTranscription,
		updateProgress,
		setSegments,
		abortTranscription,
		completeTranscription,
		failTranscription,
		cancelTranscription,
		clearTranscription
	}

	return (
		<TranscriptionContext.Provider value={contextValue}>
			{children}
		</TranscriptionContext.Provider>
	)
}

export function useTranscription() {
	const context = useContext(TranscriptionContext)
	if (!context) {
		throw new Error('useTranscription must be used within a TranscriptionProvider')
	}
	return context
}