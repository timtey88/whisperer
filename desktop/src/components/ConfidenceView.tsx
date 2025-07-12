import { useTranslation } from 'react-i18next'
import { NamedPath } from '~/lib/utils'
import { Preference } from '~/providers/Preference'

interface ConfidenceViewProps {
	confidenceHtml: string
	file: NamedPath
	preference: Preference
}

export default function ConfidenceView({ confidenceHtml, file, preference }: ConfidenceViewProps) {
	const { t } = useTranslation()
	
	return (
		<div
			dir={preference.textAreaDirection}
			className="confidence-view printable"
			style={{ 
				padding: '24px', 
				minHeight: '100%', 
				height: 'fit-content',
				fontFamily: 'Roboto, Arial', 
				maxWidth: '100%', 
				margin: '0', 
				outline: 'none',
				lineHeight: '1.6',
				backgroundColor: '#fafafa'
			}}>
			
			{/* Header */}
			<div style={{ marginBottom: '32px', textAlign: 'center' }}>
				<h1 style={{
					fontSize: '36px',
					color: '#1565c0',
					maxWidth: '70vw',
					margin: '0 auto 16px auto',
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
				}}>
					{file?.name}
				</h1>
				<div style={{
					fontSize: '14px',
					color: '#6b7280',
					fontWeight: '500'
				}}>
					Confidence Colors View
				</div>
			</div>

			{/* Confidence HTML Content */}
			<div 
				style={{
					fontSize: '16px',
					lineHeight: '1.7',
					color: '#374151',
					minHeight: '200px' // Prevent layout shift during transcription
				}}
				dangerouslySetInnerHTML={{ __html: confidenceHtml }}
			/>

			{/* Footer */}
			<div style={{
				marginTop: '32px',
				padding: '16px',
				backgroundColor: '#f3f4f6',
				borderRadius: '8px',
				fontSize: '12px',
				color: '#6b7280',
				textAlign: 'center'
			}}>
				<strong>Display-Only Format:</strong> This view shows transcription confidence levels through colors. 
				Copy and download functions are disabled for this format as it contains ANSI color codes 
				that require special parsing.
			</div>
		</div>
	)
}