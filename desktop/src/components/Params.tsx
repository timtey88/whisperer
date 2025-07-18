import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as ChevronDown } from '~/icons/chevron-down.svg'
import { ReactComponent as ChevronUp } from '~/icons/chevron-up.svg'
import { ModifyState, cx } from '~/lib/utils'
import { InfoTooltip } from './InfoTooltip'
import CustomSelect from './CustomSelect'
import { ModelOptions as IModelOptions, usePreferenceProvider } from '~/providers/Preference'

interface ParamsProps {
	options: IModelOptions
	setOptions: ModifyState<IModelOptions>
}

export default function ModelOptions({ options, setOptions }: ParamsProps) {
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
						<span className="label-text text-2xl font-bold">{t('common.model-options')}</span>
					</div>
					<div className="form-control w-full mt-3">
						<label className="label cursor-pointer">
							<span className="label-text flex items-center gap-1 cursor-default">
								<InfoTooltip text={t('common.info-translate-to-english')} />
								{t('common.translate-to-english')}
							</span>

							<input
								type="checkbox"
								className="toggle toggle-primary"
								checked={options.translate}
								onChange={(e) => setOptions({ ...options, translate: e.target.checked })}
							/>
						</label>
					</div>

					<label className="form-control w-full">
						<div className="label">
							<span className="label-text flex items-center gap-1">
								<InfoTooltip text={t('common.info-prompt')} />
								{t('common.prompt')} ({t('common.leftover')} {1024 - (options?.init_prompt?.length ?? 0)} {t('common.characters')})
							</span>
						</div>
						<textarea
							value={options?.init_prompt}
							onChange={(e) => setOptions({ ...options, init_prompt: e.target.value.slice(0, 1024) })}
							className="textarea textarea-bordered w-full"></textarea>
					</label>

					<div className="form-control w-full mt-3">
						<label className="label cursor-pointer">
							<span className="label-text flex items-center gap-1 cursor-default">
								<InfoTooltip text={t('common.info-use-word-timestamps')} />
								{t('common.use-word-timestamps')}
							</span>

							<input
								type="checkbox"
								className="toggle toggle-primary"
								checked={options.word_timestamps}
								onChange={(e) => setOptions({ ...options, word_timestamps: e.target.checked })}
							/>
						</label>
					</div>
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text flex items-center gap-1">
								<InfoTooltip text={t('common.info-max-sentence-len')} />
								{t('common.max-sentence-len')}
							</span>
						</div>
						<input
							value={options.max_sentence_len}
							onChange={(e) => setOptions({ ...options, max_sentence_len: parseInt(e.target.value) ?? 1 })}
							className="input input-bordered"
							type="number"
						/>
					</label>
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text flex items-center gap-1">
								<InfoTooltip text={t('common.info-threads')} />
								{t('common.threads')}
							</span>
						</div>
						<input
							value={options.n_threads}
							onChange={(e) => setOptions({ ...options, n_threads: parseInt(e.target.value) })}
							className="input input-bordered"
							type="number"
						/>
					</label>
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text flex items-center gap-1">
								<InfoTooltip text={t('common.info-temperature')} />
								{t('common.temperature')}
							</span>
						</div>
						<input
							step={0.1}
							value={options.temperature}
							onChange={(e) => setOptions({ ...options, temperature: parseFloat(e.target.value) })}
							className="input input-bordered"
							type="number"
						/>
					</label>
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text flex items-center gap-1">
								<InfoTooltip text={t('common.info-max-text-ctx')} />
								{t('common.max-text-ctx')}
							</span>
						</div>
						<input
							step={1}
							value={options.max_text_ctx ?? 0}
							onChange={(e) => setOptions({ ...options, max_text_ctx: parseInt(e.target.value) })}
							className="input input-bordered"
							type="number"
						/>
					</label>
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text flex items-center gap-1">
								<InfoTooltip text="Greedy vs Beam Search: Default is Beam Search (Size 5, Patience -1), which evaluates 5 possible sequences at each step for more accurate results, but is slower. Greedy, on the other hand, selects the best token from the top 5 at each step, making it faster but potentially less accurate." />
								{t('common.sampling-strategy')}
							</span>
						</div>

						<CustomSelect
							options={[
								{ value: 'beam search', label: 'Beam Search' },
								{ value: 'greedy', label: 'Greedy' }
							]}
							value={preference.modelOptions.sampling_strategy}
							onChange={(newStrategy) => {
								preference.setModelOptions({ ...preference.modelOptions, sampling_strategy: newStrategy as 'greedy' | 'beam search' })
							}}
						/>
					</label>
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text flex items-center gap-1">
								<InfoTooltip text="best_of: Top candidates in Greedy mode (default: 5) — higher = better accuracy, slower. beam_size: Paths explored in Beam Search (default: 5) — higher = better accuracy, slower." />
								{preference.modelOptions.sampling_strategy === 'greedy' ? 'Best of' : 'Beam size'}
							</span>
						</div>
						<input
							step={1}
							value={preference.modelOptions.sampling_bestof_or_beam_size ?? 5}
							onChange={(e) => setOptions({ ...options, sampling_bestof_or_beam_size: parseInt(e.target.value) })}
							className="input input-bordered"
							type="number"
						/>
					</label>
					<div className="label mt-10">
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
