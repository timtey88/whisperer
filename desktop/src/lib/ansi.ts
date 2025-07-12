// Confidence color mapping based on ANSI color codes from Whisper output
// Organized by confidence level ranges
const ANSI_COLOR_MAP: Record<string, string> = {
    // 🔴 Low Confidence (0.0-0.6)
    '160': '#d70000', // Red (~0.50)
    '196': '#ff0000', // Bright Red (~0.55)
    '166': '#d75f00', // Dark Orange (~0.60)

    // 🟠 Medium Confidence (0.6-0.8)
    '208': '#ff8700', // Orange (~0.70)
    '215': '#ffaf5f', // Light Orange (~0.75)
    '220': '#ffd700', // Yellow-Orange (~0.78)

    // 🟡 Medium-High Confidence (0.8-0.9)
    '190': '#dfff00', // Yellow-Green (~0.82)
    '114': '#87d787', // Green-Cyan (~0.88)

    // 🟢 High Confidence (0.9-1.0)
    '71': '#5faf5f', // Light Green (~0.92)
    '34': '#00af00', // Green (~0.95)
    '40': '#00d700', // Bright Green (~0.97)

    // 🟣🔵 Neutral/Informational (Varies)
    '250': '#bcbcbc', // Gray (Neutral/filler)
    '33': '#0087ff', // Blue (Metadata or tags)
    '8': '#808080', // Dark Gray (Silent or skipped)

    // Additional colors that might be in the output
    '226': '#ffff00', // Yellow
    '214': '#ffaf00', // Dark orange
    '227': '#ffff5f', // Light yellow
    '35': '#00af5f', // Spring green
    '46': '#00ff00', // Lime green
    '70': '#5faf00', // Olive green
}

/**
 * Escapes HTML characters to prevent XSS attacks
 * 
 * @param str - The string to escape
 * @returns HTML-escaped string
 */
const escapeHtml = (str: string): string =>
    str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

/**
 * Converts ANSI color codes in text to HTML with CSS styling
 * 
 * @param text - The text with ANSI color codes
 * @returns HTML string with CSS styling for colors
 */
export const ansiToHtml = (text: string): string => {
    if (!text) return ''

    // Match sequences like: \x1b[38;5;166m text \x1b[0m
    const regex = /\x1b\[38;5;(\d+)m([\s\S]*?)(?=\x1b\[38;5;|\x1b\[0m|$)/g
    const htmlParts: string[] = []

    let match
    while ((match = regex.exec(text)) !== null) {
        const [_, colorCode, content] = match
        const color = ANSI_COLOR_MAP[colorCode] || '#ffffff'
        const escapedText = escapeHtml(content)
        htmlParts.push(`<span style="color: ${color};">${escapedText}</span>`)
    }

    // Clean up any leftover control codes
    const html = htmlParts.join('').replace(/\x1b\[[0-9;]*m/g, '')

    return `<div style="white-space: pre-wrap; text-align: justify;">${html}</div>`
}

/**
 * Creates a confidence color legend for the ANSI colors
 * 
 * @returns HTML string with a color legend
 */
export const getConfidenceLegend = (): string => {
    return `
    <div class="flex flex-col space-y-1 text-xs mb-4 p-3 bg-base-200 rounded-lg">
        <h4 class="font-semibold text-sm mb-2">Confidence Color Legend</h4>
        <div class="flex items-center">
            <span class="w-4 h-4 mr-2 rounded" style="background-color: #00af00;"></span>
            <span>High confidence (0.90–1.00)</span>
        </div>
        <div class="flex items-center">
            <span class="w-4 h-4 mr-2 rounded" style="background-color: #dfff00;"></span>
            <span>Medium-high confidence (0.80–0.89)</span>
        </div>
        <div class="flex items-center">
            <span class="w-4 h-4 mr-2 rounded" style="background-color: #ffaf5f;"></span>
            <span>Medium confidence (0.60–0.79)</span>
        </div>
        <div class="flex items-center">
            <span class="w-4 h-4 mr-2 rounded" style="background-color: #ff0000;"></span>
            <span>Low confidence (0.00–0.59)</span>
        </div>
        <div class="flex items-center">
            <span class="w-4 h-4 mr-2 rounded" style="background-color: #bcbcbc;"></span>
            <span>Neutral / Informational (punctuation, metadata)</span>
        </div>
    </div>
    `
}

/**
 * Creates a mock confidence-colored text for testing purposes
 * This simulates what Whisper might output with ANSI color codes
 * 
 * @param plainText - Plain text to add mock confidence colors to
 * @returns Text with ANSI color codes
 */
export const createMockConfidenceText = (plainText: string): string => {
    if (!plainText) return ''

    // Split by words and add random confidence colors
    const words = plainText.split(' ')
    const coloredWords = words.map(word => {
        // Randomly assign confidence levels for demo
        const rand = Math.random()
        let colorCode: string
        
        if (rand > 0.9) colorCode = '40' // High confidence - bright green
        else if (rand > 0.8) colorCode = '34' // High confidence - green  
        else if (rand > 0.7) colorCode = '190' // Medium-high - yellow-green
        else if (rand > 0.6) colorCode = '220' // Medium - yellow-orange
        else if (rand > 0.4) colorCode = '208' // Low-medium - orange
        else colorCode = '196' // Low confidence - red

        return `\x1b[38;5;${colorCode}m${word}\x1b[0m`
    })

    return coloredWords.join(' ')
}