import crypto from 'node:crypto'
import { db } from '../db.js'

export const SESSION_COOKIE = '__Host-mangocode_session'

function parseCookies(header = '') {
  const cookies = {}
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=')
    if (index < 0) continue
    try { cookies[decodeURIComponent(part.slice(0, index).trim())] = decodeURIComponent(part.slice(index + 1).trim()) } catch {}
  }
  return cookies
}

function sessionHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function getCurrentUser(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]
  if (!token || token.length < 32 || token.length > 256) return null
  const result = await db.execute({
    sql: 'SELECT u.id, u.email, u.name, u.role, u.email_verified_at, u.has_donated FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1',
    args: [sessionHash(token)],
  })
  const user = result.rows[0]
  if (!user) return null

  const ownerEmail = String(process.env.OWNER_EMAIL || '').trim().toLowerCase()
  if (ownerEmail && String(user.email).toLowerCase() === ownerEmail && user.role !== 'OWNER') {
    await db.execute({ sql: "UPDATE users SET role = 'OWNER' WHERE id = ?", args: [user.id] })
    user.role = 'OWNER'
  }
  return { ...user, isOwner: user.role === 'OWNER' }
}

export async function optionalAuth(req, _res, next) {
  try {
    req.user = await getCurrentUser(req)
    req.userId = req.user?.id || null
    next()
  } catch (error) { next(error) }
}

export async function requireAuth(req, res, next) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return res.status(401).json({ error: 'Sign in to save your progress and results.' })
    req.user = user
    req.userId = user.id
    next()
  } catch (error) { next(error) }
}

export async function requireOwner(req, res, next) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return res.status(401).json({ error: 'Sign in first.' })
    if (user.role !== 'OWNER') return res.status(403).json({ error: 'Owner access required.' })
    req.user = user
    req.userId = user.id
    next()
  } catch (error) { next(error) }
}

export function setSessionCookie(res, token, maxAgeSeconds = 30 * 86400) {
  res.setHeader('Set-Cookie', [
    SESSION_COOKIE + '=' + encodeURIComponent(token),
    'Max-Age=' + maxAgeSeconds,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; '))
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', SESSION_COOKIE + '=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax')
}
