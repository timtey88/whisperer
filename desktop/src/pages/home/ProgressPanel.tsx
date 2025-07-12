import { useTranslation } from 'react-i18next'

interface ProgressPanelProps {
	isAborting: boolean
	onAbort: () => void
	progress: number | null
}

export default function ProgressPanel({ isAborting, onAbort, progress }: ProgressPanelProps) {
	const { t } = useTranslation()
	return (
		<div className="w-full flex flex-col items-center mb-6">
			<div className="flex flex-row items-center text-center gap-4 bg-base-200 p-6 rounded-2xl shadow-lg border border-base-300">
				<span className="loading loading-spinner text-primary"></span>
				{isAborting ? (
					<div className="flex flex-col items-center">
						<p className="text-lg font-medium">{t('common.aborting')}...</p>
					</div>
				) : (
					<div className="flex flex-col items-center">
						<p className="text-lg font-medium mb-2">
							{t('common.transcribing')}
						</p>
						<div className="flex items-center gap-2">
							<progress 
								className="progress progress-primary w-32" 
								value={progress ?? 0} 
								max="100"
							></progress>
							<span className="text-sm font-mono">
								{progress ? `${Math.round(progress)}%` : '0%'}
							</span>
						</div>
					</div>
				)}
				{!isAborting && (
					<button onClick={onAbort} className="btn btn-primary btn-ghost btn-sm text-red-500">
						{t('common.cancel')}
					</button>
				)}
			</div>
		</div>
	)
}
