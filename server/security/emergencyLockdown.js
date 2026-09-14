import crypto from 'node:crypto'
import { db } from '../db.js'

const LOCKDOWN_HOURS = 24
let schemaPromise
const SENSITIVE_PREFIXES = ['/api/auth', '/api/exercises', '/api/admin', '/api/lessons', '/api/quiz']
const sensitive = (path) => SENSITIVE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.execute(`CREATE TABLE IF NOT EXISTS security_incidents (id TEXT PRIMARY KEY, kind TEXT NOT NULL, path TEXT NOT NULL, status INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`)
      await db.execute(`CREATE TABLE IF NOT EXISTS security_lockdown (id INTEGER PRIMARY KEY CHECK (id = 1), active_until TEXT NOT NULL, reason TEXT NOT NULL, incident_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`)
    })()
  }
  return schemaPromise
}

async function currentLockdown() {
  const result = await db.execute('SELECT * FROM security_lockdown WHERE id = 1 LIMIT 1')
  const row = result.rows?.[0]
  if (!row) return null
  const until = Date.parse(String(row.active_until))
  if (!Number.isFinite(until) || until <= Date.now()) {
    await db.execute('DELETE FROM security_lockdown WHERE id = 1')
    return null
  }
  return row
}

async function notify(title, message) {
  const jobs = []
  const webhook = process.env.SECURITY_DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_SECURITY_WEBHOOK_URL
  if (webhook) jobs.push(fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'MangoCode Security', content: `🚨 ${title}`, embeds: [{ description: message, color: 0xFFB627, timestamp: new Date().toISOString() }] }) }))

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.SECURITY_ALERT_EMAIL || process.env.ALERT_EMAIL
  const from = process.env.SECURITY_EMAIL_FROM
  if (apiKey && to && from) jobs.push(fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject: `MangoCode Security: ${title}`, text: message }) }))
  await Promise.allSettled(jobs)
}

export async function securityStatus(_req, res) {
  await ensureSchema()
  const lock = await currentLockdown()
  return res.json(lock ? { active: true, activeUntil: new Date(String(lock.active_until)).toISOString(), message: 'Emergency security lockdown is active.' } : { active: false })
}

export async function activateLockdown(req, res) {
  const expected = process.env.SECURITY_BREAK_GLASS_TOKEN
  const supplied = req.headers['x-break-glass-token']
  if (!expected || typeof supplied !== 'string' || supplied.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return res.status(403).json({ error: 'Emergency control unauthorized.' })
  await ensureSchema()
  const incidentId = crypto.randomUUID()
  const activeUntil = new Date(Date.now() + LOCKDOWN_HOURS * 60 * 60 * 1000).toISOString()
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : 'Emergency security response.'
  await db.execute({ sql: `INSERT INTO security_lockdown (id, active_until, reason, incident_id, created_at) VALUES (1, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET active_until=excluded.active_until, reason=excluded.reason, incident_id=excluded.incident_id, created_at=excluded.created_at`, args: [activeUntil, reason, incidentId] })
  await notify('EMERGENCY LOCKDOWN ACTIVATED', `Sensitive MangoCode API endpoints are disabled for 24 hours. Incident: ${incidentId}. Automatic recovery: ${activeUntil}. Reason: ${reason}`)
  return res.json({ success: true, incidentId, activeUntil })
}

export async function recoverLockdown(req, res) {
  const expected = process.env.SECURITY_BREAK_GLASS_TOKEN
  const supplied = req.headers['x-break-glass-token']
  if (!expected || typeof supplied !== 'string' || supplied.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return res.status(403).json({ error: 'Emergency control unauthorized.' })
  await ensureSchema()
  await db.execute('DELETE FROM security_lockdown WHERE id = 1')
  await notify('EMERGENCY LOCKDOWN CLEARED', 'Sensitive MangoCode API endpoints have been restored.')
  return res.json({ success: true })
}

export async function emergencyMiddleware(req, res, next) {
  try {
    await ensureSchema()
    if (req.path === '/api/security/status' || req.path === '/api/security/lockdown' || req.path === '/api/security/recover' || req.path === '/api/health') return next()
    const lock = await currentLockdown()
    if (lock) return res.status(503).set('Retry-After', String(LOCKDOWN_HOURS * 60 * 60)).json({ lockdown: true, message: 'Emergency security lockdown is active.', activeUntil: new Date(String(lock.active_until)).toISOString() })

    res.on('finish', async () => {
      try {
        if (!sensitive(req.path) || ![401, 403, 429].includes(res.statusCode)) return
        await db.execute({ sql: 'INSERT INTO security_incidents (id, kind, path, status) VALUES (?, ?, ?, ?)', args: [crypto.randomUUID(), res.statusCode === 401 ? 'auth-failure' : res.statusCode === 429 ? 'rate-limit' : 'authorization-failure', req.path, res.statusCode] })
        const { rows } = await db.execute("SELECT COUNT(*) AS total FROM security_incidents WHERE created_at >= datetime('now', '-10 minutes')")
        if (Number(rows?.[0]?.total || 0) >= 15) await notify('Elevated security activity', 'At least 15 protected-endpoint failures were observed within 10 minutes. No automatic shutdown was performed. Review the incident and use the owner-only emergency control if needed.')
      } catch (error) { console.error('Security incident logging failed:', error?.message || error) }
    })
    next()
  } catch (error) { console.error('Emergency security middleware failed:', error?.message || error); next() }
}
