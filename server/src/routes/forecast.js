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
