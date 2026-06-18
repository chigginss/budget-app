const AMOUNT_RE = /[-]?\$?([\d,]+\.\d{2})/
const DATE_RE = /(\d{1,2}\s+\w{3,9}\s+\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i
const SKIP_RE = /total|balance|account|\d{2}-\d{4}-\d{7}/i
const PURE_DATE_RE = /^\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*$/i

function extractInlineName(line) {
  const cleaned = line
    .replace(/[-]?\$?[\d,]+\.\d{2}/g, '')
    .replace(/\b(NZD|USD)\b/g, '')
    .replace(/\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*/gi, '')
    .trim()
  return cleaned || null
}

function parseOcrText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const results = []
  const currentYear = new Date().getFullYear()

  for (let i = 0; i < lines.length; i++) {
    if (SKIP_RE.test(lines[i])) continue
    if (PURE_DATE_RE.test(lines[i])) continue

    const amountMatch = lines[i].match(AMOUNT_RE)
    if (!amountMatch) continue

    const value = parseFloat(amountMatch[1].replace(/,/g, ''))

    // Try same line first: "Netflix $15.99" → "Netflix"
    let name = extractInlineName(lines[i])

    // Fall back: nearest preceding non-amount, non-date, non-skip line
    if (!name) {
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        if (SKIP_RE.test(lines[j])) continue
        if (PURE_DATE_RE.test(lines[j])) continue
        if (!lines[j].match(AMOUNT_RE) && !lines[j].match(DATE_RE)) {
          name = lines[j]
          break
        }
      }
    }

    if (!name) name = 'Unknown'

    let date = new Date().toISOString().split('T')[0]
    for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
      const dateMatch = lines[j].match(DATE_RE)
      if (dateMatch) {
        let dateStr = dateMatch[1]
        if (!/\d{4}/.test(dateStr)) dateStr += ` ${currentYear}`
        const parsed = new Date(dateStr)
        if (!isNaN(parsed)) {
          date = parsed.toISOString().split('T')[0]
          break
        }
      }
    }

    results.push({ name, value, date, currency: 'NZD' })
  }

  return results
}

module.exports = { parseOcrText }
