import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { lessonsRouter } from './routes/lessons.js'
import { exercisesRouter } from './routes/exercises.js'
import { authRouter } from './routes/auth.js'
import { db } from './db.js'
import { checkRateLimit, clientIp } from './rateLimit.js'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://mangocode.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean)

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  next()
})

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Mango-User'],
}))

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin
    if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Origin not allowed.' })
  }
  next()
})

app.use(express.json({ limit: '32kb', strict: true }))

let schemaPromise
async function ensureAuthSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.execute(`CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`)
      await db.execute(`CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 1, window_start TEXT NOT NULL DEFAULT (datetime('now')))`)
      await db.execute('CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start)')
      const migrations = [
        'ALTER TABLE users ADD COLUMN password_hash TEXT',
        'ALTER TABLE users ADD COLUMN google_sub TEXT',
        "ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'password'",
      ]
      for (const sql of migrations) {
        try { await db.execute(sql) } catch (err) {
          if (!/duplicate column|already exists/i.test(String(err?.message || err))) throw err
        }
      }
      await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL')
      await db.execute('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)')
    })()
  }
  return schemaPromise
}

app.use(async (_req, _res, next) => {
  try { await ensureAuthSchema(); next() } catch (err) { next(err) }
})

app.use('/api/exercises', async (req, res, next) => {
  try {
    const ok = await checkRateLimit(`exercise:${clientIp(req)}`, 20, 60_000)
    if (!ok) return res.status(429).json({ error: 'Too many code runs. Please wait a minute and try again.' })
    next()
  } catch (err) { next(err) }
})

app.use('/api/quiz/check', async (req, res, next) => {
  try {
    const ok = await checkRateLimit(`quiz:${clientIp(req)}`, 60, 60_000)
    if (!ok) return res.status(429).json({ error: 'Too many quiz checks. Please slow down.' })
    next()
  } catch (err) { next(err) }
})

app.use('/api/auth', authRouter)
app.use('/api', lessonsRouter)
app.use('/api/exercises', exercisesRouter)
app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use((err, _req, res, _next) => {
  console.error('MangoCode request error:', err?.message || err)
  if (res.headersSent) return
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000
if (!process.env.VERCEL) app.listen(PORT, () => console.log(`MangoCode server running on :${PORT}`))

export default app
