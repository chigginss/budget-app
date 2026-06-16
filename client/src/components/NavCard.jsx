import { Link } from 'react-router-dom'

export default function NavCard({ label, description, path }) {
  return (
    <Link
      to={path}
      className="block border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition"
    >
      <div className="font-semibold text-gray-900">{label}</div>
      {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
    </Link>
  )
}
