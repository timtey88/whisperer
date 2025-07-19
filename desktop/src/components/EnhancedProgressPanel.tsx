import { useEffect, useState, useRef } from 'react'
import { ReactComponent as CpuIcon } from '~/icons/cpu.svg'
import { ReactComponent as GpuIcon } from '~/icons/gpu.svg'
import { ReactComponent as MicrophoneIcon } from '~/icons/microphone.svg'
import { ReactComponent as ClockIcon } from '~/icons/clock.svg'
import { cx } from '~/lib/utils'
import { ModelOptions } from '~/providers/Preference'
import AnimatedLoader from './AnimatedLoader'
import AnimatedTimer from './AnimatedTimer'
import AnimatedNumber from './AnimatedNumber'
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
	const [startTime] = useState(Date.now())
	const [elapsedTime, setElapsedTime] = useState(0)
	const [progressHistory, setProgressHistory] = useState<Array<{time: number, progress: number}>>([])
	const [displayProgress, setDisplayProgress] = useState(0)
	const [isProgressAnimating, setIsProgressAnimating] = useState(false)
	const progressAnimationRef = useRef<NodeJS.Timeout | null>(null)

	const modelInfo = getModelInfo(modelPath ?? null)
	const languageName = getLanguageDisplayName(modelOptions.lang)


	// Update elapsed time and track progress
	useEffect(() => {
		const interval = setInterval(() => {
			setElapsedTime(Date.now() - startTime)
			
			// Track progress history for speed calculation
			if (progress && progress > 0) {
				setProgressHistory(prev => {
					const newEntry = { time: Date.now(), progress }
					// Keep only last 10 entries for calculation
					const updated = [...prev, newEntry].slice(-10)
					return updated
				})
			}
		}, 1000)
		return () => clearInterval(interval)
	}, [startTime, progress])

	// Calculate estimated time remaining and processing speed
	const getProgressStats = () => {
		if (!progress || progress <= 0 || progressHistory.length < 2) {
			return { estimatedTimeRemaining: null, processingSpeed: null }
		}

		// Calculate average progress per second from recent history
		const recentHistory = progressHistory.slice(-5) // Use last 5 data points
		if (recentHistory.length < 2) {
			return { estimatedTimeRemaining: null, processingSpeed: null }
		}

		const timeSpan = recentHistory[recentHistory.length - 1].time - recentHistory[0].time
		const progressSpan = recentHistory[recentHistory.length - 1].progress - recentHistory[0].progress
		
		if (timeSpan <= 0 || progressSpan <= 0) {
			return { estimatedTimeRemaining: null, processingSpeed: null }
		}

		const progressPerSecond = (progressSpan / timeSpan) * 1000 // Convert to per second
		const remainingProgress = 100 - progress
		const estimatedTimeRemaining = remainingProgress / progressPerSecond

		return {
			estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : null,
			processingSpeed: progressPerSecond
		}
	}

	const { estimatedTimeRemaining, processingSpeed } = getProgressStats()

	// Format time in human readable format
	const formatTime = (seconds: number) => {
		if (seconds < 60) return `${Math.round(seconds)}s`
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
		return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
	}

	// Get phase display info
	// Cleanup progress animation on unmount
	useEffect(() => {
		return () => {
			if (progressAnimationRef.current) {
				clearTimeout(progressAnimationRef.current)
			}
		}
	}, [])

	// Smooth progress bar animation
	useEffect(() => {
		const targetProgress = progress || 0
		
		if (targetProgress === displayProgress || isProgressAnimating) {
			return
		}

		// Don't animate tiny changes
		if (Math.abs(targetProgress - displayProgress) < 0.5) {
			setDisplayProgress(targetProgress)
			return
		}

		setIsProgressAnimating(true)
		const startProgress = displayProgress
		const difference = targetProgress - startProgress
		
		// Animation settings - faster for smaller jumps
		const incrementDelay = 30 // 30ms between steps for smooth animation
		const increment = difference > 0 ? Math.max(0.3, Math.abs(difference) / 100) : Math.min(-0.3, difference / 100)
		
		let currentProgress = startProgress

		const animateProgressStep = () => {
			currentProgress += increment

			// Ensure we don't overshoot the target
			if ((increment > 0 && currentProgress >= targetProgress) || 
				(increment < 0 && currentProgress <= targetProgress)) {
				setDisplayProgress(targetProgress)
				setIsProgressAnimating(false)
				return
			}

			setDisplayProgress(currentProgress)
			progressAnimationRef.current = setTimeout(animateProgressStep, incrementDelay)
		}

		// Start progress animation
		progressAnimationRef.current = setTimeout(animateProgressStep, incrementDelay)

	}, [progress, displayProgress, isProgressAnimating])

	const getPhaseInfo = (phase: string) => {
		const phaseMap: Record<string, { label: string; color: string }> = {
			'Loading Model': { label: 'Loading Model', color: 'text-blue-500' },
			'Processing Audio': { label: 'Processing Audio', color: 'text-green-500' },
			'Transcribing': { label: 'Transcribing Speech', color: 'text-purple-500' },
			'Finalizing': { label: 'Finalizing Results', color: 'text-orange-500' },
		}
		return phaseMap[phase] || { label: phase, color: 'text-primary' }
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
										<AnimatedTimer 
											elapsedTime={elapsedTime}
											className="text-xs font-semibold text-center leading-tight"
										/>
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-medium text-sm mb-1">
										{isAborting ? 'Aborting' : 'Transcribing'}
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
								<ClockIcon className="w-4 h-4 text-primary" />
								Progress Info
							</h4>
							
							{/* Phase and Progress Row */}
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2">
									<span className={cx("text-sm font-medium", getPhaseInfo(currentPhase).color)}>
										{getPhaseInfo(currentPhase).label}
									</span>
									<div className="flex gap-1">
										{[0, 1, 2].map((i) => (
											<div
												key={i}
												className={cx(
													"w-1 h-1 rounded-full animate-pulse",
													getPhaseInfo(currentPhase).color.replace('text-', 'bg-')
												)}
												style={{ animationDelay: `${i * 0.2}s` }}
											/>
										))}
									</div>
								</div>
								<AnimatedNumber 
									value={displayProgress}
									suffix="%"
									className="text-lg font-mono font-bold text-primary"
									decimalPlaces={0}
									animationSpeed="fast"
									maxDuration={1500}
								/>
							</div>

							{/* Enhanced Progress Bar */}
							<div className="w-full bg-base-300/50 rounded-full h-3 overflow-hidden mb-3 relative">
								<div
									className={cx(
										"h-3 rounded-full transition-all duration-700 ease-out relative overflow-hidden",
										"bg-gradient-to-r from-primary via-primary to-primary/80"
									)}
									style={{ width: `${displayProgress}%` }}
								>
									{/* Animated shine effect */}
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
								</div>
								{/* Subtle progress indicators (no visible borders) */}
								<div className="absolute inset-0 flex pointer-events-none">
									{[25, 50, 75].map((segment) => (
										<div
											key={segment}
											className="flex-1 relative"
										>
											{/* Only show subtle marker at the segment boundary */}
											<div 
												className="absolute top-0 right-0 w-px h-full opacity-20"
												style={{
													background: displayProgress >= segment 
														? 'transparent' 
														: 'rgba(255,255,255,0.3)'
												}}
											/>
										</div>
									))}
								</div>
							</div>

							{/* Stats Row */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs">
								<div className="flex items-center justify-between sm:justify-start gap-1">
									<span className="opacity-60">Time Left:</span>
									<span className="font-medium">
										{estimatedTimeRemaining && estimatedTimeRemaining < 3600 
											? formatTime(estimatedTimeRemaining)
											: '∞'
										}
									</span>
								</div>
								<div className="flex items-center justify-between sm:justify-start gap-1">
									<span className="opacity-60">Speed:</span>
									{processingSpeed && processingSpeed > 0.01 ? (
										<AnimatedNumber 
											value={processingSpeed}
											suffix="%/s"
											className="font-medium"
											decimalPlaces={1}
										/>
									) : (
										<span className="font-medium">—</span>
									)}
								</div>
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
							Cancel
						</button>
					)}
				</div>
			</div>
		</div>
	)
}