export const modelsDocURL = 'https://huggingface.co/ggerganov/whisper.cpp/tree/main'
export const storeFilename = 'app_config.json'

export const embeddingModelFilename = 'wespeaker_en_voxceleb_CAM++.onnx'
export const segmentModelFilename = 'segmentation-3.0.onnx'

export const llmApiKeyUrl = 'https://console.anthropic.com/settings/keys'
export const llmDefaultMaxTokens = 8192 // https://docs.anthropic.com/en/docs/about-claude/models
export const llmLimitsUrl = 'https://console.anthropic.com/settings/limits'
export const llmCostUrl = 'https://console.anthropic.com/settings/cost'

export const ytDlpVersion = '2025.01.150'
export const ytDlpConfig = {
	windows: {
		url: 'https://github.com/yt-dlp/yt-dlp/releases/download/2025.01.15/yt-dlp.exe', // signed with self certificate. better than nothing
		name: 'yt-dlp.exe',
	},
	linux: {
		url: 'https://github.com/yt-dlp/yt-dlp/releases/download/2025.01.15/yt-dlp_linux',
		name: 'yt-dlp_linux',
	},
	macos: {
		// Universal binary
		url: 'https://github.com/yt-dlp/yt-dlp/releases/download/2025.01.15/yt-dlp_macos',
		name: 'yt-dlp_macos',
	},
}

export const videoExtensions = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'webm']
export const audioExtensions = ['mp3', 'wav', 'aac', 'flac', 'oga', 'ogg', 'opic', 'opus', 'm4a']
export const themes = ['light', 'dark']
