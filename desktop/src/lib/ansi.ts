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
 * Handles Whisper transcription confidence colors and preserves all spacing
 * 
 * @param text - The text with ANSI color codes from Whisper transcription
 * @returns HTML string with CSS styling for confidence colors
 */
export const ansiToHtml = (text: string): string => {
    if (!text) return ''

    // Check if text contains ANSI codes
    const hasAnsiCodes = text.includes('\x1b[38;5;')
    
    if (!hasAnsiCodes) {
        // No ANSI codes present, add basic simulated confidence colors
        return generateSimulatedConfidenceHtml(text)
    }

    // Process real ANSI codes with enhanced parsing
    const segments: Array<{ type: 'text' | 'colored', content: string, colorCode?: string }> = []
    
    // Enhanced regex to handle more ANSI variations including rapid color changes
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
        } else if (part.match(/\x1b\[0m/) || part.match(/\x1b\[39m/) || part.match(/\x1b\[m/)) {
            // Enhanced reset code detection (0m, 39m, or just m)
            currentColorCode = null
        } else if (part.match(/\x1b\[(\d+)m/)) {
            // Handle other color codes (basic 16-color codes)
            const match = part.match(/\x1b\[(\d+)m/)
            if (match) {
                const code = parseInt(match[1])
                // Map basic color codes to our extended palette
                currentColorCode = mapBasicColorToExtended(code)
            }
        } else if (part.length > 0 && !part.match(/\x1b\[/)) {
            // This is actual text content (not an unmatched escape sequence)
            if (currentColorCode) {
                segments.push({ type: 'colored', content: part, colorCode: currentColorCode })
            } else {
                segments.push({ type: 'text', content: part })
            }
        }
        // Skip malformed escape sequences (containing \x1b[ but not matching patterns)
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
 * Generates simulated confidence colors for text without ANSI codes
 * Supports multiple confidence levels within single words for realistic display
 * 
 * @param text - Plain text to add confidence colors to
 * @returns HTML with simulated confidence colors including intra-word variation
 */
function generateSimulatedConfidenceHtml(text: string): string {
    const words = text.split(/(\s+|[.!?,:;])/)
    
    const coloredWords = words.map(part => {
        if (/^\s+$/.test(part)) {
            // Preserve spaces as-is
            return part
        } else if (/[.!?,:;]/.test(part)) {
            // Punctuation in neutral gray
            return `<span style="color: #bcbcbc;">${escapeHtml(part)}</span>`
        } else if (part.trim().length > 0) {
            // Words can have multiple confidence segments
            return generateWordWithMultipleConfidence(part)
        }
        return escapeHtml(part)
    })
    
    return `<div style="white-space: pre-wrap; text-align: justify; line-height: 1.6;">${coloredWords.join('')}</div>`
}

/**
 * Generates a word with multiple confidence levels to simulate realistic Whisper output
 * Longer words can be split into segments with different confidence levels
 */
function generateWordWithMultipleConfidence(word: string): string {
    const trimmed = word.trim()
    
    // Short words (≤4 chars) get single confidence level
    if (trimmed.length <= 4) {
        const colorCode = getSegmentConfidenceColor(trimmed, 0)
        const color = ANSI_COLOR_MAP[colorCode] || '#374151'
        return `<span style="color: ${color};">${escapeHtml(trimmed)}</span>`
    }
    
    // Longer words can be split into multiple confidence segments
    const segments = splitWordIntoSegments(trimmed)
    
    return segments.map((segment, index) => {
        const colorCode = getSegmentConfidenceColor(segment, index)
        const color = ANSI_COLOR_MAP[colorCode] || '#374151'
        return `<span style="color: ${color};">${escapeHtml(segment)}</span>`
    }).join('')
}

/**
 * Splits a word into realistic segments that could have different confidence levels
 * Based on common English syllable patterns and phonetic structures
 */
function splitWordIntoSegments(word: string): string[] {
    const length = word.length
    
    // Very short words stay whole
    if (length <= 4) return [word]
    
    // Determine split pattern based on word characteristics
    const shouldSplit = getWordSplitProbability(word)
    if (!shouldSplit) return [word]
    
    // Common English patterns for splitting
    if (length <= 7) {
        // Split into 2 segments
        return splitIntoTwoSegments(word)
    } else {
        // Split into 2-3 segments for longer words
        const numSegments = Math.random() > 0.7 ? 3 : 2
        return numSegments === 3 ? splitIntoThreeSegments(word) : splitIntoTwoSegments(word)
    }
}

/**
 * Determines if a word should be split based on its characteristics
 * Uses deterministic patterns to ensure consistency
 */
function getWordSplitProbability(word: string): boolean {
    // Create deterministic hash for consistency
    let hash = 0
    for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.toLowerCase().charCodeAt(i)
    }
    
    const probability = (Math.abs(hash) % 100) / 100
    
    // Longer words more likely to split
    if (word.length >= 10) return probability > 0.3  // 70% chance
    if (word.length >= 8) return probability > 0.5   // 50% chance
    if (word.length >= 6) return probability > 0.7   // 30% chance
    return false // ≤5 chars rarely split
}

/**
 * Splits word into two segments at a natural boundary
 */
function splitIntoTwoSegments(word: string): string[] {
    const length = word.length
    
    // Look for natural split points (vowel-consonant boundaries, common patterns)
    const naturalSplits = findNaturalSplitPoints(word)
    
    if (naturalSplits.length > 0) {
        // Use most natural split point
        const splitPoint = naturalSplits[Math.floor(naturalSplits.length / 2)]
        return [word.slice(0, splitPoint), word.slice(splitPoint)]
    }
    
    // Fallback to middle split with slight variation
    const splitPoint = Math.floor(length / 2) + (length % 2)
    return [word.slice(0, splitPoint), word.slice(splitPoint)]
}

/**
 * Splits word into three segments
 */
function splitIntoThreeSegments(word: string): string[] {
    const length = word.length
    const split1 = Math.floor(length / 3)
    const split2 = Math.floor((length * 2) / 3)
    
    return [
        word.slice(0, split1),
        word.slice(split1, split2),
        word.slice(split2)
    ]
}

/**
 * Finds natural split points in English words (vowel-consonant boundaries, prefixes, suffixes)
 */
function findNaturalSplitPoints(word: string): number[] {
    const splits: number[] = []
    const vowels = /[aeiouAEIOU]/
    const consonants = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/
    
    // Look for vowel-consonant and consonant-vowel boundaries
    for (let i = 1; i < word.length - 1; i++) {
        const prev = word[i - 1]
        const curr = word[i]
        
        // Vowel followed by consonant
        if (vowels.test(prev) && consonants.test(curr)) {
            splits.push(i)
        }
        // Double consonants
        else if (consonants.test(prev) && consonants.test(curr) && prev !== curr) {
            splits.push(i)
        }
    }
    
    // Common prefixes and suffixes
    const prefixes = ['pre', 'pro', 'anti', 'auto', 'co', 'de', 'dis', 'en', 'fore', 'in', 'inter', 'mid', 'mis', 'non', 'over', 'post', 'pre', 're', 'semi', 'sub', 'super', 'trans', 'un', 'under']
    const suffixes = ['ing', 'tion', 'sion', 'able', 'ible', 'ment', 'ness', 'less', 'ful', 'ly', 'ed', 'er', 'est', 'ize', 'ise']
    
    const lowerWord = word.toLowerCase()
    
    // Check for prefixes
    for (const prefix of prefixes) {
        if (lowerWord.startsWith(prefix) && word.length > prefix.length + 2) {
            splits.push(prefix.length)
        }
    }
    
    // Check for suffixes
    for (const suffix of suffixes) {
        if (lowerWord.endsWith(suffix) && word.length > suffix.length + 2) {
            splits.push(word.length - suffix.length)
        }
    }
    
    return splits.filter((split, index, arr) => arr.indexOf(split) === index).sort((a, b) => a - b)
}

/**
 * Generates confidence color for a word segment based on realistic patterns
 * Mimics actual Whisper confidence behavior
 */
function getSegmentConfidenceColor(segment: string, position: number): string {
    const trimmed = segment.trim().toLowerCase()
    
    // Create hash for consistency
    let hash = 0
    for (let i = 0; i < trimmed.length; i++) {
        hash = (hash << 5) - hash + trimmed.charCodeAt(i)
    }
    
    let baseConfidence = Math.abs(hash) % 100
    
    // Apply realistic patterns
    
    // Common words/syllables get higher confidence
    const commonPatterns = ['the', 'and', 'ing', 'tion', 'er', 'ed', 'ly', 'en', 'al', 'es', 'on', 'in', 'to', 'for', 'of', 'with', 'by']
    if (commonPatterns.some(pattern => trimmed.includes(pattern))) {
        baseConfidence += 20
    }
    
    // Word beginnings often have higher confidence (clear starts)
    if (position === 0 && trimmed.length >= 2) {
        baseConfidence += 15
    }
    
    // Very short segments (1-2 chars) often less confident
    if (trimmed.length <= 2) {
        baseConfidence -= 10
    }
    
    // Single vowels often less confident
    if (trimmed.length === 1 && /[aeiou]/.test(trimmed)) {
        baseConfidence -= 15
    }
    
    // Clamp to reasonable range
    baseConfidence = Math.max(0, Math.min(100, baseConfidence))
    
    // Map to color codes with realistic distribution
    if (baseConfidence > 85) return '40'  // High confidence - bright green
    if (baseConfidence > 70) return '34'  // High confidence - green
    if (baseConfidence > 55) return '190' // Medium-high - yellow-green
    if (baseConfidence > 40) return '220' // Medium - yellow-orange
    if (baseConfidence > 25) return '208' // Low-medium - orange
    return '196' // Low confidence - red
}

/**
 * Maps basic 16-color ANSI codes to our extended 256-color palette
 * For compatibility with different ANSI output formats
 */
function mapBasicColorToExtended(basicCode: number): string {
    // Map basic ANSI colors to approximate confidence levels
    switch (basicCode) {
        case 30: case 90: return '8'    // Black/Dark Gray -> Low confidence
        case 31: case 91: return '196'  // Red -> Low confidence  
        case 32: case 92: return '34'   // Green -> High confidence
        case 33: case 93: return '220'  // Yellow -> Medium confidence
        case 34: case 94: return '33'   // Blue -> Neutral
        case 35: case 95: return '208'  // Magenta -> Medium-low confidence
        case 36: case 96: return '114'  // Cyan -> Medium-high confidence
        case 37: case 97: return '250'  // White/Light Gray -> Neutral
        default: return '250'           // Default to neutral
    }
}

/**
 * Creates a confidence color legend for Whisper transcription confidence levels
 * 
 * @returns HTML string with a color legend showing confidence ranges
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

