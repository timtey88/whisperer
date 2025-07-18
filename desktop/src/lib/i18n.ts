import { resolveResource } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/core'
import * as fs from '@tauri-apps/plugin-fs'
import { locale } from '@tauri-apps/plugin-os'
import i18n, { LanguageDetectorAsyncModule } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next/initReactI18next'

export const supportedLanguages: { [key: string]: string } = {
	'he-IL': 'hebrew',
	'en-US': 'english',
	'pt-BR': 'portuguese',
	'sv-SE': 'swedish',
	'zh-CN': 'chinese',
	'zh-HK': 'chinese (HK)',
	'fr-FR': 'french',
	'pl-PL': 'polish',
	'no-NO': 'norwegian',
	'it-IT': 'italian',
	'hi-IN': 'hindi',
	'ru-RU': 'russian',
}
export const supportedLanguageKeys = Object.keys(supportedLanguages)
export const supportedLanguageValues = Object.values(supportedLanguages)

export function getI18nLanguageName() {
	const name = supportedLanguages[i18n.language as keyof typeof supportedLanguages]
	return name
}

const LanguageDetector: LanguageDetectorAsyncModule = {
	type: 'languageDetector',
	async: true, // If this is set to true, your detect function receives a callback function that you should call with your language, useful to retrieve your language stored in AsyncStorage for example
	detect: (callback) => {
		locale().then((detectedLocale) => {
			const prefs_language = localStorage.getItem('prefs_display_language')
			if (prefs_language) {
				const locale = JSON.parse(prefs_language)
				callback(locale)
			} else {
				if (detectedLocale) {
					callback(detectedLocale)
				}
			}
		})
	},
}

i18n.use(LanguageDetector)
	.use(initReactI18next)
	.use(
		resourcesToBackend(async (language: string) => {
			console.log('🌐 [i18n] Loading translations for language:', language)
			console.log('🌍 [i18n] Supported languages:', supportedLanguageKeys)
			
			// Validate language is supported
			if (!supportedLanguageKeys.includes(language)) {
				console.log('❌ [i18n] Language not supported:', language)
				return
			}
			
			try {
				// Use the resource path as configured in tauri.conf.json
				const resourcePath = `locales/${language}`
				console.log('📁 [i18n] Resolving resource path:', resourcePath)
				
				const languageDirectory = await resolveResource(resourcePath)
				console.log('📂 [i18n] Language directory resolved:', languageDirectory)
				
				const files = await fs.readDir(languageDirectory)
				console.log('📄 [i18n] Found files:', files.map(f => f.name))
				
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const translations: any = {}
				
				await Promise.all(
					files.map(async (file) => {
						const filePath = `${languageDirectory}/${file.name}`
						const namespace = file.name.replace('.json', '')
						console.log('📖 [i18n] Loading file:', filePath, 'as namespace:', namespace)
						const content = await fs.readTextFile(filePath)
						translations[namespace] = JSON.parse(content)
					})
				)
				
				console.log('✅ [i18n] Translations loaded successfully:', Object.keys(translations))
				return translations
			} catch (error) {
				console.error('❌ [i18n] Failed to load translations for', language, ':', error)
				console.log('🔧 [i18n] Trying Tauri command fallback...')
				
				// Try using our Tauri command as fallback
				try {
					const tauriTranslations = await invoke('load_locale_files', { language })
					console.log('✅ [i18n] Tauri command translations loaded:', Object.keys(tauriTranslations as any))
					return tauriTranslations
				} catch (fallbackError) {
					console.error('❌ [i18n] All loading methods failed:', fallbackError)
					return
				}
			}
		})
	)
	.init({
		debug: true, // Enable debug logging
		fallbackLng: 'en-US',
		interpolation: {
			escapeValue: false, // not needed for react as it escapes by default
		},
	})
export default i18n
