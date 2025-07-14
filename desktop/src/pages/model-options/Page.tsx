import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ReactComponent as ChevronLeftIcon } from '~/icons/chevron-left.svg'
import { ReactComponent as SettingsIcon } from '~/icons/settings.svg'
import { ReactComponent as ResetIcon } from '~/icons/reset.svg'
import Layout from '~/components/Layout'
import { InfoTooltip } from '~/components/InfoTooltip'
import CustomSelect, { SelectOption } from '~/components/CustomSelect'
import { cx } from '~/lib/utils'
import { usePreferenceProvider } from '~/providers/Preference'
import { useState } from 'react'
import { whisperOptions } from '~/lib/whisperInfo'

export default function ModelOptionsPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const preference = usePreferenceProvider()
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))

	// Language options for the language selector
	const languageOptions: SelectOption[] = [
		{ value: 'auto', label: t('common.auto-detect') },
		{ value: 'en', label: 'English' },
		{ value: 'es', label: 'Spanish' },
		{ value: 'fr', label: 'French' },
		{ value: 'de', label: 'German' },
		{ value: 'it', label: 'Italian' },
		{ value: 'pt', label: 'Portuguese' },
		{ value: 'ru', label: 'Russian' },
		{ value: 'ja', label: 'Japanese' },
		{ value: 'ko', label: 'Korean' },
		{ value: 'zh', label: 'Chinese' },
		{ value: 'ar', label: 'Arabic' },
		{ value: 'hi', label: 'Hindi' },
	]

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const toggleSection = (section: string) => {
		const newExpanded = new Set(expandedSections)
		if (newExpanded.has(section)) {
			newExpanded.delete(section)
		} else {
			newExpanded.add(section)
		}
		setExpandedSections(newExpanded)
	}

	const resetToDefaults = () => {
		if (window.confirm(t('common.confirm-reset-model-options'))) {
			// Reset all model options to defaults
			const defaultModelOptions = {
				init_prompt: '',
				verbose: false,
				lang: 'en',
				n_threads: 4,
				temperature: 0.0,
				max_text_ctx: undefined,
				word_timestamps: false,
				max_sentence_len: 1,
				sampling_strategy: 'beam search' as 'greedy' | 'beam search',
				sampling_bestof_or_beam_size: 5,
				best_of: 5,
				beam_size: 5,
				patience: 1.0,
				length_penalty: undefined,
				suppress_tokens: '-1',
				condition_on_previous_text: true,
				fp16: true,
				temperature_increment_on_fallback: 0.2,
				compression_ratio_threshold: 2.4,
				logprob_threshold: -1.0,
				no_speech_threshold: 0.6,
				max_line_width: undefined,
				max_line_count: undefined,
				max_words_per_line: undefined,
				highlight_words: false,
				prepend_punctuations: "\"'\\u00BF([{-",
				append_punctuations: "\"'.\\u3002,\\uFF0C!\\uFF01?\\uFF1F:\\uFF1A\")]\\u3001",
				clip_timestamps: undefined,
				hallucination_silence_threshold: undefined,
			}
			preference.setModelOptions(defaultModelOptions)
		}
	}

	const SectionCard = ({ 
		title, 
		sectionKey, 
		children, 
		description 
	}: { 
		title: string
		sectionKey: string
		children: React.ReactNode
		description?: string
	}) => {
		const isExpanded = expandedSections.has(sectionKey)
		
		return (
			<div className="card bg-base-200 shadow-md mb-4">
				<div 
					className="card-header p-4 cursor-pointer hover:bg-base-300 transition-colors"
					onClick={() => toggleSection(sectionKey)}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<SettingsIcon className="w-5 h-5 text-primary" />
							<div>
								<h3 className="font-semibold text-lg">{title}</h3>
								{description && (
									<p className="text-sm opacity-70 mt-1">{description}</p>
								)}
							</div>
						</div>
						<ChevronLeftIcon 
							className={cx(
								'w-5 h-5 transition-transform duration-200',
								isExpanded ? '-rotate-90' : 'rotate-180'
							)} 
						/>
					</div>
				</div>
				
				{isExpanded && (
					<div className="card-body p-4 pt-0">
						{children}
					</div>
				)}
			</div>
		)
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const OptionRow = ({ 
		label, 
		children, 
		tooltip, 
		optionKey 
	}: { 
		label: string
		children: React.ReactNode
		tooltip?: string
		optionKey?: string
	}) => {
		const whisperOption = optionKey ? whisperOptions[optionKey] : null
		const tooltipText = tooltip || whisperOption?.description
		
		return (
			<div className="flex items-center justify-between py-3 border-b border-base-300 last:border-b-0">
				<div className="flex items-center gap-2">
					<label className="font-medium">{label}</label>
					{tooltipText && <InfoTooltip text={tooltipText} />}
				</div>
				<div className="min-w-0 flex-shrink-0">
					{children}
				</div>
			</div>
		)
	}

	return (
		<Layout>
			<div className="flex flex-col m-auto w-full max-w-4xl mt-10 px-4">
				{/* Header */}
				<div className="flex items-center gap-4 mb-6">
					<button
						onClick={() => navigate('/settings')}
						className="btn btn-ghost btn-sm"
						title={t('common.back')}
					>
						<ChevronLeftIcon className="w-5 h-5" />
					</button>
					<div className="flex-1">
						<h1 className="text-3xl font-bold">{t('common.model-options')}</h1>
						<p className="text-sm opacity-70 mt-1">
							{t('common.model-options-description')}
						</p>
					</div>
					<button
						onClick={resetToDefaults}
						className="btn btn-outline btn-sm gap-2"
						title={t('common.reset-to-defaults')}
					>
						<ResetIcon className="w-4 h-4" />
						{t('common.reset')}
					</button>
				</div>

				{/* Basic Options */}
				<SectionCard 
					title={t('common.basic-options')}
					sectionKey="basic"
					description={t('common.basic-options-description')}
				>
					<OptionRow label={t('common.language')} optionKey="language">
						<CustomSelect
							options={languageOptions}
							value={preference.modelOptions.lang}
							onChange={(value) => preference.setModelOptions({
								...preference.modelOptions,
								lang: value
							})}
							size="sm"
							className="w-48"
						/>
					</OptionRow>

					<OptionRow label={t('common.temperature')} optionKey="temperature">
						<div className="flex items-center gap-3">
							<input
								type="range"
								min="0"
								max="1"
								step="0.1"
								value={preference.modelOptions.temperature || 0}
								onChange={(e) => preference.setModelOptions({
									...preference.modelOptions,
									temperature: parseFloat(e.target.value)
								})}
								className="range range-primary range-sm w-32"
							/>
							<input
								type="number"
								min="0"
								max="1"
								step="0.1"
								value={preference.modelOptions.temperature || 0}
								onChange={(e) => preference.setModelOptions({
									...preference.modelOptions,
									temperature: parseFloat(e.target.value)
								})}
								className="input input-bordered input-sm w-16"
							/>
						</div>
					</OptionRow>

					<OptionRow label={t('common.sampling-strategy')} optionKey="beam_size">
						<div className="flex gap-2">
							<label className="label cursor-pointer gap-2">
								<input
									type="radio"
									name="sampling"
									value="greedy"
									checked={preference.modelOptions.sampling_strategy === 'greedy'}
									onChange={(e) => preference.setModelOptions({
										...preference.modelOptions,
										sampling_strategy: e.target.value as 'greedy' | 'beam search'
									})}
									className="radio radio-primary radio-sm"
								/>
								<span className="text-sm">{t('common.greedy')}</span>
							</label>
							<label className="label cursor-pointer gap-2">
								<input
									type="radio"
									name="sampling"
									value="beam search"
									checked={preference.modelOptions.sampling_strategy === 'beam search'}
									onChange={(e) => preference.setModelOptions({
										...preference.modelOptions,
										sampling_strategy: e.target.value as 'greedy' | 'beam search'
									})}
									className="radio radio-primary radio-sm"
								/>
								<span className="text-sm">{t('common.beam-search')}</span>
							</label>
						</div>
					</OptionRow>

					{preference.modelOptions.sampling_strategy === 'beam search' && (
						<OptionRow label={t('common.beam-size')} optionKey="beam_size">
							<input
								type="number"
								min="1"
								max="20"
								value={preference.modelOptions.beam_size || 5}
								onChange={(e) => preference.setModelOptions({
									...preference.modelOptions,
									beam_size: parseInt(e.target.value)
								})}
								className="input input-bordered input-sm w-20"
							/>
						</OptionRow>
					)}

					{preference.modelOptions.sampling_strategy === 'greedy' && (
						<OptionRow label={t('common.best-of')} optionKey="best_of">
							<input
								type="number"
								min="1"
								max="20"
								value={preference.modelOptions.best_of || 5}
								onChange={(e) => preference.setModelOptions({
									...preference.modelOptions,
									best_of: parseInt(e.target.value)
								})}
								className="input input-bordered input-sm w-20"
							/>
						</OptionRow>
					)}

					<OptionRow label={t('common.initial-prompt')} optionKey="init_prompt">
						<textarea
							value={preference.modelOptions.init_prompt || ''}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								init_prompt: e.target.value
							})}
							placeholder={t('common.initial-prompt-placeholder')}
							className="textarea textarea-bordered textarea-sm w-80 h-20"
						/>
					</OptionRow>
				</SectionCard>

				{/* Advanced Processing */}
				<SectionCard 
					title={t('common.advanced-processing')}
					sectionKey="advanced"
					description={t('common.advanced-processing-description')}
				>
					<OptionRow label={t('common.threads')} optionKey="n_threads">
						<input
							type="number"
							min="1"
							max="32"
							value={preference.modelOptions.n_threads || 4}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								n_threads: parseInt(e.target.value)
							})}
							className="input input-bordered input-sm w-20"
						/>
					</OptionRow>

					<OptionRow label={t('common.context-length')} optionKey="max_text_ctx">
						<input
							type="number"
							min="1"
							max="16384"
							value={preference.modelOptions.max_text_ctx || ''}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								max_text_ctx: e.target.value ? parseInt(e.target.value) : undefined
							})}
							placeholder="Auto"
							className="input input-bordered input-sm w-24"
						/>
					</OptionRow>

					<OptionRow label={t('common.fp16-precision')} tooltip={t('common.fp16-precision-tooltip')}>
						<input
							type="checkbox"
							checked={preference.modelOptions.fp16 ?? true}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								fp16: e.target.checked
							})}
							className="toggle toggle-primary toggle-sm"
						/>
					</OptionRow>

					<OptionRow label={t('common.condition-on-previous')} tooltip={t('common.condition-on-previous-tooltip')}>
						<input
							type="checkbox"
							checked={preference.modelOptions.condition_on_previous_text ?? true}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								condition_on_previous_text: e.target.checked
							})}
							className="toggle toggle-primary toggle-sm"
						/>
					</OptionRow>
				</SectionCard>

				{/* Output & Formatting */}
				<SectionCard 
					title={t('common.output-formatting')}
					sectionKey="output"
					description={t('common.output-formatting-description')}
				>
					<OptionRow label={t('common.word-timestamps')} optionKey="word_timestamps">
						<input
							type="checkbox"
							checked={preference.modelOptions.word_timestamps || false}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								word_timestamps: e.target.checked
							})}
							className="toggle toggle-primary toggle-sm"
						/>
					</OptionRow>

					<OptionRow label={t('common.translate-to-english')} optionKey="translate">
						<input
							type="checkbox"
							checked={preference.modelOptions.translate || false}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								translate: e.target.checked
							})}
							className="toggle toggle-primary toggle-sm"
						/>
					</OptionRow>

					{preference.modelOptions.word_timestamps && (
						<>
							<OptionRow label={t('common.highlight-words')} tooltip={t('common.highlight-words-tooltip')}>
								<input
									type="checkbox"
									checked={preference.modelOptions.highlight_words || false}
									onChange={(e) => preference.setModelOptions({
										...preference.modelOptions,
										highlight_words: e.target.checked
									})}
									className="toggle toggle-primary toggle-sm"
								/>
							</OptionRow>

							<OptionRow label={t('common.max-line-width')} tooltip={t('common.max-line-width-tooltip')}>
								<input
									type="number"
									min="10"
									max="200"
									value={preference.modelOptions.max_line_width || ''}
									onChange={(e) => preference.setModelOptions({
										...preference.modelOptions,
										max_line_width: e.target.value ? parseInt(e.target.value) : undefined
									})}
									placeholder="Auto"
									className="input input-bordered input-sm w-20"
								/>
							</OptionRow>

							<OptionRow label={t('common.max-words-per-line')} tooltip={t('common.max-words-per-line-tooltip')}>
								<input
									type="number"
									min="1"
									max="50"
									value={preference.modelOptions.max_words_per_line || ''}
									onChange={(e) => preference.setModelOptions({
										...preference.modelOptions,
										max_words_per_line: e.target.value ? parseInt(e.target.value) : undefined
									})}
									placeholder="Auto"
									className="input input-bordered input-sm w-20"
								/>
							</OptionRow>
						</>
					)}
				</SectionCard>

				{/* Quality & Performance */}
				<SectionCard 
					title={t('common.quality-performance')}
					sectionKey="quality"
					description={t('common.quality-performance-description')}
				>
					<OptionRow label={t('common.compression-ratio-threshold')} tooltip={t('common.compression-ratio-threshold-tooltip')}>
						<input
							type="number"
							min="1.0"
							max="10.0"
							step="0.1"
							value={preference.modelOptions.compression_ratio_threshold || 2.4}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								compression_ratio_threshold: parseFloat(e.target.value)
							})}
							className="input input-bordered input-sm w-20"
						/>
					</OptionRow>

					<OptionRow label={t('common.logprob-threshold')} tooltip={t('common.logprob-threshold-tooltip')}>
						<input
							type="number"
							min="-5.0"
							max="0.0"
							step="0.1"
							value={preference.modelOptions.logprob_threshold || -1.0}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								logprob_threshold: parseFloat(e.target.value)
							})}
							className="input input-bordered input-sm w-20"
						/>
					</OptionRow>

					<OptionRow label={t('common.no-speech-threshold')} tooltip={t('common.no-speech-threshold-tooltip')}>
						<input
							type="number"
							min="0.0"
							max="1.0"
							step="0.1"
							value={preference.modelOptions.no_speech_threshold || 0.6}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								no_speech_threshold: parseFloat(e.target.value)
							})}
							className="input input-bordered input-sm w-20"
						/>
					</OptionRow>

					<OptionRow label={t('common.temperature-increment')} tooltip={t('common.temperature-increment-tooltip')}>
						<input
							type="number"
							min="0.0"
							max="1.0"
							step="0.1"
							value={preference.modelOptions.temperature_increment_on_fallback || 0.2}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								temperature_increment_on_fallback: parseFloat(e.target.value)
							})}
							className="input input-bordered input-sm w-20"
						/>
					</OptionRow>

					<OptionRow label={t('common.suppress-tokens')} tooltip={t('common.suppress-tokens-tooltip')}>
						<input
							type="text"
							value={preference.modelOptions.suppress_tokens || '-1'}
							onChange={(e) => preference.setModelOptions({
								...preference.modelOptions,
								suppress_tokens: e.target.value
							})}
							placeholder="-1"
							className="input input-bordered input-sm w-32"
						/>
					</OptionRow>
				</SectionCard>

				{/* Save indicator */}
				<div className="text-center py-4">
					<p className="text-sm opacity-60">
						{t('common.settings-auto-saved')}
					</p>
				</div>
			</div>
		</Layout>
	)
}