import { invoke } from '@tauri-apps/api/core'
import { ask, open } from '@tauri-apps/plugin-dialog'
import * as shell from '@tauri-apps/plugin-shell'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as config from '~/lib/config'
import { NamedPath, ls, resetApp } from '~/lib/utils'
import { usePreferenceProvider } from '~/providers/Preference'
import { UnlistenFn, listen } from '@tauri-apps/api/event'
import { load } from '@tauri-apps/plugin-store'
import { useStoreValue } from '~/lib/useStoreValue'
import * as clipboard from '@tauri-apps/plugin-clipboard-manager'
import { getPrettyVersion } from '~/lib/logs'

async function openModelPath() {
	let dst = await invoke<string>('get_models_folder')
	invoke('open_path', { path: dst })
}

async function openModelsUrl() {
	shell.open(config.modelsDocURL)
}


async function revealLogs() {
	await invoke<string>('show_log_path')
}

async function revealTemp() {
	await invoke<string>('show_temp_path')
}

async function copyLogs() {
	const logs = await invoke<string>('get_logs')
	const templated = `<details>
<summary>logs</summary>

\`\`\`console
${logs}
\`\`\`
</details>
`
	clipboard.writeText(templated)
}

export function viewModel() {
	const [isLogToFileSet, setLogToFile] = useStoreValue<boolean>('prefs_log_to_file')

	const [models, setModels] = useState<NamedPath[]>([])
	const [appVersion, setAppVersion] = useState('')
	const [isDiarizationAvailable, setIsDiarizationAvailable] = useState(false)
	const preference = usePreferenceProvider()
	const { t } = useTranslation()
	const listenersRef = useRef<UnlistenFn[]>([])

	async function askAndReset() {
		const yes = await ask(t('common.reset-ask-dialog'), { kind: 'info' })
		if (yes) {
			resetApp()
		}
	}

	async function loadMeta() {
		try {
			const prettyVersion = await getPrettyVersion()
			setAppVersion(prettyVersion)
		} catch (e) {
			console.error(e)
		}
	}

	async function loadModels() {
		const modelsFolder = await invoke<string>('get_models_folder')
		const entries = await ls(modelsFolder)
		const found = entries.filter((e) => e.name?.endsWith('.bin'))
		setModels(found)
	}

	async function getDefaultModel() {
		if (!preference.modelPath) {
			const modelsFolder = await invoke<string>('get_models_folder')

			let files = await ls(modelsFolder)
			files = files.filter((f) => f.name.endsWith('.bin'))
			if (files) {
				const defaultModelPath = files?.[0].path
				preference.setModelPath(defaultModelPath as string)
			}
		}
	}

	async function changeModelsFolder() {
		const path = await open({ directory: true, multiple: false })
		if (path) {
			const store = await load(config.storeFilename)
			await store.set('models_folder', path)
			await store.save()
			await loadModels()
			await getDefaultModel()
		}
	}

	async function onWindowFocus() {
		listenersRef.current.push(await listen('tauri://focus', loadModels))
	}

	useEffect(() => {
		loadMeta()
		loadModels()
		getDefaultModel()
		onWindowFocus()
		
		// Check if diarization feature is available
		invoke('is_diarization_available').then((available: unknown) => {
			setIsDiarizationAvailable(Boolean(available))
		}).catch(() => {
			setIsDiarizationAvailable(false)
		})
		
		return () => {
			listenersRef.current.forEach((unlisten) => unlisten())
		}
	}, [])

	async function testDiarization() {
		if (!preference.huggingFaceToken) {
			await ask('Please enter your HuggingFace token first.', { title: 'Token Required' })
			return
		}

		try {
			// Test the Python bridge with the token
			const result = await invoke('test_diarization_dependencies', { 
				token: preference.huggingFaceToken 
			})
			
			if (result) {
				await ask('✅ Token and dependencies test successful! Diarization is ready to use.', { 
					title: 'Test Successful' 
				})
			} else {
				await ask('❌ Test failed. Please check your token and ensure dependencies are installed.', { 
					title: 'Test Failed' 
				})
			}
		} catch (error) {
			console.error('Diarization test error:', error)
			await ask(`❌ Test failed: ${error}`, { title: 'Test Failed' })
		}
	}

	return {
		copyLogs,
		isLogToFileSet,
		setLogToFile,
		preference: preference,
		askAndReset,
		openModelPath,
		openModelsUrl,
		revealLogs,
		revealTemp,
		models,
		appVersion,
		loadModels,
		changeModelsFolder,
		testDiarization,
		isDiarizationAvailable,
	}
}
