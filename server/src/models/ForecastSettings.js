const mongoose = require('mongoose')

const ForecastMonthSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  label: { type: String, required: true },
  date: { type: Date, required: true },
  variableCosts: { type: [{ name: String, amount: Number }], default: [] },
})

const FixedCostSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
})

const ForecastSettingsSchema = new mongoose.Schema({
  income: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  fixedCosts: { type: [FixedCostSchema], default: [] },
  months: [ForecastMonthSchema],
}, { timestamps: true })

module.exports = mongoose.model('ForecastSettings', ForecastSettingsSchema)
