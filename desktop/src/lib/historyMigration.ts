import { HistoryEntry } from '~/providers/HistoryProvider'
import { historyStore } from './historyStore'

interface MigrationResult {
	success: boolean
	migratedCount: number
	error?: string
}

class HistoryMigration {
	private readonly LOCALSTORAGE_KEY = 'transcription_history'
	private readonly MIGRATION_FLAG_KEY = 'history_migrated_to_store'
	
	/**
	 * Check if migration from localStorage to Tauri Store is needed
	 */
	async isMigrationNeeded(): Promise<boolean> {
		// Check if migration has already been completed
		const migrationCompleted = localStorage.getItem(this.MIGRATION_FLAG_KEY)
		if (migrationCompleted === 'true') {
			return false
		}
		
		// Check if there's data in localStorage to migrate
		const localStorageData = localStorage.getItem(this.LOCALSTORAGE_KEY)
		if (!localStorageData) {
			// No data to migrate, mark as completed
			localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true')
			return false
		}
		
		try {
			const entries = JSON.parse(localStorageData) as HistoryEntry[]
			return Array.isArray(entries) && entries.length > 0
		} catch {
			// Invalid data, mark as completed
			localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true')
			return false
		}
	}
	
	/**
	 * Migrate history data from localStorage to Tauri Store
	 */
	async migrateFromLocalStorage(): Promise<MigrationResult> {
		try {
			console.log('Starting history migration from localStorage to Tauri Store...')
			
			// Get data from localStorage
			const localStorageData = localStorage.getItem(this.LOCALSTORAGE_KEY)
			if (!localStorageData) {
				return { success: true, migratedCount: 0 }
			}
			
			const entries = JSON.parse(localStorageData) as HistoryEntry[]
			if (!Array.isArray(entries)) {
				throw new Error('Invalid localStorage data format')
			}
			
			// Migrate to Tauri Store
			await historyStore.setEntries(entries)
			
			// Mark migration as completed
			localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true')
			
			console.log(`Successfully migrated ${entries.length} history entries to Tauri Store`)
			
			return {
				success: true,
				migratedCount: entries.length
			}
		} catch (error) {
			console.error('History migration failed:', error)
			return {
				success: false,
				migratedCount: 0,
				error: error instanceof Error ? error.message : 'Unknown error'
			}
		}
	}
	
	/**
	 * Clean up localStorage data after successful migration
	 */
	async cleanupLocalStorage(): Promise<void> {
		try {
			// Only clean up if migration was successful
			const migrationCompleted = localStorage.getItem(this.MIGRATION_FLAG_KEY)
			if (migrationCompleted === 'true') {
				localStorage.removeItem(this.LOCALSTORAGE_KEY)
				console.log('Cleaned up localStorage history data after successful migration')
			}
		} catch (error) {
			console.error('Failed to cleanup localStorage:', error)
		}
	}
	
	/**
	 * Get localStorage data for backup purposes before migration
	 */
	getLocalStorageBackup(): HistoryEntry[] | null {
		try {
			const localStorageData = localStorage.getItem(this.LOCALSTORAGE_KEY)
			if (!localStorageData) return null
			
			const entries = JSON.parse(localStorageData) as HistoryEntry[]
			return Array.isArray(entries) ? entries : null
		} catch {
			return null
		}
	}
	
	/**
	 * Force reset migration state (for testing/debugging)
	 */
	resetMigrationState(): void {
		localStorage.removeItem(this.MIGRATION_FLAG_KEY)
	}
	
	/**
	 * Complete migration process with cleanup
	 */
	async performMigration(): Promise<MigrationResult> {
		const isNeeded = await this.isMigrationNeeded()
		if (!isNeeded) {
			return { success: true, migratedCount: 0 }
		}
		
		const result = await this.migrateFromLocalStorage()
		
		if (result.success) {
			// Clean up localStorage after successful migration
			await this.cleanupLocalStorage()
		}
		
		return result
	}
}

// Export a singleton instance
export const historyMigration = new HistoryMigration()