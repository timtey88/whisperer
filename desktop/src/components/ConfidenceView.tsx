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
				fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
				maxWidth: '100%', 
				margin: '0', 
				outline: 'none',
				lineHeight: '1.6',
				background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
				position: 'relative',
				color: '#e2e8f0'
			}}>
			
			{/* Subtle background pattern for dark mode */}
			<div style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				opacity: 0.08,
				backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
				backgroundSize: '20px 20px',
				pointerEvents: 'none'
			}}></div>

			{/* Dark mode gradient overlay */}
			<div style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.03) 0%, transparent 50%)',
				pointerEvents: 'none'
			}}></div>

			{/* Confidence HTML Content */}
			<div 
				style={{
					fontSize: '16px',
					lineHeight: '1.7',
					color: '#e2e8f0',
					minHeight: '200px', // Prevent layout shift during transcription
					position: 'relative',
					zIndex: 1
				}}
				dangerouslySetInnerHTML={{ __html: confidenceHtml }}
			/>
		</div>
	)
}