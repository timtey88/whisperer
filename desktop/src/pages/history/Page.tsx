import { useNavigate } from 'react-router-dom'
import Layout from '~/components/Layout'
import NavigationBar from '~/components/NavigationBar'
import MainContent from '~/components/MainContent'
import { useHistory } from '~/providers/HistoryProvider'

export default function HistoryPage() {
	const { history, clearHistory } = useHistory()
	const navigate = useNavigate()
	
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
			default: return 'text-base-content'
		}
	}
	
	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed': return '✓'
			case 'failed': return '✗'
			case 'canceled': return '○'
			default: return '?'
		}
	}

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
												{formatDate(entry.timestamp)} • {formatDuration(entry.duration)}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<span className={`badge badge-sm ${
											entry.status === 'completed' ? 'badge-success' :
											entry.status === 'failed' ? 'badge-error' :
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
							</div>
						))}
					</div>
				</div>
			</MainContent>
		</Layout>
	)
}