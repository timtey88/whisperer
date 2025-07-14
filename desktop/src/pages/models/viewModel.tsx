import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ask } from '@tauri-apps/plugin-dialog'
import { useTranslation } from 'react-i18next'
import modelsData from '~/lib/data/ggml_models.json'
import encodersData from '~/lib/data/ggml_models_encoder.json'

interface ModelInfo {
	model: string
	file_name: string
	file_size: string
	url: string
	sha256: string
	isDownloaded?: boolean
	isDownloading?: boolean
	category?: 'models' | 'encoders'
}

interface DownloadProgress {
	progress: number
	downloadedSize: string
	totalSize: string
	downloadSpeed: string
	timeRemaining: string
}

export function viewModel() {
	const { t } = useTranslation()
	const [models, setModels] = useState<ModelInfo[]>([])
	const [activeTab, setActiveTab] = useState<'models' | 'encoders'>('models')
	const [filter, setFilter] = useState<string>('all')
	const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())
	const [deletingModels, setDeletingModels] = useState<Set<string>>(new Set())
	const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map())
	const [isRefreshing, setIsRefreshing] = useState(false)

	// Load models and check download status
	useEffect(() => {
		loadModels()
	}, [])
	
	// Auto-refresh model status periodically (only when page is visible)
	useEffect(() => {
		let interval: NodeJS.Timeout | null = null
		
		const startInterval = () => {
			if (interval) clearInterval(interval)
			interval = setInterval(() => {
				if (!isRefreshing && document.visibilityState === 'visible') {
					refreshModelStatus()
				}
			}, 5000) // Check every 5 seconds when active
		}
		
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				// Page became visible - refresh immediately and start interval
				if (!isRefreshing) {
					refreshModelStatus()
				}
				startInterval()
			} else {
				// Page hidden - stop interval
				if (interval) {
					clearInterval(interval)
					interval = null
				}
			}
		}
		
		// Start interval if page is currently visible
		if (document.visibilityState === 'visible') {
			startInterval()
		}
		
		// Listen for visibility changes
		document.addEventListener('visibilitychange', handleVisibilityChange)
		
		return () => {
			if (interval) clearInterval(interval)
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [isRefreshing])

	// Function to refresh model status without reloading all model data
	async function refreshModelStatus() {
		try {
			setIsRefreshing(true)
			const modelsFolder = await invoke<string>('get_models_folder')
			
			// Check current model status
			const updatedModels = await Promise.all(
				models.map(async (model) => {
					try {
						const exists = await invoke<boolean>('check_model_exists', { 
							modelsFolder,
							fileName: model.file_name 
						})
						return { ...model, isDownloaded: exists }
					} catch {
						return { ...model, isDownloaded: false }
					}
				})
			)
			
			// Only update state if there are actual changes
			const hasChanges = updatedModels.some((model, index) => 
				model.isDownloaded !== models[index]?.isDownloaded
			)
			
			if (hasChanges) {
				setModels(updatedModels)
			}
		} catch (error) {
			console.error('Failed to refresh model status:', error)
		} finally {
			setIsRefreshing(false)
		}
	}
	
	// Function to manually refresh model status
	async function manualRefresh() {
		await refreshModelStatus()
	}

	async function loadModels() {
		try {
			// Combine regular models and encoders with category tags
			const regularModels = (modelsData as ModelInfo[]).map(model => ({ 
				...model, 
				category: 'models' as const 
			}))
			const encoderModels = (encodersData as ModelInfo[]).map(model => ({ 
				...model, 
				category: 'encoders' as const 
			}))
			const allModels = [...regularModels, ...encoderModels]
			
			const modelsFolder = await invoke<string>('get_models_folder')
			
			// Check which models are already downloaded
			const modelsWithStatus = await Promise.all(
				allModels.map(async (model) => {
					try {
						const exists = await invoke<boolean>('check_model_exists', { 
							modelsFolder,
							fileName: model.file_name 
						})
						return { ...model, isDownloaded: exists }
					} catch {
						return { ...model, isDownloaded: false }
					}
				})
			)
			
			setModels(modelsWithStatus)
		} catch (error) {
			console.error('Failed to load models:', error)
		}
	}

	// Filter models based on active tab and filter
	const filteredModels = models.filter(model => {
		// First filter by active tab - handle undefined category gracefully
		const modelCategory = model.category || 'models' // Default to 'models' if undefined
		
		if (modelCategory !== activeTab) return false
		
		// Then filter by type (only applies to regular models)
		if (activeTab === 'models' && filter !== 'all') {
			return model.model.toLowerCase().includes(filter.toLowerCase())
		}
		
		// For encoders, show all (or could add encoder-specific filtering later)
		return true
	})

	async function downloadModel(model: ModelInfo) {
		try {
			setDownloadingModels(prev => new Set(prev).add(model.model))
			
			// Initialize progress tracking
			setDownloadProgress(prev => new Map(prev).set(model.model, {
				progress: 0,
				downloadedSize: '0 MB',
				totalSize: model.file_size,
				downloadSpeed: '0 MB',
				timeRemaining: 'Calculating...'
			}))
			
			const modelsFolder = await invoke<string>('get_models_folder')
			const modelPath = `${modelsFolder}/${model.file_name}`
			
			// Simulate progress updates for now (in real implementation, this would come from the backend)
			const progressInterval = setInterval(() => {
				setDownloadProgress(prev => {
					const current = prev.get(model.model)
					if (!current || current.progress >= 100) {
						clearInterval(progressInterval)
						return prev
					}
					
					const newProgress = Math.min(current.progress + Math.random() * 10, 100)
					const newMap = new Map(prev)
					newMap.set(model.model, {
						...current,
						progress: newProgress,
						downloadedSize: `${(newProgress * 0.01 * parseFloat(model.file_size)).toFixed(1)} MB`,
						downloadSpeed: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
						timeRemaining: newProgress < 90 ? `${Math.max(1, Math.floor((100 - newProgress) / 10))} min` : 'Almost done...'
					})
					return newMap
				})
			}, 500)
			
			await invoke('download_model', {
				url: model.url,
				path: modelPath
			})
			
			clearInterval(progressInterval)
			
			// Set final progress to 100%
			setDownloadProgress(prev => {
				const newMap = new Map(prev)
				newMap.set(model.model, {
					progress: 100,
					downloadedSize: model.file_size,
					totalSize: model.file_size,
					downloadSpeed: '0 MB',
					timeRemaining: 'Complete'
				})
				return newMap
			})
			
			// Update the model status
			setModels(prev => prev.map(m => 
				m.model === model.model ? { ...m, isDownloaded: true } : m
			))
			
		} catch (error) {
			console.error('Failed to download model:', error)
		} finally {
			setDownloadingModels(prev => {
				const newSet = new Set(prev)
				newSet.delete(model.model)
				return newSet
			})
			// Clean up progress tracking after a delay
			setTimeout(() => {
				setDownloadProgress(prev => {
					const newMap = new Map(prev)
					newMap.delete(model.model)
					return newMap
				})
			}, 2000)
		}
	}

	async function deleteModel(model: ModelInfo) {
		try {
			const confirmed = await ask(
				t('common.confirm-uninstall-model', { modelName: model.model }),
				{ kind: 'warning' }
			)
			
			if (!confirmed) return
			
			setDeletingModels(prev => new Set(prev).add(model.model))
			
			const modelsFolder = await invoke<string>('get_models_folder')
			
			await invoke('delete_model', {
				modelsFolder,
				fileName: model.file_name
			})
			
			// Update the model status
			setModels(prev => prev.map(m => 
				m.model === model.model ? { ...m, isDownloaded: false } : m
			))
			
		} catch (error) {
			console.error('Failed to delete model:', error)
		} finally {
			setDeletingModels(prev => {
				const newSet = new Set(prev)
				newSet.delete(model.model)
				return newSet
			})
		}
	}

	return {
		models,
		filteredModels,
		activeTab,
		setActiveTab,
		filter,
		setFilter,
		downloadingModels,
		deletingModels,
		downloadProgress,
		isRefreshing,
		downloadModel,
		deleteModel,
		manualRefresh,
		loadModels
	}
}