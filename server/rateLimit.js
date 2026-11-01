import crypto from 'node:crypto'
import { db } from './db.js'

const RETENTION_DAYS = 7
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000
let lastCleanupAt = 0

function opaqueRateLimitKey(value) {
  const secret = String(process.env.SESSION_SECRET || 'mangocode-local-rate-limit-key')
  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex')
}

export async function checkRateLimit(key, limit, windowMs) {
  const storageKey = opaqueRateLimitKey(key)
  const cutoff = new Date(Date.now() - windowMs).toISOString()
  const now = new Date().toISOString()
  const cleanup = Date.now() - lastCleanupAt >= CLEANUP_INTERVAL_MS
  if (cleanup) lastCleanupAt = Date.now()

  return db.transaction(async (tx) => {
    if (cleanup) {
      await tx.execute({
        sql: `DELETE FROM rate_limits WHERE window_start < CURRENT_TIMESTAMP - INTERVAL '${RETENTION_DAYS} days'`,
      })
    }
    await tx.execute({
      sql: 'INSERT INTO rate_limits (key, count, window_start) VALUES (?, 0, ?) ON CONFLICT (key) DO NOTHING',
      args: [storageKey, now],
    })

    const current = await tx.execute({
      sql: 'SELECT count, window_start FROM rate_limits WHERE key = ? FOR UPDATE',
      args: [storageKey],
    })
    const row = current.rows[0]
    if (!row) return false

    const startedAt = new Date(String(row.window_start)).getTime()
    if (!Number.isFinite(startedAt) || startedAt <= Date.parse(cutoff)) {
      await tx.execute({
        sql: 'UPDATE rate_limits SET count = 1, window_start = ? WHERE key = ?',
        args: [now, storageKey],
      })
      return true
    }

    if (Number(row.count) >= limit) return false

    await tx.execute({
      sql: 'UPDATE rate_limits SET count = count + 1 WHERE key = ?',
      args: [storageKey],
    })
    return true
  })
}

export function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}
