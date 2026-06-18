const crypto = require('crypto')

module.exports = (req, res, next) => {
  const password = req.headers['x-app-password']
  const expected = process.env.AUTH_PASSWORD
  if (password && expected) {
    try {
      const a = Buffer.from(password)
      const b = Buffer.from(expected)
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next()
    } catch {}
  }
  res.status(401).json({ error: 'Unauthorized' })
}
