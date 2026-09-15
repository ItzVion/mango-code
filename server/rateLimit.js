import { db } from './db.js'

export async function checkRateLimit(key, limit, windowMs) {
  const cutoff = new Date(Date.now() - windowMs).toISOString()
  const now = new Date().toISOString()

  return db.transaction(async (tx) => {
    await tx.execute({
      sql: 'INSERT INTO rate_limits (key, count, window_start) VALUES (?, 0, ?) ON CONFLICT (key) DO NOTHING',
      args: [key, now],
    })

    const current = await tx.execute({
      sql: 'SELECT count, window_start FROM rate_limits WHERE key = ? FOR UPDATE',
      args: [key],
    })
    const row = current.rows[0]
    if (!row) return false

    const startedAt = new Date(String(row.window_start)).getTime()
    if (!Number.isFinite(startedAt) || startedAt <= Date.parse(cutoff)) {
      await tx.execute({
        sql: 'UPDATE rate_limits SET count = 1, window_start = ? WHERE key = ?',
        args: [now, key],
      })
      return true
    }

    if (Number(row.count) >= limit) return false

    await tx.execute({
      sql: 'UPDATE rate_limits SET count = count + 1 WHERE key = ?',
      args: [key],
    })
    return true
  })
}

export function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}
