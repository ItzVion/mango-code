import { db } from './db.js'

export async function checkRateLimit(key, limit, windowMs) {
  const cutoffIso = new Date(Date.now() - windowMs).toISOString()
  const nowIso = new Date().toISOString()
  const inc = await db.execute({
    sql: 'UPDATE rate_limits SET count = count + 1 WHERE key = ? AND datetime(window_start) > datetime(?) AND count < ?',
    args: [key, cutoffIso, limit],
  })
  if (inc.rowsAffected > 0) return true
  const existing = await db.execute({ sql: 'SELECT window_start FROM rate_limits WHERE key = ?', args: [key] })
  const row = existing.rows[0]
  if (row) {
    const started = new Date(String(row.window_start)).getTime()
    if (Number.isFinite(started) && started > Date.now() - windowMs) return false
  }
  await db.execute({
    sql: `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
          ON CONFLICT (key) DO UPDATE SET count = 1, window_start = excluded.window_start`,
    args: [key, nowIso],
  })
  return true
}

export function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}
