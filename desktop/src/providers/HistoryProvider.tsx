import { ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { historyStore } from '~/lib/historyStore'
import { historyMigration } from '~/lib/historyMigration'

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
	// Store segments for re-opening transcripts
	segments?: any[] // Final segments (on completion) - Will use proper Segment type later
	liveSegments?: any[] // Real-time segments during transcription (streaming)
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
	// Real-time segment methods
	addLiveSegment: (entryId: string, segment: any) => Promise<void>
	getLiveSegments: (entryId: string) => any[] | undefined
	isLoading: boolean
	migrationStatus: 'pending' | 'success' | 'error' | null
}

const HistoryContext = createContext<HistoryContextValue | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
	const [history, setHistory] = useState<HistoryEntry[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [migrationStatus, setMigrationStatus] = useState<'pending' | 'success' | 'error' | null>(null)

	// Initialize history store and handle migration
	useEffect(() => {
		async function initializeHistory() {
			try {
				setIsLoading(true)

				// Check if migration is needed and perform it
				const isMigrationNeeded = await historyMigration.isMigrationNeeded()
				if (isMigrationNeeded) {
					setMigrationStatus('pending')
					console.log('Migrating history from localStorage to Tauri Store...')
					
					const migrationResult = await historyMigration.performMigration()
					
					if (migrationResult.success) {
						setMigrationStatus('success')
						console.log(`Successfully migrated ${migrationResult.migratedCount} history entries`)
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
		return history.find(entry => entry.status === 'processing')
	}

	// Real-time segment methods
	const addLiveSegment = async (entryId: string, segment: any) => {
		try {
			// Get current entry
			const currentEntry = getHistoryEntry(entryId)
			if (!currentEntry) {
				throw new Error(`History entry with id ${entryId} not found`)
			}

			// Add segment to live segments array
			const currentLiveSegments = currentEntry.liveSegments || []
			const updatedLiveSegments = [...currentLiveSegments, segment]

			// Update history entry with new live segment
			await updateHistoryEntry(entryId, {
				liveSegments: updatedLiveSegments
			})
		} catch (error) {
			console.error('Failed to add live segment:', error)
			throw error
		}
	}

	const getLiveSegments = (entryId: string) => {
		const entry = getHistoryEntry(entryId)
		return entry?.liveSegments || []
	}

	const contextValue: HistoryContextValue = {
		history,
		addHistoryEntry,
		updateHistoryEntry,
		removeHistoryEntry,
		clearHistory,
		getHistoryEntry,
		getProcessingEntry,
		addLiveSegment,
		getLiveSegments,
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