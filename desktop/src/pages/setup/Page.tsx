import { useTranslation } from 'react-i18next'
import { viewModel } from './viewModel'
import AnimatedLoader from '~/components/AnimatedLoader'
import LoadingText from '~/components/LoadingText'
import { AnimatedDownload } from '~/components/AnimatedDownload'

function App() {
	const { t } = useTranslation()
	const vm = viewModel()

	return (
		<div className="relative w-[100vw] h-[100vh] overflow-hidden bg-base-100">
			{/* Animated Background */}
			{vm.downloadProgress > 0 && vm.downloadProgress < 100 && (
				<div className="absolute inset-0 z-0 flex items-center justify-center opacity-10">
					<AnimatedLoader size={800} strokeWidth={4} />
				</div>
			)}

			{/* Content Overlay */}
			<div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 bg-black/30 backdrop-blur-sm">
				{/* Header */}
				<div className="text-4xl font-bold text-center mb-2 text-white drop-shadow-lg">
					{t('common.downloading-model', { company: vm.modelCompany })}
				</div>
				<p className="text-base text-gray-200 text-center max-w-lg">
					{!vm?.location?.state?.downloadURL && t('common.this-happens-once')}
				</p>

				{/* Loading Text Animation */}
				{vm.downloadProgress > 0 && <LoadingText />}

				{/* Animated Download Component */}
				{vm.downloadProgress > 0 && (
					<div className="w-full max-w-2xl mt-8">
						<AnimatedDownload 
							isAnimating={vm.downloadProgress > 0 && vm.downloadProgress < 100}
							onAnimationComplete={() => {
								// Optional: Add any completion logic here
							}}
						/>
					</div>
				)}

				{/* Loading Indicator */}
				{vm.downloadProgress === 0 && (
					<div className="w-32 h-32 flex items-center justify-center">
						<span className="loading loading-spinner loading-lg text-primary"></span>
					</div>
				)}

				{/* Progress Bar */}
				{vm.downloadProgress > 0 && (
					<div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4">
						<div className="flex justify-between text-sm font-medium text-white">
							<span>{vm.downloadedSize}</span>
							<span>{vm.totalSize}</span>
						</div>
						<div className="relative pt-1">
							<div className="flex items-center justify-between">
								<div>
									<span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white bg-primary/20">
										{Math.round(vm.downloadProgress)}%
									</span>
								</div>
							</div>
							<div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-white/20 mt-2">
								<div
									style={{ width: `${vm.downloadProgress}%` }}
									className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary to-primary-fade transition-all duration-300"
								></div>
							</div>
						</div>
						<div className="flex justify-between text-sm text-white/80">
							<span className="flex items-center">
								<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
								</svg>
								{vm.downloadSpeed}
							</span>
							<span className="flex items-center">
								<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								{vm.timeRemaining} remaining
							</span>
						</div>
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
