import { useEffect, useState } from 'react'
import NavCard from '../components/NavCard'
import { get } from '../api/client'

const QUOTES = [
  'All we have to decide is what to do with the time that is given to us. - Gandalf',
  'I thought the fall would kill me, but it just made me real — Ocean Vuong',
  'Not everything that is faced can be changed, but nothing can be changed until it is faced. — James Baldwin',
  "I wouldn't change one stupid decision for another five years of life. — James Murphy",
  'You wanna fly, you got to give up the shit that weighs you down. — Toni Morrison',
]

const MAIN_PAGES = [
  { label: 'Ledger', path: '/ledger', description: 'Track your spending' },
  { label: 'Forecast', path: '/forecast', description: 'Project your savings' },
  { label: 'Focus List', path: '/focus', description: 'Your top priorities' },
  { label: 'Wish List', path: '/wishlist', description: 'Things to buy' },
  { label: "What's Next", path: '/whats-next', description: 'Your custom lists' },
  { label: 'Blobs', path: '/blobs', description: 'Ideas & thoughts' },
]

export default function Dashboard() {
  const [topItem, setTopItem] = useState(null)
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  useEffect(() => {
    get('/lists?type=todo').then(lists => {
      if (!lists.length) return
      get(`/lists/${lists[0]._id}`).then(data => {
        const first = (data.items || []).find(i => i.status === 'pending')
        setTopItem(first || null)
      })
    }).catch(console.error)
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-3 text-gray-900">Hi, Cierra!</h1>
      <p className="text-gray-400 italic text-sm mt-2 mb-6">{quote}</p>

      {topItem && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">On today's agenda</h2>
          <div className="border border-indigo-300 rounded-lg px-4 py-3 font-medium text-gray-800">
            {topItem.name}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {MAIN_PAGES.map(p => <NavCard key={p.path} {...p} />)}
      </div>
    </div>
  )
}
