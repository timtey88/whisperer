import { useEffect } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { UnlistenFn } from '@tauri-apps/api/event'

export function useConfirmExit(shouldConfirm: boolean) {
	useEffect(() => {
		let unlistenFn: UnlistenFn | null = null
		getCurrentWebviewWindow()
			.listen('tauri://close-requested', async () => {
				if (shouldConfirm) {
					if (await confirm('Are you sure you want to exit? Any ongoing transcription will be cancelled.')) {
						getCurrentWebviewWindow().destroy()
					}
				} else {
					getCurrentWebviewWindow().destroy()
				}
			})
			.then((unlisten) => {
				unlistenFn = unlisten
			})
		return () => unlistenFn?.()
	}, [shouldConfirm])
}
