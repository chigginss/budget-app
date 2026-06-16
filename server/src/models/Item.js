const mongoose = require('mongoose')

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  order: { type: Number, default: 0 },
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
}, { timestamps: true })

module.exports = mongoose.model('Item', ItemSchema)
