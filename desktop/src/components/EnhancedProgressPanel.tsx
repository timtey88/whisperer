import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as ClockIcon } from '~/icons/clock.svg'
import { ReactComponent as CpuIcon } from '~/icons/cpu.svg'
import { ReactComponent as GpuIcon } from '~/icons/gpu.svg'
import { ReactComponent as MicrophoneIcon } from '~/icons/microphone.svg'
import { cx } from '~/lib/utils'
import { ModelOptions } from '~/providers/Preference'
import AnimatedLoader from './AnimatedLoader'
import LoadingText from './LoadingText'
import { 
	getModelInfo, 
	getLanguageDisplayName, 
	getProcessingPhases,
	formatFileSize,
	estimateProcessingTime
} from '~/lib/whisperInfo'

interface EnhancedProgressPanelProps {
	isAborting: boolean
	onAbort: () => void
	progress: number | null
	fileName?: string
	fileSize?: number
	audioDuration?: number
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
	audioDuration,
	modelPath,
	modelOptions,
	useGpu = false,
	currentPhase = 'Loading Model'
}: EnhancedProgressPanelProps) {
	const { t } = useTranslation()
	const [startTime] = useState(Date.now())
	const [elapsedTime, setElapsedTime] = useState(0)

	const modelInfo = getModelInfo(modelPath)
	const languageName = getLanguageDisplayName(modelOptions.lang)
	const phases = getProcessingPhases()
	const currentPhaseInfo = phases.find(p => p.phase === currentPhase) || phases[0]
	

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

	const estimatedTime = audioDuration 
		? estimateProcessingTime(audioDuration, modelInfo.name, useGpu)
		: 'Calculating...'


	return (
		<div className="w-full flex flex-col items-center mb-6">
			<div className="bg-base-200 p-6 rounded-2xl shadow-lg border border-base-300 max-w-4xl w-full">
				{/* Header Section */}
				<div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
					<div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
						<div className="flex-shrink-0">
							<AnimatedLoader size={80} strokeWidth={3} />
						</div>
						
						<div className="flex-1 text-center sm:text-left">
							<h3 className="text-xl font-semibold mb-2">
								{isAborting ? t('common.aborting') : t('common.transcribing')}
							</h3>
							
							{fileName && (
								<p className="text-sm opacity-70 mb-2 truncate max-w-md">
									<MicrophoneIcon className="w-4 h-4 inline mr-1" />
									{fileName}
									{fileSize && <span className="ml-2">({formatFileSize(fileSize)})</span>}
								</p>
							)}
							
							<div className="flex items-center justify-center sm:justify-start gap-4 text-sm">
								<div className="flex items-center gap-1">
									<ClockIcon className="w-4 h-4" />
									<span>{formatElapsedTime(elapsedTime)}</span>
								</div>
								<div className="text-xs opacity-60">
									Est: {estimatedTime}
								</div>
							</div>
						</div>
					</div>

					{/* Progress Info Box */}
					<div className="bg-base-100 p-4 rounded-lg w-full md:w-80 flex-shrink-0">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<LoadingText text={currentPhase} />
							</div>
							<span className="text-sm font-mono font-medium">
								{progress ? `${Math.round(progress)}%` : '0%'}
							</span>
						</div>
						
						<div className="w-full bg-base-300 rounded-full h-2 mb-2">
							<div 
								className="bg-primary h-2 rounded-full transition-all duration-300"
								style={{ width: `${progress || 0}%` }}
							></div>
						</div>
						
						<p className="text-xs opacity-60 text-center">
							{currentPhaseInfo.description}
						</p>
					</div>
				</div>

				{/* Information Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					{/* Model Information */}
					<div className="bg-base-100 p-4 rounded-lg">
						<h4 className="font-medium mb-2 flex items-center gap-2">
							{useGpu ? <GpuIcon className="w-4 h-4" /> : <CpuIcon className="w-4 h-4" />}
							Model Configuration
						</h4>
						<div className="space-y-1 text-sm">
							<div className="flex justify-between">
								<span className="opacity-70">Model:</span>
								<span className="font-medium">{modelInfo.name}</span>
							</div>
							<div className="flex justify-between">
								<span className="opacity-70">Size:</span>
								<span>{modelInfo.size}</span>
							</div>
							<div className="flex justify-between">
								<span className="opacity-70">Language:</span>
								<span>{languageName}</span>
							</div>
							<div className="flex justify-between">
								<span className="opacity-70">Processing:</span>
								<span className={cx(useGpu ? 'text-green-600' : 'text-blue-600')}>
									{useGpu ? 'GPU Accelerated' : 'CPU'}
								</span>
							</div>
						</div>
					</div>

					{/* Active Settings */}
					<div className="bg-base-100 p-4 rounded-lg">
						<h4 className="font-medium mb-2">Active Settings</h4>
						<div className="space-y-1 text-sm">
							{modelOptions.temperature !== undefined && (
								<div className="flex justify-between">
									<span className="opacity-70">Temperature:</span>
									<span>{modelOptions.temperature}</span>
								</div>
							)}
							{modelOptions.sampling_strategy && (
								<div className="flex justify-between">
									<span className="opacity-70">Sampling:</span>
									<span className="capitalize">{modelOptions.sampling_strategy}</span>
								</div>
							)}
							{modelOptions.word_timestamps && (
								<div className="flex justify-between">
									<span className="opacity-70">Word Timing:</span>
									<span className="text-green-600">Enabled</span>
								</div>
							)}
							{modelOptions.translate && (
								<div className="flex justify-between">
									<span className="opacity-70">Translation:</span>
									<span className="text-blue-600">To English</span>
								</div>
							)}
							{modelOptions.n_threads && (
								<div className="flex justify-between">
									<span className="opacity-70">CPU Threads:</span>
									<span>{modelOptions.n_threads}</span>
								</div>
							)}
						</div>
					</div>
				</div>


				{/* Action Controls */}
				<div className="flex justify-center">
					{!isAborting && (
						<button 
							onClick={onAbort} 
							className="btn btn-outline btn-error gap-2"
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