import { useTranslation } from 'react-i18next'
import { Segment, formatTimestamp, mergeSpeakerSegments } from '~/lib/transcript'
import { NamedPath, formatSpeaker } from '~/lib/utils'
import { Preference } from '~/providers/Preference'

interface HTMLViewProps {
	segments: Segment[]
	file: NamedPath
	preference: Preference
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

export default function HTMLView({ segments, file, preference }: HTMLViewProps) {
	segments = mergeSpeakerSegments(segments)
	const { t } = useTranslation()
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
			{segments.map((segment, index) => (
				<div key={`${segment.text}-${index}`} className="segment" style={{ 
					fontSize: '18px', 
					display: 'flex', 
					flexDirection: 'column', 
					paddingTop: '24px',
					borderBottom: '1px solid #e5e7eb',
					paddingBottom: '16px'
				}}>
					<div style={{ marginBottom: '12px' }}>
						<div className="timestamp" style={{ 
							fontSize: '13px', 
							paddingBottom: '8px', 
							opacity: 0.6,
							fontWeight: '500',
							color: '#6b7280'
						}}>
							{formatDuration(segment.start, segment.stop)}
						</div>
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
						<div style={{ fontSize: '18px', lineHeight: '1.7' }}>
							{segment.text}
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
