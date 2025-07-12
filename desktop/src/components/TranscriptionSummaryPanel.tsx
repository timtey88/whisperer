import { useTranslation } from 'react-i18next'
import { ReactComponent as CheckIcon } from '~/icons/check.svg'
import { ReactComponent as CancelIcon } from '~/icons/cancel.svg'
import { ReactComponent as ClockIcon } from '~/icons/clock.svg'
import { ReactComponent as FileIcon } from '~/icons/file.svg'
import { ReactComponent as InfoIcon } from '~/icons/info.svg'
import { cx } from '~/lib/utils'
import { TranscriptionResult } from '~/pages/home/viewModel'

interface TranscriptionSummaryPanelProps {
	result: TranscriptionResult
	onDismiss: () => void
}

export default function TranscriptionSummaryPanel({
	result,
	onDismiss
}: TranscriptionSummaryPanelProps) {
	const { t } = useTranslation()

	const formatDuration = (seconds: number) => {
		if (seconds < 60) {
			return `${seconds}s`
		} else {
			const minutes = Math.floor(seconds / 60)
			const remainingSeconds = seconds % 60
			return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
		}
	}

	const getStatusIcon = () => {
		switch (result.status) {
			case 'completed':
				return <CheckIcon className="w-5 h-5 text-success" />
			case 'failed':
				return <CancelIcon className="w-5 h-5 text-error" />
			case 'canceled':
				return <CancelIcon className="w-5 h-5 text-warning" />
			case 'incomplete':
				return <InfoIcon className="w-5 h-5 text-warning" />
			default:
				return <InfoIcon className="w-5 h-5 text-base-content" />
		}
	}

	const getStatusText = () => {
		switch (result.status) {
			case 'completed':
				return t('common.transcribed')
			case 'failed':
				return t('common.error')
			case 'canceled':
				return t('common.cancel')
			case 'incomplete':
				return 'Incomplete'
			default:
				return 'Unknown'
		}
	}

	const getStatusColor = () => {
		switch (result.status) {
			case 'completed':
				return 'border-success bg-success/10'
			case 'failed':
				return 'border-error bg-error/10'
			case 'canceled':
				return 'border-warning bg-warning/10'
			case 'incomplete':
				return 'border-warning bg-warning/10'
			default:
				return 'border-base-300 bg-base-200'
		}
	}

	return (
		<div className="w-full flex flex-col items-center mb-6">
			<div className={cx(
				"border-2 p-4 rounded-2xl shadow-lg max-w-4xl w-full",
				getStatusColor()
			)}>
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						{getStatusIcon()}
						<div>
							<h3 className="text-lg font-semibold">
								{getStatusText()}
							</h3>
							<p className="text-sm opacity-70">
								Transcription {result.status}
							</p>
						</div>
					</div>
					<button
						onClick={onDismiss}
						className="btn btn-ghost btn-sm btn-square"
						title="Dismiss"
					>
						<CancelIcon className="w-4 h-4" />
					</button>
				</div>

				{/* Details Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* File Information */}
					<div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
						<FileIcon className="w-5 h-5 text-primary" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate">
								{result.fileName}
							</p>
							<p className="text-xs opacity-60">
								Audio file
							</p>
						</div>
					</div>

					{/* Duration Information */}
					<div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
						<ClockIcon className="w-5 h-5 text-primary" />
						<div className="flex-1">
							<p className="text-sm font-medium">
								{formatDuration(result.duration)}
							</p>
							<p className="text-xs opacity-60">
								Processing time
							</p>
						</div>
					</div>
				</div>

				{/* Error Message */}
				{result.status === 'failed' && result.error && (
					<div className="mt-4 p-3 bg-error/10 border border-error rounded-lg">
						<p className="text-sm text-error font-medium mb-1">Error Details:</p>
						<p className="text-xs opacity-80">{result.error}</p>
					</div>
				)}

				{/* Success Message */}
				{result.status === 'completed' && (
					<div className="mt-4 text-center">
						<p className="text-sm opacity-70">
							Transcription completed successfully in {formatDuration(result.duration)}
						</p>
					</div>
				)}

				{/* Canceled Message */}
				{result.status === 'canceled' && (
					<div className="mt-4 text-center">
						<p className="text-sm opacity-70">
							Transcription was canceled after {formatDuration(result.duration)}
						</p>
					</div>
				)}
			</div>
		</div>
	)
}