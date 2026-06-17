const express = require('express')
const router = express.Router()
const List = require('../models/List')
const Item = require('../models/Item')
const Idea = require('../models/Idea')

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
    if (list.type === 'ideas') {
      const ideas = await Idea.find({ list: list._id }).sort({ createdAt: -1 })
      return res.json({ ...list.toObject(), ideas })
    }
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
    await Idea.deleteMany({ list: list._id })
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

router.post('/:id/ideas', async (req, res, next) => {
  try {
    const list = await List.findById(req.params.id)
    if (!list) return res.status(404).json({ error: 'List not found' })
    const idea = await Idea.create({ ...req.body, list: list._id })
    res.status(201).json(idea)
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
