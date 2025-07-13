import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as CpuIcon } from '~/icons/cpu.svg'
import { ReactComponent as GpuIcon } from '~/icons/gpu.svg'
import { ReactComponent as MicrophoneIcon } from '~/icons/microphone.svg'
import { cx } from '~/lib/utils'
import { ModelOptions } from '~/providers/Preference'
import AnimatedLoader from './AnimatedLoader'
import {
	getModelInfo,
	getLanguageDisplayName,
	formatFileSize
} from '~/lib/whisperInfo'

interface EnhancedProgressPanelProps {
	isAborting: boolean
	onAbort: () => void
	progress: number | null
	fileName?: string
	fileSize?: number
	modelPath?: string | null
	modelOptions: ModelOptions
	useGpu?: boolean
	currentPhase?: string
}

export default function EnhancedProgressPanel({
	isAborting,
	onAbort,
	progress,
	fileName,
	fileSize,
	modelPath,
	modelOptions,
	useGpu = false,
	currentPhase = 'Loading Model'
}: EnhancedProgressPanelProps) {
	const { t } = useTranslation()
	const [startTime] = useState(Date.now())
	const [elapsedTime, setElapsedTime] = useState(0)

	const modelInfo = getModelInfo(modelPath ?? null)
	const languageName = getLanguageDisplayName(modelOptions.lang)


	// Update elapsed time
	useEffect(() => {
		const interval = setInterval(() => {
			setElapsedTime(Date.now() - startTime)
		}, 1000)
		return () => clearInterval(interval)
	}, [startTime])

	const formatElapsedTime = (ms: number) => {
		const seconds = Math.floor(ms / 1000)
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${seconds}s`
	}



	return (
		<div className="w-full flex flex-col items-center mb-6">
			<div className="bg-base-200 p-6 rounded-xl shadow-sm border border-base-300/50 max-w-4xl w-full">
				{/* Unified 4-Section Grid */}
				<div className="grid grid-cols-1 gap-4 mb-4">
					{/* Top Row - Custom Width Distribution */}
					<div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
						{/* Transcription Status */}
						<div className="bg-base-100/60 backdrop-blur-sm p-4 rounded-xl border border-base-300/30 shadow-sm hover:shadow-md transition-all duration-300">
							<h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
								<MicrophoneIcon className="w-4 h-4" />
								Transcription Status
							</h4>
							<div className="flex items-center gap-4 mb-3">
								<div className="flex-shrink-0 relative">
									<AnimatedLoader size={80} strokeWidth={3} />
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="text-xs font-semibold text-center leading-tight">
											{formatElapsedTime(elapsedTime)}
										</span>
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-medium text-sm mb-1">
										{isAborting ? t('common.aborting') : t('common.transcribing')}
									</p>
									{fileName && (
										<p 
											className="text-xs opacity-75 truncate font-medium max-w-full overflow-hidden"
											title={fileName + (fileSize ? ` (${formatFileSize(fileSize)})` : '')}
										>
											{fileName}
											{fileSize && <span className="ml-1">({formatFileSize(fileSize)})</span>}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Progress Info */}
						<div className="bg-base-100/60 backdrop-blur-sm p-4 rounded-xl border border-base-300/30 shadow-sm hover:shadow-md transition-all duration-300">
							<h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
								<span className="text-primary">⚡</span>
								Progress Info
							</h4>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium animate-pulse">{currentPhase}</span>
								<span className="text-sm font-mono font-semibold text-primary">
									{progress ? `${Math.round(progress)}%` : '0%'}
								</span>
							</div>

							<div className="w-full bg-base-300/50 rounded-full h-2 overflow-hidden">
								<div
									className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500 ease-out"
									style={{ width: `${progress || 0}%` }}
								></div>
							</div>
						</div>
					</div>

					{/* Bottom Row - Equal Width Distribution */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Model Information */}
						<div className="bg-base-100/60 backdrop-blur-sm p-4 rounded-xl border border-base-300/30 shadow-sm hover:shadow-md transition-all duration-300">
							<h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
								{useGpu ? <GpuIcon className="w-4 h-4" /> : <CpuIcon className="w-4 h-4" />}
								Model Configuration
							</h4>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between items-center">
									<span className="opacity-75 font-medium">Model:</span>
									<span className="font-medium">{modelInfo.name}</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="opacity-75 font-medium">Size:</span>
									<span>{modelInfo.size}</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="opacity-75 font-medium">Language:</span>
									<span>{languageName}</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="opacity-75 font-medium">Processing:</span>
									<span className={cx(useGpu ? 'text-green-600' : 'text-blue-600')}>
										{useGpu ? 'GPU Accelerated' : 'CPU'}
									</span>
								</div>
							</div>
						</div>

						{/* Active Settings */}
						<div className="bg-base-100/60 backdrop-blur-sm p-4 rounded-xl border border-base-300/30 shadow-sm hover:shadow-md transition-all duration-300">
							<h4 className="font-semibold mb-3 text-sm">Active Settings</h4>
							<div className="space-y-2 text-sm">
								{modelOptions.temperature !== undefined && (
									<div className="flex justify-between items-center">
										<span className="opacity-75 font-medium">Temperature:</span>
										<span>{modelOptions.temperature}</span>
									</div>
								)}
								{modelOptions.sampling_strategy && (
									<div className="flex justify-between items-center">
										<span className="opacity-75 font-medium">Sampling:</span>
										<span className="capitalize">{modelOptions.sampling_strategy}</span>
									</div>
								)}
								{modelOptions.word_timestamps && (
									<div className="flex justify-between items-center">
										<span className="opacity-75 font-medium">Word Timing:</span>
										<span className="text-green-600">Enabled</span>
									</div>
								)}
								{modelOptions.translate && (
									<div className="flex justify-between items-center">
										<span className="opacity-75 font-medium">Translation:</span>
										<span className="text-blue-600">To English</span>
									</div>
								)}
								{modelOptions.n_threads && (
									<div className="flex justify-between items-center">
										<span className="opacity-75 font-medium">CPU Threads:</span>
										<span>{modelOptions.n_threads}</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>


				{/* Action Controls */}
				<div className="flex justify-center pt-2">
					{!isAborting && (
						<button
							onClick={onAbort}
							className="btn btn-outline btn-error gap-2 hover:scale-105 transition-all duration-200"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
							{t('common.cancel')}
						</button>
					)}
				</div>
			</div>
		</div>
	)
}