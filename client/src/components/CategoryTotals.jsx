export default function CategoryTotals({ transactions, exchangeRate }) {
  const totals = transactions.reduce((acc, t) => {
    const nzd = t.currency === 'USD' ? t.value * exchangeRate : t.value
    acc[t.category] = (acc[t.category] || 0) + nzd
    return acc
  }, {})

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
  const total = sorted.reduce((s, [, v]) => s + v, 0)

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">Totals (NZD)</h3>
      <table className="w-full text-sm">
        <tbody>
          {sorted.map(([cat, amount]) => (
            <tr key={cat} className="border-b last:border-0">
              <td className="py-1 capitalize text-gray-600">{cat}</td>
              <td className="py-1 text-right font-medium">${amount.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="pt-2">Total</td>
            <td className="pt-2 text-right">${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
