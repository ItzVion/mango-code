import { Router } from 'express'
import crypto from 'node:crypto'
import { db } from '../db.js'

export const authRouter = Router()

const SESSION_COOKIE = 'mangocode_session'
const SESSION_DAYS = 30
const PASSWORD_SALT_BYTES = 16
const PASSWORD_KEY_BYTES = 64
const PASSWORD_SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }
const SESSION_BYTES = 32
const AUTH_WINDOW_MS = 60_000
const AUTH_IP_LIMIT = 30
const AUTH_IDENTITY_LIMIT = 8

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function publicUser(row) {
  if (!row) return null
  return { id: row.id, email: row.email, name: row.name }
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => {
    const i = part.indexOf('=')
    if (i < 0) return ['', '']
    try {
      return [decodeURIComponent(part.slice(0, i).trim()), decodeURIComponent(part.slice(i + 1).trim())]
    } catch {
      return ['', '']
    }
  }).filter(([k]) => k))
}

function hashSession(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, PASSWORD_KEY_BYTES, PASSWORD_SCRYPT_OPTIONS, (err, key) => {
      if (err) reject(err)
      else resolve(key)
    })
  })
}

async function encodePassword(password) {
  const salt = crypto.randomBytes(PASSWORD_SALT_BYTES)
  const key = await hashPassword(password, salt)
  return `scrypt$${salt.toString('base64url')}$${Buffer.from(key).toString('base64url')}`
}

async function verifyPassword(password, encoded) {
  const [, saltPart, keyPart] = String(encoded || '').split('$')
  if (!saltPart || !keyPart) return false
  try {
    const salt = Buffer.from(saltPart, 'base64url')
    const expected = Buffer.from(keyPart, 'base64url')
    if (expected.length !== PASSWORD_KEY_BYTES) return false
    const actual = Buffer.from(await hashPassword(password, salt))
    return crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL
  const flags = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, `Max-Age=${SESSION_DAYS * 86400}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (secure) flags.push('Secure')
  res.setHeader('Set-Cookie', flags.join('; '))
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL
  const flags = [`${SESSION_COOKIE}=`, 'Max-Age=0', 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (secure) flags.push('Secure')
  res.setHeader('Set-Cookie', flags.join('; '))
}

async function createSession(userId) {
  const token = crypto.randomBytes(SESSION_BYTES).toString('base64url')
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
  await db.execute({ sql: 'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', args: [hashSession(token), userId, expires] })
  return token
}

async function getSessionUser(req) {
  const token = parseCookies(req.headers.cookie).mangocode_session
  if (!token || token.length < 32 || token.length > 256) return null
  const result = await db.execute({
    sql: `SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`,
    args: [hashSession(token)],
  })
  return publicUser(result.rows[0])
}

function rateLimit(key, limit, windowMs) {
  const now = Date.now()
  const row = authWindows.get(key)
  if (!row || now - row.startedAt >= windowMs) {
    authWindows.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (row.count >= limit) return false
  row.count += 1
  return true
}

const authWindows = new Map()
function guard(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const email = normalizeEmail(req.body?.email)
  const ipKey = `auth-ip:${ip}`
  const identityKey = `auth-identity:${email || ip}`
  if (!rateLimit(ipKey, AUTH_IP_LIMIT, AUTH_WINDOW_MS) || !rateLimit(identityKey, AUTH_IDENTITY_LIMIT, AUTH_WINDOW_MS)) {
    return res.status(429).json({ error: 'Too many authentication attempts. Please wait a minute and try again.' })
  }
  if (authWindows.size > 10_000) {
    const now = Date.now()
    for (const [storedKey, stored] of authWindows) {
      if (now - stored.startedAt >= AUTH_WINDOW_MS) authWindows.delete(storedKey)
      if (authWindows.size <= 8_000) break
    }
  }
  next()
}

function originAllowed(req) {
  const origin = req.headers.origin
  if (!origin) return true
  const allowed = new Set([
    process.env.CLIENT_URL,
    'https://mangocode.vercel.app',
    'http://localhost:5173',
    'http://localhost:4173',
  ].filter(Boolean))
  return allowed.has(origin)
}

authRouter.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'POST' && !originAllowed(req)) return res.status(403).json({ error: 'Origin not allowed.' })
  if (req.method === 'POST') return guard(req, res, next)
  next()
})

authRouter.post('/register', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const name = String(req.body?.name || '').trim()
    const password = String(req.body?.password || '')
    if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
    if (!name || name.length > 60) return res.status(400).json({ error: 'Enter a name between 1 and 60 characters.' })
    if (password.length < 8 || password.length > 128) return res.status(400).json({ error: 'Password must be 8–128 characters.' })
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] })
    if (existing.rows.length) return res.status(409).json({ error: 'Could not create that account. Try signing in instead.' })
    const id = crypto.randomUUID()
    await db.execute({ sql: 'INSERT INTO users (id, email, name, password_hash, auth_provider) VALUES (?, ?, ?, ?, ?)', args: [id, email, name, await encodePassword(password), 'password'] })
    const token = await createSession(id)
    setSessionCookie(res, token)
    res.status(201).json({ user: { id, email, name } })
  } catch (err) { next(err) }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')
    const result = await db.execute({ sql: 'SELECT id, email, name, password_hash FROM users WHERE email = ?', args: [email] })
    const user = result.rows[0]
    if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' })
    const token = await createSession(user.id)
    setSessionCookie(res, token)
    res.json({ user: publicUser(user) })
  } catch (err) { next(err) }
})

authRouter.post('/google', async (req, res, next) => {
  try {
    const credential = String(req.body?.credential || '')
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) return res.status(503).json({ error: 'Google sign-in is not configured yet.' })
    if (!credential || credential.length > 10000) return res.status(400).json({ error: 'Invalid Google credential.' })

    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    const response = await fetch(verifyUrl, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) })
    if (!response.ok) return res.status(401).json({ error: 'Google sign-in could not be verified.' })
    const claims = await response.json()
    if (claims.aud !== clientId || (claims.azp && claims.azp !== clientId) || claims.iss !== 'https://accounts.google.com' || claims.email_verified !== 'true' || !claims.sub || !claims.email) return res.status(401).json({ error: 'Google sign-in could not be verified.' })

    const email = normalizeEmail(claims.email)
    const name = String(claims.name || email.split('@')[0]).trim().slice(0, 60) || 'MangoCode learner'
    let result = await db.execute({ sql: 'SELECT id, email, name FROM users WHERE google_sub = ? OR email = ?', args: [claims.sub, email] })
    let user = result.rows[0]
    if (!user) {
      const id = crypto.randomUUID()
      await db.execute({ sql: 'INSERT INTO users (id, email, name, google_sub, auth_provider) VALUES (?, ?, ?, ?, ?)', args: [id, email, name, claims.sub, 'google'] })
      user = { id, email, name }
    } else {
      await db.execute({ sql: 'UPDATE users SET google_sub = COALESCE(google_sub, ?), name = ? WHERE id = ?', args: [claims.sub, name, user.id] })
      user = { ...user, name }
    }
    const token = await createSession(user.id)
    setSessionCookie(res, token)
    res.json({ user: publicUser(user) })
  } catch (err) { next(err) }
})

authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = parseCookies(req.headers.cookie).mangocode_session
    if (token) await db.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [hashSession(token)] })
    clearSessionCookie(res)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

authRouter.get('/me', async (req, res, next) => {
  try { res.json({ user: await getSessionUser(req) }) } catch (err) { next(err) }
})
