import crypto from 'node:crypto'
import pg from 'pg'

const { Pool } = pg
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)
const connectionString = (() => {
  try {
    const parsed = new URL(databaseUrl)
    parsed.searchParams.delete('sslmode')
    return parsed.toString()
  } catch { return databaseUrl }
})()

const pool = new Pool({
  connectionString,
  max: Number(process.env.SECURITY_DB_POOL_MAX || 2),
  min: 0,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 8_000,
  query_timeout: 10_000,
  keepAlive: true,
  ssl: isProduction || /sslmode=require|sslmode=verify-full/i.test(databaseUrl) ? { rejectUnauthorized: true } : undefined,
})

pool.on('error', (error) => console.error('MangoCode security DB pool error:', error?.message || error))

const LOCKDOWN_HOURS = 24
const LOCKDOWN_CACHE_MS = 1000
const SENSITIVE_PREFIXES = ['/api/auth', '/api/exercises', '/api/admin', '/api/lessons', '/api/quiz']
let schemaPromise
let lockdownCache = { checkedAt: 0, row: null }
let lastElevatedNoticeAt = 0

function sensitive(path) {
  return SENSITIVE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const required = ['security_incidents', 'security_lockdown']
      const { rows } = await pool.query(
        'SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = ANY($2::text[])',
        ['public', required],
      )
      const present = new Set(rows.map((row) => row.table_name))
      const missing = required.filter((name) => !present.has(name))
      if (missing.length) throw new Error(`Security schema incomplete: missing table(s): ${missing.join(', ')}`)
    })().catch((error) => { schemaPromise = undefined; throw error })
  }
  return schemaPromise
}

async function readLockdown() {
  const { rows } = await pool.query('SELECT * FROM security_lockdown WHERE id = 1 LIMIT 1')
  const row = rows[0] || null
  if (!row) return null
  const until = Date.parse(String(row.active_until))
  if (!Number.isFinite(until) || until <= Date.now()) {
    await pool.query('DELETE FROM security_lockdown WHERE id = 1')
    return null
  }
  return row
}

async function currentLockdown(force = false) {
  const now = Date.now()
  if (!force && now - lockdownCache.checkedAt < LOCKDOWN_CACHE_MS) return lockdownCache.row
  const row = await readLockdown()
  lockdownCache = { checkedAt: now, row }
  return row
}

async function notify(title, message) {
  const jobs = []
  const webhook = process.env.SECURITY_DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_SECURITY_WEBHOOK_URL
  if (webhook) jobs.push(fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'MangoCode Security', content: `🚨 ${title}`, embeds: [{ description: message, color: 0xFFB627, timestamp: new Date().toISOString() }] }),
    signal: AbortSignal.timeout(5000),
  }))
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.SECURITY_ALERT_EMAIL || process.env.ALERT_EMAIL
  const from = process.env.SECURITY_EMAIL_FROM
  if (apiKey && to && from) jobs.push(fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: `MangoCode Security: ${title}`, text: message }),
    signal: AbortSignal.timeout(5000),
  }))
  await Promise.allSettled(jobs)
}

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  return res
}

function validBreakGlass(req) {
  const expected = process.env.SECURITY_BREAK_GLASS_TOKEN
  const supplied = req.headers['x-break-glass-token']
  if (!expected || typeof supplied !== 'string' || supplied.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
}

export async function securityStatus(_req, res) {
  try {
    await ensureSchema()
    const lock = await currentLockdown(true)
    return noStore(res).json(lock
      ? { active: true, activeUntil: new Date(String(lock.active_until)).toISOString(), message: 'Emergency security lockdown is active.' }
      : { active: false })
  } catch (error) {
    console.error('Security status failed:', error?.message || error)
    return res.status(503).json({ message: 'Security service temporarily unavailable.' })
  }
}

export async function activateLockdown(req, res) {
  if (!validBreakGlass(req)) return res.status(403).json({ error: 'Emergency control unauthorized.' })
  try {
    await ensureSchema()
    const incidentId = crypto.randomUUID()
    const activeUntil = new Date(Date.now() + LOCKDOWN_HOURS * 60 * 60 * 1000)
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : 'Emergency security response.'
    await pool.query(
      `INSERT INTO security_lockdown (id, active_until, reason, incident_id, created_at)
       VALUES (1, $1, $2, $3, now())
       ON CONFLICT (id) DO UPDATE SET active_until = EXCLUDED.active_until, reason = EXCLUDED.reason, incident_id = EXCLUDED.incident_id, created_at = EXCLUDED.created_at`,
      [activeUntil, reason, incidentId],
    )
    lockdownCache = { checkedAt: Date.now(), row: { active_until: activeUntil, reason, incident_id: incidentId } }
    await notify('EMERGENCY LOCKDOWN ACTIVATED', `Sensitive MangoCode API endpoints are disabled for 24 hours. Incident: ${incidentId}. Automatic recovery: ${activeUntil.toISOString()}. Reason: ${reason}`)
    return noStore(res).json({ success: true, incidentId, activeUntil: activeUntil.toISOString() })
  } catch (error) {
    console.error('Lockdown activation failed:', error?.message || error)
    return res.status(503).json({ message: 'Security service temporarily unavailable.' })
  }
}

export async function recoverLockdown(req, res) {
  if (!validBreakGlass(req)) return res.status(403).json({ error: 'Emergency control unauthorized.' })
  try {
    await ensureSchema()
    await pool.query('DELETE FROM security_lockdown WHERE id = 1')
    lockdownCache = { checkedAt: Date.now(), row: null }
    await notify('EMERGENCY LOCKDOWN CLEARED', 'Sensitive MangoCode API endpoints have been restored.')
    return noStore(res).json({ success: true })
  } catch (error) {
    console.error('Lockdown recovery failed:', error?.message || error)
    return res.status(503).json({ message: 'Security service temporarily unavailable.' })
  }
}

export async function emergencyMiddleware(req, res, next) {
  try {
    await ensureSchema()
    if (req.path === '/api/security/status' || req.path === '/api/security/lockdown' || req.path === '/api/security/recover' || req.path === '/api/health') return next()
    const lock = await currentLockdown()
    if (lock) {
      res.status(503)
      res.setHeader('Retry-After', String(LOCKDOWN_HOURS * 60 * 60))
      return noStore(res).json({ lockdown: true, message: 'Emergency security lockdown is active.', activeUntil: new Date(String(lock.active_until)).toISOString() })
    }

    res.on('finish', async () => {
      try {
        if (!sensitive(req.path) || ![401, 403, 429].includes(res.statusCode)) return
        await pool.query(
          'INSERT INTO security_incidents (id, kind, path, status) VALUES ($1, $2, $3, $4)',
          [crypto.randomUUID(), res.statusCode === 401 ? 'auth-failure' : res.statusCode === 429 ? 'rate-limit' : 'authorization-failure', req.path, res.statusCode],
        )
        const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM security_incidents WHERE created_at >= now() - interval '10 minutes'")
        if (Number(rows[0]?.total || 0) >= 15 && Date.now() - lastElevatedNoticeAt >= 5 * 60 * 1000) {
          lastElevatedNoticeAt = Date.now()
          void notify('Elevated security activity', 'At least 15 protected-endpoint failures were observed within 10 minutes. No automatic shutdown was performed.')
        }
      } catch (error) { console.error('Security incident logging failed:', error?.message || error) }
    })
    next()
  } catch (error) {
    console.error('Emergency security middleware failed:', error?.message || error)
    return res.status(503).json({ message: 'Security service temporarily unavailable.' })
  }
}
