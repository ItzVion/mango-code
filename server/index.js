import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { lessonsRouter } from './routes/lessons.js'
import { exercisesRouter } from './routes/exercises.js'
import { authRouter } from './routes/auth.js'
import { db } from './db.js'

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
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  next()
})

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin not allowed'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Mango-User'],
}))

app.use(express.json({ limit: '32kb', strict: true }))

const requestWindows = new Map()
function rateLimit(key, limit, windowMs) {
  const now = Date.now()
  const row = requestWindows.get(key)
  if (!row || now - row.startedAt >= windowMs) {
    requestWindows.set(key, { startedAt: now, count: 1 })
  } else {
    if (row.count >= limit) return false
    row.count += 1
  }
  if (requestWindows.size > 10_000) {
    for (const [storedKey, stored] of requestWindows) {
      if (now - stored.startedAt >= windowMs) requestWindows.delete(storedKey)
      if (requestWindows.size <= 8_000) break
    }
  }
  return true
}

function requestIp(req) {
  return req.ip || req.socket.remoteAddress || 'unknown'
}

app.use('/api/exercises', (req, res, next) => {
  if (!rateLimit(`exercise:${requestIp(req)}`, 20, 60_000)) {
    return res.status(429).json({ error: 'Too many code runs. Please wait a minute and try again.' })
  }
  next()
})

app.use('/api/quiz/check', (req, res, next) => {
  if (!rateLimit(`quiz:${requestIp(req)}`, 60, 60_000)) {
    return res.status(429).json({ error: 'Too many quiz checks. Please slow down.' })
  }
  next()
})

let schemaPromise
async function ensureAuthSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.execute(`CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`)
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

app.use('/api/auth', async (_req, _res, next) => {
  try { await ensureAuthSchema(); next() } catch (err) { next(err) }
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
