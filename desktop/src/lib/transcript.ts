import { formatSpeaker } from './utils'

/**
 * Helper functions for consistent formatting across all transcript formats
 */

/**
 * Get the appropriate separator between segments based on paragraph setting
 */
function getSegmentSeparator(showParagraphs: boolean, format: 'text' | 'srt' | 'vtt'): string {
	if (format === 'text') {
		return showParagraphs ? '\n\n' : ' '
	}
	// For SRT and VTT formats
	return showParagraphs ? '\n\n' : '\n'
}


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

export function asSrt(segments: Segment[], speakerPrefix = 'Speaker', showTimestamps = true, showParagraphs = true) {
	segments = mergeSpeakerSegments(segments)
	// Deduplicate segments based on content and timing to prevent duplicates during transcription
	const uniqueSegments = deduplicateSegments(segments)
	
	if (!showTimestamps) {
		// Return text-only format when timestamps disabled
		const separator = getSegmentSeparator(showParagraphs, 'srt')
		return uniqueSegments.map(segment => {
			return `${segment.speaker ? formatSpeaker(segment.speaker, speakerPrefix) : ''}${segment.text.trim()}`
		}).join(separator)
	}
	
	const entrySeparator = showParagraphs ? '\n' : ''
	return uniqueSegments.reduce((transcript, segment, i) => {
		return (
			transcript +
			`${i > 0 ? entrySeparator : ''}${i + 1}\n` +
			`${formatTimestamp(segment.start, true, ',')} --> ${formatTimestamp(segment.stop, true, ',')}\n` +
			`${segment.speaker ? formatSpeaker(segment.speaker, speakerPrefix) : ''}${segment.text.trim().replace('-->', '->')}\n`
		)
	}, '')
}

export function asVtt(segments: Segment[], speakerPrefix = 'Speaker', showTimestamps = true, showParagraphs = true) {
	segments = mergeSpeakerSegments(segments)
	// Deduplicate segments based on content and timing to prevent duplicates during transcription
	const uniqueSegments = deduplicateSegments(segments)
	
	if (!showTimestamps) {
		// Return text-only format when timestamps disabled  
		const separator = getSegmentSeparator(showParagraphs, 'vtt')
		return uniqueSegments.map(segment => {
			return `${segment.speaker ? formatSpeaker(segment.speaker, speakerPrefix) : ''}${segment.text.trim()}`
		}).join(separator)
	}
	
	const separator = getSegmentSeparator(showParagraphs, 'vtt')
	return uniqueSegments.map(segment => {
		return `${formatTimestamp(segment.start, false, '.')} --> ${formatTimestamp(segment.stop, false, '.')}\n` +
			`${segment.speaker ? formatSpeaker(segment.speaker, speakerPrefix) : ''}${segment.text.trim().replace('-->', '->')}`
	}).join('\n' + separator)
}

export function asText(segments: Segment[], speakerPrefix = 'Speaker', showTimestamps = false, showParagraphs = true) {
	segments = mergeSpeakerSegments(segments)
	// Deduplicate segments based on content and timing to prevent duplicates during transcription
	const uniqueSegments = deduplicateSegments(segments)
	
	if (!showTimestamps) {
		// Return text-only format when timestamps disabled
		if (!showParagraphs) {
			// Combine all segments into one continuous paragraph
			return uniqueSegments.map(segment => {
				const speakerText = segment.speaker ? `${formatSpeaker(segment.speaker, speakerPrefix)}: ` : ''
				return `${speakerText}${segment.text.trim()}`
			}).join(' ') // Single space, no line breaks
		}
		
		const separator = getSegmentSeparator(showParagraphs, 'text')
		return uniqueSegments.map(segment => {
			const speakerText = segment.speaker ? `${formatSpeaker(segment.speaker, speakerPrefix)}: ` : ''
			return `${speakerText}${segment.text.trim()}`
		}).join(separator)
	}
	
	// Return format with timestamps on separate lines (like VTT)
	if (!showParagraphs) {
		// Combine all segments into one continuous paragraph with timestamps
		return uniqueSegments.map(segment => {
			const speakerText = segment.speaker ? `${formatSpeaker(segment.speaker, speakerPrefix)}: ` : ''
			return `${speakerText}${segment.text.trim()}`
		}).join(' ') // Single space, no line breaks or timestamps when paragraphs OFF
	}
	
	const separator = getSegmentSeparator(showParagraphs, 'text')
	return uniqueSegments.map(segment => {
		const timestamp = `${formatTimestamp(segment.start, false, '.', false)} --> ${formatTimestamp(segment.stop, false, '.', false)}`
		const speakerText = segment.speaker ? `${formatSpeaker(segment.speaker, speakerPrefix)}: ` : ''
		const content = `${speakerText}${segment.text.trim()}`
		return `${timestamp}\n${content}`
	}).join(separator)
}


export function asJson(segments: Segment[]) {
	segments = mergeSpeakerSegments(segments)
	// Deduplicate segments based on content and timing to prevent duplicates during transcription
	const uniqueSegments = deduplicateSegments(segments)
	
	return JSON.stringify(uniqueSegments, null, 4)
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

