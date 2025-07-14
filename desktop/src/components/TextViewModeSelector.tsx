import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as ChevronDownIcon } from '~/icons/chevron-down.svg'
import { TextViewMode } from './FormatSelect'
import { cx } from '~/lib/utils'

interface TextViewModeSelectorProps {
	viewMode: TextViewMode
	onViewModeChange: (mode: TextViewMode) => void
	className?: string
}

export default function TextViewModeSelector({ 
	viewMode, 
	onViewModeChange,
	className = ''
}: TextViewModeSelectorProps) {
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

	const handleViewModeSelect = (mode: TextViewMode) => {
		setIsOpen(false)
		onViewModeChange(mode)
	}

	const viewModeLabels: Record<TextViewMode, string> = {
		plain: 'Plain Text',
		confidence: 'Confidence Colors',
		'raw-ansi': 'Raw ANSI'
	}

	const viewModeIcons: Record<TextViewMode, string> = {
		plain: '📝',
		confidence: '🌈',
		'raw-ansi': '⚡'
	}

	const viewModeDescriptions: Record<TextViewMode, string> = {
		plain: 'Standard text format',
		confidence: 'Color-coded confidence levels',
		'raw-ansi': 'ANSI escape sequences'
	}

	return (
		<div className={cx('relative', className)} ref={dropdownRef}>
			{/* View Mode Button */}
			<button
				onMouseDown={() => setIsOpen(!isOpen)}
				className="btn btn-sm"
				title={`View: ${viewModeLabels[viewMode]}`}
			>
				<span className="text-sm">{viewModeIcons[viewMode]}</span>
				<span className="hidden sm:inline ml-1 text-xs">{viewModeLabels[viewMode]}</span>
				<ChevronDownIcon className={cx('w-3 h-3 ml-1 transition-transform', isOpen && 'rotate-180')} />
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="absolute top-full mt-1 right-0 z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg min-w-48">
					{Object.entries(viewModeLabels).map(([mode, label]) => (
						<button
							key={mode}
							onMouseDown={() => handleViewModeSelect(mode as TextViewMode)}
							className={cx(
								'w-full text-left px-4 py-3 hover:bg-base-200 first:rounded-t-lg last:rounded-b-lg flex items-center gap-3',
								viewMode === mode && 'bg-primary/10 text-primary'
							)}
						>
							<span className="text-lg">{viewModeIcons[mode as TextViewMode]}</span>
							<div className="flex flex-col">
								<span className="font-medium">{label}</span>
								<span className="text-xs opacity-70">{viewModeDescriptions[mode as TextViewMode]}</span>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	)
}