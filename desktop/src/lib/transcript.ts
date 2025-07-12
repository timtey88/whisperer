import { formatSpeaker } from './utils'
import { ansiToHtml, getConfidenceLegend, addAnsiCodes } from './ansi'

export interface Duration {
	secs: number
	nanos: number
}

export interface Transcript {
	processing_time?: Duration
	segments: Segment[]
	word_segments?: Segment[]
}

export interface Segment {
	start: number
	stop: number
	text: string
	speaker?: string
}

export function formatTimestamp(seconds: number, alwaysIncludeHours: boolean, decimalMarker: string, includeMilliseconds: boolean = true): string {
	if (seconds < 0) {
		throw new Error('Non-negative timestamp expected')
	}

	let milliseconds = seconds * 10

	const hours = Math.floor(milliseconds / 3_600_000)
	milliseconds -= hours * 3_600_000

	const minutes = Math.floor(milliseconds / 60_000)
	milliseconds -= minutes * 60_000

	const formattedSeconds = Math.floor(milliseconds / 1_000)
	milliseconds -= formattedSeconds * 1_000

	const hoursMarker = alwaysIncludeHours || hours !== 0 ? `${String(hours).padStart(2, '0')}:` : ''

	let result = `${hoursMarker}${String(minutes).padStart(2, '0')}:${String(formattedSeconds).padStart(2, '0')}`

	if (includeMilliseconds) {
		result += `${decimalMarker}${String(milliseconds).padStart(3, '0')}`
	}

	return result
}

export function mergeSpeakerSegments(segments: Segment[]) {
	let currentSpeaker: string | undefined
	const newSegments: Segment[] = []
	let currentSegment: Segment = { speaker: '', text: '', start: 0, stop: 0 }

	if (segments?.[0]?.speaker) {
		for (const segment of segments) {
			// First segment or speaker change
			if (!currentSpeaker || segment.speaker !== currentSpeaker) {
				// If it's not the first segment, push the previous segment
				if (currentSpeaker !== undefined) {
					newSegments.push(currentSegment)
				}

				// Start a new segment
				currentSegment = { ...segment } // Start with a copy of the current segment
			} else {
				// Continue adding to the current segment if it's the same speaker
				currentSegment.text += segment.text // Concatenate text
				currentSegment.stop = segment.stop // Update the stop time
			}

			currentSpeaker = segment.speaker // Update the current speaker
		}

		// Push the last segment after the loop
		newSegments.push(currentSegment)
		return newSegments
	} else {
		return segments
	}
}

export function asSrt(segments: Segment[], speakerPrefix = 'Speaker', showTimestamps = true) {
	segments = mergeSpeakerSegments(segments)
	if (!showTimestamps) {
		// Return text-only format when timestamps disabled
		return segments.reduce((transcript, segment) => {
			return transcript + `${segment.speaker ? formatSpeaker(segment.speaker, speakerPrefix) : ''}${segment.text.trim()}\n\n`
		}, '')
	}
	return segments.reduce((transcript, segment, i) => {
		return (
			transcript +
			`${i > 0 ? '\n' : ''}${i + 1}\n` +
			`${formatTimestamp(segment.start, true, ',')} --> ${formatTimestamp(segment.stop, true, ',')}\n` +
			`${segment.speaker ? formatSpeaker(segment.speaker, speakerPrefix) : ''}${segment.text.trim().replace('-->', '->')}\n`
		)
	}, '')
}

export function asVtt(segments: Segment[], speakerPrefix = 'Speaker', showTimestamps = true) {
	segments = mergeSpeakerSegments(segments)
	if (!showTimestamps) {
		// Return text-only format when timestamps disabled  
		return segments.reduce((transcript, segment) => {
			return transcript + `${segment.speaker ? formatSpeaker(segment.speaker, speakerPrefix) : ''}${segment.text.trim()}\n\n`
		}, '')
	}
	return segments.reduce((transcript, segment) => {
		return (
			transcript +
			`${formatTimestamp(segment.start, false, '.')} --> ${formatTimestamp(segment.stop, false, '.')}\n` +
			`${segment.speaker ? formatSpeaker(segment.speaker, speakerPrefix) : ''}${segment.text.trim().replace('-->', '->')}\n`
		)
	}, '')
}

export function asText(segments: Segment[], speakerPrefix = 'Speaker') {
	return segments.map(segment => {
		const speakerText = segment.speaker ? `${formatSpeaker(segment.speaker, speakerPrefix)}: ` : ''
		return `${speakerText}${segment.text.trim()}`
	}).join(' ')
}

export function asRawAnsi(segments: Segment[], speakerPrefix = 'Speaker', showTimestamps = true) {
	segments = mergeSpeakerSegments(segments)
	// Deduplicate segments based on content and timing to prevent duplicates during transcription
	const uniqueSegments = deduplicateSegments(segments)
	
	return uniqueSegments.map(segment => {
		const speakerText = segment.speaker ? `${formatSpeaker(segment.speaker, speakerPrefix)}: ` : ''
		const timestamp = showTimestamps 
			? `[${formatTimestamp(segment.start, false, '.', false)}] `
			: ''
		// Generate actual ANSI escape sequences for confidence colors
		const textWithAnsi = addAnsiCodes(segment.text)
		return `${timestamp}${speakerText}${textWithAnsi}`
	}).join('\n\n')
}

export function asJson(segments: Segment[]) {
	return JSON.stringify(segments, null, 4)
}

export function asConfidenceHtml(segments: Segment[], speakerPrefix = 'Speaker', showTimestamps = true) {
	if (!segments || segments.length === 0) {
		return getConfidenceLegend() + '<div style="text-align: center; color: #9ca3af; padding: 40px;">No transcript data available</div>'
	}

	// Deduplicate segments based on content and timing to prevent duplicates during transcription
	const uniqueSegments = deduplicateSegments(segments)

	const segmentHtml = uniqueSegments.map((segment, index) => {
		// Convert ANSI codes to HTML (or display as plain text if no codes present)
		const coloredHtml = ansiToHtml(segment.text)
		
		// Format speaker and timestamp in floating style
		const speakerText = segment.speaker 
			? `<span style="font-weight: 600; color: #4f46e5;">${formatSpeaker(segment.speaker, speakerPrefix)}</span>` 
			: ''
		
		const timestamp = showTimestamps 
			? `<span style="color: #9ca3af; font-size: 11px; font-weight: 500;">${formatTimestamp(segment.start, false, '.', false)}</span>`
			: ''
		
		const metaInfo = (timestamp || speakerText) ? `
			<div style="
				display: flex;
				align-items: center;
				gap: 8px;
				margin-bottom: 8px;
				padding-bottom: 4px;
			">
				${timestamp}
				${speakerText}
			</div>
		` : ''
		
		// Add subtle divider except for last segment
		const divider = index < uniqueSegments.length - 1 ? `
			<div style="
				width: 100%;
				height: 1px;
				background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 50%, transparent 100%);
				margin: 20px 0;
			"></div>
		` : ''
		
		return `
			<div style="
				margin-bottom: 16px;
				transition: all 0.2s ease;
			">
				${metaInfo}
				<div style="
					padding-left: ${speakerText ? '12px' : '0'};
					line-height: 1.7;
					font-size: 16px;
				">
					${coloredHtml}
				</div>
				${divider}
			</div>
		`
	}).join('')

	const hasAnsiCodes = segments.some(s => s.text.includes('\x1b[38;5;'))

	return `
		${getConfidenceLegend()}
		<div class="confidence-transcript" style="
			padding: 0;
			margin: 0;
		">
			${segmentHtml}
		</div>
		<div style="
			margin-top: 32px;
			padding: 16px;
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
			border: 1px solid rgba(59, 130, 246, 0.1);
			border-radius: 12px;
			font-size: 12px;
			color: #6b7280;
			line-height: 1.5;
		">
			<strong style="color: #374151;">Display-Only Format:</strong> Shows confidence levels through colors. 
			${hasAnsiCodes 
				? 'ANSI color codes from transcription are converted to HTML for display.' 
				: 'Simulated confidence colors are shown for demonstration until real confidence data is available.'}
		</div>
	`
}

/**
 * Removes duplicate segments that can occur during real-time transcription
 * Uses content and timing to identify duplicates
 */
function deduplicateSegments(segments: Segment[]): Segment[] {
	const seen = new Set<string>()
	const uniqueSegments: Segment[] = []
	
	for (const segment of segments) {
		// Create a unique key based on content, start time, and speaker
		const key = `${segment.text.trim()}-${segment.start}-${segment.speaker || ''}`
		
		if (!seen.has(key)) {
			seen.add(key)
			uniqueSegments.push(segment)
		}
	}
	
	return uniqueSegments
}
