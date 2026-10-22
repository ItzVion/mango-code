import { db } from '../server/db.js'
import app from '../server/index.js'
import { emergencyMiddleware, securityStatus, activateLockdown, recoverLockdown } from '../server/security/emergencyLockdown.js'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const PROD_ORIGINS = new Set([
  process.env.CLIENT_URL,
  'https://mangocode.vercel.app',
].filter(Boolean))

function originAllowed(req) {
  const origin = req.headers.origin
  if (!origin) return false
  let value
  try { value = new URL(origin).origin } catch { return false }
  if (PROD_ORIGINS.has(value)) return true
  const requestOrigin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`
  if (value === requestOrigin) return true
  return process.env.NODE_ENV !== 'production' && !process.env.VERCEL && ['http://localhost:5173', 'http://localhost:4173'].includes(value)
}

function baseHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
}

export default async function handler(req, res) {
  baseHeaders(res)

  if (req.url?.startsWith('/api/security/status')) return securityStatus(req, res)
  if (req.url?.startsWith('/api/security/lockdown')) return activateLockdown(req, res)
  if (req.url?.startsWith('/api/security/recover')) return recoverLockdown(req, res)

  if (req.url?.startsWith('/api/health')) {
    try {
      await db.execute('SELECT 1')
      return res.status(200).json({ ok: true, database: true, runtime: 'vercel' })
    } catch (error) {
      console.error('Health check failed:', error?.message || error)
      return res.status(503).json({ ok: false, database: false })
    }
  }

  if (MUTATING_METHODS.has(req.method)) {
    if (!originAllowed(req)) return res.status(403).json({ error: 'Cross-site request blocked.' })
  }

  await new Promise((resolve, reject) => {
    emergencyMiddleware(req, res, (error) => error ? reject(error) : resolve())
  })
  if (res.headersSent) return
  return app(req, res)
}
