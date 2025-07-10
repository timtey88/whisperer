import { useTranslation } from 'react-i18next'
import { viewModel } from './viewModel'
import { AnimatedDownload } from '~/components/AnimatedDownload'
import AnimatedLoader from '~/components/AnimatedLoader'
import LoadingText from '~/components/LoadingText'

function App() {
	const { t } = useTranslation()
	const vm = viewModel()

	return (
		<div className="relative w-[100vw] h-[100vh] overflow-hidden bg-base-100 flex items-center justify-center p-6">
			{/* Main Content */}
			<div className="w-full max-w-4xl mx-auto text-center">
				{/* Header */}
				<div className="text-4xl font-bold mb-4 text-white drop-shadow-lg">
					{t('common.downloading-model', { company: vm.modelCompany })}
				</div>
				{!vm?.location?.state?.downloadURL && (
					<p className="text-base text-gray-200 mb-8 max-w-lg mx-auto">
						{t('common.this-happens-once')}
					</p>
				)}

				{/* Animated Download Component - Only show when download starts */}
				{vm.downloadProgress > 0 && (
					<AnimatedDownload 
						isAnimating={vm.downloadProgress < 100}
						downloadedSize={vm.downloadedSize}
						totalSize={vm.totalSize}
						progress={vm.downloadProgress}
						downloadSpeed={vm.downloadSpeed}
						timeRemaining={vm.timeRemaining}
						onAnimationComplete={() => {
							console.log('Download complete!');
						}}
						className="w-full max-w-2xl mx-auto"
					/>
				)}

				{/* Loading Indicator */}
				{vm.downloadProgress === 0 && (
					<div className="flex flex-col items-center justify-center space-y-8">
						<AnimatedLoader size={120} strokeWidth={6} />
						<LoadingText />
					</div>
				)}

				{/* Cancel Button */}
				<div className="mt-8">
					<button
						className="btn btn-ghost text-white/80 hover:bg-white/10 hover:text-white transition-all"
						onClick={vm.cancelSetup}
					>
						<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
						{t('common.cancel')}
					</button>
				</div>
			</div>
			{vm.isOnline === false && (
				<div className="modal modal-open">
					<div className="modal-box">
						<h1 className="text-3xl text-center">{t('common.no-connection')}</h1>
						<p className="mt-3 text-center">{t('common.info-manual-download')}</p>
						<div className="flex flex-col justify-center mt-5 gap-2">
							<button className="btn btn-primary flex-1" onClick={vm.downloadIfOnline}>
								{t('common.try-again')}
							</button>
							<button className="btn btn-sm" onClick={vm.cancelSetup}>
								{t('common.i-prefer-manual-setup')}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default App
