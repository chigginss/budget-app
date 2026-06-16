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
        const nzd = t.valueInNZD(month.exchangeRate)
        if (t.category === 'bills') totalBills += nzd
        if (t.category === 'rent') totalRent += nzd
      }
    }
    res.json({ bills: totalBills / months.length, rent: totalRent / months.length })
  } catch (err) { next(err) }
})

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
