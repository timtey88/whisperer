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
					<div className="mb-4 p-3 bg-base-200 rounded-lg border border-base-300">
						<h4 className="font-semibold text-sm mb-2 text-primary">FFmpeg Audio Preprocessing</h4>
						<p className="text-xs text-base-content/70 mb-3">
							FFmpeg options control audio preprocessing before transcription. This happens before the audio reaches the Whisper AI model.
						</p>
						<div className="text-xs text-base-content/60 space-y-1">
							<div><strong>Command Structure:</strong></div>
							<div className="font-mono bg-base-300 p-2 rounded text-xs">
								ffmpeg -i input.wav -ar 16000 -ac 1 -c:a pcm_s16le [your_options] output.wav
							</div>
							<div className="mt-2"><strong>Common Examples:</strong></div>
							<div className="font-mono text-xs space-y-1">
								<div>• <span className="text-primary">-af loudnorm=I=-16:TP=-1.5:LRA=11</span> (normalize loudness)</div>
								<div>• <span className="text-primary">-af highpass=f=200</span> (remove low frequencies)</div>
								<div>• <span className="text-primary">-af "volume=2.0"</span> (increase volume)</div>
								<div>• <span className="text-primary">-ss 00:01:00 -to 00:05:00</span> (trim audio)</div>
							</div>
						</div>
					</div>
					
					<div className="form-control w-full mt-3">
						<label className="label cursor-pointer">
							<span className="label-text flex items-center gap-1 cursor-default">
								<InfoTooltip text="Enable automatic loudness normalization. This applies the loudnorm filter to standardize audio levels before transcription." />
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
								<InfoTooltip text="Enter custom FFmpeg options to insert into the command. Use when you need specific audio processing beyond normalize loudness. Leave empty to use default processing." />
								{t('common.custom-ffmpeg-command')}
							</span>
						</div>

						<input
							value={preference.ffmpegOptions.custom_command ?? ''}
							onChange={(e) =>
								preference.setFfmpegOptions({ ...preference.ffmpegOptions, custom_command: e.target.value ? e.target.value : null })
							}
							className="input input-bordered text-sm"
							placeholder={preference.ffmpegOptions.normalize_loudness ? '-af loudnorm=I=-16:TP=-1.5:LRA=11' : 'e.g. -af highpass=f=200'}
							type="text"
						/>
					</label>
					
					<div className="alert alert-info mt-3">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<div className="text-sm">
							<div className="font-semibold">When to use:</div>
							<div>• <strong>Normalize Loudness:</strong> For consistent audio levels across files</div>
							<div>• <strong>Custom Command:</strong> For specific audio processing (noise reduction, filtering, etc.)</div>
							<div>• <strong>Both:</strong> Custom command overrides normalize loudness</div>
						</div>
					</div>

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
