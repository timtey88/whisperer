import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

export type TextFormat = 'text' | 'srt' | 'vtt' | 'document' | 'json'
export type ExportFormat = 'html' | 'pdf' | 'docx'
export type TextViewMode = 'plain' | 'confidence' | 'raw-ansi'
export type FormatExtensions = {
	[name in TextFormat]: string
}
export const formatExtensions: FormatExtensions = {
	text: '.txt', // Default text extension (can be changed via view mode)
	srt: '.srt',
	vtt: '.vtt',
	document: '.html', // Default document extension (can be changed via export menu)
	json: '.json',
}

export const textViewExtensions: Record<TextViewMode, string> = {
	plain: '.txt',
	confidence: '.html',
	'raw-ansi': '.txt',
}

export const exportExtensions: Record<ExportFormat, string> = {
	html: '.html',
	pdf: '.pdf',
	docx: '.docx',
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
				<option value="text">{t('common.mode-text')}</option>
				<option value="document">Document</option>
				<option value="srt">SRT</option>
				<option value="vtt">VTT</option>
				<option value="json">JSON</option>
			</select>
		</label>
	)
}
