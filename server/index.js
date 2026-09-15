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
  ...((process.env.NODE_ENV !== 'production' && !process.env.VERCEL) ? ['http://localhost:5173', 'http://localhost:4173'] : []),
].filter(Boolean)

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }
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
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400,
}))

app.use((req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next()
  const origin = req.headers.origin || req.headers.referer
  if (!origin) return res.status(403).json({ error: 'Cross-site request blocked.' })
  let originValue
  try { originValue = new URL(origin).origin } catch { return res.status(403).json({ error: 'Cross-site request blocked.' }) }
  const requestOrigin = `${req.protocol}://${req.get('host')}`
  if (originValue === requestOrigin || allowedOrigins.includes(originValue)) return next()
  return res.status(403).json({ error: 'Cross-site request blocked.' })
})

app.use(express.json({ limit: '32kb', strict: true }))

let schemaPromise
async function ensureAuthSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const required = ['users', 'sessions', 'rate_limits', 'lessons', 'courses', 'exercises', 'quiz_questions', 'progress', 'streaks', 'exercise_attempts', 'test_attempts']
      const result = await db.execute({
        sql: `SELECT table_name
              FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = ANY(?)`,
        args: [required],
      })
      const present = new Set(result.rows.map(row => row.table_name))
      const missing = required.filter(name => !present.has(name))
      if (missing.length) throw new Error(`Database schema incomplete: missing table(s): ${missing.join(', ')}`)
    })().catch((err) => {
      schemaPromise = undefined
      throw err
    })
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

const PORT = Number(process.env.PORT || 4000)
if (!process.env.VERCEL) app.listen(PORT, () => console.log(`MangoCode server running on :${PORT}`))

export default app
