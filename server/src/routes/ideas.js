const express = require('express')
const router = express.Router()
const Idea = require('../models/Idea')

router.put('/:id', async (req, res, next) => {
  try {
    const idea = await Idea.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!idea) return res.status(404).json({ error: 'Idea not found' })
    res.json(idea)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const idea = await Idea.findByIdAndDelete(req.params.id)
    if (!idea) return res.status(404).json({ error: 'Idea not found' })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
