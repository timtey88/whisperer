import { useNavigate } from 'react-router-dom'
import { InfoTooltip } from '~/components/InfoTooltip'
import { ReactComponent as FolderIcon } from '~/icons/folder.svg'
import { ReactComponent as LinkIcon } from '~/icons/link.svg'
import { ReactComponent as ResetIcon } from '~/icons/reset.svg'
import { ReactComponent as WrenchIcon } from '~/icons/wrench.svg'
import { ReactComponent as CopyIcon } from '~/icons/copy.svg'
import { ReactComponent as ListIcon } from '~/icons/list.svg'

import * as config from '~/lib/config'
import { viewModel } from './viewModel'
import * as os from '@tauri-apps/plugin-os'
import { useEffect, useState } from 'react'
import CustomSelect, { SelectOption } from '~/components/CustomSelect'
import Layout from '~/components/Layout'
import NavigationBar from '~/components/NavigationBar'
import MainContent from '~/components/MainContent'

export default function SettingsPage() {
	const vm = viewModel()
	const navigate = useNavigate()

	const [platform, setPlatform] = useState<os.Platform | null>(null)

	// Create theme options for CustomSelect
	const themeOptions: SelectOption[] = config.themes.map((theme) => ({
		value: theme,
		label: theme === 'dark' ? 'Dark' : 'Light'
	}))

	// Create model options for CustomSelect
	const modelOptions: SelectOption[] = vm.models.map((model) => ({
		value: model.path,
		label: model.name
	}))

	async function getPlatform() {
		setPlatform(os.platform())
	}

	useEffect(() => {
		getPlatform()
	}, [])

	return (
		<Layout>
			<NavigationBar />
			<MainContent maxWidth="md" className="pb-4 dark:font-normal">

				<label className="form-control w-full">
					<div className="label">
						<span className="label-text">Theme</span>
					</div>
					<CustomSelect
						options={themeOptions}
						value={vm.preference.theme}
						onChange={(value) => vm.preference.setTheme(value as any)}
						placeholder="Select Theme"
					/>
				</label>

				<div className="label mt-5">
					<span className="label-text opacity-60">When completing transcription</span>
				</div>

				<div className="form-control">
					<label className="label cursor-pointer">
						<span className="label-text">Play sound on finish</span>
						<input
							type="checkbox"
							className="toggle toggle-primary"
							onChange={(e) => vm.preference.setSoundOnFinish(e.target.checked)}
							checked={vm.preference.soundOnFinish}
						/>
					</label>
					<label className="label cursor-pointer">
						<span className="label-text">Focus window on finish</span>
						<input
							type="checkbox"
							className="toggle toggle-primary"
							onChange={(e) => vm.preference.setFocusOnFinish(e.target.checked)}
							checked={vm.preference.focusOnFinish}
						/>
					</label>
				</div>

				<div className="label mt-5">
					<span className="label-text flex items-center gap-1">
						<InfoTooltip text="Configure transcription model and options" />
						Customize
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<div onFocus={vm.loadModels}>
						<CustomSelect
							options={modelOptions}
							value={vm.preference.modelPath ?? ''}
							onChange={(value) => vm.preference.setModelPath(value)}
							placeholder="Select model"
						/>
					</div>
					{modelOptions.length === 0 && (
						<div className="alert alert-info">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<span>No models found. Click "Models Management" below to download a model for transcription.</span>
						</div>
					)}

					<button onMouseDown={() => navigate('/models')} className="btn bg-base-300 text-base-content">
						Manage models
						<ListIcon className="w-4 h-4" />
					</button>
					<button onMouseDown={() => navigate('/model-options')} className="btn bg-base-300 text-base-content">
						Model options
						<WrenchIcon className="w-4 h-4" />
					</button>
					<button onMouseDown={vm.openModelPath} className="btn bg-base-300 text-base-content">
						Models folder
						<FolderIcon className="h-4 w-4" />
					</button>
					<button onMouseDown={vm.changeModelsFolder} className="btn bg-base-300 text-base-content">
						Change models folder
						<WrenchIcon className="h-4 w-4" />
					</button>
					<button onMouseDown={vm.openModelsUrl} className="btn bg-base-300 text-base-content">
						Models source
						<LinkIcon className="w-4 h-4" />
					</button>
				</div>

				<div className="label mt-10">
					<span className="label-text">Advanced</span>
				</div>
				<div className="flex flex-col gap-1">
					<div>
						<div className="form-control">
							<label className="label cursor-pointer">
								<span className="label-text">Use GPU</span>
								<input
									type="checkbox"
									className="toggle toggle-primary"
									onChange={(e) => vm.preference.setUseGpu(e.target.checked)}
									checked={Boolean(vm.preference.useGpu)}
								/>
							</label>
						</div>
					</div>
					
					<div>
						<label className="form-control w-full py-2">
							<span className="label-text flex items-center gap-1 cursor-default mb-2">
								<InfoTooltip text="GPU device index to use for acceleration. Usually 0 for integrated GPUs, 1+ for discrete GPUs. Use 'Detect GPU Devices' button below to find the recommended device for your system." />
								GPU device
							</span>
							<input
								value={vm.preference.gpuDevice}
								onChange={(e) => vm.preference.setGpuDevice(parseInt(e.target.value) ?? 0)}
								className="input input-bordered"
								type="number"
							/>
						</label>
					</div>

					<button onClick={vm.detectGpu} className="btn bg-base-300 text-base-content">
						Detect GPU Devices
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
						</svg>
					</button>
				</div>

				{vm.gpuInfo && (
					<div className="bg-base-200 p-4 rounded-lg mt-4 space-y-3">
						<h4 className="font-semibold text-base mb-3">Recommended Settings</h4>
						
						{/* Actionable Recommendations */}
						<div className="space-y-2 text-sm">
							<div className="flex items-center justify-between p-3 bg-base-100 rounded border">
								<span className="font-medium">Set GPU Device to:</span>
								<span className="font-mono font-bold text-primary text-lg">{vm.gpuInfo.recommended_device}</span>
							</div>
							<div className="flex items-center justify-between p-3 bg-base-100 rounded border">
								<span className="font-medium">GPU Acceleration:</span>
								<span className={`font-medium ${vm.gpuInfo.gpu_acceleration_available ? 'text-green-600' : 'text-red-500'}`}>
									{vm.gpuInfo.gpu_acceleration_available ? 'Enable' : 'Disable'}
								</span>
							</div>
							{vm.gpuInfo.devices.length > 0 && vm.gpuInfo.devices[vm.gpuInfo.recommended_device] && (
								<div className="flex items-center justify-between p-3 bg-base-100 rounded border">
									<span className="font-medium">Detected GPU:</span>
									<span className="text-base-content/80">
										{vm.gpuInfo.devices[vm.gpuInfo.recommended_device].name} ({vm.gpuInfo.devices[vm.gpuInfo.recommended_device].device_type})
									</span>
								</div>
							)}
						</div>
					</div>
				)}
				{platform === 'windows' && (
					<div className="form-control w-full mt-3">
						<label className="label cursor-pointer">
							<span className="label-text flex items-center gap-1 cursor-default">
								<InfoTooltip text="Enable high performance GPU scheduling on Windows" />
								High GPU performance
							</span>

							<input
								type="checkbox"
								className="toggle toggle-primary"
								checked={vm.preference.highGraphicsPreference}
								onChange={() => vm.preference.setHighGraphicsPreference(!vm.preference.highGraphicsPreference)}
							/>
						</label>
					</div>
				)}

				{vm.isDiarizationAvailable && (
					<>
						<div className="label mt-10">
							<span className="label-text">Speaker recognition</span>
						</div>
						<div className="form-control w-full">
							<label className="label cursor-pointer">
								<span className="label-text flex items-center gap-1 cursor-default">
									<InfoTooltip text="Identify and separate different speakers in the audio" />
									Recognize speakers
								</span>
								<input
									type="checkbox"
									className="toggle toggle-primary"
									onChange={(e) => vm.preference.setRecognizeSpeakers(e.target.checked)}
									checked={vm.preference.recognizeSpeakers}
								/>
							</label>
						</div>
					
						{vm.preference.recognizeSpeakers && (
							<>
								<label className="form-control w-full py-2">
									<span className="label-text flex items-center gap-1 cursor-default">
										<InfoTooltip text="Maximum number of speakers to identify" />
										Max speakers
									</span>
									<input
										value={vm.preference.maxSpeakers}
										onChange={(e) => vm.preference.setMaxSpeakers(parseInt(e.target.value) ?? 5)}
										className="input input-bordered"
										type="number"
										min="1"
										max="20"
									/>
								</label>
								<label className="form-control w-full py-2">
									<span className="label-text flex items-center gap-1 cursor-default">
										<InfoTooltip text="Threshold for speaker change detection (0-1)" />
										Diarization threshold
									</span>
									<input
										value={vm.preference.diarizeThreshold}
										onChange={(e) => vm.preference.setDiarizeThreshold(parseFloat(e.target.value) ?? 0.5)}
										className="input input-bordered"
										type="number"
										min="0"
										max="1"
										step="0.1"
									/>
								</label>
							
								<div className="label mt-5">
									<span className="label-text">HuggingFace Token Configuration</span>
								</div>
								<label className="form-control w-full py-2">
									<span className="label-text flex items-center gap-1 cursor-default">
										<InfoTooltip text="Enter your HuggingFace access token with READ permissions for pyannote/speaker-diarization-3.1" />
										HuggingFace Token
									</span>
									<input
										value={vm.preference.huggingFaceToken || ''}
										onChange={(e) => vm.preference.setHuggingFaceToken(e.target.value || null)}
										placeholder="hf_xxxxxxxxxx"
										className="input input-bordered"
										type="password"
									/>
								</label>
								<div className="flex flex-col gap-1">
									<button 
										onClick={vm.testDiarization}
										className="btn bg-base-300 text-base-content"
										disabled={!vm.preference.huggingFaceToken}
									>
										Test Token & Dependencies
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
											<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.5 14.5M14.25 3.104c.251.023.501.05.75.082M19.5 14.5l-5.25 5.25m0 0H9.75m4.5 0V24" />
										</svg>
									</button>
								</div>
							</>
						)}
					</>
				)}

				<div className="flex flex-col gap-1 mt-10">
					<button onMouseDown={vm.copyLogs} className="btn bg-base-300 text-base-content">
						Copy logs
						<CopyIcon className="h-4 w-4" />
					</button>
					<button onMouseDown={vm.revealLogs} className="btn bg-base-300 text-base-content">
						Logs folder
						<FolderIcon className="h-4 w-4" />
					</button>
					<button onMouseDown={vm.revealTemp} className="btn bg-base-300 text-base-content">
						Temp folder
						<FolderIcon className="h-4 w-4" />
					</button>
					<button onClick={vm.askAndReset} className="btn bg-base-300">
						Reset app
						<ResetIcon className="h-5 w-5" />
					</button>
					
					<div className="divider mt-6 mb-2">
						<span className="label-text opacity-60">Uninstall</span>
					</div>
					<button onClick={vm.prepareForUninstall} className="btn bg-red-600 hover:bg-red-700 text-white">
						Prepare for Uninstall
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
							<path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
						</svg>
					</button>
					<p className="text-xs text-gray-500 text-center px-2">
						Removes all app data, models, and cache files. Use before deleting the app.
					</p>
					
					<p className="text-center font-light mt-4">{vm.appVersion}</p>
				</div>
			</MainContent>
		</Layout>
	)
}