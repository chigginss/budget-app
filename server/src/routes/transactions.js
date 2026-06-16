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
