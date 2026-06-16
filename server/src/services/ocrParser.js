const AMOUNT_RE = /[-]?\$?([\d,]+\.\d{2})/
const DATE_RE = /(\d{1,2}\s+\w{3,9}\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/
const SKIP_RE = /total|balance|account|\d{2}-\d{4}-\d{7}/i

function extractInlineName(line) {
  const cleaned = line
    .replace(/[-]?\$?[\d,]+\.\d{2}/g, '')
    .replace(/\b(NZD|USD)\b/g, '')
    .trim()
  return cleaned || null
}

function parseOcrText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const results = []

  for (let i = 0; i < lines.length; i++) {
    if (SKIP_RE.test(lines[i])) continue

    const amountMatch = lines[i].match(AMOUNT_RE)
    if (!amountMatch) continue

    const value = parseFloat(amountMatch[1].replace(/,/g, ''))

    // Try same line first: "Netflix $15.99" → "Netflix"
    let name = extractInlineName(lines[i])

    // Fall back: nearest preceding non-amount, non-date, non-skip line
    if (!name) {
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        if (SKIP_RE.test(lines[j])) continue
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
        const parsed = new Date(dateMatch[1])
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
