import { ReactNode } from 'react'
import DropModal from './DropModal'
import Toast from './Toast'

export default function Layout({ children }: { children: ReactNode }) {

	return (
		<div className="flex flex-col pb-[80px]">
			<Toast />
			<DropModal />

			<div className="flex flex-col m-auto w-full mt-10">
				<div className="relative text-center">
					<div className="text-center mb-2">
						<img src="/icon.png" alt="Whisperer" className="h-12 w-12 mx-auto" />
					</div>
				</div>
				{children}
			</div>
		</div>
	)
}
