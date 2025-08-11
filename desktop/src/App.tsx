import '@fontsource/roboto'
import { Route, Routes } from 'react-router-dom'
import '~/globals.css'
import HomePage from '~/pages/home/Page'
import HistoryPage from './pages/history/Page'
import SettingsPage from './pages/settings/Page'
import ModelsPage from './pages/models/Page'
import ModelOptionsPage from './pages/model-options/Page'
import { ErrorModalProvider } from './providers/ErrorModal'
import { PreferenceProvider } from './providers/Preference'
import { FilesProvider } from './providers/FilesProvider'
import { HistoryProvider } from './providers/HistoryProvider'
import { TranscriptionProvider } from './providers/TranscriptionProvider'
import { UpdaterProvider } from './providers/Updater'
import { ErrorBoundary } from 'react-error-boundary'
import { BoundaryFallback } from './components/BoundaryFallback'
import ErrorModalWithContext from './components/ErrorModalWithContext'
import { Toaster } from 'react-hot-toast'
import { ToastProvider } from './providers/Toast'

export default function App() {
	return (
		// Handle errors before first render
		<ErrorBoundary FallbackComponent={BoundaryFallback}>
			<div>
				<Toaster position="bottom-right" />
			</div>
			<ErrorModalProvider>
				<PreferenceProvider>
					<FilesProvider>
							<HistoryProvider>
								<TranscriptionProvider>
									<ToastProvider>
								<ErrorModalWithContext />
								<Routes>
									<Route path="/" element={<HomePage />} />
									<Route path="/history" element={<HistoryPage />} />
									<Route path="/settings" element={<SettingsPage />} />
									<Route path="/models" element={<ModelsPage />} />
									<Route path="/model-options" element={<ModelOptionsPage />} />
								</Routes>
									</ToastProvider>
								</TranscriptionProvider>
							</HistoryProvider>
					</FilesProvider>
				</PreferenceProvider>
			</ErrorModalProvider>
		</ErrorBoundary>
	)
}
