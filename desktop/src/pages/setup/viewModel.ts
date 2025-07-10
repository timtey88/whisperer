import { invoke } from '@tauri-apps/api/core'
import { emit, listen } from '@tauri-apps/api/event'
import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ErrorModalContext } from '~/providers/ErrorModal'
import { usePreferenceProvider } from '~/providers/Preference'
import * as utils from '~/lib/utils'
import * as osExt from '@tauri-apps/plugin-os'
import * as config from '~/lib/config'

export function viewModel() {
	const location = useLocation()
	const [downloadProgress, setDownloadProgress] = useState(0)
	const [downloadSpeed, setDownloadSpeed] = useState<string>('0 KB/s')
	const [timeRemaining, setTimeRemaining] = useState<string>('Calculating...')
	const [downloadedSize, setDownloadedSize] = useState<string>('0 MB')
	const [totalSize, setTotalSize] = useState<string>('0 MB')
	const [isOnline, setIsOnline] = useState<boolean | null>(null)
	const downloadProgressRef = useRef(0)
	const lastBytesReceivedRef = useRef(0)
	const lastTimeRef = useRef(Date.now())
	const { setState: setErrorModal } = useContext(ErrorModalContext)
	const navigate = useNavigate()
	const preference = usePreferenceProvider()
	const [modelCompany, setModelCompany] = useState('OpenAI')

	function formatBytes(bytes: number, decimals = 2): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}

	function formatTime(seconds: number): string {
		if (isNaN(seconds) || !isFinite(seconds)) return 'Calculating...';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return [h, m > 9 ? m : h ? '0' + m : m || '0', s < 10 ? '0' + s : s].filter(Boolean).join(':');
	}

	function handleProgressEvenets() {
		listen('download_progress', (event) => {
			const [current, total] = event.payload as [number, number];
			const now = Date.now();
			const timeDiff = (now - lastTimeRef.current) / 1000; // in seconds
			
			if (timeDiff > 0.5) { // Update every 500ms for better performance
				const bytesDiff = current - lastBytesReceivedRef.current;
				const speed = bytesDiff / timeDiff; // bytes per second
				
				setDownloadSpeed(`${formatBytes(speed)}/s`);
				setDownloadedSize(formatBytes(current));
				setTotalSize(formatBytes(total));
				
				// Calculate remaining time
				if (speed > 0) {
					const remainingBytes = total - current;
					const remainingTime = remainingBytes / speed;
					setTimeRemaining(formatTime(remainingTime));
				}
				
				lastBytesReceivedRef.current = current;
				lastTimeRef.current = now;
			}

			const newDownloadProgress = Number((current / total) * 100);
			if (newDownloadProgress > downloadProgressRef.current) {
				setDownloadProgress(newDownloadProgress);
				downloadProgressRef.current = newDownloadProgress;
			}
		});
	}

	async function downloadModel() {
		handleProgressEvenets()

		let lastError = null

		try {
			let urls = []

			// Determine model URLs
			if (location?.state?.downloadURL) {
				urls = [location.state.downloadURL]
				console.log(`[model] Using provided model URL: ${urls[0]}`)
				if (urls[0].includes('ivrit')) {
					setModelCompany('ivrit.ai')
				}
			} else {
				urls = [...config.modelUrls.default]
				const locale = await osExt.locale()
				console.log(`[locale] Detected locale: ${locale}`)

				if (locale?.endsWith('-IL')) {
					console.log(`[model] Prioritizing Hebrew models`)
					urls.unshift(...config.modelUrls.hebrew)
					setModelCompany('ivrit.ai')
				}
			}

			// Try downloading from each URL
			for (const url of urls) {
				try {
					console.log(`[model] Attempting to download from: ${url}`)
					const path = await utils.downloadModel(url)
					if (path) {
						console.log(`[model] Download succeeded: ${path}`)
						preference.setModelPath(path)
						navigate('/')
						return
					}
				} catch (err) {
					console.error(`[model] Failed to download from ${url}:`, err)
					lastError = err
				}
			}

			throw new Error(`All model downloads failed. Last error: ${lastError}`)
		} catch (err) {
			console.error(`[model] Unhandled error:`, err)
			setErrorModal?.({ open: true, log: String(err) })
		}
	}

	async function downloadIfOnline() {
		// Check if online
		const isOnlineResponse = await invoke<boolean>('is_online')
		// If online download model
		if (isOnlineResponse) {
			downloadModel()
		}
		// Update UI
		setIsOnline(isOnlineResponse)
	}

	async function cancelSetup() {
		// Cancel and go to settings
		preference.setSkippedSetup(true)
		emit('abort_download')
		navigate('/#settings')
	}

	useEffect(() => {
		downloadIfOnline()
	}, [])

	return {
		modelCompany,
		navigate,
		cancelSetup,
		setErrorModal,
		downloadProgress,
		downloadIfOnline,
		setDownloadProgress,
		downloadProgressRef,
		isOnline,
		location,
		downloadSpeed,
		timeRemaining,
		downloadedSize,
		totalSize
	}
}
