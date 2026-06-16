const Month = require('../../src/models/Month')
const Transaction = require('../../src/models/Transaction')

describe('Month.totalSpendingNZD', () => {
  it('sums NZD transactions directly', async () => {
    const month = await Month.create({ name: 'June', startDate: new Date('2026-06-01'), endDate: new Date('2026-06-30'), exchangeRate: 1.6 })
    await Transaction.create({ name: 'Supermarket', category: 'food', currency: 'NZD', value: 50, date: new Date(), month: month._id })
    await Transaction.create({ name: 'Coffee', category: 'food', currency: 'NZD', value: 10, date: new Date(), month: month._id })
    expect(await month.totalSpendingNZD()).toBe(60)
  })

  it('converts USD transactions at the month exchange rate', async () => {
    const month = await Month.create({ name: 'June', startDate: new Date('2026-06-01'), endDate: new Date('2026-06-30'), exchangeRate: 2.0 })
    await Transaction.create({ name: 'Amazon', category: 'shopping', currency: 'USD', value: 25, date: new Date(), month: month._id })
    expect(await month.totalSpendingNZD()).toBe(50)
  })

  it('correctly sums mixed NZD and USD transactions', async () => {
    const month = await Month.create({ name: 'July', startDate: new Date('2026-07-01'), endDate: new Date('2026-07-31'), exchangeRate: 1.5 })
    await Transaction.create({ name: 'Countdown', category: 'food', currency: 'NZD', value: 40, date: new Date(), month: month._id })
    await Transaction.create({ name: 'Amazon', category: 'shopping', currency: 'USD', value: 20, date: new Date(), month: month._id })
    // NZD 40 + (USD 20 * 1.5) = 40 + 30 = 70
    expect(await month.totalSpendingNZD()).toBe(70)
  })
})

describe('Transaction.valueInNZD', () => {
  it('returns value as-is for NZD transactions', () => {
    const t = new Transaction({ name: 'Shop', currency: 'NZD', value: 25, date: new Date(), month: new (require('mongoose').Types.ObjectId)() })
    expect(t.valueInNZD(1.6)).toBe(25)
  })

  it('converts USD to NZD using the exchange rate', () => {
    const t = new Transaction({ name: 'Amazon', currency: 'USD', value: 10, date: new Date(), month: new (require('mongoose').Types.ObjectId)() })
    expect(t.valueInNZD(2.0)).toBe(20)
  })
})
