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
	category?: 'model' | 'encoder'
}

export function viewModel() {
	const { t } = useTranslation()
	const [models, setModels] = useState<ModelInfo[]>([])
	const [activeTab, setActiveTab] = useState<'models' | 'encoders'>('models')
	const [filter, setFilter] = useState<string>('all')
	const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())
	const [deletingModels, setDeletingModels] = useState<Set<string>>(new Set())
	const [loading, setLoading] = useState(true)

	// Load models and check download status
	useEffect(() => {
		loadModels()
	}, [])

	async function loadModels() {
		try {
			setLoading(true)
			
			// Combine regular models and encoders with category tags
			const regularModels = (modelsData as ModelInfo[]).map(model => ({ 
				...model, 
				category: 'model' as const 
			}))
			const encoderModels = (encodersData as ModelInfo[]).map(model => ({ 
				...model, 
				category: 'encoder' as const 
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
			console.log('Loaded models:', modelsWithStatus.length)
			console.log('Regular models:', regularModels.length) 
			console.log('Encoder models:', encoderModels.length)
		} catch (error) {
			console.error('Failed to load models:', error)
		} finally {
			setLoading(false)
		}
	}

	// Filter models based on active tab and filter
	const filteredModels = models.filter(model => {
		// First filter by active tab - handle undefined category gracefully
		const modelCategory = model.category || 'model' // Default to 'model' if undefined
		if (modelCategory !== activeTab) return false
		
		// Then filter by type (only applies to regular models)
		if (activeTab === 'models' && filter !== 'all') {
			return model.model.toLowerCase().includes(filter.toLowerCase())
		}
		
		// For encoders, show all (or could add encoder-specific filtering later)
		return true
	})

	// Debug logging
	console.log('Total models:', models.length)
	console.log('Active tab:', activeTab)
	console.log('Filter:', filter)
	console.log('Filtered models:', filteredModels.length)

	async function downloadModel(model: ModelInfo) {
		try {
			setDownloadingModels(prev => new Set(prev).add(model.model))
			
			const modelsFolder = await invoke<string>('get_models_folder')
			const modelPath = `${modelsFolder}/${model.file_name}`
			
			await invoke('download_model', {
				url: model.url,
				path: modelPath
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
		loading,
		downloadModel,
		deleteModel,
		loadModels
	}
}