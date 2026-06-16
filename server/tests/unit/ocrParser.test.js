const { parseOcrText } = require('../../src/services/ocrParser')

describe('parseOcrText', () => {
  it('extracts transactions from multi-line OCR text (name above amount)', () => {
    const text = `
Countdown
$45.50
15 Jun 2026
Netflix
$19.99
14 Jun 2026
    `.trim()
    const results = parseOcrText(text)
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({ name: 'Countdown', value: 45.50 })
    expect(results[1]).toMatchObject({ name: 'Netflix', value: 19.99 })
  })

  it('extracts name from same line as amount (bank statement format)', () => {
    const text = 'Netflix $15.99'
    const results = parseOcrText(text)
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ name: 'Netflix', value: 15.99 })
  })

  it('skips lines containing "total"', () => {
    const text = `
Countdown $45.50
Total $45.50
    `.trim()
    const results = parseOcrText(text)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Countdown')
  })

  it('skips lines containing "balance"', () => {
    const text = `
Pak n Save $32.10
Balance $1234.56
    `.trim()
    const results = parseOcrText(text)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Pak n Save')
  })

  it('skips lines containing a bank account number', () => {
    const text = `
12-3456-7890123-00 $0.00
Countdown $45.50
    `.trim()
    const results = parseOcrText(text)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Countdown')
  })

  it('does not use a skip-pattern line as a merchant name', () => {
    const text = `
Account
$500.00
Countdown
$45.50
    `.trim()
    const results = parseOcrText(text)
    // $500 line is skipped entirely (line above is "Account" which matches skip)
    // $45.50 should be captured with name "Countdown"
    const countdown = results.find(r => r.value === 45.50)
    expect(countdown).toBeDefined()
    expect(countdown.name).toBe('Countdown')
  })

  it('returns empty array for text with no amounts', () => {
    expect(parseOcrText('Hello world\nNo money here')).toEqual([])
  })
})
