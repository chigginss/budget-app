const request = require('supertest')
const app = require('../../src/app')
const Month = require('../../src/models/Month')
const Transaction = require('../../src/models/Transaction')

describe('Months API', () => {
  it('POST /api/months creates a month', async () => {
    const res = await request(app).post('/api/months').send({
      name: 'June 2026', startDate: '2026-06-01', endDate: '2026-06-30', exchangeRate: 1.6,
    })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('June 2026')
  })

  it('GET /api/months returns all months', async () => {
    await Month.create({ name: 'May', startDate: '2026-05-01', endDate: '2026-05-31' })
    const res = await request(app).get('/api/months')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
  })

  it('DELETE /api/months/:id also deletes transactions', async () => {
    const month = await Month.create({ name: 'May', startDate: '2026-05-01', endDate: '2026-05-31' })
    await Transaction.create({ name: 'Shop', currency: 'NZD', value: 10, date: new Date(), month: month._id })
    await request(app).delete(`/api/months/${month._id}`)
    expect(await Transaction.countDocuments({ month: month._id })).toBe(0)
  })
})
