import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Ledger from './pages/Ledger'
import Forecast from './pages/Forecast'
import FocusList from './pages/FocusList'
import WishList from './pages/WishList'
import Dreaming from './pages/Dreaming'
import ListPage from './pages/ListPage' 
import Blobs from './pages/Blobs'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/focus" element={<FocusList />} />
        <Route path="/wishlist" element={<WishList />} />
        <Route path="/dreaming" element={<Dreaming />} />
        <Route path="/blobs" element={<Blobs />} />
        <Route path="/lists/:id" element={<ListPage />} />
      </Routes>
    </BrowserRouter>
  )
}
