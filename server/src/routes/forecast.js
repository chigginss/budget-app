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
      variableCosts: [],
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
    if (req.body.variableCosts !== undefined) month.variableCosts = req.body.variableCosts
    settings.markModified('months')
    await settings.save()
    res.json(settings)
  } catch (err) { next(err) }
})

router.get('/', async (req, res, next) => {
  try {
    let settings = await ForecastSettings.findOne()
    if (!settings) settings = await ForecastSettings.create({ months: generateMonths() })
    // Strip any fixedCosts entries that lack a valid amount (legacy schema migration)
    const cleaned = settings.fixedCosts.filter(c => c && typeof c.amount === 'number' && !isNaN(c.amount))
    if (cleaned.length !== settings.fixedCosts.length) {
      settings.fixedCosts = cleaned
      await settings.save()
    }
    res.json(settings)
  } catch (err) { next(err) }
})

router.put('/', async (req, res, next) => {
  try {
    let settings = await ForecastSettings.findOne()
    if (!settings) settings = new ForecastSettings({ months: generateMonths() })
    const { income, currentBalance, checkingBalance, creditCardBalance, usdExchangeRate, fixedCosts } = req.body
    if (income !== undefined) settings.income = income
    if (currentBalance !== undefined) settings.currentBalance = currentBalance
    if (checkingBalance !== undefined) settings.checkingBalance = checkingBalance
    if (creditCardBalance !== undefined) settings.creditCardBalance = creditCardBalance
    if (usdExchangeRate !== undefined) settings.usdExchangeRate = usdExchangeRate
    if (fixedCosts !== undefined) settings.fixedCosts = fixedCosts
    await settings.save()
    res.json(settings)
  } catch (err) { next(err) }
})

module.exports = router
