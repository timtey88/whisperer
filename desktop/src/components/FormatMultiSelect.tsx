import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

import { TextFormat } from '~/lib/formats'

// For multi-select, we need to map 'normal' to 'text' from the unified type
const multiSelectFormats: TextFormat[] = ['text', 'srt', 'vtt', 'document', 'json']

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
				{multiSelectFormats.map((formatOption) => (
					<button
						key={formatOption}
						className={`btn btn-xs ${formats.includes(formatOption) ? 'btn-primary' : ''}`}
						onClick={() => handleFormatButtonClick(formatOption)}>
						{formatOption === 'text' ? 'normal' : formatOption}
					</button>
				))}
			</div>
		</label>
	)
}
