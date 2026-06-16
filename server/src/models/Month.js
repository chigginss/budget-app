const mongoose = require('mongoose')

const MonthSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  details: { type: String, default: '' },
  exchangeRate: { type: Number, default: 1.0 },
}, { timestamps: true })

MonthSchema.methods.totalSpendingNZD = async function () {
  const Transaction = mongoose.model('Transaction')
  const txns = await Transaction.find({ month: this._id })
  return txns.reduce((sum, t) => {
    return sum + t.valueInNZD(this.exchangeRate)
  }, 0)
}

module.exports = mongoose.model('Month', MonthSchema)
