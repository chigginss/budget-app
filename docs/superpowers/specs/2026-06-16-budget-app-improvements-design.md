# Budget App Improvements — Design Spec

**Date:** 2026-06-16

## Overview

Five improvements to the personal budget app: expanded transaction categories, OCR parser fixes, positive/negative transaction amounts, a redesigned forecast with running balance, and a collapsible fixed costs section within the Forecast page.

---

## 1. Transaction Categories

Add `entertainment` and `health` to the Transaction category enum.

**Current:** `['shopping', 'food', 'bills', 'rent', 'travel', 'gifts', 'general']`
**Updated:** `['shopping', 'food', 'bills', 'rent', 'travel', 'gifts', 'general', 'entertainment', 'health']`

Changes required:
- `server/src/models/Transaction.js` — enum array
- `client/src/components/TransactionForm.jsx` — category dropdown
- `client/src/components/CategoryTotals.jsx` — category display

---

## 2. OCR Parser Fixes

**Problem 1 — Unknown names:** The parser only backtracks above the amount line to find a merchant name. Bank statements often put description and amount on the same line (e.g. `Netflix $15.99`), so backtracking finds nothing and falls back to "Unknown".

**Fix:** Before backtracking, check if the amount's own line contains non-amount text. If it does, extract that text as the name (strip the dollar amount portion).

**Problem 2 — False positives:** Lines containing bank account numbers, totals, and balances are being parsed as transactions.

**Fix:** Add a blocklist. Skip any line (or candidate name) matching:
- `/total/i`
- `/balance/i`
- `/account/i`
- Bank account number pattern: `/\d{2}-\d{4}-\d{7}/`

Changes required:
- `server/src/services/ocrParser.js` — name extraction logic + skip patterns

---

## 3. Positive/Negative Transaction Amounts

When money is received (refund, transfer from someone), the transaction value can be negative (e.g. `-50` means +$50 to the user).

**Model:** No schema change needed — `value: Number` already supports negative values. Remove any positive-only validation if present.

**Ledger UI:** When `transaction.value < 0`, display the amount in green and prefix with `+`. This value reduces the month's total spending.

**`totalSpendingNZD()` on Month model:** Already sums all transaction values — negative values will naturally reduce the total correctly.

Changes required:
- `server/src/models/Transaction.js` — remove positive-only constraint if present
- `client/src/components/TransactionList.jsx` — green styling + `+` prefix for negative values
- `client/src/components/TransactionForm.jsx` — allow negative value input

---

## 4. Forecast Redesign — Running Balance

### Data Model Changes (`ForecastSettings`)

**Add field:** `currentBalance: { type: Number, default: 0 }` — the user's current savings/bank account balance.

**Change field:** `fixedCosts: Number` → `fixedCosts: [{ name: String, amount: Number }]`

Each forecast month document is unchanged (`index`, `label`, `date`, `unexpectedCosts`). Actual spending is fetched live from the Ledger (matched by month date range).

### Running Balance Calculation

For each forecast month (index 0..11):
```
fixedCostsTotal = sum of fixedCosts[].amount
actualSpent     = Month.totalSpendingNZD() for that calendar month (0 if no ledger month exists)
net             = income - fixedCostsTotal - unexpectedCosts - actualSpent
balance[0]      = currentBalance + net
balance[n]      = balance[n-1] + net
```

### Forecast API Changes

- `GET /api/forecast` — returns `{ income, currentBalance, fixedCosts: [{name, amount}], months: [...] }`
- `PUT /api/forecast` — accepts `{ income?, currentBalance?, fixedCosts? }` (full array replacement for fixedCosts)
- `PUT /api/forecast/months/:index` — unchanged (updates `unexpectedCosts`)

### Forecast Page UI

**Collapsible fixed costs section** (at top of page, collapsed by default):
- Header shows: "Fixed Costs" label + total per month + collapse toggle
- Expanded: list of `{name, amount}` rows with delete (✕) button each
- Add row: name input + amount input + Add button
- Saves on Add / delete immediately via `PUT /api/forecast`

**Income + Current Savings fields:** Side-by-side inputs, editable inline, save on blur.

**Monthly table columns:** Month | Spent (from Ledger) | Unexpected | Net | Balance
- Spent: red if > 0, em-dash if no ledger data
- Net: green if positive, red if negative
- Balance: always green (savings growing) or red (savings depleting)

Changes required:
- `server/src/models/ForecastSettings.js`
- `server/src/routes/forecast.js`
- `client/src/pages/Forecast.jsx`

---

## 5. Fixed Costs UI (within Forecast)

Covered fully in section 4. The collapsible section is part of the Forecast page — not a separate route or model. Fixed costs persist in `ForecastSettings` and apply to every forecast month uniformly.

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `server/src/models/Transaction.js` | Add categories, allow negative values |
| `server/src/models/ForecastSettings.js` | Add `currentBalance`, change `fixedCosts` to array |
| `server/src/routes/forecast.js` | Update GET/PUT to handle new fields |
| `server/src/services/ocrParser.js` | Fix name extraction, add skip patterns |
| `client/src/components/TransactionForm.jsx` | New categories, allow negative input |
| `client/src/components/TransactionList.jsx` | Green styling for negative values |
| `client/src/components/CategoryTotals.jsx` | New categories |
| `client/src/pages/Forecast.jsx` | Full redesign — collapsible fixed costs, running balance table |
