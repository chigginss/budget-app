const mongoose = require('mongoose')

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  locationUrl: { type: String, default: '' },
  date: { type: Date, required: true },
  order: { type: Number, default: 0 },
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary', required: true, index: true },
}, { timestamps: true })

module.exports = mongoose.model('Activity', ActivitySchema)
