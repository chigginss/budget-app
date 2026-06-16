const { parseOcrText } = require('../../src/services/ocrParser')

describe('parseOcrText', () => {
  it('extracts transactions from simple OCR text', () => {
    const text = `
Countdown
-$45.50
15 Jun 2026
Netflix
-$19.99
14 Jun 2026
    `.trim()
    const results = parseOcrText(text)
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({ name: 'Countdown', value: 45.50 })
    expect(results[1]).toMatchObject({ name: 'Netflix', value: 19.99 })
  })

  it('returns empty array for text with no amounts', () => {
    expect(parseOcrText('Hello world\nNo money here')).toEqual([])
  })
})
