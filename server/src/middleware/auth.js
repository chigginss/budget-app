const bcrypt = require('bcryptjs')

module.exports = async (req, res, next) => {
  const header = req.headers['authorization']
  if (header && header.startsWith('Basic ')) {
    const credentials = Buffer.from(header.slice(6), 'base64').toString()
    const password = credentials.slice(credentials.indexOf(':') + 1)
    const hash = process.env.AUTH_PASSWORD_HASH
    if (hash && await bcrypt.compare(password, hash)) return next()
  }
  res.status(401).json({ error: 'Unauthorized' })
}
