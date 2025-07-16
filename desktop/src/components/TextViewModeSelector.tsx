import { useState, useRef, useEffect } from 'react'
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


	return (
		<div className={cx('relative', className)} ref={dropdownRef}>
			{/* View Mode Button */}
			<button
				onMouseDown={() => setIsOpen(!isOpen)}
				className="btn btn-sm"
				title={`View: ${viewModeLabels[viewMode]}`}
			>
				<span className="text-xs">{viewModeLabels[viewMode]}</span>
				<ChevronDownIcon className={cx('w-3 h-3 ml-1 transition-transform', isOpen && 'rotate-180')} />
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="absolute top-full mt-1 left-0 z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg min-w-40">
					{Object.entries(viewModeLabels).map(([mode, label]) => (
						<button
							key={mode}
							onMouseDown={() => handleViewModeSelect(mode as TextViewMode)}
							className={cx(
								'w-full text-left px-3 py-2 hover:bg-base-200 first:rounded-t-lg last:rounded-b-lg text-sm',
								viewMode === mode && 'bg-primary/10 text-primary'
							)}
						>
							{label}
						</button>
					))}
				</div>
			)}
		</div>
	)
}