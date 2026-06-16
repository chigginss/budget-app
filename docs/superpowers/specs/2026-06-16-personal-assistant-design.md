# Personal Assistant App — Design Spec
_Date: 2026-06-16_

## Overview

A personal life-organisation app built with React, Node/Express, and MongoDB. Covers budget tracking, financial forecasting, task management, and planning. Runs locally as a monorepo.

---

## Project Structure

```
/personal-assistant
  /client                   ← React 18 + Vite + Tailwind + Chart.js
    /src
      /components           ← Shared UI components
      /pages                ← One directory per page
      /hooks                ← Custom React hooks
      /api                  ← Fetch wrappers per resource
      /utils                ← Currency conversion, date helpers
  /server
    /src
      /models               ← Mongoose schemas
      /routes               ← Express route handlers (thin)
      /services             ← Business logic (testable in isolation)
      /middleware           ← multer for uploads, error handler
      /utils                ← OCR parsing, text extraction helpers
    /tests
      /unit                 ← Model methods, service logic
      /integration          ← Route tests with Supertest
```

**Key dependencies:**
- Vite — fast dev server with HMR
- Mongoose — schema + model methods
- Multer — screenshot file uploads
- Tesseract.js — server-side OCR
- Concurrently — run client + server together in dev
- Jest + Supertest — server tests
- Vitest + React Testing Library — client tests
- MongoDB Memory Server — in-memory DB for tests

---

## Data Models

### Month
| Field        | Type   | Notes                                      |
|--------------|--------|--------------------------------------------|
| name         | String |                                            |
| startDate    | Date   |                                            |
| endDate      | Date   |                                            |
| details      | String | Free-text notes/goals                      |
| exchangeRate | Number | NZD per 1 USD (e.g. 1.65), set per month  |

**Model method:** `totalSpendingNZD()` — sums all transactions, converting USD using the month's exchange rate. Not a stored field.

> No `Year` model — months group by year in the UI using their dates.

---

### Transaction
| Field    | Type     | Notes                                               |
|----------|----------|-----------------------------------------------------|
| name     | String   | Merchant name, editable                             |
| category | Enum     | shopping, food, bills, rent, travel, gifts, general |
| currency | Enum     | NZD, USD                                            |
| value    | Number   | Original amount in stated currency                  |
| date     | Date     |                                                     |
| month    | ObjectId | → Month                                             |

**Model method:** `valueInNZD(exchangeRate)` — returns `value` if NZD, else `value * exchangeRate`.

---

### List
| Field       | Type     | Notes                                          |
|-------------|----------|------------------------------------------------|
| name        | String   |                                                |
| description | String   |                                                |
| type        | Enum     | todo, toBuy, longTermPlan, custom              |
| savingGoal  | Number   | longTermPlan only                              |
| goalDate    | Date     | longTermPlan only                              |

### Item
| Field  | Type     | Notes                          |
|--------|----------|--------------------------------|
| name   | String   |                                |
| status | Enum     | pending, completed             |
| order  | Number   | For drag-and-drop position     |
| list   | ObjectId | → List                         |

---

## Pages

### Dashboard (`/`)
- Navigation cards to: Ledger, Forecast, Focus List, Wish List, Dreaming
- Custom list cards below with delete button per list
- "New List" button to create a custom list

### Ledger (`/ledger`)
- Months as tabs, grouped by year, sorted by date
- "Add Month" button — form: name, start/end date, exchange rate
- Per month tab:
  - Transaction list — name (editable inline), category (dropdown), currency, value (original + NZD equivalent), date, delete button
  - Add transaction: manual form OR screenshot upload → OCR review → confirm
  - Pie chart (Chart.js) — spending by category in NZD
  - Category totals table below chart
  - Notes field (auto-saves on blur)

### Forecast (`/forecast`)
- Inputs: monthly income (NZD), fixed costs (editable, pre-populated from Ledger bills + rent averages)
- 12 tabs — one per upcoming month from today
- Each tab: projected savings, one-off unexpected cost input
- Header: forecast yearly savings total
- Calculation: `(income - fixed costs - unexpected costs) * months`

### Focus List (`/focus`)
- Ordered list with drag-and-drop (vanilla JS)
- Gradient background: top item deepest red → bottom item yellow
- Top 3 items bold
- Add via input at top
- Checkbox to mark done (moves to bottom, muted style)
- Delete button per item

### Wish List (`/wishlist`)
- Simple list
- Input to add
- Delete button per item

### Dreaming (`/dreaming`)
- Saving goal form: amount (NZD) + target date
- Comparison: Forecast projected savings by goal date vs goal amount (ahead/behind)
- Freeform list of plans/ideas — add and delete

### Custom Lists (`/lists/:id`)
- Name as heading, description as subheading
- Items: add, delete, toggle status (pending → completed shown as strikethrough)

---

## API Routes

### Months & Transactions
```
GET    /api/months                        ← all months sorted by date
POST   /api/months                        ← create month
GET    /api/months/:id                    ← single month with transactions
PUT    /api/months/:id                    ← update name, dates, rate, details
DELETE /api/months/:id                    ← deletes month + its transactions
POST   /api/months/:id/transactions       ← add single transaction
PUT    /api/transactions/:id              ← edit name, category, value, date
DELETE /api/transactions/:id
POST   /api/months/:id/parse-screenshot   ← upload image, returns parsed rows
```

### Lists & Items
```
GET    /api/lists                         ← all lists
POST   /api/lists                         ← create list
GET    /api/lists/:id                     ← single list with items
PUT    /api/lists/:id                     ← update name, description, goal fields
DELETE /api/lists/:id
POST   /api/lists/:id/items               ← add item
PUT    /api/items/:id                     ← edit name, status, order
DELETE /api/items/:id
PUT    /api/lists/:id/reorder             ← bulk update item order after drag-drop
```

---

## OCR Flow

1. User selects a screenshot and uploads
2. Multer receives the image, stores temporarily
3. Tesseract.js processes image, returns raw text
4. Parser scans text line by line with regex — extracts amounts (`$XX.XX`, `-XX.XX`), dates, and treats surrounding lines as merchant name
5. Server returns candidate transactions: `{ name, value, date, currency }`
6. Client shows editable review table — name, value, date, category dropdown, currency toggle, remove button per row
7. User confirms → batch POST to `/api/months/:id/transactions`
8. Temp image deleted from server

---

## Currency Handling

- Each transaction stores its original currency and value
- Each month has a user-set `exchangeRate` (NZD per USD)
- All charts, totals, and Forecast calculations use NZD
- Transaction list displays both original value and NZD equivalent

---

## Testing Strategy

Simple — test the critical logic only, no exhaustive coverage.

**Server (Jest + Supertest):**
- Model methods: `totalSpendingNZD()`, `valueInNZD()`
- Key API routes: month CRUD, transaction create/edit, parse-screenshot

**Client (Vitest + React Testing Library):**
- Key interactive components: transaction form, OCR review table, category dropdown

**Test conventions:**
```
/server/tests/unit/month.service.test.js
/server/tests/integration/months.routes.test.js
/client/src/components/TransactionForm.test.jsx
```

MongoDB Memory Server used for integration tests — no external DB dependency.

---

## Naming Reference

| Section         | Route        |
|-----------------|--------------|
| Dashboard       | `/`          |
| Ledger          | `/ledger`    |
| Forecast        | `/forecast`  |
| Focus List      | `/focus`     |
| Wish List       | `/wishlist`  |
| Dreaming        | `/dreaming`  |
| Custom Lists    | `/lists/:id` |
