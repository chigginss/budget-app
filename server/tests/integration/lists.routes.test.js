const request = require('supertest')
const app = require('../../src/app')
const List = require('../../src/models/List')

describe('Lists API', () => {
  it('POST /api/lists creates a list', async () => {
    const res = await request(app).post('/api/lists').send({ name: 'My List', type: 'custom' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('My List')
  })

  it('GET /api/lists?type=custom filters by type', async () => {
    await List.create({ name: 'A', type: 'custom' })
    await List.create({ name: 'B', type: 'todo' })
    const res = await request(app).get('/api/lists?type=custom')
    expect(res.body.length).toBe(1)
    expect(res.body[0].name).toBe('A')
  })

  it('POST /api/lists/:id/items adds item to list', async () => {
    const list = await List.create({ name: 'Tasks', type: 'custom' })
    const res = await request(app).post(`/api/lists/${list._id}/items`).send({ name: 'Buy milk' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Buy milk')
  })
})
