export interface WhisperOptionInfo {
	name: string
	description: string
	impact: 'performance' | 'quality' | 'both'
	tip: string
}

export interface WhisperTip {
	category: string
	title: string
	description: string
	icon: string
}

export const whisperOptions: Record<string, WhisperOptionInfo> = {
	temperature: {
		name: 'Temperature',
		description: 'Controls randomness in transcription. Lower values (0-0.2) are more deterministic and accurate, while higher values add creativity but may reduce accuracy.',
		impact: 'both',
		tip: 'Use 0 for maximum accuracy, 0.2-0.8 for creative tasks'
	},
	beam_size: {
		name: 'Beam Search',
		description: 'Number of alternative sequences to consider. Higher values improve accuracy but increase processing time. Only active when temperature is 0.',
		impact: 'both',
		tip: 'Increase beam size (5-10) for better accuracy on important content'
	},
	best_of: {
		name: 'Best Of',
		description: 'Number of candidates to generate when using temperature sampling. More candidates improve quality but take longer to process.',
		impact: 'both',
		tip: 'Higher values (5-10) improve transcription quality for challenging audio'
	},
	word_timestamps: {
		name: 'Word Timestamps',
		description: 'Extract precise timing for each word. Enables advanced features like highlighting and better subtitle formatting.',
		impact: 'performance',
		tip: 'Enable for subtitles and precise timing, disable for faster processing'
	},
	language: {
		name: 'Language Detection',
		description: 'Specify the spoken language or use auto-detection. Setting the correct language improves accuracy significantly.',
		impact: 'quality',
		tip: 'Always specify language when known for best results'
	},
	translate: {
		name: 'Translation Mode',
		description: 'Translate non-English speech directly to English instead of transcribing in original language.',
		impact: 'quality',
		tip: 'Use for foreign content when you need English output'
	},
	n_threads: {
		name: 'CPU Threads',
		description: 'Number of CPU threads used for processing. More threads can speed up transcription on multi-core systems.',
		impact: 'performance',
		tip: 'Set to number of CPU cores for optimal performance'
	},
	max_text_ctx: {
		name: 'Text Context',
		description: 'Maximum number of previous tokens to consider for context. Larger context improves coherence but uses more memory.',
		impact: 'both',
		tip: 'Increase for better context understanding in long audio'
	},
	init_prompt: {
		name: 'Initial Prompt',
		description: 'Text prompt to guide the transcription style and context. Helps with specialized vocabulary and formatting.',
		impact: 'quality',
		tip: 'Use technical terms or names that might appear in your audio'
	}
}

export const whisperTips: WhisperTip[] = [
	{
		category: 'Performance',
		title: 'GPU Acceleration',
		description: 'Enable GPU processing in settings for 2-5x faster transcription on supported hardware.',
		icon: '⚡'
	},
	{
		category: 'Languages',
		title: 'Language Specification',
		description: 'Whisper supports 100+ languages. Specifying the language improves accuracy by 10-15%.',
		icon: '🌍'
	},
	{
		category: 'Models',
		title: 'Model Size Trade-offs',
		description: 'Larger models (large-v3) are more accurate but slower. Choose based on your speed vs quality needs.',
		icon: '🎯'
	},
	{
		category: 'Features',
		title: 'Word-Level Timestamps',
		description: 'Enable word timestamps for precise subtitle timing and word-level highlighting features.',
		icon: '⏱️'
	},
	{
		category: 'Quality',
		title: 'Temperature Settings',
		description: 'Use temperature 0 for deterministic results, or 0.2-0.6 for more natural transcriptions.',
		icon: '🌡️'
	}
]

export function getModelInfo(modelPath: string | null): { name: string; size: string; description: string } {
	if (!modelPath) {
		return { name: 'No Model Selected', size: 'Unknown', description: 'Please select a model in settings' }
	}

	const fileName = modelPath.split('/').pop() || modelPath
	
	if (fileName.includes('tiny')) {
		return { 
			name: 'Tiny Model', 
			size: '~65MB', 
			description: 'Fastest processing, basic accuracy. Good for quick transcription.' 
		}
	} else if (fileName.includes('base')) {
		return { 
			name: 'Base Model', 
			size: '~140MB', 
			description: 'Balanced speed and accuracy. Recommended for most users.' 
		}
	} else if (fileName.includes('small')) {
		return { 
			name: 'Small Model', 
			size: '~480MB', 
			description: 'Good accuracy with reasonable speed. Great for important content.' 
		}
	} else if (fileName.includes('medium')) {
		return { 
			name: 'Medium Model', 
			size: '~1.5GB', 
			description: 'High accuracy, slower processing. Ideal for professional transcription.' 
		}
	} else if (fileName.includes('large')) {
		return { 
			name: 'Large Model', 
			size: '~3GB', 
			description: 'Best accuracy available. Recommended for critical transcriptions.' 
		}
	} else if (fileName.includes('turbo')) {
		return { 
			name: 'Turbo Model', 
			size: '~800MB', 
			description: 'Optimized for speed while maintaining good accuracy.' 
		}
	}

	return { 
		name: 'Custom Model', 
		size: 'Unknown', 
		description: 'User-provided model with custom configuration.' 
	}
}

export function getLanguageDisplayName(langCode: string): string {
	const languageMap: Record<string, string> = {
		'en': 'English',
		'es': 'Spanish',
		'fr': 'French',
		'de': 'German',
		'it': 'Italian',
		'pt': 'Portuguese',
		'ru': 'Russian',
		'ja': 'Japanese',
		'ko': 'Korean',
		'zh': 'Chinese',
		'ar': 'Arabic',
		'hi': 'Hindi',
		'auto': 'Auto-Detect'
	}
	
	return languageMap[langCode] || langCode.toUpperCase()
}

export function getProcessingPhases(): { phase: string; description: string; typical_duration: string }[] {
	return [
		{
			phase: 'Loading Model',
			description: 'Loading Whisper model into memory and initializing GPU if enabled',
			typical_duration: '2-10 seconds'
		},
		{
			phase: 'Audio Processing',
			description: 'Converting audio format and extracting features for transcription',
			typical_duration: '1-5 seconds'
		},
		{
			phase: 'Transcribing',
			description: 'Running AI inference to generate transcript from audio features',
			typical_duration: '10-50% of audio length'
		},
		{
			phase: 'Post-Processing',
			description: 'Formatting transcript, applying timestamps, and finalizing output',
			typical_duration: '1-3 seconds'
		}
	]
}

export function formatFileSize(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB']
	let size = bytes
	let unitIndex = 0
	
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex++
	}
	
	return `${size.toFixed(1)} ${units[unitIndex]}`
}

export function estimateProcessingTime(
	audioDurationSeconds: number, 
	modelName: string, 
	useGpu: boolean
): string {
	const baseMultiplier = useGpu ? 0.1 : 0.3 // GPU is roughly 3x faster
	
	let modelMultiplier = 1
	if (modelName.includes('tiny')) modelMultiplier = 0.5
	else if (modelName.includes('base')) modelMultiplier = 0.8
	else if (modelName.includes('small')) modelMultiplier = 1.0
	else if (modelName.includes('medium')) modelMultiplier = 1.5
	else if (modelName.includes('large')) modelMultiplier = 2.0
	else if (modelName.includes('turbo')) modelMultiplier = 0.6
	
	const estimatedSeconds = audioDurationSeconds * baseMultiplier * modelMultiplier
	
	if (estimatedSeconds < 60) {
		return `~${Math.ceil(estimatedSeconds)} seconds`
	} else {
		const minutes = Math.ceil(estimatedSeconds / 60)
		return `~${minutes} minute${minutes > 1 ? 's' : ''}`
	}
}