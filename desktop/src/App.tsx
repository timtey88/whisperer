import '@fontsource/roboto'
import { useTranslation } from 'react-i18next'
import { Route, Routes } from 'react-router-dom'
import '~/globals.css'
import '~/lib/i18n'
import HomePage from '~/pages/home/Page'
import SettingsPage from './pages/settings/Page'
import { ErrorModalProvider } from './providers/ErrorModal'
import { PreferenceProvider } from './providers/Preference'
import { FilesProvider } from './providers/FilesProvider'
import { ErrorBoundary } from 'react-error-boundary'
import { BoundaryFallback } from './components/BoundaryFallback'
import ErrorModalWithContext from './components/ErrorModalWithContext'
import { Toaster } from 'react-hot-toast'
import { ToastProvider } from './providers/Toast'

export default function App() {
	const { i18n } = useTranslation()
	document.body.dir = i18n.dir()

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
							</Routes>
						</ToastProvider>
					</FilesProvider>
				</PreferenceProvider>
			</ErrorModalProvider>
		</ErrorBoundary>
	)
}
