import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

export type TextFormat = 'normal' | 'srt' | 'vtt' | 'document' | 'json'
export type FormatExtensions = {
	[name in TextFormat]: string
}
export const formatExtensions: FormatExtensions = {
	normal: '.txt',
	srt: '.srt',
	vtt: '.vtt',
	document: '.html', // Default document extension
	json: '.json',
}

interface FormatMultiSelectProps {
	formats: TextFormat[]
	setFormats: Dispatch<SetStateAction<TextFormat[]>>
}
export default function FormatMultiSelect({ formats, setFormats }: FormatMultiSelectProps) {
	const { t } = useTranslation()

	const handleFormatButtonClick = (formatOption: TextFormat) => {
		// Check if the format is already selected
		if (formats.includes(formatOption)) {
			// If it's selected, remove it
			setFormats(formats.filter((format) => format !== formatOption))
		} else {
			// If it's not selected, add it to the array
			setFormats([...formats, formatOption])
		}
	}

	return (
		<label className="form-control w-full">
			<div className="label">
				<span className="label-text">{t('common.formats')}</span>
			</div>

			<div className="flex flex-wrap gap-2 justify-center">
				{['normal', 'document', 'srt', 'vtt', 'json'].map((formatOption) => (
					<button
						key={formatOption}
						className={`btn btn-xs ${formats.includes(formatOption as TextFormat) ? 'btn-primary' : ''}`}
						onClick={() => handleFormatButtonClick(formatOption as TextFormat)}>
						{formatOption}
					</button>
				))}
			</div>
		</label>
	)
}
