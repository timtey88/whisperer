import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as DownloadIcon } from '~/icons/download.svg'
import { ReactComponent as ChevronDownIcon } from '~/icons/chevron-down.svg'
import { ExportFormat } from './FormatSelect'
import { cx } from '~/lib/utils'

interface DocumentExportMenuProps {
	onExport: (format: ExportFormat) => void
	defaultFormat?: ExportFormat
	className?: string
}

export default function DocumentExportMenu({ 
	onExport, 
	defaultFormat = 'html',
	className = ''
}: DocumentExportMenuProps) {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat)
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
		setSelectedFormat(format)
		setIsOpen(false)
		onExport(format)
	}

	const formatLabels: Record<ExportFormat, string> = {
		html: 'Save as HTML',
		pdf: 'Print as PDF',
		docx: 'Save as DOCX'
	}

	const formatIcons: Record<ExportFormat, string> = {
		html: '🌐',
		pdf: '📄',
		docx: '📝'
	}

	return (
		<div className={cx('relative', className)} ref={dropdownRef}>
			{/* Main Export Button */}
			<div className="flex">
				<button
					onMouseDown={() => handleExport(selectedFormat)}
					className="btn btn-md rounded-r-none border-r-0"
					title={formatLabels[selectedFormat]}
				>
					<DownloadIcon className="w-5 h-5" />
					<span className="hidden sm:inline ml-1">{formatLabels[selectedFormat].split(' ')[0]}</span>
				</button>
				
				{/* Dropdown Toggle */}
				<button
					onMouseDown={() => setIsOpen(!isOpen)}
					className="btn btn-md rounded-l-none border-l-0 px-2"
					title="Export options"
				>
					<ChevronDownIcon className={cx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
				</button>
			</div>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="absolute top-full mt-1 right-0 z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg min-w-44">
					{Object.entries(formatLabels).map(([format, label]) => (
						<button
							key={format}
							onMouseDown={() => handleExport(format as ExportFormat)}
							className={cx(
								'w-full text-left px-4 py-2 hover:bg-base-200 first:rounded-t-lg last:rounded-b-lg flex items-center gap-3',
								selectedFormat === format && 'bg-primary/10 text-primary'
							)}
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