import '@fontsource/roboto'
import { Route, Routes } from 'react-router-dom'
import '~/globals.css'
import HomePage from '~/pages/home/Page'
import SettingsPage from './pages/settings/Page'
import ModelsPage from './pages/models/Page'
import ModelOptionsPage from './pages/model-options/Page'
import { ErrorModalProvider } from './providers/ErrorModal'
import { PreferenceProvider } from './providers/Preference'
import { FilesProvider } from './providers/FilesProvider'
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
							<ToastProvider>
								<ErrorModalWithContext />
								<Routes>
									<Route path="/" element={<HomePage />} />
									<Route path="/settings" element={<SettingsPage />} />
									<Route path="/models" element={<ModelsPage />} />
									<Route path="/model-options" element={<ModelOptionsPage />} />
								</Routes>
							</ToastProvider>
					</FilesProvider>
				</PreferenceProvider>
			</ErrorModalProvider>
		</ErrorBoundary>
	)
}
