import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as ChevronDown } from '~/icons/chevron-down.svg'
import { ReactComponent as ChevronUp } from '~/icons/chevron-up.svg'
import { cx } from '~/lib/utils'
import { usePreferenceProvider } from '~/providers/Preference'

export default function TranscribeOptions() {
	const [open, setOpen] = useState(false)
	const preference = usePreferenceProvider()
	const { t } = useTranslation()



	return (
		<div className={cx('collapse !overflow-visible', open && 'collapse-open')}>
			<div onMouseDown={() => setOpen(!open)} className={cx('mt-3 flex flex-row items-center gap-1 text-sm text-primary font-medium cursor-pointer')}>
				{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
				{t('common.more-options')}
			</div>
			{open && (
				<div className={cx(`collapse-content w-full`)}>
					<div className="label mt-5">
						<span className="label-text text-2xl font-bold">{t('common.presets')}</span>
					</div>

					<label className="form-control w-full">
						<button onClick={preference.resetOptions} className="btn btn-md">
							{t('common.reset-options')}
						</button>
					</label>
				</div>
			)}
		</div>
	)
}
