const mongoose = require('mongoose')

const ListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['todo', 'toBuy', 'longTermPlan', 'custom', 'ideas'],
    default: 'custom',
  },
  savingGoal: { type: Number },
  goalDate: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('List', ListSchema)
