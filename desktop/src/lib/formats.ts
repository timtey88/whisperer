// Shared type definitions for text formats and export formats
export type TextFormat = 'text' | 'srt' | 'vtt' | 'document' | 'json' | 'docx'
export type ExportFormat = 'html' | 'pdf' | 'docx'
export type TextViewMode = 'plain' | 'confidence' | 'raw-ansi'

export type FormatExtensions = {
	[name in TextFormat]: string
}

export const formatExtensions: FormatExtensions = {
	text: '.txt',
	srt: '.srt', 
	vtt: '.vtt',
	document: '.html',
	json: '.json',
	docx: '.docx'
}

export const exportExtensions: Record<ExportFormat, string> = {
	html: '.html',
	pdf: '.pdf',
	docx: '.docx'
}

export const textViewExtensions: Record<TextViewMode, string> = {
	plain: '.txt',
	confidence: '.html',
	'raw-ansi': '.txt'
}