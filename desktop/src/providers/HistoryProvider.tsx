import { ReactNode, createContext, useContext } from 'react'
import { useLocalStorage } from 'usehooks-ts'

// Extend the existing TranscriptionResult interface for history
export interface HistoryEntry {
	id: string
	fileName: string
	filePath: string
	timestamp: number // Unix timestamp when transcription started
	status: 'completed' | 'failed' | 'canceled' | 'incomplete'
	duration: number // Processing time in seconds
	startTime: number
	endTime: number
	error?: string
	modelPath?: string
	useGpu?: boolean
	// Store segments for re-opening transcripts
	segments?: any[] // Will use proper Segment type later
	settings?: {
		modelOptions?: any
		language?: string
	}
}

interface HistoryContextValue {
	history: HistoryEntry[]
	addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
	removeHistoryEntry: (id: string) => void
	clearHistory: () => void
	getHistoryEntry: (id: string) => HistoryEntry | undefined
}

const HistoryContext = createContext<HistoryContextValue | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
	const [history, setHistory] = useLocalStorage<HistoryEntry[]>('transcription_history', [])

	const addHistoryEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
		const newEntry: HistoryEntry = {
			...entry,
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
		}
		
		setHistory(prev => [newEntry, ...prev]) // Add to beginning for recent-first order
	}

	const removeHistoryEntry = (id: string) => {
		setHistory(prev => prev.filter(entry => entry.id !== id))
	}

	const clearHistory = () => {
		setHistory([])
	}

	const getHistoryEntry = (id: string) => {
		return history.find(entry => entry.id === id)
	}

	const contextValue: HistoryContextValue = {
		history,
		addHistoryEntry,
		removeHistoryEntry,
		clearHistory,
		getHistoryEntry,
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