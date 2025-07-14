import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as DownloadIcon } from '~/icons/download.svg'
import { ReactComponent as ChevronDownIcon } from '~/icons/chevron-down.svg'
import { ExportFormat } from './FormatSelect'
import { cx } from '~/lib/utils'

interface DocumentExportMenuProps {
	onExport: (format: ExportFormat) => void
	className?: string
}

export default function DocumentExportMenu({ 
	onExport, 
	className = ''
}: DocumentExportMenuProps) {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const handleExport = (format: ExportFormat) => {
		setIsOpen(false)
		onExport(format)
	}

	const formatLabels: Record<ExportFormat, string> = {
		html: 'HTML',
		pdf: 'PDF',
		docx: 'DOCX'
	}

	const formatIcons: Record<ExportFormat, string> = {
		html: '🌐',
		pdf: '📄',
		docx: '📝'
	}

	return (
		<div className={cx('relative', className)} ref={dropdownRef}>
			{/* Single Dropdown Button */}
			<button
				onMouseDown={() => setIsOpen(!isOpen)}
				className="btn btn-md"
				title="Export document"
			>
				<DownloadIcon className="w-5 h-5" />
				<span className="hidden sm:inline ml-1">Save As</span>
				<ChevronDownIcon className={cx('w-4 h-4 ml-1 transition-transform', isOpen && 'rotate-180')} />
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="absolute top-full mt-1 right-0 z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg min-w-44">
					{Object.entries(formatLabels).map(([format, label]) => (
						<button
							key={format}
							onMouseDown={() => handleExport(format as ExportFormat)}
							className="w-full text-left px-4 py-2 hover:bg-base-200 first:rounded-t-lg last:rounded-b-lg flex items-center gap-3"
						>
							<span className="text-lg">{formatIcons[format as ExportFormat]}</span>
							<span className="font-medium">{label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	)
}