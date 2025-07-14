import { useState, useRef, useEffect } from 'react'
import { ReactComponent as ChevronDownIcon } from '~/icons/chevron-down.svg'
import { cx } from '~/lib/utils'

export interface SelectOption {
	value: string
	label: string
	group?: string
}

interface CustomSelectProps {
	options: SelectOption[]
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
	disabled?: boolean
	size?: 'sm' | 'md'
}

export default function CustomSelect({
	options,
	value,
	onChange,
	placeholder = 'Select option',
	className = '',
	disabled = false,
	size = 'md'
}: CustomSelectProps) {
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

	// Handle keyboard navigation
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (!isOpen) return

			if (event.key === 'Escape') {
				setIsOpen(false)
			} else if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [isOpen])

	const handleOptionSelect = (optionValue: string) => {
		setIsOpen(false)
		onChange(optionValue)
	}

	// Find the selected option
	const selectedOption = options.find(option => option.value === value)

	// Group options by group property
	const groupedOptions = options.reduce((groups, option) => {
		const group = option.group || 'default'
		if (!groups[group]) {
			groups[group] = []
		}
		groups[group].push(option)
		return groups
	}, {} as Record<string, SelectOption[]>)

	// Check if we have groups
	const hasGroups = Object.keys(groupedOptions).length > 1 || (Object.keys(groupedOptions).length === 1 && !groupedOptions.default)

	const buttonSizeClass = size === 'sm' ? 'btn-sm' : 'btn-md'
	const dropdownSizeClass = size === 'sm' ? 'text-sm' : ''

	return (
		<div className={cx('relative w-full', className)} ref={dropdownRef}>
			{/* Select Button */}
			<button
				onMouseDown={() => !disabled && setIsOpen(!isOpen)}
				disabled={disabled}
				className={cx(
					'btn w-full justify-between',
					buttonSizeClass,
					disabled && 'btn-disabled'
				)}
				title={selectedOption?.label || placeholder}
			>
				<span className={cx('truncate', !selectedOption && 'opacity-60')}>
					{selectedOption?.label || placeholder}
				</span>
				<ChevronDownIcon 
					className={cx(
						'w-4 h-4 ml-2 flex-shrink-0 transition-transform', 
						isOpen && 'rotate-180'
					)} 
				/>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className={cx(
					'absolute top-full mt-1 left-0 z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg',
					'min-w-full max-w-xs max-h-60 overflow-y-auto',
					dropdownSizeClass
				)}>
					{hasGroups ? (
						// Render grouped options
						Object.entries(groupedOptions).map(([groupName, groupOptions], groupIndex) => (
							<div key={groupName}>
								{groupName !== 'default' && (
									<div className="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider border-b border-base-300/50">
										{groupName}
									</div>
								)}
								{groupOptions.map((option, optionIndex) => (
									<button
										key={option.value}
										onMouseDown={() => handleOptionSelect(option.value)}
										className={cx(
											'w-full text-left px-3 py-2 hover:bg-base-200 text-sm',
											value === option.value && 'bg-primary/10 text-primary',
											// Rounded corners for first/last items
											groupIndex === 0 && optionIndex === 0 && 'rounded-t-lg',
											groupIndex === Object.keys(groupedOptions).length - 1 && 
											optionIndex === groupOptions.length - 1 && 'rounded-b-lg'
										)}
									>
										{option.label}
									</button>
								))}
								{groupIndex < Object.keys(groupedOptions).length - 1 && (
									<div className="border-b border-base-300/30" />
								)}
							</div>
						))
					) : (
						// Render flat options
						options.map((option, index) => (
							<button
								key={option.value}
								onMouseDown={() => handleOptionSelect(option.value)}
								className={cx(
									'w-full text-left px-3 py-2 hover:bg-base-200 text-sm',
									value === option.value && 'bg-primary/10 text-primary',
									index === 0 && 'rounded-t-lg',
									index === options.length - 1 && 'rounded-b-lg'
								)}
							>
								{option.label}
							</button>
						))
					)}
				</div>
			)}
		</div>
	)
}