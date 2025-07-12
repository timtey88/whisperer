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
 * Properly handles text before first color code and preserves all spacing
 * 
 * @param text - The text with ANSI color codes
 * @returns HTML string with CSS styling for colors
 */
export const ansiToHtml = (text: string): string => {
    if (!text) return ''

    // First, split the text into segments based on ANSI codes
    const segments: Array<{ type: 'text' | 'colored', content: string, colorCode?: string }> = []
    
    // Split by any ANSI escape sequence to preserve exact structure
    const parts = text.split(/(\x1b\[[0-9;]*m)/)
    
    let currentColorCode: string | null = null
    let i = 0
    
    while (i < parts.length) {
        const part = parts[i]
        
        if (part.match(/\x1b\[38;5;(\d+)m/)) {
            // This is a color start code
            const match = part.match(/\x1b\[38;5;(\d+)m/)
            if (match) {
                currentColorCode = match[1]
            }
        } else if (part === '\x1b[0m') {
            // This is a reset code
            currentColorCode = null
        } else if (part.length > 0) {
            // This is actual text content
            if (currentColorCode) {
                segments.push({ type: 'colored', content: part, colorCode: currentColorCode })
            } else {
                segments.push({ type: 'text', content: part })
            }
        }
        i++
    }
    
    // Convert segments to HTML
    const htmlParts = segments.map(segment => {
        const escapedText = escapeHtml(segment.content)
        
        if (segment.type === 'colored' && segment.colorCode) {
            const color = ANSI_COLOR_MAP[segment.colorCode] || '#374151'
            return `<span style="color: ${color};">${escapedText}</span>`
        } else {
            // Default color for uncolored text
            return `<span style="color: #374151;">${escapedText}</span>`
        }
    })

    return `<div style="white-space: pre-wrap; text-align: justify; line-height: 1.6;">${htmlParts.join('')}</div>`
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
 * This simulates realistic Whisper output with ANSI color codes,
 * including words split into multiple confidence levels
 * 
 * @param plainText - Plain text to add mock confidence colors to
 * @returns Text with ANSI color codes showing realistic confidence patterns
 */
export const createMockConfidenceText = (plainText: string): string => {
    if (!plainText) return ''

    const result: string[] = []
    
    // Process character by character to create realistic patterns
    let i = 0
    while (i < plainText.length) {
        const char = plainText[i]
        
        if (char === ' ') {
            // Spaces are usually neutral
            result.push(char)
            i++
        } else if (/[.!?,:;]/.test(char)) {
            // Punctuation is usually neutral/gray
            result.push(`\x1b[38;5;250m${char}\x1b[0m`)
            i++
        } else if (/[a-zA-Z]/.test(char)) {
            // Process words with varying confidence levels
            const wordStart = i
            let wordEnd = i
            
            // Find the end of the current word
            while (wordEnd < plainText.length && /[a-zA-Z0-9']/.test(plainText[wordEnd])) {
                wordEnd++
            }
            
            const word = plainText.slice(wordStart, wordEnd)
            const coloredWord = createWordWithVariableConfidence(word)
            result.push(coloredWord)
            
            i = wordEnd
        } else {
            // Numbers and other characters
            const rand = Math.random()
            let colorCode: string
            
            if (rand > 0.7) colorCode = '34' // High confidence
            else if (rand > 0.4) colorCode = '220' // Medium confidence
            else colorCode = '208' // Lower confidence
            
            result.push(`\x1b[38;5;${colorCode}m${char}\x1b[0m`)
            i++
        }
    }
    
    return result.join('')
}

/**
 * Creates realistic confidence patterns within a single word
 * Simulates how Whisper might have different confidence levels for different parts of a word
 * 
 * @param word - The word to add confidence colors to
 * @returns Word with ANSI color codes for different parts
 */
function createWordWithVariableConfidence(word: string): string {
    if (word.length <= 3) {
        // Short words get single confidence level
        const colorCode = getRandomConfidenceColor()
        return `\x1b[38;5;${colorCode}m${word}\x1b[0m`
    }
    
    // Longer words can be split into multiple confidence levels
    const shouldSplit = Math.random() > 0.6 // 40% chance to split word
    
    if (!shouldSplit) {
        const colorCode = getRandomConfidenceColor()
        return `\x1b[38;5;${colorCode}m${word}\x1b[0m`
    }
    
    // Split word into 2-3 parts with different confidence levels
    const parts: string[] = []
    const numParts = Math.random() > 0.7 ? 3 : 2
    
    if (numParts === 2) {
        const splitPoint = Math.floor(word.length / 2) + Math.floor(Math.random() * 2) - 1
        const part1 = word.slice(0, splitPoint)
        const part2 = word.slice(splitPoint)
        
        const color1 = getRandomConfidenceColor()
        const color2 = getRandomConfidenceColor()
        
        parts.push(`\x1b[38;5;${color1}m${part1}\x1b[0m`)
        parts.push(`\x1b[38;5;${color2}m${part2}\x1b[0m`)
    } else {
        // Split into 3 parts
        const split1 = Math.floor(word.length / 3)
        const split2 = Math.floor((word.length * 2) / 3)
        
        const part1 = word.slice(0, split1)
        const part2 = word.slice(split1, split2)
        const part3 = word.slice(split2)
        
        const color1 = getRandomConfidenceColor()
        const color2 = getRandomConfidenceColor()
        const color3 = getRandomConfidenceColor()
        
        parts.push(`\x1b[38;5;${color1}m${part1}\x1b[0m`)
        parts.push(`\x1b[38;5;${color2}m${part2}\x1b[0m`)
        parts.push(`\x1b[38;5;${color3}m${part3}\x1b[0m`)
    }
    
    return parts.join('')
}

/**
 * Returns a random confidence color code based on realistic distribution
 * Higher confidence levels are more common than lower ones
 */
function getRandomConfidenceColor(): string {
    const rand = Math.random()
    
    // Weight higher confidence colors more heavily (realistic for most transcriptions)
    if (rand > 0.85) return '40'   // High confidence - bright green (15%)
    if (rand > 0.7) return '34'    // High confidence - green (15%)
    if (rand > 0.5) return '190'   // Medium-high - yellow-green (20%)
    if (rand > 0.3) return '220'   // Medium - yellow-orange (20%)
    if (rand > 0.15) return '208'  // Low-medium - orange (15%)
    return '196'                   // Low confidence - red (15%)
}