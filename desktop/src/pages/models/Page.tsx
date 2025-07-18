import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ReactComponent as ChevronLeftIcon } from '~/icons/chevron-left.svg'
import { ReactComponent as DownloadIcon } from '~/icons/download.svg'
import { ReactComponent as CheckIcon } from '~/icons/check.svg'
import { ReactComponent as CancelIcon } from '~/icons/cancel.svg'
import Layout from '~/components/Layout'
import MainContent from '~/components/MainContent'
import { cx } from '~/lib/utils'
import { viewModel } from './viewModel'
import AnimatedLoader from '~/components/AnimatedLoader'
import { AnimatedDownload } from '~/components/AnimatedDownload'

export default function ModelsPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const vm = viewModel()

	const modelTypes = ['all', 'tiny', 'base', 'small', 'medium', 'large']

	function getModelTypeFromName(modelName: string): string {
		const name = modelName.toLowerCase()
		if (name.includes('tiny')) return 'tiny'
		if (name.includes('base')) return 'base'
		if (name.includes('small')) return 'small'
		if (name.includes('medium')) return 'medium'
		if (name.includes('large')) return 'large'
		return 'other'
	}

	function getModelTypeColor(modelType: string): string {
		switch (modelType) {
			case 'tiny': return 'badge-success'
			case 'base': return 'badge-info'
			case 'small': return 'badge-warning'
			case 'medium': return 'badge-secondary'
			case 'large': return 'badge-error'
			default: return 'badge-neutral'
		}
	}

	return (
		<Layout>
			<MainContent maxWidth="4xl">
				{/* Header with back button and refresh */}
				<div className="flex items-center gap-4 mb-6">
					<button
						onClick={() => navigate('/settings')}
						className="btn btn-ghost btn-sm"
					>
						<ChevronLeftIcon className="w-4 h-4" />
						{t('common.back')}
					</button>
					<h1 className="text-2xl font-bold flex-1">{t('common.models-management')}</h1>
					<button
						onClick={vm.manualRefresh}
						disabled={vm.isRefreshing}
						className="btn btn-ghost btn-sm"
						title={t('common.refresh')}
					>
						{vm.isRefreshing ? (
							<AnimatedLoader size={16} strokeWidth={2} />
						) : (
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						)}
						{t('common.refresh')}
					</button>
				</div>

				{/* Main tabs */}
				<div className="tabs tabs-boxed mb-4 justify-center">
					<a
						className={cx('tab', vm.activeTab === 'models' && 'tab-active')}
						onClick={() => vm.setActiveTab('models')}
					>
						{t('common.models')}
					</a>
					<a
						className={cx('tab', vm.activeTab === 'encoders' && 'tab-active')}
						onClick={() => vm.setActiveTab('encoders')}
					>
						{t('common.encoders')}
					</a>
				</div>

				{/* Filter tabs - only show for models */}
				{vm.activeTab === 'models' && (
					<div className="tabs tabs-boxed mb-6 justify-center">
						{modelTypes.map(type => (
							<a
								key={type}
								className={cx('tab', vm.filter === type && 'tab-active')}
								onClick={() => vm.setFilter(type)}
							>
								{type === 'all' ? t('common.all') : type}
							</a>
						))}
					</div>
				)}

				{/* Models grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{vm.filteredModels.map((model) => {
						const modelType = getModelTypeFromName(model.model)
						const isDownloading = vm.downloadingModels.has(model.model)
						const isDeleting = vm.deletingModels.has(model.model)
						const downloadProgress = vm.downloadProgress.get(model.model)
						
						return (
							<div key={model.model} className={cx(
								'card bg-base-200 shadow-md transition-all duration-300 hover:shadow-lg',
								isDownloading && 'ring-2 ring-primary ring-opacity-50 bg-primary/5',
								model.isDownloaded && 'border border-success/20'
							)}>
								<div className="card-body p-4">
									{/* Model header */}
									<div className="flex items-start justify-between mb-3">
										<div className="flex-1 min-w-0">
											<h2 className="card-title text-lg truncate" title={model.model}>
												{model.model}
											</h2>
											<p className="text-sm opacity-60 truncate" title={model.file_name}>
												{model.file_name}
											</p>
										</div>
										<span className={cx('badge badge-sm', getModelTypeColor(modelType))}>
											{modelType}
										</span>
									</div>

									{/* Model info */}
									<div className="flex justify-between items-center mb-4">
										<div className="text-sm">
											<span className="font-medium">{t('common.size')}: </span>
											<span className="opacity-80">{model.file_size}</span>
										</div>
										{model.isDownloaded && (
											<div className="flex items-center gap-1">
												<CheckIcon className="w-4 h-4 text-success" />
												<span className="text-sm text-success font-medium">
													{t('common.installed')}
												</span>
											</div>
										)}
									</div>

									{/* Download progress or action buttons */}
									{isDownloading && downloadProgress ? (
										<div className="mt-4">
											<AnimatedDownload
												className="scale-75 origin-center"
												isAnimating={true}
												progress={downloadProgress.progress}
												downloadedSize={downloadProgress.downloadedSize}
												totalSize={downloadProgress.totalSize}
												downloadSpeed={downloadProgress.downloadSpeed}
												timeRemaining={downloadProgress.timeRemaining}
											/>
										</div>
									) : (
										<div className="card-actions justify-end gap-2">
											{model.isDownloaded ? (
												<button
													className={cx(
														'btn btn-error btn-sm',
														isDeleting && 'loading'
													)}
													disabled={isDeleting || isDownloading}
													onClick={() => vm.deleteModel(model)}
												>
													{isDeleting ? (
														<span className="loading loading-spinner loading-sm"></span>
													) : (
														<CancelIcon className="w-4 h-4" />
													)}
													{isDeleting ? t('common.uninstalling') : t('common.uninstall')}
												</button>
											) : (
												<button
													className="btn btn-primary btn-sm"
													disabled={isDownloading || isDeleting}
													onClick={() => vm.downloadModel(model)}
												>
													<DownloadIcon className="w-4 h-4" />
													{t('common.download')}
												</button>
											)}
										</div>
									)}
								</div>
							</div>
						)
					})}
				</div>

				{/* Empty state */}
				{vm.filteredModels.length === 0 && vm.models.length > 0 && (
					<div className="text-center py-12">
						<p className="text-lg opacity-60">
							{vm.activeTab === 'models' ? t('common.no-models-found') : t('common.no-encoders-found')}
						</p>
						{vm.activeTab === 'models' && (
							<p className="text-sm opacity-40 mt-2">{t('common.try-different-filter')}</p>
						)}
					</div>
				)}

			</MainContent>
		</Layout>
	)
}