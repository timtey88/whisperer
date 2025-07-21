import { ReactNode, createContext, useContext, useEffect } from 'react'
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
	isCompleting: boolean
	error?: string
}

interface TranscriptionContextValue {
	transcription: TranscriptionState
	startTranscription: (file: { fileName: string; filePath: string }, options?: {
		modelPath?: string
		useGpu?: boolean
		settings?: any
	}) => Promise<string>
	updateProgress: (progress: number, phase: string) => void
	setSegments: (segments: any[]) => void
	abortTranscription: () => void
	completeTranscription: (segments?: any[], processingDuration?: number) => Promise<void>
	failTranscription: (error: string, processingDuration?: number) => Promise<void>
	cancelTranscription: (processingDuration?: number) => Promise<void>
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
		isCompleting: false,
		error: undefined
	})

	// Use transcriptionState directly - no separate memory state needed

	// Set up Tauri event listeners for progress updates
	useEffect(() => {
		let progressUnlisten: (() => void) | undefined
		let segmentUnlisten: (() => void) | undefined
		let completionUnlisten: (() => void) | undefined

		const setupListeners = async () => {
			// Listen for transcription progress
			progressUnlisten = await listen('transcribe_progress', (event) => {
				const value = event.payload as number
				if (value >= 0 && value <= 100 && transcriptionState.current) {
					let phase = transcriptionState.current.phase
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
				console.log('Received new segment:', payload)
				
				// Use functional state update to avoid stale closure
				setTranscriptionState(currentState => {
					if (currentState.current) {
						const existingSegments = currentState.current.segments || []
						const updatedSegments = [...existingSegments, payload]
						console.log('Accumulating segments. Total:', updatedSegments.length)
						
						return {
							...currentState,
							current: {
								...currentState.current,
								segments: updatedSegments
							}
						}
					}
					return currentState
				})
			})

			// Listen for transcription completion
			completionUnlisten = await listen<any>('transcription_complete', (event) => {
				const transcript = event.payload
				console.log('Received transcription_complete event:', transcript)
				
				// Calculate processing duration if we have start time
				let processingDuration: number | undefined
				if (transcriptionState.current?.startTime) {
					processingDuration = Math.round((Date.now() - transcriptionState.current.startTime) / 1000)
				}
				
				// Automatically complete the transcription
				completeTranscription(transcript.segments, processingDuration).catch(error => {
					console.error('Failed to auto-complete transcription from event:', error)
				})
			})
		}

		if (transcriptionState.isActive) {
			setupListeners()
		}

		return () => {
			progressUnlisten?.()
			segmentUnlisten?.()
			completionUnlisten?.()
		}
	}, [transcriptionState.isActive])

	// Check for orphaned processing entries on mount (browser refresh scenario)
	useEffect(() => {
		const processingEntry = getProcessingEntry()
		if (processingEntry && !transcriptionState.isActive) {
			// There's a processing entry but no active transcription - likely app was restarted
			// Mark it as incomplete
			updateHistoryEntry(processingEntry.id, {
				status: 'incomplete',
				endTime: Date.now(),
				duration: Math.round((Date.now() - processingEntry.startTime) / 1000)
			})
		}
	}, [])

	// Clear stale abort state on app startup
	useEffect(() => {
		if (transcriptionState.isAborting && !transcriptionState.isActive) {
			console.log('Clearing stale abort state from localStorage')
			// App was restarted while in abort state - clear it
			const clearedState = {
				isActive: false,
				current: null,
				isAborting: false,
				isCompleting: false,
				error: undefined
			}
			setTranscriptionState(clearedState)
		}
	}, [])

	const updateState = (updates: Partial<TranscriptionState>) => {
		const newState = { ...transcriptionState, ...updates }
		
		// Validate state before updating to prevent invalid combinations
		const validatedState = { ...newState }
		
		// Rule: isAborting should be false when isActive is false
		if (!validatedState.isActive && validatedState.isAborting) {
			console.log('Clearing isAborting flag because transcription is not active')
			validatedState.isAborting = false
		}
		
		// Rule: isCompleting should be false when isActive is false  
		if (!validatedState.isActive && validatedState.isCompleting) {
			console.log('Clearing isCompleting flag because transcription is not active')
			validatedState.isCompleting = false
		}
		
		// Rule: current should be null when isActive is false
		if (!validatedState.isActive && validatedState.current) {
			console.log('Clearing current transcription because isActive is false')
			validatedState.current = null
		}
		
		setTranscriptionState(validatedState)
	}

	const startTranscription = async (
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

		try {
			// Add processing entry to history immediately
			await addHistoryEntry({
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
				isCompleting: false,
				error: undefined
			})

			return id
		} catch (error) {
			console.error('Failed to start transcription:', error)
			throw error
		}
	}

	const updateProgress = (progress: number, phase: string) => {
		if (!transcriptionState.current || transcriptionState.isCompleting) {
			console.log('Skipping progress update - no current transcription or completing:', { 
				hasCurrent: !!transcriptionState.current, 
				isCompleting: transcriptionState.isCompleting,
				progress,
				phase 
			})
			return
		}

		console.log('Updating progress:', { progress, phase })

		// Update transcription state
		updateState({
			current: {
				...transcriptionState.current,
				progress,
				phase
			}
		})

		// Update history entry with current progress (async, but don't block)
		const processingEntry = getProcessingEntry()
		if (processingEntry) {
			updateHistoryEntry(processingEntry.id, {
				progress,
				phase
			}).catch(error => {
				console.error('Failed to update progress in history:', error)
			})
		}
	}

	const setSegments = (segments: any[]) => {
		if (!transcriptionState.current) return

		updateState({
			current: {
				...transcriptionState.current,
				segments
			}
		})
	}

	const abortTranscription = () => {
		updateState({
			isAborting: true
		})
	}

	const completeTranscription = async (segments?: any[], processingDuration?: number) => {
		const clearState = () => {
			const clearedState = {
				isActive: false,
				current: null,
				isAborting: false,
				isCompleting: false,
				error: undefined
			}
			setTranscriptionState(clearedState)
		}

		try {
			// Set completing flag to prevent progress updates from overriding completion
			console.log('Setting completion flag to prevent progress update races')
			updateState({
				isCompleting: true
			})

			const processingEntry = getProcessingEntry()
			if (processingEntry && transcriptionState.current) {
				const endTime = Date.now()
				const duration = processingDuration || Math.round((endTime - processingEntry.startTime) / 1000)
				
				console.log('Completing transcription for:', processingEntry.fileName, 'with status: completed, progress: 100')
				
				// Wait for history update to complete before clearing state
				await updateHistoryEntry(processingEntry.id, {
					status: 'completed',
					endTime,
					duration,
					progress: 100,
					phase: 'Completed',
					segments: segments || transcriptionState.current.segments
				})
				
				console.log('History entry updated successfully, clearing transcription state')
			}

			// Only clear state after successful history update
			clearState()
		} catch (error) {
			console.error('Failed to complete transcription:', error)
			// Still clear state but log the error for debugging
			clearState()
		}
	}

	const failTranscription = async (error: string, processingDuration?: number) => {
		try {
			const processingEntry = getProcessingEntry()
			if (processingEntry) {
				const endTime = Date.now()
				const duration = processingDuration || Math.round((endTime - processingEntry.startTime) / 1000)
				
				await updateHistoryEntry(processingEntry.id, {
					status: 'failed',
					endTime,
					duration,
					progress: 0,
					phase: 'Failed',
					error
				})
			}

			// Clear both memory and localStorage state immediately
			const clearedState = {
				isActive: false,
				current: null,
				isAborting: false,
				isCompleting: false,
				error
			}
			setTranscriptionState(clearedState)
		} catch (updateError) {
			console.error('Failed to update failed transcription in history:', updateError)
			// Still clear the state even if history update fails
			const clearedState = {
				isActive: false,
				current: null,
				isAborting: false,
				isCompleting: false,
				error
			}
			setTranscriptionState(clearedState)
		}
	}

	const cancelTranscription = async (processingDuration?: number) => {
		try {
			const processingEntry = getProcessingEntry()
			if (processingEntry) {
				const endTime = Date.now()
				const duration = processingDuration || Math.round((endTime - processingEntry.startTime) / 1000)
				
				await updateHistoryEntry(processingEntry.id, {
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
				isCompleting: false,
				error: undefined
			}
			setTranscriptionState(clearedState)
		} catch (updateError) {
			console.error('Failed to update canceled transcription in history:', updateError)
			// Still clear the state even if history update fails
			const clearedState = {
				isActive: false,
				current: null,
				isAborting: false,
				isCompleting: false,
				error: undefined
			}
			setTranscriptionState(clearedState)
		}
	}

	const clearTranscription = () => {
		// Clear both memory and localStorage state immediately
		const clearedState = {
			isActive: false,
			current: null,
			isAborting: false,
			isCompleting: false,
			error: undefined
		}
		setTranscriptionState(clearedState)
	}

	const contextValue: TranscriptionContextValue = {
		transcription: transcriptionState,
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