import { Dispatch, SetStateAction } from 'react'

import { TextFormat, ExportFormat, TextViewMode, formatExtensions, exportExtensions, textViewExtensions } from '~/lib/formats'

// Re-export types for backward compatibility
export type { TextFormat, ExportFormat, TextViewMode }
export { formatExtensions, exportExtensions, textViewExtensions }

interface FormatSelectProps {
	format: TextFormat
	setFormat: Dispatch<SetStateAction<TextFormat>>
}
export default function FormatSelect({ format, setFormat }: FormatSelectProps) {
	return (
		<label className="form-control w-full">
			<div className="label">
				<span className="label-text">Format</span>
			</div>
			<select
				value={format}
				onChange={(event) => {
					setFormat(event.target.value as unknown as TextFormat)
				}}
				className="select select-bordered">
				<option value="text">Text</option>
				<option value="document">Document</option>
				<option value="srt">SRT</option>
				<option value="vtt">VTT</option>
				<option value="json">JSON</option>
			</select>
		</label>
	)
}
