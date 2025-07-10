import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ReactComponent as ChevronLeftIcon } from '~/icons/chevron-left.svg'
import { ReactComponent as DownloadIcon } from '~/icons/download.svg'
import { ReactComponent as CheckIcon } from '~/icons/check.svg'
import { ReactComponent as CancelIcon } from '~/icons/cancel.svg'
import Layout from '~/components/Layout'
import { cx } from '~/lib/utils'
import { viewModel } from './viewModel'

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
			<div className="flex flex-col max-w-6xl mx-auto px-4">
				{/* Header with back button */}
				<div className="flex items-center gap-4 mb-6">
					<button
						onClick={() => navigate('/settings')}
						className="btn btn-ghost btn-sm"
					>
						<ChevronLeftIcon className="w-4 h-4" />
						{t('common.back')}
					</button>
					<h1 className="text-2xl font-bold">{t('common.models-management')}</h1>
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
						
						return (
							<div key={model.model} className="card bg-base-200 shadow-md">
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
										<div className="flex items-center gap-1">
											{model.isDownloaded ? (
												<>
													<CheckIcon className="w-4 h-4 text-success" />
													<span className="text-sm text-success font-medium">
														{t('common.downloaded')}
													</span>
												</>
											) : (
												<span className="text-sm opacity-60">
													{t('common.available')}
												</span>
											)}
										</div>
									</div>

									{/* Action buttons */}
									<div className="card-actions justify-end gap-2">
										{model.isDownloaded ? (
											<>
												<div className="flex items-center gap-1 text-success text-sm">
													<CheckIcon className="w-4 h-4" />
													{t('common.installed')}
												</div>
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
											</>
										) : (
											<button
												className={cx(
													'btn btn-primary btn-sm',
													isDownloading && 'loading'
												)}
												disabled={isDownloading || isDeleting}
												onClick={() => vm.downloadModel(model)}
											>
												{isDownloading ? (
													<span className="loading loading-spinner loading-sm"></span>
												) : (
													<DownloadIcon className="w-4 h-4" />
												)}
												{isDownloading ? t('common.downloading') : t('common.download')}
											</button>
										)}
									</div>
								</div>
							</div>
						)
					})}
				</div>

				{/* Empty state */}
				{vm.filteredModels.length === 0 && vm.models.length > 0 && !vm.loading && (
					<div className="text-center py-12">
						<p className="text-lg opacity-60">
							{vm.activeTab === 'models' ? t('common.no-models-found') : t('common.no-encoders-found')}
						</p>
						{vm.activeTab === 'models' && (
							<p className="text-sm opacity-40 mt-2">{t('common.try-different-filter')}</p>
						)}
					</div>
				)}

				{/* Loading state */}
				{vm.loading && (
					<div className="text-center py-12">
						<span className="loading loading-spinner loading-lg"></span>
						<p className="mt-4 opacity-60">{t('common.loading-models')}</p>
					</div>
				)}
			</div>
		</Layout>
	)
}