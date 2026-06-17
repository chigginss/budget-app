const express = require('express')
const router = express.Router()
const Idea = require('../models/Idea')

router.delete('/:id', async (req, res, next) => {
  try {
    const idea = await Idea.findByIdAndDelete(req.params.id)
    if (!idea) return res.status(404).json({ error: 'Idea not found' })
    res.status(204).end()
  } catch (err) { next(err) }
})

module.exports = router
