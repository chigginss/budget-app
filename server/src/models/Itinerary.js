const mongoose = require('mongoose')

const DaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  notes: { type: String, default: '' },
}, { _id: false })

const ItinerarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: { type: Number },
  ledgerMonthId: { type: mongoose.Schema.Types.ObjectId, ref: 'Month' },
  linkedListIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }],
  days: [DaySchema],
}, { timestamps: true })

module.exports = mongoose.model('Itinerary', ItinerarySchema)
