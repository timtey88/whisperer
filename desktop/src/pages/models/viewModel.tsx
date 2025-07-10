import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import modelsData from '~/lib/data/ggml_models.json'

interface ModelInfo {
	model: string
	file_name: string
	file_size: string
	url: string
	sha256: string
	isDownloaded?: boolean
	isDownloading?: boolean
}

export function viewModel() {
	const [models, setModels] = useState<ModelInfo[]>([])
	const [filter, setFilter] = useState<string>('all')
	const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())
	const [loading, setLoading] = useState(true)

	// Load models and check download status
	useEffect(() => {
		loadModels()
	}, [])

	async function loadModels() {
		try {
			setLoading(true)
			const modelList = modelsData as ModelInfo[]
			const modelsFolder = await invoke<string>('get_models_folder')
			
			// Check which models are already downloaded
			const modelsWithStatus = await Promise.all(
				modelList.map(async (model) => {
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
		} finally {
			setLoading(false)
		}
	}

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

	return {
		models,
		filter,
		setFilter,
		downloadingModels,
		loading,
		downloadModel,
		loadModels
	}
}