const express = require('express')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')
const auth = require('./middleware/auth')

const app = express()
app.use(cors({
  origin: [/\.vercel\.app$/, /localhost/, /startprojecting\.xyz$/],
  allowedHeaders: ['Content-Type', 'X-App-Password'],
}))
app.use(express.json())
app.use('/api', auth)

app.use('/api/months', require('./routes/months'))
app.use('/api/transactions', require('./routes/transactions'))
app.use('/api/lists', require('./routes/lists'))
app.use('/api/items', require('./routes/items'))
app.use('/api/ideas', require('./routes/ideas'))
app.use('/api/forecast', require('./routes/forecast'))

app.use(errorHandler)

module.exports = app
