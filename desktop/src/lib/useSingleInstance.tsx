import { ModifyState, NamedPath, pathToNamedPath } from './utils'
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import * as config from '~/lib/config'
import * as os from '@tauri-apps/plugin-os'

interface UseSingleInstanceProps {
	setFiles: ModifyState<NamedPath[]>
}

export function useSingleInstance({ setFiles }: UseSingleInstanceProps) {
	async function handleSingleInstance() {
		await listen<string[]>('single-instance', async (event) => {
			const argv = event.payload

			// if not action, probably it's open with action
			const newFiles: NamedPath[] = []
			for (const arg of argv) {
				if (config.audioExtensions.some((e) => arg.endsWith(e)) || config.videoExtensions.some((e) => arg.endsWith(e))) {
					newFiles.push(await pathToNamedPath(arg))
				}
			}
			if (newFiles) {
				setFiles([...newFiles])
			}
		})
	}

	useEffect(() => {
		handleSingleInstance()
	}, [])
}
