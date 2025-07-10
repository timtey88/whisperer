import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import DropModal from './DropModal'
import Toast from './Toast'

export default function Layout({ children }: { children: ReactNode }) {
	const { t } = useTranslation()

	return (
		<div className="flex flex-col pb-[80px]">
			<Toast />
			<DropModal />

			<div className="flex flex-col m-auto w-full mt-10">
				<div className="relative text-center">
					<h1 className="text-center text-4xl mb-2 text-base-content font-normal">{t('common.app-title')}</h1>
				</div>
				{children}
			</div>
		</div>
	)
}
