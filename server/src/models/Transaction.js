const mongoose = require('mongoose')
const { CATEGORIES } = require('../utils/currency')

const TransactionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: CATEGORIES, default: 'general' },
  currency: { type: String, enum: ['NZD', 'USD'], required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true },
  month: { type: mongoose.Schema.Types.ObjectId, ref: 'Month', required: true, index: true },
}, { timestamps: true })

TransactionSchema.methods.valueInNZD = function (exchangeRate) {
  return this.currency === 'USD' ? this.value * exchangeRate : this.value
}

module.exports = mongoose.model('Transaction', TransactionSchema)
