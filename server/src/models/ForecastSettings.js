const mongoose = require('mongoose')

const ForecastMonthSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  label: { type: String, required: true },
  date: { type: Date, required: true },
  unexpectedCosts: { type: Number, default: 0 },
})

const ForecastSettingsSchema = new mongoose.Schema({
  income: { type: Number, default: 0 },
  fixedCosts: { type: Number, default: 0 },
  months: [ForecastMonthSchema],
}, { timestamps: true })

module.exports = mongoose.model('ForecastSettings', ForecastSettingsSchema)
