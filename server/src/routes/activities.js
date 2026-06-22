const express = require('express')
const router = express.Router()
const Activity = require('../models/Activity')

router.put('/:id', async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    )
    if (!activity) return res.status(404).json({ error: 'Activity not found' })
    res.json(activity)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id)
    if (!activity) return res.status(404).json({ error: 'Activity not found' })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
