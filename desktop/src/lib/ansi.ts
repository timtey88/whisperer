// Confidence color mapping optimized for dark mode
// Enhanced contrast and visibility on dark backgrounds
const ANSI_COLOR_MAP: Record<string, string> = {
    // 🔴 Low Confidence (0.0-0.6) - Enhanced brightness for dark mode
    '160': '#ff4444', // Bright Red (~0.50)
    '196': '#ff5555', // Enhanced Bright Red (~0.55)
    '166': '#ff7744', // Bright Dark Orange (~0.60)

    // 🟠 Medium Confidence (0.6-0.8) - Enhanced visibility
    '208': '#ff9933', // Bright Orange (~0.70)
    '215': '#ffbb66', // Enhanced Light Orange (~0.75)
    '220': '#ffdd44', // Bright Yellow-Orange (~0.78)

    // 🟡 Medium-High Confidence (0.8-0.9) - Enhanced contrast
    '190': '#eeff44', // Bright Yellow-Green (~0.82)
    '114': '#99ee99', // Bright Green-Cyan (~0.88)

    // 🟢 High Confidence (0.9-1.0) - Enhanced vibrancy
    '71': '#77dd77', // Bright Light Green (~0.92)
    '34': '#44cc44', // Enhanced Green (~0.95)
    '40': '#55ff55', // Vivid Bright Green (~0.97)

    // 🟣🔵 Neutral/Informational (Varies) - Dark mode optimized
    '250': '#888888', // Enhanced Gray (Neutral/filler)
    '33': '#66aaff', // Bright Blue (Metadata or tags)
    '8': '#999999', // Enhanced Medium Gray (Silent or skipped)

    // Additional colors optimized for dark backgrounds
    '226': '#ffff66', // Bright Yellow
    '214': '#ffcc44', // Enhanced orange
    '227': '#ffff88', // Bright light yellow
    '35': '#44ff88', // Bright spring green
    '46': '#66ff66', // Enhanced lime green
    '70': '#88cc44', // Bright olive green
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

    // Trim leading and trailing whitespace to prevent extra spaces
    const trimmedText = text.trim()

    // Check if text contains ANSI codes
    const hasAnsiCodes = trimmedText.includes('\x1b[38;5;')
    
    if (!hasAnsiCodes) {
        // No ANSI codes present, add basic simulated confidence colors
        return generateSimulatedConfidenceHtml(trimmedText)
    }

    // Match sequences like: \x1b[38;5;166m text \x1b[0m
    const regex = /\x1b\[38;5;(\d+)m([\s\S]*?)(?=\x1b\[38;5;|\x1b\[0m|$)/g
    const htmlParts: string[] = []

    let match
    while ((match = regex.exec(trimmedText)) !== null) {
        const [_, colorCode, content] = match
        const color = ANSI_COLOR_MAP[colorCode] || '#374151'
        const escapedText = escapeHtml(content)
        
        // Enhanced styling for dark mode with stronger shadows and improved readability
        htmlParts.push(`<span style="
            color: ${color};
            font-weight: 600;
            text-shadow: 0 1px 3px rgba(0,0,0,0.7), 0 0 0 rgba(255,255,255,0.1);
            transition: all 0.15s ease;
            filter: brightness(1.1) saturate(1.2);
        ">${escapedText}</span>`)
    }

    // Clean up any leftover control codes
    const html = htmlParts.join('').replace(/\x1b\[[0-9;]*m/g, '')

    return `<div style="
        white-space: pre-wrap; 
        text-align: justify; 
        line-height: 1.9;
        letter-spacing: 0.3px;
        word-spacing: 1.2px;
        hyphens: auto;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-feature-settings: 'liga' 1, 'kern' 1;
        color: #e2e8f0;
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
    // Trim leading and trailing whitespace to prevent extra spaces
    const trimmedText = text.trim()
    const words = trimmedText.split(/(\s+|[.!?,:;])/)
    
    const coloredWords = words.map(part => {
        if (/^\s+$/.test(part)) {
            // Preserve spaces as-is
            return part
        } else if (/[.!?,:;]/.test(part)) {
            // Punctuation in neutral gray with enhanced dark mode styling
            return `<span style="
                color: #64748b;
                font-weight: 500;
                text-shadow: 0 1px 3px rgba(0,0,0,0.7);
                filter: brightness(1.1);
            ">${escapeHtml(part)}</span>`
        } else if (part.trim().length > 0) {
            // Words get consistent confidence colors based on their content
            const colorCode = getWordConfidenceColor(part)
            const color = ANSI_COLOR_MAP[colorCode] || '#374151'
            return `<span style="
                color: ${color};
                font-weight: 600;
                text-shadow: 0 1px 3px rgba(0,0,0,0.7), 0 0 0 rgba(255,255,255,0.1);
                transition: all 0.15s ease;
                filter: brightness(1.1) saturate(1.2);
            ">${escapeHtml(part)}</span>`
        }
        return escapeHtml(part)
    })
    
    return `<div style="
        white-space: pre-wrap; 
        text-align: justify; 
        line-height: 1.9;
        letter-spacing: 0.3px;
        word-spacing: 1.2px;
        hyphens: auto;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-feature-settings: 'liga' 1, 'kern' 1;
        color: #e2e8f0;
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
        background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px;
        padding: 16px 20px;
        margin-bottom: 24px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
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
                color: #e2e8f0;
                margin: 0;
                letter-spacing: 0.5px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
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
                    color: #94a3b8;
                ">
                    <div style="
                        width: 24px;
                        height: 6px;
                        border-radius: 3px;
                        background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
                        box-shadow: 0 2px 8px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
                        border: 1px solid rgba(16,185,129,0.3);
                    "></div>
                    High
                </div>
                
                <div class="confidence-indicator" style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #94a3b8;
                ">
                    <div style="
                        width: 24px;
                        height: 6px;
                        border-radius: 3px;
                        background: linear-gradient(90deg, #eab308 0%, #a3e635 100%);
                        box-shadow: 0 2px 8px rgba(234,179,8,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
                        border: 1px solid rgba(234,179,8,0.3);
                    "></div>
                    Med-High
                </div>
                
                <div class="confidence-indicator" style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #94a3b8;
                ">
                    <div style="
                        width: 24px;
                        height: 6px;
                        border-radius: 3px;
                        background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
                        box-shadow: 0 2px 8px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
                        border: 1px solid rgba(245,158,11,0.3);
                    "></div>
                    Medium
                </div>
                
                <div class="confidence-indicator" style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #94a3b8;
                ">
                    <div style="
                        width: 24px;
                        height: 6px;
                        border-radius: 3px;
                        background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
                        box-shadow: 0 2px 8px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
                        border: 1px solid rgba(239,68,68,0.3);
                    "></div>
                    Low
                </div>
                
                <div class="confidence-indicator" style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #94a3b8;
                ">
                    <div style="
                        width: 16px;
                        height: 6px;
                        border-radius: 3px;
                        background: #64748b;
                        box-shadow: 0 2px 8px rgba(100,116,139,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
                        border: 1px solid rgba(100,116,139,0.3);
                    "></div>
                    Neutral
                </div>
            </div>
        </div>
    </div>
    `
}

