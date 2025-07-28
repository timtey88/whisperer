import { useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ReactComponent as TranscribeIcon } from '~/icons/microphone.svg'
import { ReactComponent as HistoryIcon } from '~/icons/clock.svg'
import { ReactComponent as SettingsIcon } from '~/icons/settings.svg'
import { UpdaterContext } from '~/providers/Updater'

export default function NavigationBar() {
	const location = useLocation()
	const navigate = useNavigate()
	const { availableUpdate } = useContext(UpdaterContext)

	const isTranscribeActive = location.pathname === '/'
	const isHistoryActive = location.pathname === '/history'
	const isSettingsActive = location.pathname === '/settings'

	return (
		<div className="w-full max-w-4xl mx-auto px-6 mt-8 mb-8">
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
						className={`tab tab-lg gap-2 px-6 relative ${isSettingsActive ? 'tab-active' : ''}`}
					>
						<SettingsIcon className="w-5 h-5" />
						Settings
						{availableUpdate && (
							<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
						)}
					</button>
				</div>
			</div>
		</div>
	)
}