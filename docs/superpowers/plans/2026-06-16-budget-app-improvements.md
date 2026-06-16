# Budget App Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add entertainment/health categories, fix OCR name parsing, support positive/negative transactions, redesign Forecast with running balance and per-item fixed costs.

**Architecture:** Backend changes touch `currency.js`, `Transaction.js`, `ForecastSettings.js`, `ocrParser.js`, `forecast.js`, and `months.js`. Frontend changes touch `TransactionForm.jsx`, `TransactionList.jsx`, `CategoryTotals.jsx`, and a full rewrite of `Forecast.jsx`. No new routes or models are added — `ForecastSettings` gains two field changes (`currentBalance` scalar, `fixedCosts` array) and `months.js` gains one new static endpoint.

**Tech Stack:** Node.js/Express/Mongoose (server), React/Vite/Tailwind (client), Jest (server tests)

---

## Task 1: Expand Transaction Categories

**Files:**
- Modify: `server/src/utils/currency.js`
- Modify: `client/src/components/TransactionForm.jsx`
- Modify: `client/src/components/TransactionList.jsx`

- [ ] **Step 1: Update the server-side categories source of truth**

In `server/src/utils/currency.js`, replace the entire file:

```js
const CATEGORIES = ['shopping', 'food', 'bills', 'rent', 'travel', 'gifts', 'general', 'entertainment', 'health']
module.exports = { CATEGORIES }
```

- [ ] **Step 2: Update the CATEGORIES constant in TransactionForm**

In `client/src/components/TransactionForm.jsx`, line 4, replace:

```js
const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts']
```

with:

```js
const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts', 'entertainment', 'health']
```

- [ ] **Step 3: Update the CATEGORIES constant in TransactionList**

In `client/src/components/TransactionList.jsx`, line 4, replace:

```js
const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts']
```

with:

```js
const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts', 'entertainment', 'health']
```

- [ ] **Step 4: Commit**

```bash
git add server/src/utils/currency.js client/src/components/TransactionForm.jsx client/src/components/TransactionList.jsx
git commit -m "feat: add entertainment and health transaction categories"
```

---

## Task 2: Fix OCR Parser

**Files:**
- Modify: `server/src/services/ocrParser.js`
- Modify: `server/tests/unit/ocrParser.test.js`

- [ ] **Step 1: Write failing tests for the new parser behaviour**

Replace the full contents of `server/tests/unit/ocrParser.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/cierrahiggins/budget-app/server && npx jest tests/unit/ocrParser.test.js --no-coverage
```

Expected: several FAIL results — "extracts name from same line" and the skip-pattern tests will fail.

- [ ] **Step 3: Rewrite ocrParser.js**

Replace the full contents of `server/src/services/ocrParser.js`:

```js
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/cierrahiggins/budget-app/server && npx jest tests/unit/ocrParser.test.js --no-coverage
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/ocrParser.js server/tests/unit/ocrParser.test.js
git commit -m "fix: ocr parser — extract inline names, skip total/balance/account lines"
```

---

## Task 3: Allow Negative Transaction Values (Credits)

**Files:**
- Modify: `server/src/models/Transaction.js`
- Modify: `client/src/components/TransactionForm.jsx`
- Modify: `client/src/components/TransactionList.jsx`

- [ ] **Step 1: Remove the `min: 0` constraint from the Transaction model**

In `server/src/models/Transaction.js`, replace line 8:

```js
value: { type: Number, required: true },
```

(Remove `min: 0`)

- [ ] **Step 2: Remove `min="0"` from the amount input in TransactionForm**

In `client/src/components/TransactionForm.jsx`, line 36, replace:

```jsx
<input required type="number" step="0.01" min="0" placeholder="Amount" value={form.value}
```

with:

```jsx
<input required type="number" step="0.01" placeholder="Amount" value={form.value}
```

- [ ] **Step 3: Add green styling for negative (credit) values in TransactionList**

In `client/src/components/TransactionList.jsx`, replace the two amount cells (lines 64–65):

```jsx
<td className="py-2 pr-2 text-right">{t.value.toFixed(2)} {t.currency}</td>
<td className="py-2 pr-2 text-right font-medium">${nzd(t)}</td>
```

with:

```jsx
<td className={`py-2 pr-2 text-right ${t.value < 0 ? 'text-green-600' : ''}`}>
  {t.value < 0 ? '+' : ''}{Math.abs(t.value).toFixed(2)} {t.currency}
</td>
<td className={`py-2 pr-2 text-right font-medium ${t.value < 0 ? 'text-green-600' : ''}`}>
  {t.value < 0 ? '+' : ''}${Math.abs(parseFloat(nzd(t))).toFixed(2)}
</td>
```

- [ ] **Step 4: Commit**

```bash
git add server/src/models/Transaction.js client/src/components/TransactionForm.jsx client/src/components/TransactionList.jsx
git commit -m "feat: allow negative transaction values for credits and refunds"
```

---

## Task 4: Update ForecastSettings Model and API

**Files:**
- Modify: `server/src/models/ForecastSettings.js`
- Modify: `server/src/routes/forecast.js`
- Modify: `server/src/routes/months.js`

- [ ] **Step 1: Rewrite ForecastSettings model**

Replace the full contents of `server/src/models/ForecastSettings.js`:

```js
const mongoose = require('mongoose')

const ForecastMonthSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  label: { type: String, required: true },
  date: { type: Date, required: true },
  unexpectedCosts: { type: Number, default: 0 },
})

const FixedCostSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
})

const ForecastSettingsSchema = new mongoose.Schema({
  income: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  fixedCosts: { type: [FixedCostSchema], default: [] },
  months: [ForecastMonthSchema],
}, { timestamps: true })

module.exports = mongoose.model('ForecastSettings', ForecastSettingsSchema)
```

- [ ] **Step 2: Update the forecast route to handle new fields**

Replace the full contents of `server/src/routes/forecast.js`:

```js
const express = require('express')
const router = express.Router()
const ForecastSettings = require('../models/ForecastSettings')

function generateMonths() {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return {
      index: i,
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      date: d,
      unexpectedCosts: 0,
    }
  })
}

router.put('/months/:index', async (req, res, next) => {
  try {
    const settings = await ForecastSettings.findOne()
    if (!settings) return res.status(404).json({ error: 'Forecast not initialized' })
    const idx = parseInt(req.params.index)
    const month = settings.months.find(m => m.index === idx)
    if (!month) return res.status(404).json({ error: 'Month not found' })
    month.unexpectedCosts = req.body.unexpectedCosts ?? month.unexpectedCosts
    await settings.save()
    res.json(settings)
  } catch (err) { next(err) }
})

router.get('/', async (req, res, next) => {
  try {
    let settings = await ForecastSettings.findOne()
    if (!settings) settings = await ForecastSettings.create({ months: generateMonths() })
    res.json(settings)
  } catch (err) { next(err) }
})

router.put('/', async (req, res, next) => {
  try {
    let settings = await ForecastSettings.findOne()
    if (!settings) settings = new ForecastSettings({ months: generateMonths() })
    const { income, currentBalance, fixedCosts } = req.body
    if (income !== undefined) settings.income = income
    if (currentBalance !== undefined) settings.currentBalance = currentBalance
    if (fixedCosts !== undefined) settings.fixedCosts = fixedCosts
    await settings.save()
    res.json(settings)
  } catch (err) { next(err) }
})

module.exports = router
```

- [ ] **Step 3: Add spending-summary endpoint to months route**

In `server/src/routes/months.js`, after the `ledger-averages` route (after line 26) and before `router.get('/', ...)`, add:

```js
router.get('/spending-summary', async (req, res, next) => {
  try {
    const months = await Month.find()
    const summary = {}
    for (const month of months) {
      const txns = await Transaction.find({ month: month._id })
      const total = txns.reduce((sum, t) => sum + t.valueInNZD(month.exchangeRate), 0)
      const key = `${month.startDate.getFullYear()}-${String(month.startDate.getMonth() + 1).padStart(2, '0')}`
      summary[key] = total
    }
    res.json(summary)
  } catch (err) { next(err) }
})
```

- [ ] **Step 4: Commit**

```bash
git add server/src/models/ForecastSettings.js server/src/routes/forecast.js server/src/routes/months.js
git commit -m "feat: update ForecastSettings model and API — currentBalance, fixedCosts array, spending-summary endpoint"
```

---

## Task 5: Redesign Forecast Page

**Files:**
- Modify: `client/src/pages/Forecast.jsx`

- [ ] **Step 1: Replace Forecast.jsx with the new design**

Replace the full contents of `client/src/pages/Forecast.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, put } from '../api/client'

export default function Forecast() {
  const [settings, setSettings] = useState(null)
  const [spendingSummary, setSpendingSummary] = useState({})
  const [fixedOpen, setFixedOpen] = useState(false)
  const [newCost, setNewCost] = useState({ name: '', amount: '' })

  useEffect(() => {
    get('/forecast').then(setSettings).catch(console.error)
    get('/months/spending-summary').then(setSpendingSummary).catch(console.error)
  }, [])

  const saveSettings = async (patch) => {
    const updated = await put('/forecast', patch)
    setSettings(updated)
  }

  const updateMonth = async (index, unexpectedCosts) => {
    const updated = await put(`/forecast/months/${index}`, { unexpectedCosts: parseFloat(unexpectedCosts) || 0 })
    setSettings(updated)
  }

  const addFixedCost = async () => {
    if (!newCost.name || !newCost.amount) return
    const updated = [...(settings.fixedCosts || []), { name: newCost.name, amount: parseFloat(newCost.amount) }]
    await saveSettings({ fixedCosts: updated })
    setNewCost({ name: '', amount: '' })
  }

  const removeFixedCost = async (index) => {
    const updated = settings.fixedCosts.filter((_, i) => i !== index)
    await saveSettings({ fixedCosts: updated })
  }

  if (!settings) return <div className="p-6 text-gray-500">Loading...</div>

  const { income, currentBalance, fixedCosts, months } = settings
  const fixedCostsTotal = (fixedCosts || []).reduce((s, c) => s + c.amount, 0)

  const monthsWithBalance = months.reduce((acc, m) => {
    const prevBalance = acc.length === 0 ? (currentBalance || 0) : acc[acc.length - 1].balance
    const key = `${new Date(m.date).getFullYear()}-${String(new Date(m.date).getMonth() + 1).padStart(2, '0')}`
    const spent = spendingSummary[key] ?? null
    const net = (income || 0) - fixedCostsTotal - (m.unexpectedCosts || 0) - (spent ?? 0)
    acc.push({ ...m, spent, net, balance: prevBalance + net })
    return acc
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Forecast</h1>

      {/* Fixed Costs Collapsible */}
      <div className="border border-gray-200 rounded-lg mb-6 overflow-hidden">
        <button
          onClick={() => setFixedOpen(o => !o)}
          className="w-full flex justify-between items-center px-5 py-4 bg-gray-50 hover:bg-gray-100 text-left"
        >
          <div>
            <span className="font-semibold text-gray-800">Fixed Costs</span>
            <span className="text-sm text-gray-400 ml-3">used in all months</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-700">${fixedCostsTotal.toFixed(2)} / mo</span>
            <span className="text-gray-400 text-sm">{fixedOpen ? '▲' : '▼'}</span>
          </div>
        </button>
        {fixedOpen && (
          <div className="p-5 border-t border-gray-200">
            <div className="space-y-2 mb-4">
              {(fixedCosts || []).map((c, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded">
                  <span className="text-gray-700">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">${c.amount.toFixed(2)}</span>
                    <button onClick={() => removeFixedCost(i)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                  </div>
                </div>
              ))}
              {(fixedCosts || []).length === 0 && (
                <p className="text-sm text-gray-400">No fixed costs yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="e.g. Netflix"
                value={newCost.name}
                onChange={e => setNewCost(p => ({ ...p, name: e.target.value }))}
                className="border rounded px-3 py-2 text-sm flex-1"
              />
              <input
                type="number" step="0.01" placeholder="Amount"
                value={newCost.amount}
                onChange={e => setNewCost(p => ({ ...p, amount: e.target.value }))}
                className="border rounded px-3 py-2 text-sm w-28"
              />
              <button
                onClick={addFixedCost}
                className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
              >
                + Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Income + Savings */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (NZD)</label>
          <input
            type="number" step="0.01" defaultValue={income}
            onBlur={e => saveSettings({ income: parseFloat(e.target.value) || 0 })}
            className="border rounded px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Savings (NZD)</label>
          <input
            type="number" step="0.01" defaultValue={currentBalance}
            onBlur={e => saveSettings({ currentBalance: parseFloat(e.target.value) || 0 })}
            className="border rounded px-3 py-2 text-sm w-full"
          />
        </div>
      </div>

      {/* Monthly running balance table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Month</th>
              <th className="px-4 py-3 text-right font-medium">Spent</th>
              <th className="px-4 py-3 text-right font-medium">Unexpected</th>
              <th className="px-4 py-3 text-right font-medium">Net</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monthsWithBalance.map(m => (
              <tr key={m.index} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{m.label}</td>
                <td className="px-4 py-3 text-right text-red-500">
                  {m.spent !== null
                    ? `$${m.spent.toFixed(2)}`
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number" step="0.01" defaultValue={m.unexpectedCosts}
                    key={`${m.index}-${m.unexpectedCosts}`}
                    onBlur={e => updateMonth(m.index, e.target.value)}
                    className="border rounded px-2 py-1 text-xs w-24 text-right"
                  />
                </td>
                <td className={`px-4 py-3 text-right font-medium ${m.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {m.net >= 0 ? '+' : ''}${m.net.toFixed(2)}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${m.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  ${m.balance.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the app runs without errors**

Start the dev server:
```bash
cd /Users/cierrahiggins/budget-app && npm run dev
```

Open http://localhost:5173 and navigate to Forecast. Confirm:
- Fixed Costs section is present and collapses/expands
- Income and Current Savings fields are editable
- Monthly table renders all 12 months
- Adding a fixed cost updates the total immediately

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Forecast.jsx
git commit -m "feat: redesign forecast page — running balance, collapsible fixed costs, spending from ledger"
```

---

## Task 6: Push to GitHub

- [ ] **Step 1: Run all server tests**

```bash
cd /Users/cierrahiggins/budget-app/server && npx jest --no-coverage
```

Expected: all tests PASS

- [ ] **Step 2: Push**

```bash
cd /Users/cierrahiggins/budget-app && git push origin main
```
