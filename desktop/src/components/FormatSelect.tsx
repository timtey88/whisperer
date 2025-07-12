import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

export type TextFormat = 'normal' | 'srt' | 'vtt' | 'html' | 'pdf' | 'json' | 'docx' | 'confidence'
export type FormatExtensions = {
	[name in TextFormat]: string
}
export const formatExtensions: FormatExtensions = {
	normal: '.txt',
	srt: '.srt',
	vtt: '.vtt',
	html: '.html',
	pdf: '.pdf',
	json: '.json',
	docx: '.docx',
	confidence: '.html', // Display only format, no actual download
}

interface FormatSelectProps {
	format: TextFormat
	setFormat: Dispatch<SetStateAction<TextFormat>>
}
export default function FormatSelect({ format, setFormat }: FormatSelectProps) {
	const { t } = useTranslation()
	return (
		<label className="form-control w-full">
			<div className="label">
				<span className="label-text">{t('common.format')}</span>
			</div>
			<select
				value={format}
				onChange={(event) => {
					setFormat(event.target.value as unknown as TextFormat)
				}}
				className="select select-bordered">
				<option value="normal">{t('common.mode-text')}</option>
				<option value="srt">srt</option>
				<option value="docx">docx</option>
				<option value="vtt">vtt</option>
				<option value="json">json</option>
				<option value="confidence">Confidence Colors</option>
			</select>
		</label>
	)
}
