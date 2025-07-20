import { useLocation, useNavigate } from 'react-router-dom'
import { ReactComponent as TranscribeIcon } from '~/icons/microphone.svg'
import { ReactComponent as HistoryIcon } from '~/icons/clock.svg'
import { ReactComponent as SettingsIcon } from '~/icons/settings.svg'
import { useTranscription } from '~/providers/TranscriptionProvider'

export default function NavigationBar() {
	const location = useLocation()
	const navigate = useNavigate()
	const { transcription } = useTranscription()

	const isTranscribeActive = location.pathname === '/'
	const isHistoryActive = location.pathname === '/history'
	const isSettingsActive = location.pathname === '/settings'

	const isTranscribing = transcription.isActive

	return (
		<div className="w-full max-w-4xl mx-auto px-6 mt-8 mb-8">
			{/* Transcription Status Indicator */}
			{isTranscribing && !isHistoryActive && transcription.current && (
				<div className="mb-4 bg-info/10 border border-info/20 rounded-lg p-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="loading loading-spinner loading-sm text-info"></div>
							<div>
								<p className="font-medium text-sm">Transcribing: {transcription.current.fileName}</p>
								<p className="text-xs text-base-content/60">
									{transcription.current.phase}
									{transcription.current.progress !== undefined && 
										<span> • {transcription.current.progress}%</span>
									}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{transcription.current.progress !== undefined ? (
								<progress 
									className="progress progress-info w-20" 
									value={transcription.current.progress} 
									max="100"
								></progress>
							) : null}
							<button
								onClick={() => navigate('/')}
								className="btn btn-xs btn-primary"
							>
								View
							</button>
						</div>
					</div>
				</div>
			)}
			
			<div className="flex justify-center">
				<div className="tabs tabs-boxed bg-base-200 p-1">
					<button
						onClick={() => navigate('/')}
						className={`tab tab-lg gap-2 px-6 ${isTranscribeActive ? 'tab-active' : ''}`}
					>
						<TranscribeIcon className="w-5 h-5" />
						Transcribe
					</button>
					<button
						onClick={() => navigate('/history')}
						className={`tab tab-lg gap-2 px-6 ${isHistoryActive ? 'tab-active' : ''}`}
					>
						<HistoryIcon className="w-5 h-5" />
						History
					</button>
					<button
						onClick={() => navigate('/settings')}
						className={`tab tab-lg gap-2 px-6 ${isSettingsActive ? 'tab-active' : ''}`}
					>
						<SettingsIcon className="w-5 h-5" />
						Settings
					</button>
				</div>
			</div>
		</div>
	)
}