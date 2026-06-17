const mongoose = require('mongoose')

const IdeaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
}, { timestamps: true })

module.exports = mongoose.model('Idea', IdeaSchema)
