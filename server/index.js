import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { lessonsRouter } from './routes/lessons.js'
import { exercisesRouter } from './routes/exercises.js'

const app = express()
app.disable('x-powered-by')

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
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  }
  next()
})

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin not allowed'))
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Mango-User'],
}))

app.use(express.json({ limit: '32kb', strict: true }))

// Lightweight per-instance limiter. This is intentionally an additional layer;
// the code runner itself also enforces strict input and upstream execution limits.
const requestWindows = new Map()
function rateLimit(key, limit, windowMs) {
  const now = Date.now()
  const row = requestWindows.get(key)
  if (!row || now - row.startedAt >= windowMs) {
    requestWindows.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (row.count >= limit) return false
  row.count += 1
  return true
}

app.use('/api/exercises', (req, res, next) => {
  const forwarded = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.socket.remoteAddress || 'unknown').split(',')[0].trim()
  const user = typeof req.headers['x-mango-user'] === 'string' ? req.headers['x-mango-user'].slice(0, 80) : ''
  const key = `exercise:${ip}:${user}`
  if (!rateLimit(key, 20, 60_000)) return res.status(429).json({ error: 'Too many code runs. Please wait a minute and try again.' })
  next()
})

app.use('/api', lessonsRouter)
app.use('/api/exercises', exercisesRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use((err, _req, res, _next) => {
  console.error('MangoCode request error:', err?.message || err)
  if (res.headersSent) return
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`MangoCode server running on :${PORT}`))
}

export default app
