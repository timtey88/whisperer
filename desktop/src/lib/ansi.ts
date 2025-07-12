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

    // Check if text contains ANSI codes
    const hasAnsiCodes = text.includes('\x1b[38;5;')
    
    if (!hasAnsiCodes) {
        // No ANSI codes present, add basic simulated confidence colors
        return generateSimulatedConfidenceHtml(text)
    }

    // Match sequences like: \x1b[38;5;166m text \x1b[0m
    const regex = /\x1b\[38;5;(\d+)m([\s\S]*?)(?=\x1b\[38;5;|\x1b\[0m|$)/g
    const htmlParts: string[] = []

    let match
    while ((match = regex.exec(text)) !== null) {
        const [_, colorCode, content] = match
        const color = ANSI_COLOR_MAP[colorCode] || '#374151'
        const escapedText = escapeHtml(content)
        
        // Enhanced styling with subtle text shadow and improved readability
        htmlParts.push(`<span style="
            color: ${color};
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0,0,0,0.05);
            transition: all 0.1s ease;
        ">${escapedText}</span>`)
    }

    // Clean up any leftover control codes
    const html = htmlParts.join('').replace(/\x1b\[[0-9;]*m/g, '')

    return `<div style="
        white-space: pre-wrap; 
        text-align: justify; 
        line-height: 1.8;
        letter-spacing: 0.2px;
        word-spacing: 1px;
        hyphens: auto;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    ">${html}</div>`
}

/**
 * Generates simulated confidence colors for text without ANSI codes
 * Simple word-level coloring for demonstration purposes
 * 
 * @param text - Plain text to add confidence colors to
 * @returns HTML with simulated confidence colors
 */
function generateSimulatedConfidenceHtml(text: string): string {
    const words = text.split(/(\s+|[.!?,:;])/)
    
    const coloredWords = words.map(part => {
        if (/^\s+$/.test(part)) {
            // Preserve spaces as-is
            return part
        } else if (/[.!?,:;]/.test(part)) {
            // Punctuation in neutral gray with enhanced styling
            return `<span style="
                color: #bcbcbc;
                font-weight: 400;
                text-shadow: 0 1px 2px rgba(0,0,0,0.05);
            ">${escapeHtml(part)}</span>`
        } else if (part.trim().length > 0) {
            // Words get consistent confidence colors based on their content
            const colorCode = getWordConfidenceColor(part)
            const color = ANSI_COLOR_MAP[colorCode] || '#374151'
            return `<span style="
                color: ${color};
                font-weight: 500;
                text-shadow: 0 1px 2px rgba(0,0,0,0.05);
                transition: all 0.1s ease;
            ">${escapeHtml(part)}</span>`
        }
        return escapeHtml(part)
    })
    
    return `<div style="
        white-space: pre-wrap; 
        text-align: justify; 
        line-height: 1.8;
        letter-spacing: 0.2px;
        word-spacing: 1px;
        hyphens: auto;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    ">${coloredWords.join('')}</div>`
}

/**
 * Generates a consistent confidence color for a word based on its characteristics
 * Uses simple heuristics to assign colors consistently
 */
function getWordConfidenceColor(word: string): string {
    const trimmed = word.trim().toLowerCase()
    
    // Simple hash-like function for consistency
    let hash = 0
    for (let i = 0; i < trimmed.length; i++) {
        hash = (hash << 5) - hash + trimmed.charCodeAt(i)
        hash = hash & hash // Convert to 32-bit integer
    }
    
    const absHash = Math.abs(hash)
    const confidence = absHash % 100
    
    // Distribute colors based on word characteristics and hash
    if (confidence > 85 || trimmed.length <= 3) return '40' // High confidence - short words or high hash
    if (confidence > 70) return '34' // High confidence - green
    if (confidence > 50) return '190' // Medium-high - yellow-green  
    if (confidence > 30) return '220' // Medium - yellow-orange
    if (confidence > 15) return '208' // Low-medium - orange
    return '196' // Low confidence - red
}

/**
 * Generates ANSI color codes for text using the same confidence logic as HTML version
 * 
 * @param text - Plain text to add ANSI color codes to
 * @returns Text with ANSI escape sequences for colors
 */
export const addAnsiCodes = (text: string): string => {
    if (!text) return ''

    // Check if text already contains ANSI codes
    const hasAnsiCodes = text.includes('\x1b[38;5;')
    
    if (hasAnsiCodes) {
        // Text already has ANSI codes, return as-is
        return text
    }

    // Add ANSI codes using same logic as generateSimulatedConfidenceHtml
    const words = text.split(/(\s+|[.!?,:;])/)
    
    const coloredWords = words.map(part => {
        if (/^\s+$/.test(part)) {
            // Preserve spaces as-is
            return part
        } else if (/[.!?,:;]/.test(part)) {
            // Punctuation in neutral gray (250)
            return `\x1b[38;5;250m${part}\x1b[0m`
        } else if (part.trim().length > 0) {
            // Words get consistent confidence colors based on their content
            const colorCode = getWordConfidenceColor(part)
            return `\x1b[38;5;${colorCode}m${part}\x1b[0m`
        }
        return part
    })
    
    return coloredWords.join('')
}

/**
 * Creates a modern, compact confidence color legend for Whisper transcription confidence levels
 * 
 * @returns HTML string with a sleek horizontal legend design
 */
export const getConfidenceLegend = (): string => {
    return `
    <div class="confidence-legend" style="
        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 16px 20px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    ">
        <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
        ">
            <h4 style="
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin: 0;
                letter-spacing: 0.5px;
            ">Confidence</h4>
            
            <div style="
                display: flex;
                align-items: center;
                gap: 16px;
                flex-wrap: wrap;
            ">
                <div class="confidence-indicator" style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #6b7280;
                ">
                    <div style="
                        width: 24px;
                        height: 6px;
                        border-radius: 3px;
                        background: linear-gradient(90deg, #00af00 0%, #00d700 100%);
                        box-shadow: 0 1px 3px rgba(0,175,0,0.3);
                    "></div>
                    High
                </div>
                
                <div class="confidence-indicator" style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #6b7280;
                ">
                    <div style="
                        width: 24px;
                        height: 6px;
                        border-radius: 3px;
                        background: linear-gradient(90deg, #dfff00 0%, #87d787 100%);
                        box-shadow: 0 1px 3px rgba(223,255,0,0.3);
                    "></div>
                    Med-High
                </div>
                
                <div class="confidence-indicator" style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #6b7280;
                ">
                    <div style="
                        width: 24px;
                        height: 6px;
                        border-radius: 3px;
                        background: linear-gradient(90deg, #ffaf5f 0%, #ffd700 100%);
                        box-shadow: 0 1px 3px rgba(255,175,95,0.3);
                    "></div>
                    Medium
                </div>
                
                <div class="confidence-indicator" style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #6b7280;
                ">
                    <div style="
                        width: 24px;
                        height: 6px;
                        border-radius: 3px;
                        background: linear-gradient(90deg, #ff0000 0%, #ff8700 100%);
                        box-shadow: 0 1px 3px rgba(255,0,0,0.3);
                    "></div>
                    Low
                </div>
                
                <div class="confidence-indicator" style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #6b7280;
                ">
                    <div style="
                        width: 16px;
                        height: 6px;
                        border-radius: 3px;
                        background: #bcbcbc;
                        box-shadow: 0 1px 3px rgba(188,188,188,0.3);
                    "></div>
                    Neutral
                </div>
            </div>
        </div>
    </div>
    `
}

