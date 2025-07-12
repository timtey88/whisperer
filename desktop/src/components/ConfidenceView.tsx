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
				padding: '32px 28px', 
				minHeight: '100%', 
				height: 'fit-content',
				fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
				maxWidth: '100%', 
				margin: '0', 
				outline: 'none',
				lineHeight: '1.6',
				background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
				position: 'relative'
			}}>
			
			{/* Subtle background pattern */}
			<div style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				opacity: 0.02,
				backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
				backgroundSize: '20px 20px',
				pointerEvents: 'none'
			}}></div>

			{/* Streamlined Header */}
			<div style={{ 
				marginBottom: '28px', 
				position: 'relative',
				zIndex: 1
			}}>
				<h1 style={{
					fontSize: '28px',
					fontWeight: '700',
					color: '#1e293b',
					maxWidth: '100%',
					margin: '0 0 6px 0',
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					letterSpacing: '-0.5px'
				}}>
					{file?.name}
				</h1>
				<div style={{
					fontSize: '13px',
					color: '#64748b',
					fontWeight: '500',
					letterSpacing: '0.5px',
					textTransform: 'uppercase'
				}}>
					Confidence Analysis
				</div>
			</div>

			{/* Confidence HTML Content */}
			<div 
				style={{
					fontSize: '16px',
					lineHeight: '1.7',
					color: '#374151',
					minHeight: '200px', // Prevent layout shift during transcription
					position: 'relative',
					zIndex: 1
				}}
				dangerouslySetInnerHTML={{ __html: confidenceHtml }}
			/>
		</div>
	)
}