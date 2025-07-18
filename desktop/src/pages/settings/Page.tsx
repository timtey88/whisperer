import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { InfoTooltip } from '~/components/InfoTooltip'
import { ReactComponent as FolderIcon } from '~/icons/folder.svg'
import { ReactComponent as LinkIcon } from '~/icons/link.svg'
import { ReactComponent as ResetIcon } from '~/icons/reset.svg'
import { ReactComponent as WrenchIcon } from '~/icons/wrench.svg'
import { ReactComponent as CopyIcon } from '~/icons/copy.svg'
import { ReactComponent as ListIcon } from '~/icons/list.svg'

import * as config from '~/lib/config'
import { supportedLanguages } from '~/lib/i18n'
import { viewModel } from './viewModel'
import * as os from '@tauri-apps/plugin-os'
import { useEffect, useState } from 'react'
import CustomSelect, { SelectOption } from '~/components/CustomSelect'

export default function SettingsPage() {
	const { t, i18n } = useTranslation()
	const vm = viewModel()
	const navigate = useNavigate()

	const [platform, setPlatform] = useState<os.Platform | null>(null)

	// Create language options for CustomSelect
	const languageOptions: SelectOption[] = Object.entries(supportedLanguages).map(([code, name]) => ({
		value: code,
		label: code === i18n.language ? t(`language.${name}`) : name
	}))

	// Create theme options for CustomSelect
	const themeOptions: SelectOption[] = config.themes.map((theme) => ({
		value: theme,
		label: t(`common.${theme}`)
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
		<div className="flex flex-col m-auto max-w-4xl w-full px-4 pb-4 dark:font-normal">
			
			{/* General Settings */}
			<div className="card bg-base-200 shadow-md mb-6">
				<div className="card-body">
					<h2 className="card-title text-xl mb-4">{t('common.general')}</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<label className="form-control w-full">
							<div className="label">
								<span className="label-text">{t('common.language')}</span>
							</div>
							<CustomSelect
								options={languageOptions}
								value={vm.preference.displayLanguage}
								onChange={(value) => vm.preference.setDisplayLanguage(value)}
								placeholder={t('common.select-language')}
							/>
						</label>

						<label className="form-control w-full">
							<div className="label">
								<span className="label-text">{t('common.theme')}</span>
							</div>
							<CustomSelect
								options={themeOptions}
								value={vm.preference.theme}
								onChange={(value) => vm.preference.setTheme(value as any)}
								placeholder={t('common.select-theme')}
							/>
						</label>
					</div>
				</div>
			</div>

			{/* Transcription Completion Settings */}
			<div className="card bg-base-200 shadow-md mb-6">
				<div className="card-body">
					<h2 className="card-title text-xl mb-4">{t('common.when-completing-transcription')}</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label cursor-pointer">
								<span className="label-text">{t('common.play-sound-on-finish')}</span>
								<input
									type="checkbox"
									className="toggle toggle-primary"
									onChange={(e) => vm.preference.setSoundOnFinish(e.target.checked)}
									checked={vm.preference.soundOnFinish}
								/>
							</label>
						</div>
						<div className="form-control">
							<label className="label cursor-pointer">
								<span className="label-text">{t('common.focus-window-on-finish')}</span>
								<input
									type="checkbox"
									className="toggle toggle-primary"
									onChange={(e) => vm.preference.setFocusOnFinish(e.target.checked)}
									checked={vm.preference.focusOnFinish}
								/>
							</label>
						</div>
					</div>
				</div>
			</div>

			{/* Model Management */}
			<div className="card bg-base-200 shadow-md mb-6">
				<div className="card-body">
					<h2 className="card-title text-xl mb-4 flex items-center gap-2">
						<InfoTooltip text={t('common.customize-info')} />
						{t('common.customize')}
					</h2>
					<div className="space-y-4">
						<div onFocus={vm.loadModels}>
							<label className="form-control w-full">
								<div className="label">
									<span className="label-text">{t('common.select-model')}</span>
								</div>
								<CustomSelect
									options={modelOptions}
									value={vm.preference.modelPath ?? ''}
									onChange={(value) => vm.preference.setModelPath(value)}
									placeholder={t('common.select-model')}
								/>
							</label>
						</div>
						{modelOptions.length === 0 && (
							<div className="alert alert-info">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								<span>No models found. Click "Models Management" below to download a model for transcription.</span>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
							<button onMouseDown={() => navigate('/models')} className="btn bg-base-300 text-base-content">
								{t('common.manage-models')}
								<ListIcon className="w-4 h-4" />
							</button>
							<button onMouseDown={() => navigate('/model-options')} className="btn bg-base-300 text-base-content">
								{t('common.model-options')}
								<WrenchIcon className="w-4 h-4" />
							</button>
							<button onMouseDown={vm.openModelPath} className="btn bg-base-300 text-base-content">
								{t('common.models-folder')}
								<FolderIcon className="h-4 w-4" />
							</button>
							<button onMouseDown={vm.changeModelsFolder} className="btn bg-base-300 text-base-content">
								{t('common.change-models-folder')}
								<WrenchIcon className="h-4 w-4" />
							</button>
							<button onMouseDown={vm.openModelsUrl} className="btn bg-base-300 text-base-content">
								{t('common.models-source')}
								<LinkIcon className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Advanced Settings */}
			<div className="card bg-base-200 shadow-md mb-6">
				<div className="card-body">
					<h2 className="card-title text-xl mb-4">{t('common.advanced')}</h2>
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<label className="form-control w-full">
								<div className="label">
									<span className="label-text flex items-center gap-1">
										<InfoTooltip text={t('common.info-gpu-device')} />
										{t('common.gpu-device')}
									</span>
								</div>
								<input
									value={vm.preference.gpuDevice}
									onChange={(e) => vm.preference.setGpuDevice(parseInt(e.target.value) ?? 0)}
									className="input input-bordered"
									type="number"
								/>
							</label>
							<div className="form-control">
								<label className="label cursor-pointer">
									<span className="label-text">{t('common.use-gpu')}</span>
									<input
										type="checkbox"
										className="toggle toggle-primary"
										onChange={(e) => vm.preference.setUseGpu(e.target.checked)}
										checked={Boolean(vm.preference.useGpu)}
									/>
								</label>
							</div>
						</div>
						{platform === 'windows' && (
							<div className="form-control w-full">
								<label className="label cursor-pointer">
									<span className="label-text flex items-center gap-1">
										<InfoTooltip text={t('common.info-high-gpu-performance')} />
										{t('common.high-gpu-performance')}
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
					</div>
				</div>
			</div>

			{/* Speaker Recognition */}
			{vm.isDiarizationAvailable && (
				<div className="card bg-base-200 shadow-md mb-6">
					<div className="card-body">
						<h2 className="card-title text-xl mb-4">{t('common.speaker-recognition')}</h2>
						<div className="space-y-4">
							<div className="form-control w-full">
								<label className="label cursor-pointer">
									<span className="label-text flex items-center gap-1">
										<InfoTooltip text={t('common.info-recognize-speakers')} />
										{t('common.recognize-speakers')}
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
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<label className="form-control w-full">
											<div className="label">
												<span className="label-text flex items-center gap-1">
													<InfoTooltip text={t('common.info-max-speakers')} />
													{t('common.max-speakers')}
												</span>
											</div>
											<input
												value={vm.preference.maxSpeakers}
												onChange={(e) => vm.preference.setMaxSpeakers(parseInt(e.target.value) ?? 5)}
												className="input input-bordered"
												type="number"
												min="1"
												max="20"
											/>
										</label>
										<label className="form-control w-full">
											<div className="label">
												<span className="label-text flex items-center gap-1">
													<InfoTooltip text={t('common.info-diarize-threshold')} />
													{t('common.diarize-threshold')}
												</span>
											</div>
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
									</div>
									
									<div className="divider">HuggingFace Token Configuration</div>
									<label className="form-control w-full">
										<div className="label">
											<span className="label-text flex items-center gap-1">
												<InfoTooltip text="Enter your HuggingFace access token with READ permissions for pyannote/speaker-diarization-3.1" />
												HuggingFace Token
											</span>
										</div>
										<input
											value={vm.preference.huggingFaceToken || ''}
											onChange={(e) => vm.preference.setHuggingFaceToken(e.target.value || null)}
											placeholder="hf_xxxxxxxxxx"
											className="input input-bordered"
											type="password"
										/>
									</label>
									<button 
										onClick={vm.testDiarization}
										className="btn btn-outline w-full md:w-auto"
										disabled={!vm.preference.huggingFaceToken}
									>
										Test Token & Dependencies
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
											<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.5 14.5M14.25 3.104c.251.023.501.05.75.082M19.5 14.5l-5.25 5.25m0 0H9.75m4.5 0V24" />
										</svg>
									</button>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{/* System & Debug */}
			<div className="card bg-base-200 shadow-md mb-6">
				<div className="card-body">
					<h2 className="card-title text-xl mb-4">System & Debug</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
						<button onMouseDown={vm.copyLogs} className="btn bg-base-300 text-base-content">
							{t('common.copy-logs')}
							<CopyIcon className="h-4 w-4" />
						</button>
						<button onMouseDown={vm.revealLogs} className="btn bg-base-300 text-base-content">
							{t('common.logs-folder')}
							<FolderIcon className="h-4 w-4" />
						</button>
						<button onMouseDown={vm.revealTemp} className="btn bg-base-300 text-base-content">
							{t('common.temp-folder')}
							<FolderIcon className="h-4 w-4" />
						</button>
						<button onClick={vm.askAndReset} className="btn btn-error">
							{t('common.reset-app')}
							<ResetIcon className="h-5 w-5" />
						</button>
					</div>
					<div className="mt-4 text-center">
						<p className="text-sm opacity-60">{vm.appVersion}</p>
					</div>
				</div>
			</div>
		</div>
	)
}