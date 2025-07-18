import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ReactComponent as TranscribeIcon } from '~/icons/microphone.svg'
import { ReactComponent as SettingsIcon } from '~/icons/settings.svg'

export default function NavigationBar() {
	const { t } = useTranslation()
	const location = useLocation()
	const navigate = useNavigate()

	const isTranscribeActive = location.pathname === '/'
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
						{t('common.transcribe')}
					</button>
					<button
						onClick={() => navigate('/settings')}
						className={`tab tab-lg gap-2 px-6 ${isSettingsActive ? 'tab-active' : ''}`}
					>
						<SettingsIcon className="w-5 h-5" />
						{t('common.settings')}
					</button>
				</div>
			</div>
		</div>
	)
}