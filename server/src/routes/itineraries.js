const express = require('express')
const router = express.Router()
const Itinerary = require('../models/Itinerary')
const Activity = require('../models/Activity')

router.get('/', async (req, res, next) => {
  try {
    const itineraries = await Itinerary.find().sort({ startDate: 1 })
    res.json(itineraries)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const itinerary = await Itinerary.create(req.body)
    res.status(201).json(itinerary)
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id)
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' })
    const activities = await Activity.find({ itinerary: itinerary._id }).sort({ date: 1, order: 1 })
    res.json({ ...itinerary.toObject(), activities })
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    )
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' })
    res.json(itinerary)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findByIdAndDelete(req.params.id)
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' })
    await Activity.deleteMany({ itinerary: itinerary._id })
    res.status(204).end()
  } catch (err) { next(err) }
})

router.put('/:id/days/:date', async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id)
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' })

    const datePrefix = req.params.date
    const { title = '', description = '', notes = '' } = req.body
    const isEmpty = title === '' && description === '' && notes === ''

    const idx = itinerary.days.findIndex(d =>
      d.date.toISOString().startsWith(datePrefix)
    )

    if (isEmpty) {
      if (idx !== -1) itinerary.days.splice(idx, 1)
    } else if (idx !== -1) {
      itinerary.days[idx].title = title
      itinerary.days[idx].description = description
      itinerary.days[idx].notes = notes
    } else {
      itinerary.days.push({ date: new Date(datePrefix + 'T00:00:00.000Z'), title, description, notes })
    }

    await itinerary.save()
    res.json(itinerary)
  } catch (err) { next(err) }
})

// POST /api/itineraries/:id/activities
router.post('/:id/activities', async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id)
    if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' })

    const datePrefix = new Date(req.body.date).toISOString().split('T')[0]
    const dayStart = new Date(datePrefix + 'T00:00:00.000Z')
    const dayEnd = new Date(datePrefix + 'T23:59:59.999Z')
    const count = await Activity.countDocuments({
      itinerary: itinerary._id,
      date: { $gte: dayStart, $lte: dayEnd },
    })
    const activity = await Activity.create({
      ...req.body,
      date: dayStart,
      itinerary: itinerary._id,
      order: count,
    })
    res.status(201).json(activity)
  } catch (err) { next(err) }
})

module.exports = router
