import { useTranslation } from 'react-i18next'
import WhisperLanguages from '~/assets/whisper-languages.json'
import { getI18nLanguageName } from '~/lib/i18n'
import { usePreferenceProvider } from '~/providers/Preference'
import CustomSelect, { SelectOption } from './CustomSelect'

const specialModels = [{ pattern: 'ug.bin', languages: [{ code: 'ug', label: 'Uyghur', name: 'uyghur' }] }]

export default function LanguageInput() {
	const { t } = useTranslation()
	const preference = usePreferenceProvider()

	// create entries with translated labels
	const entries = Object.entries(WhisperLanguages).map(([name, code]) => {
		return { label: t(`language.${name}`, { defaultValue: name }), name, code }
	})

	// Speical models with special languages
	for (const special of specialModels) {
		if (preference.modelPath?.endsWith(special.pattern)) {
			entries.push(...special.languages)
		}
	}
	// sort alphabet
	entries.sort((a, b) => {
		return a.label.localeCompare(b.label)
	})
	const popularLanguages = [getI18nLanguageName(), 'auto', 'english']
	const popularEntries: { label: string; code: string }[] = []
	const otherEntries: { label: string; code: string }[] = []

	entries.forEach(({ label, name, code }) => {
		if (popularLanguages.includes(name)) {
			popularEntries.push({ label, code })
		} else {
			otherEntries.push({ label, code })
		}
	})

	// Group names
	const groupNames = {
		popular: t('common.popular'),
		others: t('common.others'),
	}

	// Create options for CustomSelect with groups
	const languageOptions: SelectOption[] = [
		...popularEntries.map(({ label, code }) => ({
			value: code,
			label,
			group: groupNames.popular
		})),
		...otherEntries.map(({ label, code }) => ({
			value: code,
			label,
			group: groupNames.others
		}))
	]

	return (
		<label className="form-control w-full">
			<div className="label">
				<span className="label-text">{t('common.language')}</span>
			</div>
			<CustomSelect
				options={languageOptions}
				value={preference.modelOptions.lang}
				onChange={(value) => preference.setModelOptions({ ...preference.modelOptions, lang: value })}
				placeholder={t('common.select-language')}
			/>
		</label>
	)
}
