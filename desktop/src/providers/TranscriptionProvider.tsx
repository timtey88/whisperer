import { ReactNode, createContext, useContext, useEffect, useRef } from 'react'
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
	// Note: segments are now stored in history, not here
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
	updateProgress: (progress: number, phase: string) => Promise<void>
	setSegments: (segments: any[]) => void
	abortTranscription: () => void
	completeTranscription: (segments?: any[], processingDuration?: number) => Promise<void>
	failTranscription: (error: string, processingDuration?: number) => Promise<void>
	cancelTranscription: (processingDuration?: number) => Promise<void>
	clearTranscription: () => void
}

const TranscriptionContext = createContext<TranscriptionContextValue | null>(null)

export function TranscriptionProvider({ children }: { children: ReactNode }) {
	const { addHistoryEntry, updateHistoryEntry, getProcessingEntry, getProcessingEntryFromStorage, addSegment } = useHistory()
	
	// Use localStorage to persist transcription state across page navigation
	const [transcriptionState, setTranscriptionState] = useLocalStorage<TranscriptionState>('current_transcription', {
		isActive: false,
		current: null,
		isAborting: false,
		isCompleting: false,
		error: undefined
	})

	const stateRef = useRef(transcriptionState)
	useEffect(() => {
		stateRef.current = transcriptionState
	}, [transcriptionState])

	// Use transcriptionState directly - no separate memory state needed

	// Store listener cleanup functions for proper cleanup
	const listenerCleanupRef = useRef<{
		progressUnlisten?: () => void
		segmentUnlisten?: () => void  
		completionUnlisten?: () => void
	}>({})

	// Store audio duration cache for progress estimation
	const audioDurationRef = useRef<number | null>(null)

	// Progress estimation based on segment timestamps since backend doesn't emit progress events
	const estimateProgressFromSegment = async (segment: any) => {
		const currentState = stateRef.current
		if (!currentState.current || currentState.isCompleting) {
			return
		}

		try {
			// Get audio duration if not cached
			if (!audioDurationRef.current && currentState.current.filePath) {
				audioDurationRef.current = await getAudioDuration(currentState.current.filePath)
			}

			const segmentEndTime = segment.stop || segment.end || 0 // in milliseconds
			let audioDuration = audioDurationRef.current || 0 // in milliseconds

			// Dynamic estimation refinement: if segment extends beyond our estimated duration,
			// adjust the duration estimate upward (conservative approach)
			if (segmentEndTime > audioDuration * 0.8) {
				const newEstimate = segmentEndTime * 1.2 // Add 20% buffer for remaining audio
				if (newEstimate > audioDuration) {
					audioDuration = newEstimate
					audioDurationRef.current = newEstimate
					console.log('🔥 PROGRESS ESTIMATION - Refined duration estimate:', {
						oldEstimate: audioDurationRef.current,
						newEstimate,
						segmentEndTime
					})
				}
			}

			if (audioDuration > 0 && segmentEndTime > 0) {
				// Calculate progress percentage based on segment timing
				const rawProgress = Math.min(95, (segmentEndTime / audioDuration) * 100)
				const estimatedProgress = Math.floor(rawProgress)

				// Determine phase based on progress and segment activity
				let phase = currentState.current.phase
				if (estimatedProgress >= 1 && phase === 'Loading Model') {
					phase = 'Transcribing'
				} else if (estimatedProgress >= 90) {
					phase = 'Post-Processing'
				}

				// Only update if progress has meaningfully changed (at least 1% or phase change)
				if (estimatedProgress > currentState.current.progress || phase !== currentState.current.phase) {
					console.log('🔥 PROGRESS ESTIMATION - Updating based on segment timing:', {
						segmentEndTime,
						audioDuration,
						estimatedProgress,
						currentProgress: currentState.current.progress,
						newPhase: phase,
						currentPhase: currentState.current.phase
					})
					
					await updateProgress(estimatedProgress, phase)
				}
			}
		} catch (error) {
			console.error('🔥 PROGRESS ESTIMATION - Failed to estimate progress from segment:', error)
		}
	}

	// Get audio file duration using Web Audio API or fallback estimation
	const getAudioDuration = async (filePath: string): Promise<number> => {
		try {
			// First try using HTML5 audio element for better Tauri compatibility
			const audio = new Audio()
			
			const loadAudio = () => new Promise<number>((resolve, reject) => {
				audio.onloadedmetadata = () => {
					const durationMs = audio.duration * 1000
					console.log('🔥 AUDIO DURATION - Detected using HTML5 Audio:', { filePath, durationMs })
					resolve(durationMs)
				}
				audio.onerror = () => reject(new Error('Failed to load audio metadata'))
				audio.src = `file://${filePath}`
			})

			const duration = await Promise.race([
				loadAudio(),
				new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
			])

			return duration
		} catch (error) {
			console.warn('🔥 AUDIO DURATION - HTML5 Audio failed, using dynamic estimation:', error)
			
			// Fallback: Dynamic estimation based on segment progression
			// Start with a conservative estimate and adjust as segments arrive
			return 60000 // Default 60 seconds - will be refined dynamically
		}
	}

	// Standalone function to set up listeners - called before transcription starts
	const setupListeners = async () => {
		console.log('🔥 LISTENER DEBUG - Setting up event listeners BEFORE transcription starts')
		
		// Clean up existing listeners first
		cleanupListeners()

		try {
			// Listen for transcription progress
			listenerCleanupRef.current.progressUnlisten = await listen('transcribe_progress', async (event) => {
				const value = event.payload as number
				const currentState = stateRef.current
				if (value >= 0 && value <= 100 && currentState.current) {
					let phase = currentState.current.phase
					// Update phase based on progress
					if (value >= 10 && value < 95) {
						phase = 'Transcribing'
					} else if (value >= 95) {
						phase = 'Post-Processing'
					}
					
					await updateProgress(value, phase)
				}
			})

			// Listen for new segments - append directly to segments array in history
			listenerCleanupRef.current.segmentUnlisten = await listen<any>('new_segment', async (event) => {
				const { payload } = event
				console.log('🔥 SEGMENT DEBUG - Received new segment event:', {
					payload,
					timestamp: new Date().toISOString(),
					payloadType: typeof payload,
					isArray: Array.isArray(payload)
				})
				
				// Find the current processing entry using storage-based method for fresh data
				const processingEntry = await getProcessingEntryFromStorage()
				if (processingEntry) {
					console.log('🔥 SEGMENT DEBUG - Processing entry found from storage:', {
						entryId: processingEntry.id,
						currentSegmentCount: processingEntry.segments?.length || 0,
						currentSegments: processingEntry.segments?.map(s => ({ start: s.start, stop: s.stop, text: s.text.substring(0, 30) + '...' }))
					})
					
					// We await the segment addition to prevent race conditions with the progress update that follows.
					await addSegment(processingEntry.id, payload).catch(error => {
						console.error('🔥 SEGMENT DEBUG - Failed to add segment to history:', error)
					})
					console.log('🔥 SEGMENT DEBUG - Initiated addSegment for entry:', processingEntry.id)
					
					// Estimate progress based on segment timing since backend doesn't emit progress events
					await estimateProgressFromSegment(payload)
				} else {
					console.warn('🔥 SEGMENT DEBUG - No processing entry found for new segment (from storage)')
				}
			})

			// Listen for transcription completion
			listenerCleanupRef.current.completionUnlisten = await listen<any>('transcription_complete', (event) => {
				const transcript = event.payload
				console.log('Received transcription_complete event:', transcript)
				
				const currentState = stateRef.current
				// Calculate processing duration if we have start time
				let processingDuration: number | undefined
				if (currentState.current?.startTime) {
					processingDuration = Math.round((Date.now() - currentState.current.startTime) / 1000)
				}
				
				// Automatically complete the transcription
				completeTranscription(transcript.segments, processingDuration).catch(error => {
					console.error('Failed to auto-complete transcription from event:', error)
				})
			})

			console.log('🔥 LISTENER DEBUG - All event listeners set up successfully')
		} catch (error) {
			console.error('🔥 LISTENER DEBUG - Failed to set up listeners:', error)
			throw error
		}
	}

	// Function to clean up listeners
	const cleanupListeners = () => {
		console.log('🔥 LISTENER DEBUG - Cleaning up event listeners')
		listenerCleanupRef.current.progressUnlisten?.()
		listenerCleanupRef.current.segmentUnlisten?.()
		listenerCleanupRef.current.completionUnlisten?.()
		listenerCleanupRef.current = {}
	}

	// Clean up listeners when transcription becomes inactive  
	useEffect(() => {
		if (!transcriptionState.isActive) {
			cleanupListeners()
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

	// Force clear any corrupted localStorage state on app startup
	useEffect(() => {
		// Nuclear option: clear any corrupted state
		if (transcriptionState.isAborting || (transcriptionState.isActive && !transcriptionState.current)) {
			console.log('Detected corrupted state, force clearing localStorage')
			localStorage.removeItem('current_transcription')
			localStorage.removeItem('transcription_history')
			
			// Force reset to clean state
			const cleanState = {
				isActive: false,
				current: null,
				isAborting: false,
				isCompleting: false,
				error: undefined
			}
			setTranscriptionState(cleanState)
		}
	}, [])

	const updateState = (updates: Partial<TranscriptionState>) => {
		setTranscriptionState(prevState => {
			const newState = { ...prevState, ...updates }
	
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
	
			return validatedState
		})
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
			// Clear cached audio duration for new transcription
			audioDurationRef.current = null
			
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

			// Set up event listeners BEFORE activating transcription to catch all segments
			console.log('🔥 TIMING DEBUG - Setting up listeners before activating transcription')
			await setupListeners()

			updateState({
				isActive: true,
				current: newTranscription,
				isAborting: false,
				isCompleting: false,
				error: undefined
			})

			console.log('🔥 TIMING DEBUG - Transcription activated, listeners are ready')
			return id
		} catch (error) {
			console.error('Failed to start transcription:', error)
			throw error
		}
	}

	const updateProgress = async (progress: number, phase: string) => {
		// Use functional setState to get the latest state and prevent race conditions
		setTranscriptionState(prevState => {
			if (!prevState.current || prevState.isCompleting) {
				console.log('Skipping progress update - no current transcription or completing:', { 
					hasCurrent: !!prevState.current, 
					isCompleting: prevState.isCompleting,
					progress,
					phase 
				})
				return prevState // Return previous state without changes
			}

			console.log('Updating progress:', { progress, phase })

			// Return the new state
			return {
				...prevState,
				current: {
					...prevState.current,
					progress,
					phase
				}
			}
		})

		// Now, update the history entry. This part is outside the state update to keep it clean.
		const processingEntry = await getProcessingEntryFromStorage()
		if (processingEntry) {
			try {
				await updateHistoryEntry(processingEntry.id, {
					progress,
					phase
				})
				console.log('🔥 PROGRESS SYNC - Successfully updated history entry:', {
					entryId: processingEntry.id,
					progress,
					phase
				})
			} catch (error) {
				console.error('🔥 PROGRESS SYNC - Failed to update progress in history:', error)
			}
		}
	}

	const setSegments = (_segments: any[]) => {
		// Legacy method - segments are now stored in history automatically
		// This method is kept for compatibility but is a no-op
		console.log('setSegments called - segments are now stored in history automatically')
	}

	const abortTranscription = () => {
		updateState({
			isAborting: true
		})
	}

	const completeTranscription = async (segments?: any[], processingDuration?: number) => {
		const clearState = () => {
			setTranscriptionState({
				isActive: false,
				current: null,
				isAborting: false,
				isCompleting: false,
				error: undefined
			})
		}

		// Set isCompleting flag immediately to prevent other updates
		updateState({ isCompleting: true })

		try {
			const processingEntry = await getProcessingEntryFromStorage()

			if (processingEntry) {
				const endTime = Date.now()
				const duration = processingDuration || Math.round((endTime - processingEntry.startTime) / 1000)
				const finalSegments = segments || processingEntry.segments || []

				console.log('🔥 COMPLETION SYNC - Completing transcription for:', processingEntry.fileName)

				await updateHistoryEntry(processingEntry.id, {
					status: 'completed',
					endTime,
					duration,
					progress: 100,
					phase: 'Completed',
					segments: finalSegments
				})
				
				console.log('🔥 COMPLETION SYNC - History entry updated successfully.')
			} else {
				console.warn('🔥 COMPLETION SYNC - No processing entry found to complete.')
			}
		} catch (error) {
			console.error('🔥 COMPLETION SYNC - Failed to complete transcription:', error)
		} finally {
			// Always clear the state
			clearState()
		}
	}

	const failTranscription = async (error: string, processingDuration?: number) => {
		try {
			console.log('🔥 FAILURE SYNC - Processing failure for transcription:', error)
			
			const processingEntry = getProcessingEntry()
			if (processingEntry) {
				const endTime = Date.now()
				const duration = processingDuration || Math.round((endTime - processingEntry.startTime) / 1000)
				
				console.log('🔥 FAILURE SYNC - Updating history entry with failed status')
				
				await updateHistoryEntry(processingEntry.id, {
					status: 'failed',
					endTime,
					duration,
					progress: 0,
					phase: 'Failed',
					error
				})
				
				console.log('🔥 FAILURE SYNC - History entry updated successfully')
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
			console.error('🔥 FAILURE SYNC - Failed to update failed transcription in history:', updateError)
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
			console.log('🔥 CANCEL SYNC - Processing cancellation for transcription')
			
			const processingEntry = getProcessingEntry()
			if (processingEntry) {
				const endTime = Date.now()
				const duration = processingDuration || Math.round((endTime - processingEntry.startTime) / 1000)
				
				console.log('🔥 CANCEL SYNC - Updating history entry with canceled status')
				
				await updateHistoryEntry(processingEntry.id, {
					status: 'canceled',
					endTime,
					duration,
					phase: 'Canceled'
				})
				
				console.log('🔥 CANCEL SYNC - History entry updated successfully')
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
			console.error('🔥 CANCEL SYNC - Failed to update canceled transcription in history:', updateError)
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