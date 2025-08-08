import * as dialog from '@tauri-apps/plugin-dialog'
import * as process from '@tauri-apps/plugin-process'
import { DownloadEvent, Update, check as checkUpdate } from '@tauri-apps/plugin-updater'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { ErrorModalContext } from './ErrorModal'
import { ModifyState } from '~/lib/utils'
import { invoke } from '@tauri-apps/api/core'
// Define the context type

type UpdaterContextType = {
	availableUpdate: boolean
	setAvailableUpdate: ModifyState<boolean>
	updating: boolean
	setUpdating: ModifyState<boolean>
	manifest?: Update
	setManifest: ModifyState<Update | undefined>
	updateApp: () => Promise<void>
	progress: number | null
}

// Create the context
export const UpdaterContext = createContext<UpdaterContextType>({
	availableUpdate: false,
	setAvailableUpdate: () => {},
	updating: false,
	setUpdating: () => {},
	setManifest: () => {},
	updateApp: async () => {},
	progress: null,
})

export function UpdaterProvider({ children }: { children: React.ReactNode }) {
	const [availableUpdate, setAvailableUpdate] = useState(false)
	const [update, setUpdate] = useState<Update | undefined>()
	const [updating, setUpdating] = useState(false)
	const [totalSize, setTotal] = useState<number | null>(null)
	const [partSize, setPartSize] = useState<number | null>(null)
	const { setState: setErrorModal } = useContext(ErrorModalContext)
	const [progress, setProgress] = useState<number | null>(null)

	useEffect(() => {
		if (partSize && totalSize) {
			setProgress((partSize / totalSize) * 100)
		}
	}, [partSize])

	useEffect(() => {
		// Check for new updates
		async function checkForUpdates() {
			try {
				console.log('🔄 Checking for updates...')
				console.log('🖥️ Current platform:', navigator.platform, 'User agent:', navigator.userAgent)
				console.log('📍 Updater endpoint: https://github.com/timtey88/whisperer/releases/download/v1.1.0/latest.json')
				
				const newUpdate = await checkUpdate()
				console.log('📡 Update check result:', newUpdate)
				
				if (newUpdate) {
					console.log('✅ Update available:', newUpdate.available, 'Version:', newUpdate.version)
					console.log('📦 Update manifest:', JSON.stringify(newUpdate, null, 2))
					setAvailableUpdate(newUpdate?.available)
					setUpdate(newUpdate)
				} else {
					console.log('ℹ️ No update available (returned null)')
					setAvailableUpdate(false)
				}
			} catch (error) {
				console.error('❌ Could not check for updates:', error)
				const errorInfo = error instanceof Error ? {
					name: error.name,
					message: error.message,
					stack: error.stack
				} : { error: String(error) }
				console.error('🔍 Error details:', errorInfo)
				// Silently fail - updater errors shouldn't disrupt user experience
				setAvailableUpdate(false)
			}
		}
		checkForUpdates()
	}, [])

	async function askForRelaunch() {
		const shouldRelaunch = await dialog.ask('The update has been installed successfully. Would you like to restart the application now?', {
			title: 'Installation Complete',
			kind: 'info',
			cancelLabel: 'Restart Later',
			okLabel: 'Restart Now',
		})
		if (shouldRelaunch) {
			console.info('relaunch....')
			await process.relaunch()
		}
	}

	function onDownloadEvent(downloadEvent: DownloadEvent) {
		switch (downloadEvent.event) {
			case 'Started': {
				setTotal(downloadEvent.data.contentLength!)
				break
			}
			case 'Progress': {
				setPartSize((prev) => (prev ?? 0) + downloadEvent.data.chunkLength)
				break
			}
		}
	}

	async function downloadAndInstall() {
		setUpdating(true)
		setProgress(0)
		console.info(`Installing update ${update?.version}, ${update?.date}, ${update?.body}`)
		await update?.downloadAndInstall(onDownloadEvent)
		setUpdating(false)
		setTotal(null)
		setPartSize(null)
		setProgress(null)
		await askForRelaunch()
		setAvailableUpdate(false)
	}

	async function updateApp() {
		const cudaVersion = await invoke('get_cuda_version')
		const rocmVersion = await invoke('get_rocm_version')
		const avx2Enabled = await invoke('is_avx2_enabled')
		const isPortable = await invoke<string>('is_portable')

		// Nvidia / Older CPU / Portable - No updates available
		if (cudaVersion || !avx2Enabled || isPortable || rocmVersion) {
			await dialog.message('Auto-updates are not available for your configuration. Please check manually for updates.', {
				title: 'Manual Update Required',
				kind: 'info'
			})
			return
		}

		const shouldUpdate = await dialog.ask(`A new version ${update?.version} is available. Would you like to download and install it now?`, {
			title: 'Update Available',
			kind: 'info',
			cancelLabel: 'Cancel',
			okLabel: 'Update Now',
		})
		if (shouldUpdate) {
			try {
				downloadAndInstall()
			} catch (e) {
				console.error(e)
				setUpdating(false)
				setErrorModal?.({ open: true, log: String(e) })
			}
		}
	}

	return (
		<UpdaterContext.Provider
			value={{ availableUpdate, setAvailableUpdate, manifest: update, setManifest: setUpdate, updating, setUpdating, updateApp, progress }}>
			{children}
		</UpdaterContext.Provider>
	)
}
