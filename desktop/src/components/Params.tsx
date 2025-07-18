import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as ChevronDown } from '~/icons/chevron-down.svg'
import { ReactComponent as ChevronUp } from '~/icons/chevron-up.svg'
import { cx } from '~/lib/utils'
import { InfoTooltip } from './InfoTooltip'
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
						<span className="label-text text-2xl font-bold">{t('common.ffmpeg-options')}</span>
					</div>
					<div className="form-control w-full mt-3">
						<label className="label cursor-pointer">
							<span className="label-text flex items-center gap-1 cursor-default">
								<InfoTooltip text={t('common.info-normalize-loudness')} />
								{t('common.normalize-loudness')}
							</span>

							<input
								type="checkbox"
								className="toggle toggle-primary"
								checked={preference.ffmpegOptions.normalize_loudness}
								onChange={(e) => preference.setFfmpegOptions({ ...preference.ffmpegOptions, normalize_loudness: e.target.checked })}
							/>
						</label>
					</div>
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text flex items-center gap-1">
								<InfoTooltip text={'ffmpeg -i {input} -ar 16000 -ac 1 -c:a pcm_s16le {custom_command} -hide_banner -y -loglevel error'} />
								{t('common.custom-ffmpeg-command')}
							</span>
						</div>

						<input
							value={preference.ffmpegOptions.custom_command ?? ''}
							onChange={(e) =>
								preference.setFfmpegOptions({ ...preference.ffmpegOptions, custom_command: e.target.value ? e.target.value : null })
							}
							className="input input-bordered opacity-50 text-sm"
							placeholder={preference.ffmpegOptions.normalize_loudness ? '-af loudnorm=I=-16:TP=-1.5:LRA=11' : ''}
							type="text"
						/>
					</label>

					<div className="label mt-8">
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
