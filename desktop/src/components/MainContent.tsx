import { ReactNode } from 'react'

interface MainContentProps {
	children: ReactNode
	maxWidth?: 'md' | '4xl' | '6xl'
	className?: string
}

export default function MainContent({ 
	children, 
	maxWidth = 'md', 
	className = '' 
}: MainContentProps) {
	const maxWidthClass = {
		'md': 'max-w-md',
		'4xl': 'max-w-4xl', 
		'6xl': 'max-w-6xl'
	}[maxWidth]
	
	return (
		<div className="flex flex-col items-center w-full px-6">
			<div className={`w-full ${maxWidthClass} flex flex-col ${className}`}>
				{children}
			</div>
		</div>
	)
}