import { ReactNode, createContext, useContext, useState, useEffect, useRef } from 'react'
import { historyStore } from '~/lib/historyStore'
import { historyMigration } from '~/lib/historyMigration'

// Queue item for sequential segment processing
interface SegmentQueueItem {
	segment: any
	resolve: (value: void) => void
	reject: (error: any) => void
}

// Extend the existing TranscriptionResult interface for history
export interface HistoryEntry {
	id: string
	fileName: string
	filePath: string
	timestamp: number // Unix timestamp when transcription started
	status: 'processing' | 'completed' | 'failed' | 'canceled' | 'incomplete'
	duration: number // Processing time in seconds
	startTime: number
	endTime: number
	error?: string
	modelPath?: string
	useGpu?: boolean
	// Store segments - accumulates during processing and remains for final result
	segments?: any[] // Segments array that builds during transcription and becomes final result
	settings?: {
		modelOptions?: any
		language?: string
	}
	// Fields for processing entries
	progress?: number // Current progress percentage (0-100)
	phase?: string // Current transcription phase
}

interface HistoryContextValue {
	history: HistoryEntry[]
	addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => Promise<void>
	updateHistoryEntry: (id: string, updates: Partial<HistoryEntry>) => Promise<void>
	removeHistoryEntry: (id: string) => Promise<void>
	clearHistory: () => Promise<void>
	getHistoryEntry: (id: string) => HistoryEntry | undefined
	getProcessingEntry: () => HistoryEntry | undefined
	// Direct storage access for critical operations (bypasses memory cache)
	getProcessingEntryFromStorage: () => Promise<HistoryEntry | undefined>
	// Real-time segment method - append segments to existing array
	addSegment: (entryId: string, segment: any) => Promise<void>
	isLoading: boolean
	migrationStatus: 'pending' | 'success' | 'error' | null
}

const HistoryContext = createContext<HistoryContextValue | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
	const [history, setHistory] = useState<HistoryEntry[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [migrationStatus, setMigrationStatus] = useState<'pending' | 'success' | 'error' | null>(null)
	
	// Segment processing queue to prevent race conditions
	const segmentQueue = useRef<Map<string, SegmentQueueItem[]>>(new Map())
	const isProcessingQueue = useRef<Map<string, boolean>>(new Map())

	// Initialize history store and handle migration
	useEffect(() => {
		async function initializeHistory() {
			try {
				setIsLoading(true)

				// Check if migration is needed and perform it
				const isMigrationNeeded = await historyMigration.isMigrationNeeded()
				if (isMigrationNeeded) {
					setMigrationStatus('pending')
					// console.log('Migrating history from localStorage to Tauri Store...')
					
					const migrationResult = await historyMigration.performMigration()
					
					if (migrationResult.success) {
						setMigrationStatus('success')
						// console.log(`Successfully migrated ${migrationResult.migratedCount} history entries`)
					} else {
						setMigrationStatus('error')
						console.error('Migration failed:', migrationResult.error)
					}
				}

				// Load history from Tauri Store
				const entries = await historyStore.getEntries()
				setHistory(entries)
			} catch (error) {
				console.error('Failed to initialize history:', error)
				setMigrationStatus('error')
				// Fallback to empty history if store fails
				setHistory([])
			} finally {
				setIsLoading(false)
			}
		}

		initializeHistory()
	}, [])

	const addHistoryEntry = async (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
		const newEntry: HistoryEntry = {
			...entry,
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
		}
		
		try {
			await historyStore.addEntry(newEntry)
			setHistory(prev => [newEntry, ...prev]) // Add to beginning for recent-first order
		} catch (error) {
			console.error('Failed to add history entry:', error)
			throw error
		}
	}

	const updateHistoryEntry = async (id: string, updates: Partial<HistoryEntry>) => {
		try {
			await historyStore.updateEntry(id, updates)
			setHistory(prev => prev.map(entry => 
				entry.id === id ? { ...entry, ...updates } : entry
			))
		} catch (error) {
			console.error('Failed to update history entry:', error)
			throw error
		}
	}

	const removeHistoryEntry = async (id: string) => {
		try {
			await historyStore.removeEntry(id)
			setHistory(prev => prev.filter(entry => entry.id !== id))
		} catch (error) {
			console.error('Failed to remove history entry:', error)
			throw error
		}
	}

	const clearHistory = async () => {
		try {
			await historyStore.clearEntries()
			setHistory([])
		} catch (error) {
			console.error('Failed to clear history:', error)
			throw error
		}
	}

	const getHistoryEntry = (id: string) => {
		return history.find(entry => entry.id === id)
	}

	const getProcessingEntry = () => {
		const processingEntry = history.find(entry => entry.status === 'processing')
		// console.log('🔥 MEMORY DEBUG - getProcessingEntry called:', {
		// 	found: !!processingEntry,
		// 	entryId: processingEntry?.id,
		// 	segmentCount: processingEntry?.segments?.length || 0,
		// 	historyArrayLength: history.length,
		// 	allEntryIds: history.map(e => e.id)
		// })
		return processingEntry
	}

	// Direct storage access for critical operations - bypasses memory cache issues
	const getProcessingEntryFromStorage = async () => {
		try {
			const processingEntry = await historyStore.getProcessingEntry()
			// console.log('🔥 STORAGE DEBUG - getProcessingEntryFromStorage called:', {
			// 	found: !!processingEntry,
			// 	entryId: processingEntry?.id,
			// 	segmentCount: processingEntry?.segments?.length || 0
			// })
			return processingEntry
		} catch (error) {
			console.error('🔥 STORAGE DEBUG - Failed to get processing entry from storage:', error)
			return undefined
		}
	}

	// Sequential queue processor to prevent race conditions
	const processQueue = async (entryId: string) => {
		// Skip if already processing this entry
		if (isProcessingQueue.current.get(entryId)) {
			// console.log('🔥 QUEUE DEBUG - Already processing queue for entryId:', entryId)
			return
		}

		// Mark as processing
		isProcessingQueue.current.set(entryId, true)
		// console.log('🔥 QUEUE DEBUG - Starting queue processing for entryId:', entryId)

		try {
			// Process all queued segments for this entry
			const queue = segmentQueue.current.get(entryId) || []
			
			while (queue.length > 0) {
				const item = queue.shift()
				if (!item) break

				// console.log('🔥 QUEUE DEBUG - Processing segment:', {
				// 	entryId,
				// 	remainingInQueue: queue.length,
				// 	segment: { start: item.segment.start, stop: item.segment.stop }
				// })

				try {
					// Process the segment using atomic storage operation
					await historyStore.addSegmentAtomic(entryId, item.segment)
					
					// Refresh memory state after each segment
					const updatedEntries = await historyStore.getEntries()
					setHistory(updatedEntries)
					
					// Resolve the promise for this segment
					item.resolve()
					
					// console.log('🔥 QUEUE DEBUG - Segment processed successfully:', {
					// 	entryId,
					// 	currentSegmentCount: updatedEntries.find(e => e.id === entryId)?.segments?.length || 0
					// })
				} catch (error) {
					console.error('🔥 QUEUE DEBUG - Failed to process segment:', error)
					item.reject(error)
				}
			}
		} finally {
			// Mark as not processing
			isProcessingQueue.current.set(entryId, false)
			// console.log('🔥 QUEUE DEBUG - Queue processing completed for entryId:', entryId)
		}
	}

	// Real-time segment method - queue segments for sequential processing
	const addSegment = async (entryId: string, segment: any): Promise<void> => {
		return new Promise((resolve, reject) => {
			// console.log('🔥 PROVIDER DEBUG - Queueing segment:', {
			// 	entryId,
			// 	segment: { start: segment.start, stop: segment.stop, text: segment.text?.substring(0, 30) + '...' }
			// })

			// Initialize queue for this entry if it doesn't exist
			if (!segmentQueue.current.has(entryId)) {
				segmentQueue.current.set(entryId, [])
			}

			// Add segment to queue
			const queue = segmentQueue.current.get(entryId)!
			queue.push({ segment, resolve, reject })

			// console.log('🔥 PROVIDER DEBUG - Segment queued:', {
			// 	entryId,
			// 	queueLength: queue.length,
			// 	isCurrentlyProcessing: isProcessingQueue.current.get(entryId) || false
			// })

			// Start processing the queue (if not already processing)
			processQueue(entryId).catch(error => {
				console.error('🔥 PROVIDER DEBUG - Queue processing failed:', error)
				// If queue processing fails, reject all pending segments
				while (queue.length > 0) {
					const item = queue.shift()
					if (item) item.reject(error)
				}
			})
		})
	}

	const contextValue: HistoryContextValue = {
		history,
		addHistoryEntry,
		updateHistoryEntry,
		removeHistoryEntry,
		clearHistory,
		getHistoryEntry,
		getProcessingEntry,
		getProcessingEntryFromStorage,
		addSegment,
		isLoading,
		migrationStatus,
	}

	return (
		<HistoryContext.Provider value={contextValue}>
			{children}
		</HistoryContext.Provider>
	)
}

export function useHistory() {
	const context = useContext(HistoryContext)
	if (!context) {
		throw new Error('useHistory must be used within a HistoryProvider')
	}
	return context
}
