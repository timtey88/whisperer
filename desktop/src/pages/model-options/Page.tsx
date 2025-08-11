import { useNavigate } from 'react-router-dom'
import { ReactComponent as ChevronLeftIcon } from '~/icons/chevron-left.svg'
import { ReactComponent as SettingsIcon } from '~/icons/settings.svg'
import { ReactComponent as ResetIcon } from '~/icons/reset.svg'
import Layout from '~/components/Layout'
import MainContent from '~/components/MainContent'
import { InfoTooltip } from '~/components/InfoTooltip'
import CustomSelect, { SelectOption } from '~/components/CustomSelect'
import { cx } from '~/lib/utils'
import { usePreferenceProvider } from '~/providers/Preference'
import { useState } from 'react'
import { whisperOptions } from '~/lib/whisperInfo'

export default function ModelOptionsPage() {
	const navigate = useNavigate()
	const preference = usePreferenceProvider()
	const [activeTab, setActiveTab] = useState<'whisper' | 'ffmpeg'>('whisper')

	// Language options for the language selector
	const languageOptions: SelectOption[] = [
		{ value: 'auto', label: 'Auto-detect' },
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


	const resetToDefaults = () => {
		if (window.confirm('Are you sure you want to reset all model options to their default values?')) {
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

	const SectionHeader = ({ title, description }: { title: string; description?: string }) => {
		return (
			<div className="mb-4 mt-6 first:mt-0">
				<div className="flex items-center gap-2 mb-2">
					<SettingsIcon className="w-4 h-4 text-primary" />
					<h3 className="font-semibold text-base text-primary">{title}</h3>
				</div>
				{description && (
					<p className="text-sm opacity-70 mb-3">{description}</p>
				)}
				<div className="border-b border-base-300"></div>
			</div>
		)
	}

	const OptionRow = ({ 
		label, 
		children, 
		tooltip, 
		optionKey,
		impact 
	}: { 
		label: string
		children: React.ReactNode
		tooltip?: string
		optionKey?: string
		impact?: 'performance' | 'quality' | 'both'
	}) => {
		const whisperOption = optionKey ? whisperOptions[optionKey] : null
		const tooltipText = tooltip || whisperOption?.description
		const optionImpact = impact || whisperOption?.impact
		
		const getImpactBadge = (impact: string) => {
			switch (impact) {
				case 'performance':
					return <span className="badge badge-info badge-xs ml-2">Speed</span>
				case 'quality':
					return <span className="badge badge-success badge-xs ml-2">Quality</span>
				case 'both':
					return <span className="badge badge-warning badge-xs ml-2">Both</span>
				default:
					return null
			}
		}
		
		return (
			<div className="flex items-center justify-between py-3 border-b border-base-300/50 last:border-b-0">
				<div className="flex items-center gap-2 flex-1 mr-4">
					<label className="font-medium text-sm">{label}</label>
					{optionImpact && getImpactBadge(optionImpact)}
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
			<MainContent maxWidth="4xl">
				{/* Header */}
				<div className="flex items-center gap-4 mb-6">
					<button
						onClick={() => navigate('/settings')}
						className="btn btn-ghost btn-sm"
						title="Back"
					>
						<ChevronLeftIcon className="w-5 h-5" />
					</button>
					<div className="flex-1">
						<h1 className="text-3xl font-bold">Model Options</h1>
						<p className="text-sm opacity-70 mt-1">
							Configure advanced Whisper model settings for optimal transcription
						</p>
					</div>
					<button
						onClick={resetToDefaults}
						className="btn btn-outline btn-sm gap-2"
						title="Reset to Defaults"
					>
						<ResetIcon className="w-4 h-4" />
						Reset
					</button>
				</div>

				{/* Main tabs */}
				<div className="tabs tabs-boxed mb-6 justify-center">
					<a
						className={cx('tab', activeTab === 'whisper' && 'tab-active')}
						onClick={() => setActiveTab('whisper')}
					>
						Whisper Options
					</a>
					<a
						className={cx('tab', activeTab === 'ffmpeg' && 'tab-active')}
						onClick={() => setActiveTab('ffmpeg')}
					>
						FFmpeg Options
					</a>
				</div>

				{/* Whisper Options Tab */}
				{activeTab === 'whisper' && (
					<div className="bg-base-200 rounded-lg p-6">
						{/* Header with context */}
						<div className="mb-6 p-4 bg-base-100 rounded-lg border border-base-300">
							<h4 className="font-semibold text-sm mb-2 text-primary">Whisper AI Model Configuration</h4>
							<p className="text-xs text-base-content/70 mb-3">
								These settings control how the Whisper AI model processes your audio. Different options impact transcription speed, quality, or both.
							</p>
							<div className="flex gap-4 text-xs">
								<div className="flex items-center gap-1">
									<span className="badge badge-info badge-xs">Speed</span>
									<span className="text-base-content/60">Performance impact</span>
								</div>
								<div className="flex items-center gap-1">
									<span className="badge badge-success badge-xs">Quality</span>
									<span className="text-base-content/60">Accuracy impact</span>
								</div>
								<div className="flex items-center gap-1">
									<span className="badge badge-warning badge-xs">Both</span>
									<span className="text-base-content/60">Speed & quality</span>
								</div>
							</div>
						</div>

						{/* Core Settings */}
						<SectionHeader 
							title="Core Settings" 
							description="Essential options for language and transcription approach"
						/>
						
						<div className="space-y-0">
							<OptionRow label="Language" optionKey="language">
								<CustomSelect
									options={languageOptions}
									value={preference.modelOptions.lang}
									onChange={(value) => preference.setModelOptions({
										...preference.modelOptions,
										lang: value
									})}
									size="sm"
									className="w-44"
								/>
							</OptionRow>

							<OptionRow label="Temperature" optionKey="temperature">
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
										className="range range-primary range-sm w-28"
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

							<OptionRow label="Sampling Strategy" optionKey="beam_size">
								<div className="flex gap-3">
									<label className="label cursor-pointer gap-2 py-1">
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
										<span className="text-sm">Greedy</span>
									</label>
									<label className="label cursor-pointer gap-2 py-1">
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
										<span className="text-sm">Beam Search</span>
									</label>
								</div>
							</OptionRow>

							{preference.modelOptions.sampling_strategy === 'beam search' && (
								<OptionRow label="Beam Size" optionKey="beam_size">
									<input
										type="number"
										min="1"
										max="20"
										value={preference.modelOptions.beam_size || 5}
										onChange={(e) => preference.setModelOptions({
											...preference.modelOptions,
											beam_size: parseInt(e.target.value)
										})}
										className="input input-bordered input-sm w-16"
									/>
								</OptionRow>
							)}

							{preference.modelOptions.sampling_strategy === 'greedy' && (
								<OptionRow label="Best Of" optionKey="best_of">
									<input
										type="number"
										min="1"
										max="20"
										value={preference.modelOptions.best_of || 5}
										onChange={(e) => preference.setModelOptions({
											...preference.modelOptions,
											best_of: parseInt(e.target.value)
										})}
										className="input input-bordered input-sm w-16"
									/>
								</OptionRow>
							)}

							<OptionRow label="Translate to English" optionKey="translate">
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

							<OptionRow label="Initial Prompt" optionKey="init_prompt">
								<textarea
									value={preference.modelOptions.init_prompt || ''}
									onChange={(e) => preference.setModelOptions({
										...preference.modelOptions,
										init_prompt: e.target.value
									})}
									placeholder="Enter context or vocabulary to guide transcription..."
									className="textarea textarea-bordered textarea-sm w-72 h-20 resize-none"
								/>
							</OptionRow>
						</div>

						{/* Performance Settings */}
						<SectionHeader 
							title="Performance Settings" 
							description="Control processing speed and resource usage"
						/>
						
						<div className="space-y-0">
							<OptionRow label="CPU Threads" optionKey="n_threads">
								<input
									type="number"
									min="1"
									max="32"
									value={preference.modelOptions.n_threads || 4}
									onChange={(e) => preference.setModelOptions({
										...preference.modelOptions,
										n_threads: parseInt(e.target.value)
									})}
									className="input input-bordered input-sm w-16"
								/>
							</OptionRow>

							<OptionRow label="Context Length" optionKey="max_text_ctx">
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
									className="input input-bordered input-sm w-20"
								/>
							</OptionRow>

							<OptionRow label="FP16 Precision" tooltip="Use 16-bit floating point for faster inference with minimal quality loss">
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

							<OptionRow label="Use Previous Context" tooltip="Use previous segment output as context for better coherence">
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
						</div>

						{/* Output Options */}
						<SectionHeader 
							title="Output Options" 
							description="Control timestamp formatting and subtitle layout"
						/>
						
						<div className="space-y-0">
							<OptionRow label="Word Timestamps" optionKey="word_timestamps">
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

							{preference.modelOptions.word_timestamps && (
								<>
									<OptionRow label="Highlight Words" tooltip="Underline each word as it is spoken in subtitle formats">
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

									<OptionRow label="Max Line Width" tooltip="Maximum characters per line in subtitle output">
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
											className="input input-bordered input-sm w-16"
										/>
									</OptionRow>

									<OptionRow label="Max Words Per Line" tooltip="Maximum words per line in subtitle output">
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
											className="input input-bordered input-sm w-16"
										/>
									</OptionRow>
								</>
							)}
						</div>

						{/* Advanced Settings */}
						<SectionHeader 
							title="Advanced Settings" 
							description="Fine-tune quality thresholds and detection parameters"
						/>
						
						<div className="space-y-0">
							<OptionRow label="Compression Ratio" tooltip="Treat decoding as failed if compression ratio exceeds this value">
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
									className="input input-bordered input-sm w-16"
								/>
							</OptionRow>

							<OptionRow label="Log Probability Threshold" tooltip="Treat decoding as failed if average log probability is below this value">
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
									className="input input-bordered input-sm w-16"
								/>
							</OptionRow>

							<OptionRow label="No Speech Threshold" tooltip="Consider segment as silence if no-speech probability exceeds this value">
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
									className="input input-bordered input-sm w-16"
								/>
							</OptionRow>

							<OptionRow label="Temperature Increment" tooltip="Amount to increase temperature when decoding fails">
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
									className="input input-bordered input-sm w-16"
								/>
							</OptionRow>

							<OptionRow label="Suppress Tokens" tooltip="Comma-separated token IDs to suppress during sampling (-1 for common punctuation)">
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
						</div>

						{/* Save indicator */}
						<div className="text-center py-4 mt-6">
							<p className="text-sm opacity-60">
								Settings are automatically saved
							</p>
						</div>
					</div>
				)}

				{/* FFmpeg Options Tab */}
				{activeTab === 'ffmpeg' && (
					<div className="bg-base-200 rounded-lg p-6">
						{/* Header with context */}
						<div className="mb-6 p-4 bg-base-100 rounded-lg border border-base-300">
							<h4 className="font-semibold text-sm mb-2 text-primary">FFmpeg Audio Preprocessing</h4>
							<p className="text-xs text-base-content/70 mb-3">
								FFmpeg options control audio preprocessing before transcription. This happens before the audio reaches the Whisper AI model.
							</p>
							<div className="text-xs text-base-content/60 space-y-2">
								<div><strong>Command Structure:</strong></div>
								<div className="font-mono bg-base-300 p-3 rounded text-xs break-all">
									ffmpeg -i input.wav -ar 16000 -ac 1 -c:a pcm_s16le [your_options] output.wav
								</div>
								<div className="mt-3"><strong>Common Examples:</strong></div>
								<div className="bg-base-300 p-3 rounded space-y-1">
									<div className="font-mono text-xs flex items-start gap-2">
										<span>•</span>
										<div>
											<span className="text-primary font-semibold">-af loudnorm=I=-16:TP=-1.5:LRA=11</span>
											<div className="text-base-content/60">Normalize audio loudness levels</div>
										</div>
									</div>
									<div className="font-mono text-xs flex items-start gap-2">
										<span>•</span>
										<div>
											<span className="text-primary font-semibold">-af highpass=f=200</span>
											<div className="text-base-content/60">Remove low frequency noise</div>
										</div>
									</div>
									<div className="font-mono text-xs flex items-start gap-2">
										<span>•</span>
										<div>
											<span className="text-primary font-semibold">-af &quot;volume=2.0&quot;</span>
											<div className="text-base-content/60">Increase volume by 2x</div>
										</div>
									</div>
									<div className="font-mono text-xs flex items-start gap-2">
										<span>•</span>
										<div>
											<span className="text-primary font-semibold">-ss 00:01:00 -to 00:05:00</span>
											<div className="text-base-content/60">Trim audio from 1min to 5min</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Audio Processing Options */}
						<SectionHeader 
							title="Audio Processing" 
							description="Configure audio preprocessing and enhancement options"
						/>
						
						<div className="space-y-0">
							<OptionRow 
								label="Normalize Loudness"
								tooltip="Enable automatic loudness normalization. This applies the loudnorm filter to standardize audio levels before transcription."
								impact="quality"
							>
								<input
									type="checkbox"
									className="toggle toggle-primary toggle-sm"
									checked={preference.ffmpegOptions.normalize_loudness}
									onChange={(e) => preference.setFfmpegOptions({ ...preference.ffmpegOptions, normalize_loudness: e.target.checked })}
								/>
							</OptionRow>

							<OptionRow 
								label="Custom FFmpeg Command"
								tooltip="Enter custom FFmpeg options to insert into the command. Use when you need specific audio processing beyond normalize loudness. Leave empty to use default processing."
								impact="both"
							>
								<input
									value={preference.ffmpegOptions.custom_command ?? ''}
									onChange={(e) =>
										preference.setFfmpegOptions({ ...preference.ffmpegOptions, custom_command: e.target.value ? e.target.value : null })
									}
									className="input input-bordered input-sm w-80"
									placeholder={preference.ffmpegOptions.normalize_loudness ? '-af loudnorm=I=-16:TP=-1.5:LRA=11' : 'e.g. -af highpass=f=200'}
									type="text"
								/>
							</OptionRow>
						</div>

						{/* Usage Tips */}
						<div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
							<div className="flex items-start gap-3">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5 text-info mt-0.5">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								<div className="text-sm">
									<div className="font-semibold text-info mb-2">Usage Guidelines</div>
									<div className="space-y-1 text-base-content/80">
										<div><strong>Normalize Loudness:</strong> Recommended for consistent audio levels across different files</div>
										<div><strong>Custom Command:</strong> For advanced audio processing like noise reduction, filtering, or trimming</div>
										<div><strong>Priority:</strong> Custom command takes precedence over normalize loudness if both are set</div>
									</div>
								</div>
							</div>
						</div>

						{/* Save indicator */}
						<div className="text-center py-4 mt-6">
							<p className="text-sm opacity-60">
								Settings are automatically saved
							</p>
						</div>
					</div>
				)}

			</MainContent>
		</Layout>
	)
}