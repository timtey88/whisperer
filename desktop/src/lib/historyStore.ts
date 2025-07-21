import { load } from '@tauri-apps/plugin-store'
import { HistoryEntry } from '~/providers/HistoryProvider'

export interface HistoryStoreData {
	version: string
	created: string
	lastModified: string
	entries: HistoryEntry[]
}

class HistoryStore {
	private store: any = null
	private readonly STORE_PATH = 'history.json'
	private readonly CURRENT_VERSION = '1.0'
	
	async initialize(): Promise<void> {
		if (this.store) return
		
		try {
			this.store = await load(this.STORE_PATH, { autoSave: true })
			
			// Ensure the store file exists with proper structure
			const exists = await this.store.has('version')
			if (!exists) {
				await this.initializeEmptyStore()
			}
		} catch (error) {
			console.error('Failed to initialize history store:', error)
			throw error
		}
	}
	
	private async initializeEmptyStore(): Promise<void> {
		if (!this.store) throw new Error('Store not initialized')
		
		const initialData: HistoryStoreData = {
			version: this.CURRENT_VERSION,
			created: new Date().toISOString(),
			lastModified: new Date().toISOString(),
			entries: []
		}
		
		await this.store.set('version', initialData.version)
		await this.store.set('created', initialData.created)
		await this.store.set('lastModified', initialData.lastModified)
		await this.store.set('entries', initialData.entries)
		await this.store.save()
	}
	
	async getEntries(): Promise<HistoryEntry[]> {
		await this.initialize()
		if (!this.store) throw new Error('Store not initialized')
		
		try {
			const entries = await this.store.get('entries')
			return entries || []
		} catch (error) {
			console.error('Failed to get history entries:', error)
			return []
		}
	}
	
	async setEntries(entries: HistoryEntry[]): Promise<void> {
		await this.initialize()
		if (!this.store) throw new Error('Store not initialized')
		
		try {
			await this.store.set('entries', entries)
			await this.store.set('lastModified', new Date().toISOString())
			await this.store.save()
		} catch (error) {
			console.error('Failed to set history entries:', error)
			throw error
		}
	}
	
	async addEntry(entry: HistoryEntry): Promise<void> {
		const entries = await this.getEntries()
		const newEntries = [entry, ...entries] // Add to beginning for recent-first order
		await this.setEntries(newEntries)
	}
	
	async updateEntry(id: string, updates: Partial<HistoryEntry>): Promise<void> {
		const entries = await this.getEntries()
		const updatedEntries = entries.map(entry => 
			entry.id === id ? { ...entry, ...updates } : entry
		)
		await this.setEntries(updatedEntries)
	}
	
	async removeEntry(id: string): Promise<void> {
		const entries = await this.getEntries()
		const filteredEntries = entries.filter(entry => entry.id !== id)
		await this.setEntries(filteredEntries)
	}
	
	async clearEntries(): Promise<void> {
		await this.setEntries([])
	}
	
	async getEntry(id: string): Promise<HistoryEntry | undefined> {
		const entries = await this.getEntries()
		return entries.find(entry => entry.id === id)
	}
	
	async getProcessingEntry(): Promise<HistoryEntry | undefined> {
		const entries = await this.getEntries()
		return entries.find(entry => entry.status === 'processing')
	}

	// Atomic segment accumulation - reads fresh from storage to prevent race conditions
	async addSegmentAtomic(entryId: string, segment: any): Promise<void> {
		await this.initialize()
		if (!this.store) throw new Error('Store not initialized')

		try {
			console.log('🔥 STORAGE DEBUG - Starting addSegmentAtomic:', {
				entryId,
				newSegment: { start: segment.start, stop: segment.stop, text: segment.text?.substring(0, 30) + '...' },
				timestamp: new Date().toISOString()
			})

			// Read latest data directly from storage (not memory cache)
			const entries = await this.getEntries()
			const entryIndex = entries.findIndex(entry => entry.id === entryId)
			
			if (entryIndex === -1) {
				throw new Error(`History entry with id ${entryId} not found`)
			}

			// Get current entry and add segment atomically
			const currentEntry = entries[entryIndex]
			const currentSegments = currentEntry.segments || []
			
			console.log('🔥 STORAGE DEBUG - Current state before adding:', {
				currentSegmentCount: currentSegments.length,
				currentSegments: currentSegments.map(s => ({ start: s.start, stop: s.stop, text: s.text?.substring(0, 30) + '...' })),
				newSegmentStart: segment.start,
				newSegmentStop: segment.stop
			})

			// Check for duplicate segment (same start/stop times)
			const isDuplicate = currentSegments.some(s => s.start === segment.start && s.stop === segment.stop)
			if (isDuplicate) {
				console.log('🔥 STORAGE DEBUG - Duplicate segment detected, skipping:', {
					start: segment.start,
					stop: segment.stop
				})
				return
			}

			const updatedSegments = [...currentSegments, segment]

			// Update the entry with accumulated segments
			const updatedEntry = {
				...currentEntry,
				segments: updatedSegments
			}

			// Replace the entry in the array
			const updatedEntries = [...entries]
			updatedEntries[entryIndex] = updatedEntry

			// Write back to storage atomically
			await this.setEntries(updatedEntries)
			
			console.log('🔥 STORAGE DEBUG - Successfully added segment:', {
				previousCount: currentSegments.length,
				newCount: updatedSegments.length,
				addedSegment: { start: segment.start, stop: segment.stop, text: segment.text?.substring(0, 30) + '...' }
			})
		} catch (error) {
			console.error('🔥 STORAGE DEBUG - Failed to add segment atomically:', error)
			throw error
		}
	}

	
	async getStoreInfo(): Promise<{ version: string; created: string; lastModified: string }> {
		await this.initialize()
		if (!this.store) throw new Error('Store not initialized')
		
		const [version, created, lastModified] = await Promise.all([
			this.store.get('version'),
			this.store.get('created'),
			this.store.get('lastModified')
		])
		
		return {
			version: version || this.CURRENT_VERSION,
			created: created || new Date().toISOString(),
			lastModified: lastModified || new Date().toISOString()
		}
	}
	
	async exportHistory(): Promise<HistoryStoreData> {
		const entries = await this.getEntries()
		const info = await this.getStoreInfo()
		
		return {
			...info,
			entries
		}
	}
	
	async importHistory(data: HistoryStoreData): Promise<void> {
		// Validate the imported data structure
		if (!data.entries || !Array.isArray(data.entries)) {
			throw new Error('Invalid history data format')
		}
		
		// Import the entries
		await this.setEntries(data.entries)
	}
}

// Export a singleton instance
export const historyStore = new HistoryStore()