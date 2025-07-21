import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '~/components/Layout'
import NavigationBar from '~/components/NavigationBar'
import MainContent from '~/components/MainContent'
import { useHistory } from '~/providers/HistoryProvider'
import { useTranscription } from '~/providers/TranscriptionProvider'

export default function HistoryPage() {
	const { history, clearHistory, removeHistoryEntry } = useHistory()
	const { transcription, abortTranscriptionByEntry } = useTranscription()
	const navigate = useNavigate()
	const [showCancelConfirm, setShowCancelConfirm] = useState(false)
	const [cancelEntryId, setCancelEntryId] = useState<string | null>(null)
	const [cancelFileName, setCancelFileName] = useState<string>('')
	
	// Delete confirmation states
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)
	const [deleteFileName, setDeleteFileName] = useState<string>('')
	
	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleString()
	}
	
	const formatDuration = (seconds: number) => {
		if (seconds < 60) return `${seconds}s`
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}m ${remainingSeconds}s`
	}
	
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed': return 'text-success'
			case 'failed': return 'text-error'
			case 'canceled': return 'text-warning'
			case 'processing': return 'text-info'
			case 'incomplete': return 'text-base-content/60'
			default: return 'text-base-content'
		}
	}
	
	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed': return '✓'
			case 'failed': return '✗'
			case 'canceled': return '○'
			case 'processing': return '⟳'
			case 'incomplete': return '⏸'
			default: return '?'
		}
	}

	const handleCancelTranscription = async (entryId: string) => {
		// Use the enhanced abort method which validates entry ID automatically and handles event emission
		abortTranscriptionByEntry(entryId)
	}

	const showCancelConfirmation = (entryId: string, fileName: string) => {
		setCancelEntryId(entryId)
		setCancelFileName(fileName)
		setShowCancelConfirm(true)
	}

	const confirmCancel = async () => {
		if (cancelEntryId) {
			await handleCancelTranscription(cancelEntryId)
		}
		setShowCancelConfirm(false)
		setCancelEntryId(null)
		setCancelFileName('')
	}

	const cancelConfirm = () => {
		setShowCancelConfirm(false)
		setCancelEntryId(null)
		setCancelFileName('')
	}

	// Delete functionality
	const showDeleteConfirmation = (entryId: string, fileName: string) => {
		setDeleteEntryId(entryId)
		setDeleteFileName(fileName)
		setShowDeleteConfirm(true)
	}

	const handleDeleteEntry = async () => {
		if (deleteEntryId) {
			await removeHistoryEntry(deleteEntryId)
		}
		setShowDeleteConfirm(false)
		setDeleteEntryId(null)
		setDeleteFileName('')
	}

	const cancelDelete = () => {
		setShowDeleteConfirm(false)
		setDeleteEntryId(null)
		setDeleteFileName('')
	}

	// Handle keyboard shortcuts for confirmation modals
	useEffect(() => {
		if (!showCancelConfirm && !showDeleteConfirm) return

		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault()
				if (showCancelConfirm) {
					cancelConfirm()
				} else if (showDeleteConfirm) {
					cancelDelete()
				}
			} else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault()
				if (showCancelConfirm) {
					confirmCancel()
				} else if (showDeleteConfirm) {
					handleDeleteEntry()
				}
			}
		}

		document.addEventListener('keydown', handleKeyPress)
		return () => document.removeEventListener('keydown', handleKeyPress)
	}, [showCancelConfirm, showDeleteConfirm])

	if (history.length === 0) {
		return (
		<Layout>
			<NavigationBar />
			<MainContent maxWidth="4xl">
				<div className="flex flex-col gap-6">
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2">Transcription History</h1>
						<p className="text-base-content/60">View and manage your past transcriptions</p>
					</div>
					
					<div className="bg-base-200 rounded-lg p-8 text-center">
						<div className="mb-4">
							<div className="w-16 h-16 mx-auto bg-base-300 rounded-full flex items-center justify-center mb-4">
								<svg className="w-8 h-8 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
						<h3 className="text-lg font-medium mb-2">No History Yet</h3>
						<p className="text-base-content/60 mb-4">
							Your transcription history will appear here after you transcribe your first file.
						</p>
						<button 
							onClick={() => navigate('/')}
							className="btn btn-primary"
						>
							Start Transcribing
						</button>
					</div>
				</div>
			</MainContent>
		</Layout>
		)
	}

	return (
		<Layout>
			<NavigationBar />
			<MainContent maxWidth="4xl">
				<div className="flex flex-col gap-6">
					<div className="flex justify-between items-center">
						<div className="text-center flex-1">
							<h1 className="text-3xl font-bold mb-2">Transcription History</h1>
							<p className="text-base-content/60">{history.length} transcription{history.length !== 1 ? 's' : ''}</p>
						</div>
						<button 
							onClick={clearHistory}
							className="btn btn-outline btn-sm"
						>
							Clear All
						</button>
					</div>
					
					<div className="space-y-3">
						{history.map((entry) => (
							<div key={entry.id} className="bg-base-200 rounded-lg p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3 flex-1 min-w-0">
										<span className={`text-lg font-mono ${getStatusColor(entry.status)}`}>
											{getStatusIcon(entry.status)}
										</span>
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate">{entry.fileName}</p>
											<p className="text-sm text-base-content/60">
												{entry.status === 'processing' ? (
													<span>
														Started {formatDate(entry.timestamp)}
														{entry.phase && <span> • {entry.phase}</span>}
													</span>
												) : (
													<span>{formatDate(entry.timestamp)} • {formatDuration(entry.duration)}</span>
												)}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{entry.status === 'processing' && (
											<div className="flex items-center gap-2">
												{entry.progress !== undefined ? (
													<>
														<div className="text-xs text-base-content/60">
															{entry.progress}%
														</div>
														<progress 
															className="progress progress-info w-16" 
															value={entry.progress} 
															max="100"
														></progress>
													</>
												) : (
													<div className="loading loading-spinner loading-sm text-info"></div>
												)}
												{/* Cancel button for processing entries */}
												{transcription.isActive && transcription.current?.id === entry.id ? (
													<button 
														onClick={() => showCancelConfirmation(entry.id, entry.fileName)}
														disabled={transcription.isAborting}
														className="btn btn-xs btn-outline btn-error gap-1 hover:scale-105 transition-all duration-200"
														title={transcription.isAborting ? "Aborting..." : "Cancel transcription"}
													>
														<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
														</svg>
														{transcription.isAborting ? 'Aborting' : 'Cancel'}
													</button>
												) : (
													<div className="text-xs text-base-content/40">Processing...</div>
												)}
											</div>
										)}
										
										{/* View button for all entries (processing, completed, etc.) */}
										{(entry.status === 'processing' || entry.status === 'completed') && (
											<button 
												onClick={() => navigate('/', { 
													state: { 
														viewHistoryEntry: entry.id,
														fileName: entry.fileName 
													} 
												})}
												className="btn btn-xs btn-primary"
											>
												View
											</button>
										)}
										
										{/* Delete button for all entries except currently processing */}
										{!(entry.status === 'processing' && transcription.isActive && transcription.current?.id === entry.id) && (
											<button 
												onClick={() => showDeleteConfirmation(entry.id, entry.fileName)}
												className="btn btn-xs btn-outline btn-error hover:scale-105 transition-all duration-200"
												title="Delete entry"
											>
												<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										)}
										
										<span className={`badge badge-sm ${
											entry.status === 'completed' ? 'badge-success' :
											entry.status === 'failed' ? 'badge-error' :
											entry.status === 'processing' ? 'badge-info' :
											entry.status === 'incomplete' ? 'badge-neutral' :
											'badge-warning'
										}`}>
											{entry.status}
										</span>
									</div>
								</div>
								{entry.error && (
									<div className="mt-2 text-sm text-error bg-error/10 p-2 rounded">
										{entry.error}
									</div>
								)}
								{entry.status === 'incomplete' && (
									<div className="mt-2 text-sm text-base-content/60 bg-base-300/50 p-2 rounded">
										This transcription was interrupted (app was closed or refreshed during processing)
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</MainContent>

			{/* Cancel Confirmation Modal */}
			{showCancelConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
						<div className="flex items-center gap-3 mb-4">
							<div className="text-warning">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
								</svg>
							</div>
							<h3 className="text-lg font-bold">Cancel Transcription</h3>
						</div>
						<p className="mb-6 text-base-content/80">
							Are you sure you want to cancel the transcription of &ldquo;{cancelFileName}&rdquo;? This action cannot be undone and any progress will be lost.
						</p>
						<div className="flex gap-3 justify-end">
							<button 
								onClick={cancelConfirm}
								className="btn btn-outline"
							>
								Keep Transcribing
							</button>
							<button 
								onClick={confirmCancel}
								className="btn btn-error"
							>
								Cancel Transcription
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
						<div className="flex items-center gap-3 mb-4">
							<div className="text-error">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</div>
							<h3 className="text-lg font-bold">Delete Entry</h3>
						</div>
						<p className="mb-6 text-base-content/80">
							Are you sure you want to delete &ldquo;{deleteFileName}&rdquo; from your history? This action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<button 
								onClick={cancelDelete}
								className="btn btn-outline"
							>
								Cancel
							</button>
							<button 
								onClick={handleDeleteEntry}
								className="btn btn-error"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</Layout>
	)
}