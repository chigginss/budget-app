# Personal Assistant App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack personal life-organisation app with budget tracking, forecasting, and list management.

**Architecture:** React (Vite) client + Express/Mongoose server in a monorepo under `personal-assistant/`. Client proxies `/api` to server on port 5000. All financial calculations use NZD; USD transactions convert using a per-month exchange rate on the Month document.

**Tech Stack:** React 18, Vite 5, Tailwind 3, Chart.js 4, React Router 6, Express 4, Mongoose 8, MongoDB, Tesseract.js 5, Multer, Jest 29, Supertest, mongodb-memory-server 9, Vitest, React Testing Library

---

## File Map

```
personal-assistant/
  package.json                     ← root: concurrently dev script
  server/
    package.json
    .env.example
    jest.config.js
    src/
      app.js                       ← Express app exported (no listen)
      server.js                    ← entry: connects Mongo, starts listen
      models/
        Month.js
        Transaction.js
        List.js
        Item.js
        ForecastSettings.js
      routes/
        months.js
        transactions.js
        lists.js
        items.js
        forecast.js
      services/
        ocrParser.js
      middleware/
        upload.js
        errorHandler.js
      utils/
        currency.js
    tests/
      setup.js
      unit/
        month.test.js
        ocrParser.test.js
      integration/
        months.routes.test.js
        lists.routes.test.js
  client/
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
    index.html
    src/
      main.jsx
      App.jsx
      api/
        client.js
      pages/
        Dashboard.jsx
        Ledger.jsx
        Forecast.jsx
        FocusList.jsx
        WishList.jsx
        Dreaming.jsx
        ListPage.jsx
      components/
        NavCard.jsx
        TransactionList.jsx
        TransactionForm.jsx
        OcrReview.jsx
        SpendingChart.jsx
        CategoryTotals.jsx
        NotesField.jsx
        DragList.jsx
      utils/
        gradient.js
      test/
        setup.js
```

---

## Task 1: Root & Server Initialization

**Files:**
- Create: `personal-assistant/package.json`
- Create: `personal-assistant/server/package.json`
- Create: `personal-assistant/server/.env.example`
- Create: `personal-assistant/server/.env`
- Create: `personal-assistant/server/jest.config.js`
- Create: `personal-assistant/server/tests/setup.js`
- Create: `personal-assistant/server/src/app.js`
- Create: `personal-assistant/server/src/server.js`
- Create: `personal-assistant/server/src/middleware/errorHandler.js`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "personal-assistant",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "install:all": "npm install && npm install --prefix server && npm install --prefix client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Create `server/package.json`**

```json
{
  "name": "personal-assistant-server",
  "private": true,
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "mongoose": "^8.4.1",
    "multer": "^1.4.5-lts.1",
    "tesseract.js": "^5.1.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "mongodb-memory-server": "^9.3.0",
    "nodemon": "^3.1.3",
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 3: Create `server/.env.example` and `server/.env`**

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/personal-assistant
```

Both files have identical content.

- [ ] **Step 4: Create `server/jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterFramework: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
}
```

Note: the correct Jest key is `setupFilesAfterFramework` — if Jest rejects it, the correct alternative is `globalSetup`/`globalTeardown` pair. See tests/setup.js comments.

- [ ] **Step 5: Create `server/tests/setup.js`**

```js
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})
```

- [ ] **Step 6: Create `server/src/middleware/errorHandler.js`**

```js
module.exports = (err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Internal server error' })
}
```

- [ ] **Step 7: Create `server/src/app.js`**

```js
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/months', require('./routes/months'))
app.use('/api/transactions', require('./routes/transactions'))
app.use('/api/lists', require('./routes/lists'))
app.use('/api/items', require('./routes/items'))
app.use('/api/forecast', require('./routes/forecast'))

app.use(errorHandler)

module.exports = app
```

- [ ] **Step 8: Create `server/src/server.js`**

```js
require('dotenv').config()
const mongoose = require('mongoose')
const app = require('./app')

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/personal-assistant'

mongoose.connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
```

- [ ] **Step 9: Install server dependencies**

```bash
cd personal-assistant/server && npm install
```

- [ ] **Step 10: Commit**

```bash
git add personal-assistant/package.json personal-assistant/server/
git commit -m "feat: initialize server project structure"
```

---

## Task 2: Server Models

**Files:**
- Create: `server/src/models/Month.js`
- Create: `server/src/models/Transaction.js`
- Create: `server/src/models/List.js`
- Create: `server/src/models/Item.js`
- Create: `server/src/models/ForecastSettings.js`
- Create: `server/src/utils/currency.js`

- [ ] **Step 1: Create `server/src/utils/currency.js`**

```js
const CATEGORIES = ['shopping', 'food', 'bills', 'rent', 'travel', 'gifts', 'general']
module.exports = { CATEGORIES }
```

- [ ] **Step 2: Create `server/src/models/Month.js`**

```js
const mongoose = require('mongoose')

const MonthSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  details: { type: String, default: '' },
  exchangeRate: { type: Number, default: 1.0 },
}, { timestamps: true })

MonthSchema.methods.totalSpendingNZD = async function () {
  const Transaction = mongoose.model('Transaction')
  const txns = await Transaction.find({ month: this._id })
  return txns.reduce((sum, t) => {
    return sum + (t.currency === 'USD' ? t.value * this.exchangeRate : t.value)
  }, 0)
}

module.exports = mongoose.model('Month', MonthSchema)
```

- [ ] **Step 3: Create `server/src/models/Transaction.js`**

```js
const mongoose = require('mongoose')
const { CATEGORIES } = require('../utils/currency')

const TransactionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: CATEGORIES, default: 'general' },
  currency: { type: String, enum: ['NZD', 'USD'], required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true },
  month: { type: mongoose.Schema.Types.ObjectId, ref: 'Month', required: true },
}, { timestamps: true })

TransactionSchema.methods.valueInNZD = function (exchangeRate) {
  return this.currency === 'USD' ? this.value * exchangeRate : this.value
}

module.exports = mongoose.model('Transaction', TransactionSchema)
```

- [ ] **Step 4: Create `server/src/models/List.js`**

```js
const mongoose = require('mongoose')

const ListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['todo', 'toBuy', 'longTermPlan', 'custom'],
    default: 'custom',
  },
  savingGoal: { type: Number },
  goalDate: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('List', ListSchema)
```

- [ ] **Step 5: Create `server/src/models/Item.js`**

```js
const mongoose = require('mongoose')

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  order: { type: Number, default: 0 },
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
}, { timestamps: true })

module.exports = mongoose.model('Item', ItemSchema)
```

- [ ] **Step 6: Create `server/src/models/ForecastSettings.js`**

```js
const mongoose = require('mongoose')

const ForecastMonthSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  label: { type: String, required: true },
  date: { type: Date, required: true },
  unexpectedCosts: { type: Number, default: 0 },
})

const ForecastSettingsSchema = new mongoose.Schema({
  income: { type: Number, default: 0 },
  fixedCosts: { type: Number, default: 0 },
  months: [ForecastMonthSchema],
}, { timestamps: true })

module.exports = mongoose.model('ForecastSettings', ForecastSettingsSchema)
```

- [ ] **Step 7: Write unit tests for model methods**

File: `server/tests/unit/month.test.js`

```js
const mongoose = require('mongoose')
const Month = require('../../src/models/Month')
const Transaction = require('../../src/models/Transaction')

describe('Month.totalSpendingNZD', () => {
  it('sums NZD transactions directly', async () => {
    const month = await Month.create({ name: 'June', startDate: new Date('2026-06-01'), endDate: new Date('2026-06-30'), exchangeRate: 1.6 })
    await Transaction.create({ name: 'Supermarket', category: 'food', currency: 'NZD', value: 50, date: new Date(), month: month._id })
    await Transaction.create({ name: 'Coffee', category: 'food', currency: 'NZD', value: 10, date: new Date(), month: month._id })
    expect(await month.totalSpendingNZD()).toBe(60)
  })

  it('converts USD transactions at the month exchange rate', async () => {
    const month = await Month.create({ name: 'June', startDate: new Date('2026-06-01'), endDate: new Date('2026-06-30'), exchangeRate: 2.0 })
    await Transaction.create({ name: 'Amazon', category: 'shopping', currency: 'USD', value: 25, date: new Date(), month: month._id })
    expect(await month.totalSpendingNZD()).toBe(50)
  })
})
```

- [ ] **Step 8: Run tests to confirm they pass**

```bash
cd personal-assistant/server && npm test -- tests/unit/month.test.js
```

Expected: 2 passing

- [ ] **Step 9: Commit**

```bash
git add personal-assistant/server/src/models/ personal-assistant/server/src/utils/ personal-assistant/server/tests/
git commit -m "feat: add Mongoose models with unit tests"
```

---

## Task 3: OCR Service

**Files:**
- Create: `server/src/services/ocrParser.js`
- Create: `server/tests/unit/ocrParser.test.js`

- [ ] **Step 1: Write failing test**

File: `server/tests/unit/ocrParser.test.js`

```js
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd personal-assistant/server && npm test -- tests/unit/ocrParser.test.js
```

Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Create `server/src/services/ocrParser.js`**

```js
const AMOUNT_RE = /[-]?\$?([\d,]+\.\d{2})/
const DATE_RE = /(\d{1,2}\s+\w{3,9}\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/

function parseOcrText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const results = []

  for (let i = 0; i < lines.length; i++) {
    const amountMatch = lines[i].match(AMOUNT_RE)
    if (!amountMatch) continue

    const value = parseFloat(amountMatch[1].replace(/,/g, ''))

    // merchant name: nearest preceding non-amount, non-date line
    let name = 'Unknown'
    for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
      if (!lines[j].match(AMOUNT_RE) && !lines[j].match(DATE_RE)) {
        name = lines[j]
        break
      }
    }

    // date: look nearby
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

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd personal-assistant/server && npm test -- tests/unit/ocrParser.test.js
```

Expected: 2 passing

- [ ] **Step 5: Commit**

```bash
git add personal-assistant/server/src/services/ personal-assistant/server/tests/unit/ocrParser.test.js
git commit -m "feat: add OCR parser service with tests"
```

---

## Task 4: Server Middleware & Routes — Months & Transactions

**Files:**
- Create: `server/src/middleware/upload.js`
- Create: `server/src/routes/months.js`
- Create: `server/src/routes/transactions.js`
- Create: `server/tests/integration/months.routes.test.js`

- [ ] **Step 1: Create `server/src/middleware/upload.js`**

```js
const multer = require('multer')
const path = require('path')
const os = require('os')

module.exports = multer({ dest: os.tmpdir() })
```

- [ ] **Step 2: Create `server/src/routes/transactions.js`**

```js
const express = require('express')
const router = express.Router()
const Transaction = require('../models/Transaction')

router.put('/:id', async (req, res, next) => {
  try {
    const t = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!t) return res.status(404).json({ error: 'Transaction not found' })
    res.json(t)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const t = await Transaction.findByIdAndDelete(req.params.id)
    if (!t) return res.status(404).json({ error: 'Transaction not found' })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
```

- [ ] **Step 3: Create `server/src/routes/months.js`**

```js
const express = require('express')
const router = express.Router()
const fs = require('fs')
const Tesseract = require('tesseract.js')
const Month = require('../models/Month')
const Transaction = require('../models/Transaction')
const upload = require('../middleware/upload')
const { parseOcrText } = require('../services/ocrParser')

// Static routes before :id
router.get('/ledger-averages', async (req, res, next) => {
  try {
    const months = await Month.find()
    if (!months.length) return res.json({ bills: 0, rent: 0 })
    let totalBills = 0, totalRent = 0
    for (const month of months) {
      const txns = await Transaction.find({ month: month._id })
      for (const t of txns) {
        const nzd = t.currency === 'USD' ? t.value * month.exchangeRate : t.value
        if (t.category === 'bills') totalBills += nzd
        if (t.category === 'rent') totalRent += nzd
      }
    }
    res.json({ bills: totalBills / months.length, rent: totalRent / months.length })
  } catch (err) { next(err) }
})

router.get('/', async (req, res, next) => {
  try {
    const months = await Month.find().sort({ startDate: -1 })
    res.json(months)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const month = await Month.create(req.body)
    res.status(201).json(month)
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const month = await Month.findById(req.params.id)
    if (!month) return res.status(404).json({ error: 'Month not found' })
    const transactions = await Transaction.find({ month: month._id }).sort({ date: -1 })
    res.json({ ...month.toObject(), transactions })
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const month = await Month.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!month) return res.status(404).json({ error: 'Month not found' })
    res.json(month)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const month = await Month.findByIdAndDelete(req.params.id)
    if (!month) return res.status(404).json({ error: 'Month not found' })
    await Transaction.deleteMany({ month: month._id })
    res.status(204).end()
  } catch (err) { next(err) }
})

router.post('/:id/transactions', async (req, res, next) => {
  try {
    const month = await Month.findById(req.params.id)
    if (!month) return res.status(404).json({ error: 'Month not found' })
    // support batch (array) or single transaction
    const payload = Array.isArray(req.body) ? req.body : [req.body]
    const txns = await Transaction.insertMany(payload.map(t => ({ ...t, month: month._id })))
    res.status(201).json(txns)
  } catch (err) { next(err) }
})

router.post('/:id/parse-screenshot', upload.single('screenshot'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng')
    fs.unlinkSync(req.file.path)
    res.json(parseOcrText(text))
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
    next(err)
  }
})

module.exports = router
```

- [ ] **Step 4: Write integration tests**

File: `server/tests/integration/months.routes.test.js`

```js
const request = require('supertest')
const app = require('../../src/app')
const Month = require('../../src/models/Month')
const Transaction = require('../../src/models/Transaction')

describe('Months API', () => {
  it('POST /api/months creates a month', async () => {
    const res = await request(app).post('/api/months').send({
      name: 'June 2026', startDate: '2026-06-01', endDate: '2026-06-30', exchangeRate: 1.6,
    })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('June 2026')
  })

  it('GET /api/months returns all months', async () => {
    await Month.create({ name: 'May', startDate: '2026-05-01', endDate: '2026-05-31' })
    const res = await request(app).get('/api/months')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
  })

  it('DELETE /api/months/:id also deletes transactions', async () => {
    const month = await Month.create({ name: 'May', startDate: '2026-05-01', endDate: '2026-05-31' })
    await Transaction.create({ name: 'Shop', currency: 'NZD', value: 10, date: new Date(), month: month._id })
    await request(app).delete(`/api/months/${month._id}`)
    expect(await Transaction.countDocuments({ month: month._id })).toBe(0)
  })
})
```

- [ ] **Step 5: Run integration tests**

```bash
cd personal-assistant/server && npm test -- tests/integration/months.routes.test.js
```

Expected: 3 passing

- [ ] **Step 6: Commit**

```bash
git add personal-assistant/server/src/routes/ personal-assistant/server/src/middleware/ personal-assistant/server/tests/integration/
git commit -m "feat: add months and transactions routes with integration tests"
```

---

## Task 5: Server Routes — Lists, Items & Forecast

**Files:**
- Create: `server/src/routes/lists.js`
- Create: `server/src/routes/items.js`
- Create: `server/src/routes/forecast.js`
- Create: `server/tests/integration/lists.routes.test.js`

- [ ] **Step 1: Create `server/src/routes/items.js`**

```js
const express = require('express')
const router = express.Router()
const Item = require('../models/Item')

router.put('/:id', async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!item) return res.status(404).json({ error: 'Item not found' })
    res.json(item)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ error: 'Item not found' })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
```

- [ ] **Step 2: Create `server/src/routes/lists.js`**

```js
const express = require('express')
const router = express.Router()
const List = require('../models/List')
const Item = require('../models/Item')

router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.type ? { type: req.query.type } : {}
    const lists = await List.find(filter).sort({ createdAt: 1 })
    res.json(lists)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const list = await List.create(req.body)
    res.status(201).json(list)
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const list = await List.findById(req.params.id)
    if (!list) return res.status(404).json({ error: 'List not found' })
    const items = await Item.find({ list: list._id }).sort({ order: 1 })
    res.json({ ...list.toObject(), items })
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const list = await List.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!list) return res.status(404).json({ error: 'List not found' })
    res.json(list)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const list = await List.findByIdAndDelete(req.params.id)
    if (!list) return res.status(404).json({ error: 'List not found' })
    await Item.deleteMany({ list: list._id })
    res.status(204).end()
  } catch (err) { next(err) }
})

router.post('/:id/items', async (req, res, next) => {
  try {
    const list = await List.findById(req.params.id)
    if (!list) return res.status(404).json({ error: 'List not found' })
    const count = await Item.countDocuments({ list: list._id })
    const item = await Item.create({ ...req.body, list: list._id, order: count })
    res.status(201).json(item)
  } catch (err) { next(err) }
})

router.put('/:id/reorder', async (req, res, next) => {
  try {
    // body: [{ id, order }]
    const updates = req.body
    await Promise.all(updates.map(({ id, order }) => Item.findByIdAndUpdate(id, { order })))
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
```

- [ ] **Step 3: Create `server/src/routes/forecast.js`**

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
    const { income, fixedCosts } = req.body
    if (income !== undefined) settings.income = income
    if (fixedCosts !== undefined) settings.fixedCosts = fixedCosts
    await settings.save()
    res.json(settings)
  } catch (err) { next(err) }
})

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

module.exports = router
```

- [ ] **Step 4: Write lists integration test**

File: `server/tests/integration/lists.routes.test.js`

```js
const request = require('supertest')
const app = require('../../src/app')
const List = require('../../src/models/List')

describe('Lists API', () => {
  it('POST /api/lists creates a list', async () => {
    const res = await request(app).post('/api/lists').send({ name: 'My List', type: 'custom' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('My List')
  })

  it('GET /api/lists?type=custom filters by type', async () => {
    await List.create({ name: 'A', type: 'custom' })
    await List.create({ name: 'B', type: 'todo' })
    const res = await request(app).get('/api/lists?type=custom')
    expect(res.body.length).toBe(1)
    expect(res.body[0].name).toBe('A')
  })

  it('POST /api/lists/:id/items adds item to list', async () => {
    const list = await List.create({ name: 'Tasks', type: 'custom' })
    const res = await request(app).post(`/api/lists/${list._id}/items`).send({ name: 'Buy milk' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Buy milk')
  })
})
```

- [ ] **Step 5: Run all server tests**

```bash
cd personal-assistant/server && npm test
```

Expected: all tests passing

- [ ] **Step 6: Commit**

```bash
git add personal-assistant/server/src/routes/ personal-assistant/server/tests/
git commit -m "feat: add lists, items, and forecast routes with tests"
```

---

## Task 6: Client Initialization

**Files:**
- Create: `client/package.json`
- Create: `client/index.html`
- Create: `client/vite.config.js`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/api/client.js`
- Create: `client/src/test/setup.js`

- [ ] **Step 1: Create `client/package.json`**

```json
{
  "name": "personal-assistant-client",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": {
    "chart.js": "^4.4.3",
    "react": "^18.3.1",
    "react-chartjs-2": "^5.2.0",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.0",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `client/vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 3: Create `client/tailwind.config.js`**

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Create `client/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create `client/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Personal Assistant</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `client/src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: Create `client/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Create `client/src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Ledger from './pages/Ledger'
import Forecast from './pages/Forecast'
import FocusList from './pages/FocusList'
import WishList from './pages/WishList'
import Dreaming from './pages/Dreaming'
import ListPage from './pages/ListPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/focus" element={<FocusList />} />
        <Route path="/wishlist" element={<WishList />} />
        <Route path="/dreaming" element={<Dreaming />} />
        <Route path="/lists/:id" element={<ListPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 9: Create `client/src/api/client.js`**

```js
const BASE = '/api'

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const get = (path) => req(path)

export const post = (path, body) => req(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const put = (path, body) => req(path, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const del = (path) => req(path, { method: 'DELETE' })

export const upload = (path, formData) => req(path, { method: 'POST', body: formData })
```

- [ ] **Step 10: Create `client/src/test/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 11: Install client dependencies**

```bash
cd personal-assistant/client && npm install
```

- [ ] **Step 12: Commit**

```bash
git add personal-assistant/client/
git commit -m "feat: initialize React client with Vite and Tailwind"
```

---

## Task 7: Dashboard & NavCard

**Files:**
- Create: `client/src/components/NavCard.jsx`
- Create: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create `client/src/components/NavCard.jsx`**

```jsx
import { Link } from 'react-router-dom'

export default function NavCard({ label, description, path }) {
  return (
    <Link
      to={path}
      className="block border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition"
    >
      <div className="font-semibold text-gray-900">{label}</div>
      {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
    </Link>
  )
}
```

- [ ] **Step 2: Create `client/src/pages/Dashboard.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavCard from '../components/NavCard'
import { get, post, del } from '../api/client'

const MAIN_PAGES = [
  { label: 'Ledger', path: '/ledger', description: 'Track your spending' },
  { label: 'Forecast', path: '/forecast', description: 'Project your savings' },
  { label: 'Focus List', path: '/focus', description: 'Your top priorities' },
  { label: 'Wish List', path: '/wishlist', description: 'Things to buy' },
  { label: 'Dreaming', path: '/dreaming', description: 'Long-term goals' },
]

export default function Dashboard() {
  const [customLists, setCustomLists] = useState([])
  const [newName, setNewName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    get('/lists?type=custom').then(setCustomLists).catch(console.error)
  }, [])

  const createList = async () => {
    if (!newName.trim()) return
    const list = await post('/lists', { name: newName.trim(), type: 'custom' })
    setNewName('')
    navigate(`/lists/${list._id}`)
  }

  const deleteList = async (id) => {
    if (!confirm('Delete this list?')) return
    await del(`/lists/${id}`)
    setCustomLists(prev => prev.filter(l => l._id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {MAIN_PAGES.map(p => <NavCard key={p.path} {...p} />)}
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">Custom Lists</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {customLists.map(list => (
          <div key={list._id} className="relative border border-gray-200 rounded-lg p-4">
            <a href={`/lists/${list._id}`} className="font-medium text-gray-800 hover:underline block">
              {list.name}
            </a>
            <button
              onClick={() => deleteList(list._id)}
              className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 max-w-sm">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createList()}
          placeholder="New list name..."
          className="border border-gray-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button
          onClick={createList}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
        >
          + New List
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add personal-assistant/client/src/components/NavCard.jsx personal-assistant/client/src/pages/Dashboard.jsx
git commit -m "feat: add Dashboard page with navigation and custom list creation"
```

---

## Task 8: Ledger Page — Month Tabs & Notes

**Files:**
- Create: `client/src/pages/Ledger.jsx`
- Create: `client/src/components/NotesField.jsx`

- [ ] **Step 1: Create `client/src/components/NotesField.jsx`**

```jsx
import { useState } from 'react'
import { put } from '../api/client'

export default function NotesField({ monthId, initialValue }) {
  const [value, setValue] = useState(initialValue || '')
  const [saved, setSaved] = useState(false)

  const handleBlur = async () => {
    await put(`/months/${monthId}`, { details: value })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Month Notes {saved && <span className="text-green-600 text-xs">Saved</span>}
      </label>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleBlur}
        rows={4}
        placeholder="Goals, notes, reminders for this month..."
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
    </div>
  )
}
```

- [ ] **Step 2: Create `client/src/pages/Ledger.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { get, post } from '../api/client'
import TransactionList from '../components/TransactionList'
import TransactionForm from '../components/TransactionForm'
import OcrReview from '../components/OcrReview'
import SpendingChart from '../components/SpendingChart'
import CategoryTotals from '../components/CategoryTotals'
import NotesField from '../components/NotesField'

export default function Ledger() {
  const [months, setMonths] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [monthData, setMonthData] = useState(null)
  const [showAddMonth, setShowAddMonth] = useState(false)
  const [newMonth, setNewMonth] = useState({ name: '', startDate: '', endDate: '', exchangeRate: 1.65 })
  const [showOcr, setShowOcr] = useState(false)

  useEffect(() => {
    get('/months').then(data => {
      setMonths(data)
      if (data.length) setActiveId(data[0]._id)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!activeId) return
    get(`/months/${activeId}`).then(setMonthData).catch(console.error)
  }, [activeId])

  const addMonth = async (e) => {
    e.preventDefault()
    const month = await post('/months', newMonth)
    setMonths(prev => [month, ...prev])
    setActiveId(month._id)
    setShowAddMonth(false)
    setNewMonth({ name: '', startDate: '', endDate: '', exchangeRate: 1.65 })
  }

  const onTransactionSaved = () => {
    get(`/months/${activeId}`).then(setMonthData)
  }

  // Group months by year for display
  const grouped = months.reduce((acc, m) => {
    const year = new Date(m.startDate).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(m)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ledger</h1>
        <button
          onClick={() => setShowAddMonth(!showAddMonth)}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
        >
          + Add Month
        </button>
      </div>

      {showAddMonth && (
        <form onSubmit={addMonth} className="border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
          <input required placeholder="Name (e.g. June 2026)" value={newMonth.name}
            onChange={e => setNewMonth(p => ({ ...p, name: e.target.value }))}
            className="border rounded px-3 py-2 text-sm col-span-2" />
          <input required type="date" value={newMonth.startDate}
            onChange={e => setNewMonth(p => ({ ...p, startDate: e.target.value }))}
            className="border rounded px-3 py-2 text-sm" />
          <input required type="date" value={newMonth.endDate}
            onChange={e => setNewMonth(p => ({ ...p, endDate: e.target.value }))}
            className="border rounded px-3 py-2 text-sm" />
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-sm text-gray-600">NZD per USD:</label>
            <input type="number" step="0.01" value={newMonth.exchangeRate}
              onChange={e => setNewMonth(p => ({ ...p, exchangeRate: parseFloat(e.target.value) }))}
              className="border rounded px-3 py-2 text-sm w-28" />
          </div>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded text-sm">Save</button>
          <button type="button" onClick={() => setShowAddMonth(false)} className="border rounded px-4 py-2 text-sm">Cancel</button>
        </form>
      )}

      {/* Year/month tabs */}
      <div className="mb-6">
        {Object.keys(grouped).sort((a, b) => b - a).map(year => (
          <div key={year} className="mb-2">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">{year}</div>
            <div className="flex flex-wrap gap-2">
              {grouped[year].map(m => (
                <button
                  key={m._id}
                  onClick={() => setActiveId(m._id)}
                  className={`px-4 py-2 rounded text-sm border ${activeId === m._id ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {monthData && (
        <>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setShowOcr(false)}
              className={`px-4 py-2 rounded text-sm ${!showOcr ? 'bg-gray-800 text-white' : 'border border-gray-300'}`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setShowOcr(true)}
              className={`px-4 py-2 rounded text-sm ${showOcr ? 'bg-gray-800 text-white' : 'border border-gray-300'}`}
            >
              Upload Screenshot
            </button>
          </div>

          {showOcr
            ? <OcrReview monthId={activeId} onSaved={() => { setShowOcr(false); onTransactionSaved() }} />
            : <TransactionForm monthId={activeId} onSaved={onTransactionSaved} />
          }

          <TransactionList
            transactions={monthData.transactions || []}
            exchangeRate={monthData.exchangeRate}
            onUpdate={onTransactionSaved}
          />

          {monthData.transactions?.length > 0 && (
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <SpendingChart transactions={monthData.transactions} exchangeRate={monthData.exchangeRate} />
              <CategoryTotals transactions={monthData.transactions} exchangeRate={monthData.exchangeRate} />
            </div>
          )}

          <NotesField monthId={activeId} initialValue={monthData.details} />
        </>
      )}

      {!months.length && (
        <p className="text-gray-500 text-sm">No months yet. Add one to get started.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add personal-assistant/client/src/pages/Ledger.jsx personal-assistant/client/src/components/NotesField.jsx
git commit -m "feat: add Ledger page shell with month tabs"
```

---

## Task 9: Ledger Components — TransactionList & TransactionForm

**Files:**
- Create: `client/src/components/TransactionList.jsx`
- Create: `client/src/components/TransactionForm.jsx`

- [ ] **Step 1: Create `client/src/components/TransactionForm.jsx`**

```jsx
import { useState } from 'react'
import { post } from '../api/client'

const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts']

export default function TransactionForm({ monthId, onSaved }) {
  const empty = { name: '', category: 'general', currency: 'NZD', value: '', date: new Date().toISOString().split('T')[0] }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.value || !form.date) return
    setSaving(true)
    await post(`/months/${monthId}/transactions`, { ...form, value: parseFloat(form.value) })
    setForm(empty)
    setSaving(false)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-4 items-end">
      <input required placeholder="Merchant" value={form.name} onChange={e => set('name', e.target.value)}
        className="border rounded px-3 py-2 text-sm flex-1 min-w-32" />
      <select value={form.category} onChange={e => set('category', e.target.value)}
        className="border rounded px-3 py-2 text-sm">
        {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
      </select>
      <select value={form.currency} onChange={e => set('currency', e.target.value)}
        className="border rounded px-3 py-2 text-sm">
        <option value="NZD">NZD</option>
        <option value="USD">USD</option>
      </select>
      <input required type="number" step="0.01" min="0" placeholder="Amount" value={form.value}
        onChange={e => set('value', e.target.value)}
        className="border rounded px-3 py-2 text-sm w-28" />
      <input required type="date" value={form.date} onChange={e => set('date', e.target.value)}
        className="border rounded px-3 py-2 text-sm" />
      <button type="submit" disabled={saving}
        className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50">
        Add
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create `client/src/components/TransactionList.jsx`**

```jsx
import { useState } from 'react'
import { put, del } from '../api/client'

const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts']

export default function TransactionList({ transactions, exchangeRate, onUpdate }) {
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  const nzd = (t) => t.currency === 'USD' ? (t.value * exchangeRate).toFixed(2) : t.value.toFixed(2)

  const startEdit = (t) => { setEditId(t._id); setEditName(t.name) }

  const saveEdit = async (t) => {
    await put(`/transactions/${t._id}`, { name: editName })
    setEditId(null)
    onUpdate()
  }

  const changeCategory = async (t, category) => {
    await put(`/transactions/${t._id}`, { category })
    onUpdate()
  }

  const remove = async (id) => {
    if (!confirm('Delete transaction?')) return
    await del(`/transactions/${id}`)
    onUpdate()
  }

  if (!transactions.length) return <p className="text-sm text-gray-400 mb-4">No transactions yet.</p>

  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2 font-medium">Merchant</th>
            <th className="pb-2 font-medium">Category</th>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium text-right">Amount</th>
            <th className="pb-2 font-medium text-right">NZD</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t._id} className="border-b last:border-0">
              <td className="py-2 pr-2">
                {editId === t._id
                  ? <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                      onBlur={() => saveEdit(t)} onKeyDown={e => e.key === 'Enter' && saveEdit(t)}
                      className="border rounded px-2 py-1 text-sm w-full" />
                  : <button onClick={() => startEdit(t)} className="text-left hover:underline">{t.name}</button>
                }
              </td>
              <td className="py-2 pr-2">
                <select value={t.category} onChange={e => changeCategory(t, e.target.value)}
                  className="border rounded px-2 py-1 text-xs">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </td>
              <td className="py-2 pr-2 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
              <td className="py-2 pr-2 text-right">{t.value.toFixed(2)} {t.currency}</td>
              <td className="py-2 pr-2 text-right font-medium">${nzd(t)}</td>
              <td className="py-2 text-right">
                <button onClick={() => remove(t._id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add personal-assistant/client/src/components/TransactionList.jsx personal-assistant/client/src/components/TransactionForm.jsx
git commit -m "feat: add transaction list and form components"
```

---

## Task 10: Ledger Components — OCR Review, Chart & Category Totals

**Files:**
- Create: `client/src/components/OcrReview.jsx`
- Create: `client/src/components/SpendingChart.jsx`
- Create: `client/src/components/CategoryTotals.jsx`

- [ ] **Step 1: Create `client/src/components/OcrReview.jsx`**

```jsx
import { useState } from 'react'
import { upload, post } from '../api/client'

const CATEGORIES = ['general', 'shopping', 'food', 'bills', 'rent', 'travel', 'gifts']

export default function OcrReview({ monthId, onSaved }) {
  const [file, setFile] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('screenshot', file)
    const parsed = await upload(`/months/${monthId}/parse-screenshot`, fd)
    setRows(parsed.map((r, i) => ({ ...r, id: i, category: 'general' })))
    setLoading(false)
  }

  const update = (id, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  const remove = (id) => setRows(prev => prev.filter(r => r.id !== id))

  const handleSave = async () => {
    const payload = rows.map(({ name, category, currency, value, date }) => ({ name, category, currency, value: parseFloat(value), date }))
    await post(`/months/${monthId}/transactions`, payload)
    onSaved()
  }

  return (
    <div className="mb-6">
      <div className="flex gap-3 items-center mb-4">
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="text-sm" />
        <button onClick={handleUpload} disabled={!file || loading}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
          {loading ? 'Parsing...' : 'Parse Screenshot'}
        </button>
      </div>

      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Merchant</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Currency</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">
                      <input value={r.name} onChange={e => update(r.id, 'name', e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" step="0.01" value={r.value} onChange={e => update(r.id, 'value', e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-24" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="date" value={r.date} onChange={e => update(r.id, 'date', e.target.value)}
                        className="border rounded px-2 py-1 text-sm" />
                    </td>
                    <td className="py-2 pr-2">
                      <select value={r.currency} onChange={e => update(r.id, 'currency', e.target.value)}
                        className="border rounded px-2 py-1 text-sm">
                        <option>NZD</option>
                        <option>USD</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <select value={r.category} onChange={e => update(r.id, 'category', e.target.value)}
                        className="border rounded px-2 py-1 text-sm">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="py-2">
                      <button onClick={() => remove(r.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleSave}
            className="bg-green-700 text-white px-4 py-2 rounded text-sm hover:bg-green-800">
            Save {rows.length} Transaction{rows.length !== 1 ? 's' : ''}
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `client/src/components/SpendingChart.jsx`**

```jsx
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = {
  shopping: '#6366f1',
  food: '#22c55e',
  bills: '#f59e0b',
  rent: '#ef4444',
  travel: '#3b82f6',
  gifts: '#ec4899',
  general: '#9ca3af',
}

export default function SpendingChart({ transactions, exchangeRate }) {
  const totals = transactions.reduce((acc, t) => {
    const nzd = t.currency === 'USD' ? t.value * exchangeRate : t.value
    acc[t.category] = (acc[t.category] || 0) + nzd
    return acc
  }, {})

  const categories = Object.keys(totals)
  if (!categories.length) return null

  const data = {
    labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
    datasets: [{
      data: categories.map(c => totals[c].toFixed(2)),
      backgroundColor: categories.map(c => COLORS[c] || '#9ca3af'),
    }],
  }

  return (
    <div className="max-w-xs">
      <h3 className="font-semibold text-gray-700 mb-3">Spending by Category</h3>
      <Pie data={data} />
    </div>
  )
}
```

- [ ] **Step 3: Create `client/src/components/CategoryTotals.jsx`**

```jsx
export default function CategoryTotals({ transactions, exchangeRate }) {
  const totals = transactions.reduce((acc, t) => {
    const nzd = t.currency === 'USD' ? t.value * exchangeRate : t.value
    acc[t.category] = (acc[t.category] || 0) + nzd
    return acc
  }, {})

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
  const total = sorted.reduce((s, [, v]) => s + v, 0)

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">Totals (NZD)</h3>
      <table className="w-full text-sm">
        <tbody>
          {sorted.map(([cat, amount]) => (
            <tr key={cat} className="border-b last:border-0">
              <td className="py-1 capitalize text-gray-600">{cat}</td>
              <td className="py-1 text-right font-medium">${amount.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="pt-2">Total</td>
            <td className="pt-2 text-right">${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add personal-assistant/client/src/components/OcrReview.jsx personal-assistant/client/src/components/SpendingChart.jsx personal-assistant/client/src/components/CategoryTotals.jsx
git commit -m "feat: add OCR review, spending chart, and category totals"
```

---

## Task 11: Forecast Page

**Files:**
- Create: `client/src/pages/Forecast.jsx`

- [ ] **Step 1: Create `client/src/pages/Forecast.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { get, put } from '../api/client'

export default function Forecast() {
  const [settings, setSettings] = useState(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [ledgerAverages, setLedgerAverages] = useState({ bills: 0, rent: 0 })

  useEffect(() => {
    get('/forecast').then(setSettings).catch(console.error)
    get('/months/ledger-averages').then(setLedgerAverages).catch(console.error)
  }, [])

  const updateSettings = async (field, value) => {
    const updated = await put('/forecast', { [field]: parseFloat(value) || 0 })
    setSettings(updated)
  }

  const updateMonth = async (index, unexpectedCosts) => {
    const updated = await put(`/forecast/months/${index}`, { unexpectedCosts: parseFloat(unexpectedCosts) || 0 })
    setSettings(updated)
  }

  if (!settings) return <div className="p-6 text-gray-500">Loading...</div>

  const { income, fixedCosts, months } = settings

  const projectedSavings = months.map(m => {
    const saving = income - fixedCosts - (m.unexpectedCosts || 0)
    return Math.max(0, saving)
  })

  const yearlySavings = projectedSavings.reduce((s, v) => s + v, 0)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Forecast</h1>
      <div className="text-2xl font-semibold text-green-700 mb-6">
        Projected yearly savings: ${yearlySavings.toFixed(2)} NZD
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (NZD)</label>
          <input
            type="number" step="0.01" defaultValue={income}
            onBlur={e => updateSettings('income', e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fixed Costs (NZD)
            {(ledgerAverages.bills + ledgerAverages.rent) > 0 && (
              <span className="text-xs text-gray-400 ml-1">
                (ledger avg: ${(ledgerAverages.bills + ledgerAverages.rent).toFixed(0)})
              </span>
            )}
          </label>
          <input
            type="number" step="0.01" defaultValue={fixedCosts}
            onBlur={e => updateSettings('fixedCosts', e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full"
          />
        </div>
      </div>

      {/* Month tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {months.map(m => (
          <button key={m.index} onClick={() => setActiveIdx(m.index)}
            className={`px-3 py-1 rounded text-sm border ${activeIdx === m.index ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {months.filter(m => m.index === activeIdx).map(m => (
        <div key={m.index} className="border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-lg mb-4">{m.label}</h2>
          <div className="grid grid-cols-2 gap-4 max-w-sm mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Unexpected Costs (NZD)</label>
              <input type="number" step="0.01" defaultValue={m.unexpectedCosts}
                key={`${m.index}-${m.unexpectedCosts}`}
                onBlur={e => updateMonth(m.index, e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full" />
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Income: <span className="font-medium">${income.toFixed(2)}</span></div>
            <div>Fixed costs: <span className="font-medium">-${fixedCosts.toFixed(2)}</span></div>
            {m.unexpectedCosts > 0 && <div>Unexpected: <span className="font-medium">-${m.unexpectedCosts.toFixed(2)}</span></div>}
            <div className="text-base font-semibold text-green-700 pt-1">
              Projected savings: ${projectedSavings[m.index]?.toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add personal-assistant/client/src/pages/Forecast.jsx
git commit -m "feat: add Forecast page with 12-month projections"
```

---

## Task 12: Focus List Page (Drag & Drop)

**Files:**
- Create: `client/src/utils/gradient.js`
- Create: `client/src/components/DragList.jsx`
- Create: `client/src/pages/FocusList.jsx`

- [ ] **Step 1: Create `client/src/utils/gradient.js`**

```js
// Returns a style object interpolating red→yellow based on position
export function getItemStyle(index, total) {
  if (total <= 1) return { backgroundColor: 'rgba(220, 38, 38, 0.12)' }
  const ratio = index / (total - 1)
  // red(220,38,38) → yellow(234,179,8)
  const r = Math.round(220 + (234 - 220) * ratio)
  const g = Math.round(38 + (179 - 38) * ratio)
  const b = Math.round(38 + (8 - 38) * ratio)
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)` }
}
```

- [ ] **Step 2: Create `client/src/components/DragList.jsx`**

```jsx
import { useState } from 'react'
import { put, del } from '../api/client'
import { getItemStyle } from '../utils/gradient'

export default function DragList({ listId, items: initialItems, onUpdate }) {
  const [items, setItems] = useState(initialItems)
  const [draggedId, setDraggedId] = useState(null)

  const pending = items.filter(i => i.status === 'pending')
  const completed = items.filter(i => i.status === 'completed')

  const handleDragStart = (id) => setDraggedId(id)
  const handleDragOver = (e) => e.preventDefault()

  const handleDrop = async (targetId) => {
    if (!draggedId || draggedId === targetId) return
    const draggedIdx = pending.findIndex(i => i._id === draggedId)
    const targetIdx = pending.findIndex(i => i._id === targetId)
    const reordered = [...pending]
    const [moved] = reordered.splice(draggedIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    const withOrder = reordered.map((item, idx) => ({ ...item, order: idx }))
    setItems([...withOrder, ...completed])
    setDraggedId(null)
    await put(`/lists/${listId}/reorder`, withOrder.map(({ _id, order }) => ({ id: _id, order })))
  }

  const toggleDone = async (item) => {
    const newStatus = item.status === 'pending' ? 'completed' : 'pending'
    await put(`/items/${item._id}`, { status: newStatus })
    onUpdate()
  }

  const remove = async (id) => {
    await del(`/items/${id}`)
    onUpdate()
  }

  return (
    <div>
      {pending.map((item, idx) => (
        <div
          key={item._id}
          draggable
          onDragStart={() => handleDragStart(item._id)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(item._id)}
          style={getItemStyle(idx, pending.length)}
          className={`flex items-center gap-3 px-4 py-3 rounded mb-1 cursor-grab active:cursor-grabbing ${idx < 3 ? 'font-semibold' : ''}`}
        >
          <input type="checkbox" onChange={() => toggleDone(item)} className="shrink-0" />
          <span className="flex-1">{item.name}</span>
          <button onClick={() => remove(item._id)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
        </div>
      ))}

      {completed.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Done</div>
          {completed.map(item => (
            <div key={item._id} className="flex items-center gap-3 px-4 py-2 text-gray-400 line-through mb-1">
              <input type="checkbox" checked onChange={() => toggleDone(item)} className="shrink-0" />
              <span className="flex-1">{item.name}</span>
              <button onClick={() => remove(item._id)} className="text-xs hover:text-red-500">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `client/src/pages/FocusList.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { get, post } from '../api/client'
import DragList from '../components/DragList'

export default function FocusList() {
  const [list, setList] = useState(null)
  const [newItem, setNewItem] = useState('')

  const load = () =>
    get('/lists?type=todo').then(lists => {
      if (lists.length) return get(`/lists/${lists[0]._id}`)
      return post('/lists', { name: 'Focus List', type: 'todo' }).then(l => ({ ...l, items: [] }))
    }).then(setList).catch(console.error)

  useEffect(() => { load() }, [])

  const addItem = async () => {
    if (!newItem.trim() || !list) return
    await post(`/lists/${list._id}/items`, { name: newItem.trim() })
    setNewItem('')
    load()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Focus List</h1>
      <div className="flex gap-2 mb-6">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add a task..."
          className="border border-gray-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button onClick={addItem} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
          Add
        </button>
      </div>
      {list && (
        <DragList listId={list._id} items={list.items || []} onUpdate={load} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add personal-assistant/client/src/utils/gradient.js personal-assistant/client/src/components/DragList.jsx personal-assistant/client/src/pages/FocusList.jsx
git commit -m "feat: add Focus List with drag-and-drop and gradient styling"
```

---

## Task 13: Wish List, Dreaming & Custom List Pages

**Files:**
- Create: `client/src/pages/WishList.jsx`
- Create: `client/src/pages/Dreaming.jsx`
- Create: `client/src/pages/ListPage.jsx`

- [ ] **Step 1: Create `client/src/pages/WishList.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { get, post, del } from '../api/client'

export default function WishList() {
  const [list, setList] = useState(null)
  const [newItem, setNewItem] = useState('')

  const load = () =>
    get('/lists?type=toBuy').then(lists => {
      if (lists.length) return get(`/lists/${lists[0]._id}`)
      return post('/lists', { name: 'Wish List', type: 'toBuy' }).then(l => ({ ...l, items: [] }))
    }).then(setList).catch(console.error)

  useEffect(() => { load() }, [])

  const addItem = async () => {
    if (!newItem.trim() || !list) return
    await post(`/lists/${list._id}/items`, { name: newItem.trim() })
    setNewItem('')
    load()
  }

  const remove = async (id) => {
    await del(`/items/${id}`)
    load()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Wish List</h1>
      <div className="flex gap-2 mb-6">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add something to buy..."
          className="border border-gray-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button onClick={addItem} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
          Add
        </button>
      </div>
      {list?.items?.map(item => (
        <div key={item._id} className="flex items-center justify-between py-2 border-b last:border-0">
          <span className="text-gray-800">{item.name}</span>
          <button onClick={() => remove(item._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `client/src/pages/Dreaming.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { get, post, put, del } from '../api/client'

export default function Dreaming() {
  const [list, setList] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [goal, setGoal] = useState({ savingGoal: '', goalDate: '' })

  const load = () =>
    get('/lists?type=longTermPlan').then(lists => {
      if (lists.length) return get(`/lists/${lists[0]._id}`)
      return post('/lists', { name: 'Dreaming', type: 'longTermPlan' }).then(l => ({ ...l, items: [] }))
    }).then(data => {
      setList(data)
      setGoal({ savingGoal: data.savingGoal || '', goalDate: data.goalDate ? data.goalDate.split('T')[0] : '' })
    }).catch(console.error)

  useEffect(() => {
    load()
    get('/forecast').then(setForecast).catch(console.error)
  }, [])

  const saveGoal = async () => {
    if (!list) return
    const updated = await put(`/lists/${list._id}`, {
      savingGoal: parseFloat(goal.savingGoal) || 0,
      goalDate: goal.goalDate || null,
    })
    setList(prev => ({ ...prev, ...updated }))
  }

  const addItem = async () => {
    if (!newItem.trim() || !list) return
    await post(`/lists/${list._id}/items`, { name: newItem.trim() })
    setNewItem('')
    load()
  }

  const remove = async (id) => {
    await del(`/items/${id}`)
    load()
  }

  // Calculate projected savings by goal date
  const projectedByGoalDate = () => {
    if (!forecast || !goal.goalDate) return null
    const target = new Date(goal.goalDate)
    const now = new Date()
    const months = forecast.months.filter(m => new Date(m.date) <= target)
    return months.reduce((sum, m) => {
      return sum + Math.max(0, forecast.income - forecast.fixedCosts - (m.unexpectedCosts || 0))
    }, 0)
  }

  const projected = projectedByGoalDate()
  const savingGoal = parseFloat(goal.savingGoal) || 0
  const diff = projected !== null ? projected - savingGoal : null

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Dreaming</h1>

      <div className="border border-gray-200 rounded-lg p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-3">Saving Goal</h2>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Goal Amount (NZD)</label>
            <input type="number" step="0.01" value={goal.savingGoal}
              onChange={e => setGoal(p => ({ ...p, savingGoal: e.target.value }))}
              onBlur={saveGoal}
              className="border rounded px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Target Date</label>
            <input type="date" value={goal.goalDate}
              onChange={e => setGoal(p => ({ ...p, goalDate: e.target.value }))}
              onBlur={saveGoal}
              className="border rounded px-3 py-2 text-sm w-full" />
          </div>
        </div>
        {diff !== null && (
          <div className={`text-sm font-semibold ${diff >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {diff >= 0
              ? `On track — ${diff >= 0 ? '+' : ''}$${diff.toFixed(2)} ahead`
              : `Behind by $${Math.abs(diff).toFixed(2)}`}
            {projected !== null && <span className="text-gray-500 font-normal ml-2">(projected: ${projected.toFixed(2)})</span>}
          </div>
        )}
      </div>

      <h2 className="font-semibold text-gray-800 mb-3">Plans & Ideas</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add a plan or idea..."
          className="border border-gray-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button onClick={addItem} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
          Add
        </button>
      </div>
      {list?.items?.map(item => (
        <div key={item._id} className="flex items-center justify-between py-2 border-b last:border-0">
          <span className="text-gray-800">{item.name}</span>
          <button onClick={() => remove(item._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create `client/src/pages/ListPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { get, post, put, del } from '../api/client'

export default function ListPage() {
  const { id } = useParams()
  const [list, setList] = useState(null)
  const [newItem, setNewItem] = useState('')

  const load = () => get(`/lists/${id}`).then(setList).catch(console.error)

  useEffect(() => { load() }, [id])

  const addItem = async () => {
    if (!newItem.trim()) return
    await post(`/lists/${id}/items`, { name: newItem.trim() })
    setNewItem('')
    load()
  }

  const toggle = async (item) => {
    await put(`/items/${item._id}`, { status: item.status === 'pending' ? 'completed' : 'pending' })
    load()
  }

  const remove = async (itemId) => {
    await del(`/items/${itemId}`)
    load()
  }

  if (!list) return <div className="p-6 text-gray-500">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900">{list.name}</h1>
      {list.description && <p className="text-gray-500 mt-1 mb-6">{list.description}</p>}

      <div className="flex gap-2 mb-6 mt-4">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add an item..."
          className="border border-gray-300 rounded px-3 py-2 flex-1 text-sm"
        />
        <button onClick={addItem} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
          Add
        </button>
      </div>

      {list.items?.map(item => (
        <div key={item._id} className="flex items-center gap-3 py-2 border-b last:border-0">
          <input type="checkbox" checked={item.status === 'completed'} onChange={() => toggle(item)} />
          <span className={`flex-1 ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.name}
          </span>
          <button onClick={() => remove(item._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add personal-assistant/client/src/pages/WishList.jsx personal-assistant/client/src/pages/Dreaming.jsx personal-assistant/client/src/pages/ListPage.jsx
git commit -m "feat: add Wish List, Dreaming, and custom List pages"
```

---

## Task 14: Root Dev Script & Final Wiring

**Files:**
- Modify: `personal-assistant/package.json` (already has concurrently)

- [ ] **Step 1: Install root dependencies**

```bash
cd personal-assistant && npm install
```

- [ ] **Step 2: Verify server starts**

```bash
cd personal-assistant/server && npm run dev
```

Expected: `Server running on port 5000`

- [ ] **Step 3: Verify client starts**

In a separate terminal:
```bash
cd personal-assistant/client && npm run dev
```

Expected: Vite dev server at `http://localhost:5173`

- [ ] **Step 4: Verify both run together from root**

```bash
cd personal-assistant && npm run dev
```

Expected: Both server and client start. Visit `http://localhost:5173` and see the Dashboard.

- [ ] **Step 5: Smoke test key flows**
  - Dashboard loads with nav cards
  - Navigate to Ledger → add a month → add a transaction manually
  - Navigate to Forecast → income/fixed costs fields save on blur
  - Navigate to Focus List → add an item → drag to reorder
  - Navigate to Wish List → add and delete an item
  - Navigate to Dreaming → set a saving goal and add a plan
  - Create a custom list from Dashboard → navigate to it → add items

- [ ] **Step 6: Final commit**

```bash
git add personal-assistant/
git commit -m "feat: complete personal assistant app — all pages wired"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Budget dashboard with month tabs — Ledger page, Task 8
- [x] Manual transaction input — TransactionForm, Task 9
- [x] Screenshot OCR upload + review — OcrReview, Task 10
- [x] Past months retroactively — Add Month form, Task 8
- [x] Category self-assignment — category dropdown in TransactionList, Task 9
- [x] Pie chart by category — SpendingChart, Task 10
- [x] Numerical category totals — CategoryTotals, Task 10
- [x] Edit transaction names — inline edit in TransactionList, Task 9
- [x] USD/NZD dual display — TransactionList shows original + NZD, Task 9
- [x] Month notes — NotesField, Task 8
- [x] Future extrapolation (Forecast) — Task 11
- [x] 12-month tabs from today — Forecast page, Task 11
- [x] Yearly savings forecast header — Forecast page, Task 11
- [x] Focus List with gradient and drag-drop — Tasks 12
- [x] Top 3 bold — DragList idx < 3, Task 12
- [x] Wish List — Task 13
- [x] Dreaming page with saving goal and gap calculation — Task 13
- [x] Dashboard with nav buttons — Task 7
- [x] Create new custom list from Dashboard — Task 7
- [x] Delete custom list — Task 7
- [x] Custom list pages — Task 13
- [x] Exchange rate per month — Month model + Forecast route, Tasks 2 & 5

**Notes:**
- The `setupFilesAfterFramework` key in jest.config.js may need to be verified — the correct Jest 29 key is `setupFilesAfterFramework`. If tests fail to pick up setup.js, try renaming to `globalSetup` with a module export pattern, or check Jest docs for the exact key.
- Tesseract.js v5 uses ESM by default in Node — if `require('tesseract.js')` fails, use dynamic import: `const { createWorker } = await import('tesseract.js')` in the route handler.
