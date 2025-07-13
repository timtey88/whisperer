import { useTranslation } from 'react-i18next'
import { Segment, formatTimestamp, mergeSpeakerSegments } from '~/lib/transcript'
import { NamedPath, formatSpeaker } from '~/lib/utils'
import { Preference } from '~/providers/Preference'

interface HTMLViewProps {
	segments: Segment[]
	file: NamedPath
	preference: Preference
	showParagraphs?: boolean
}

export function formatDuration(start: number, stop: number, direction: 'rtl' | 'ltr' = 'ltr') {
	const startFmt = formatTimestamp(start, false, '', false)
	const stopFmt = formatTimestamp(stop, false, '', false)
	const duration = `${startFmt} --> ${stopFmt}`

	if (direction === 'rtl') {
		return `\u202B${duration}\u202C` // Use Unicode characters for right-to-left embedding
	}
	return duration
}

export default function HTMLView({ segments, file, preference, showParagraphs = true }: HTMLViewProps) {
	segments = mergeSpeakerSegments(segments)
	const { t } = useTranslation()
	
	// Single paragraph mode - combine all segments into one continuous paragraph
	if (!showParagraphs) {
		const combinedText = segments.map(segment => {
			const speakerText = segment.speaker ? `${formatSpeaker(segment.speaker, t('common.speaker-prefix'))}: ` : ''
			return `${speakerText}${segment.text.trim()}`
		}).join(' ')
		
		return (
			<div
				autoCorrect="off"
				contentEditable={true}
				dir={preference.textAreaDirection}
				className="html printable"
				style={{ 
					padding: '24px', 
					minHeight: '100%', 
					height: 'fit-content',
					fontFamily: 'Roboto, Arial', 
					maxWidth: '100%', 
					margin: '0', 
					outline: 'none',
					lineHeight: '1.6'
				}}>
				<h1
					style={{
						fontSize: '36px',
						textAlign: 'center',
						color: '#1565c0',
						maxWidth: '50vw',
						margin: 'auto',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}>
					{file?.name}
				</h1>
				<div style={{ 
					fontSize: '18px', 
					lineHeight: '1.7', 
					textAlign: 'justify',
					paddingTop: '24px'
				}}>
					{combinedText}
				</div>
			</div>
		)
	}
	
	// Regular paragraph mode - individual segments
	return (
		<div
			autoCorrect="off"
			contentEditable={true}
			dir={preference.textAreaDirection}
			className="html printable"
			style={{ 
				padding: '24px', 
				minHeight: '100%', 
				height: 'fit-content',
				fontFamily: 'Roboto, Arial', 
				maxWidth: '100%', 
				margin: '0', 
				outline: 'none',
				lineHeight: '1.6'
			}}>
			<h1
				style={{
					fontSize: '36px',
					textAlign: 'center',
					color: '#1565c0',
					maxWidth: '50vw',
					margin: 'auto',
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
				}}>
				{file?.name}
			</h1>
			{segments.map((segment, index) => {
				// Adjust spacing based on paragraph setting
				const paddingTop = showParagraphs ? '24px' : '8px'
				const paddingBottom = showParagraphs ? '16px' : '4px'
				const marginBottom = showParagraphs ? '12px' : '6px'
				
				return (
					<div key={`${segment.text}-${index}`} className="segment" style={{ 
						fontSize: '18px', 
						display: 'flex', 
						flexDirection: 'column', 
						paddingTop,
						borderBottom: '1px solid #e5e7eb',
						paddingBottom
					}}>
						<div style={{ marginBottom }}>
						{preference.showTimestamps && (
							<div className="timestamp" style={{ 
								fontSize: '13px', 
								paddingBottom: '8px', 
								opacity: 0.6,
								fontWeight: '500',
								color: '#6b7280'
							}}>
								{formatDuration(segment.start, segment.stop)}
							</div>
						)}
						{segment.speaker && (
							<div style={{ 
								fontSize: '16px', 
								fontWeight: 'bold', 
								marginBottom: '8px',
								color: '#374151'
							}}>
								{formatSpeaker(segment.speaker, t('common.speaker-prefix'))}
							</div>
						)}
						<div style={{ fontSize: '18px', lineHeight: '1.7', textAlign: 'justify' }}>
							{segment.text}
						</div>
					</div>
				</div>
				)
			})}
		</div>
	)
}
