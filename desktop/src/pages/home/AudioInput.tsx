interface AudioInputProps {
	onClick: () => void
}

export default function AudioInput({ onClick }: AudioInputProps) {
	return (
		<div className="flex items-center w-full justify-center">
			<button onMouseDown={onClick} className="btn btn-primary w-full">
				Select File
			</button>
		</div>
	)
}
