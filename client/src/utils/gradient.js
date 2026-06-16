// Returns a style object interpolating red→yellow based on item position
export function getItemStyle(index, total) {
  if (total <= 1) return { backgroundColor: 'rgba(220, 38, 38, 0.12)' }
  const ratio = index / (total - 1)
  // red(220,38,38) → yellow(234,179,8)
  const r = Math.round(220 + (234 - 220) * ratio)
  const g = Math.round(38 + (179 - 38) * ratio)
  const b = Math.round(38 + (8 - 38) * ratio)
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)` }
}
