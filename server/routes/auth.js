import { Router } from 'express'
import crypto from 'node:crypto'
import { db } from '../db.js'
import { checkRateLimit, clientIp } from '../rateLimit.js'
import { getCurrentUser, setSessionCookie, clearSessionCookie, SESSION_COOKIE } from '../middleware/auth.js'
import { sendCodeEmail, sendAccountExistsEmail } from '../lib/mailer.js'

export const authRouter = Router()

const SESSION_DAYS = 30
const PASSWORD_BYTES = 64
const PASSWORD_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }
const OTP_TTL_MS = 10 * 60 * 1000
const OTP_RESEND_MS = 30 * 1000
const OTP_MAX_ATTEMPTS = 5
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function publicUser(user) {
  if (!user) return null
  return {
    id: user.id, email: user.email, name: user.name,
    role: user.role || 'USER', isOwner: user.role === 'OWNER',
    emailVerified: Boolean(user.email_verified_at),
    hasDonated: Boolean(user.has_donated),
  }
}

function parseCookies(header = '') {
  const result = {}
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=')
    if (index < 0) continue
    try { result[decodeURIComponent(part.slice(0, index).trim())] = decodeURIComponent(part.slice(index + 1).trim()) } catch {}
  }
  return result
}

function sessionHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function otpHash(code) {
  const secret = process.env.OTP_SECRET || process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('Set SESSION_SECRET to a random value of at least 32 characters before using email verification.')
  return crypto.createHmac('sha256', secret).update(code).digest('hex')
}

function otpMatches(code, storedHash) {
  if (typeof storedHash !== 'string' || !/^[a-f0-9]{64}$/i.test(storedHash)) return false
  const expected = Buffer.from(otpHash(code), 'hex')
  const actual = Buffer.from(storedHash, 'hex')
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

function validatePassword(value) {
  return typeof value === 'string' && value.length >= MIN_PASSWORD_LENGTH && value.length <= MAX_PASSWORD_LENGTH
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16)
    crypto.scrypt(password, salt, PASSWORD_BYTES, PASSWORD_OPTIONS, (error, key) => {
      if (error) return reject(error)
      resolve('scrypt$' + salt.toString('base64url') + '$' + Buffer.from(key).toString('base64url'))
    })
  })
}

function verifyPassword(password, encoded) {
  return new Promise((resolve) => {
    const parts = String(encoded || '').split('$')
    if (parts.length !== 3 || parts[0] !== 'scrypt') return resolve(false)
    try {
      const salt = Buffer.from(parts[1], 'base64url')
      const expected = Buffer.from(parts[2], 'base64url')
      if (salt.length !== 16 || expected.length !== PASSWORD_BYTES) return resolve(false)
      crypto.scrypt(password, salt, PASSWORD_BYTES, PASSWORD_OPTIONS, (error, key) => {
        if (error) return resolve(false)
        const actual = Buffer.from(key)
        resolve(actual.length === expected.length && crypto.timingSafeEqual(actual, expected))
      })
    } catch { resolve(false) }
  })
}

function originAllowed(req) {
  const origin = req.headers.origin
  if (!origin) return true
  let normalized
  try { normalized = new URL(origin).origin } catch { return false }
  const allowed = [process.env.CLIENT_URL, 'https://mangocode.vercel.app', 'https://mangocode-deathmango.vercel.app'].filter(Boolean)
  const requestOrigin = (req.headers['x-forwarded-proto'] || req.protocol || 'https') + '://' + req.headers.host
  if (normalized === requestOrigin || allowed.includes(normalized)) return true
  return process.env.NODE_ENV !== 'production' && !process.env.VERCEL && ['http://localhost:5173', 'http://localhost:4173'].includes(normalized)
}

async function createSession(userId, res) {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
  await db.execute('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP')
  await db.execute({ sql: 'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', args: [sessionHash(token), userId, expiresAt] })
  setSessionCookie(res, token, SESSION_DAYS * 86400)
}

async function applyOwnerRole(user) {
  if (!user) return user
  const ownerEmail = normalizeEmail(process.env.OWNER_EMAIL)
  if (ownerEmail && normalizeEmail(user.email) === ownerEmail && user.role !== 'OWNER') {
    await db.execute({ sql: "UPDATE users SET role = 'OWNER' WHERE id = ?", args: [user.id] })
    user.role = 'OWNER'
  }
  return user
}

async function findUserByEmail(email) {
  const result = await db.execute({
    sql: 'SELECT id, email, name, password_hash, google_sub, role, email_verified_at, legal_accepted_at, has_donated FROM users WHERE email = ? LIMIT 1',
    args: [email],
  })
  return result.rows[0] || null
}

async function issueOtp({ email, purpose, name = null, passwordHash = null, legalAccepted = false }) {
  // OTPs are short-lived; remove expired rows so abandoned sign-up/reset requests do not accumulate.
  await db.execute({ sql: 'DELETE FROM auth_otps WHERE expires_at <= CURRENT_TIMESTAMP' })
  const code = crypto.randomInt(100000, 1000000).toString()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS)
  const tokenHash = otpHash(code)
  await db.execute({
    sql: 'INSERT INTO auth_otps (email, purpose, token_hash, name, password_hash, legal_accepted_at, expires_at, attempts, last_sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?) ON CONFLICT (email, purpose) DO UPDATE SET token_hash = EXCLUDED.token_hash, name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, legal_accepted_at = EXCLUDED.legal_accepted_at, expires_at = EXCLUDED.expires_at, attempts = 0, last_sent_at = EXCLUDED.last_sent_at',
    args: [email, purpose, tokenHash, name, passwordHash, legalAccepted ? now.toISOString() : null, expiresAt.toISOString(), now.toISOString()],
  })
  try {
    await sendCodeEmail(email, code, purpose)
  } catch (error) {
    await db.execute({ sql: 'DELETE FROM auth_otps WHERE email = ? AND purpose = ?', args: [email, purpose] })
    throw error
  }
}

async function checkOtp(email, purpose, code) {
  const result = await db.execute({ sql: 'SELECT * FROM auth_otps WHERE email = ? AND purpose = ? LIMIT 1', args: [email, purpose] })
  const row = result.rows[0]
  if (!row) return { ok: false, error: 'No active code. Request a new one.' }
  const expiresAt = new Date(row.expires_at).getTime()
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    await db.execute({ sql: 'DELETE FROM auth_otps WHERE email = ? AND purpose = ?', args: [email, purpose] })
    return { ok: false, error: 'That code has expired. Request a new one.' }
  }
  if (Number(row.attempts) >= OTP_MAX_ATTEMPTS) {
    await db.execute({ sql: 'DELETE FROM auth_otps WHERE email = ? AND purpose = ?', args: [email, purpose] })
    return { ok: false, error: 'Too many incorrect attempts. Request a new code.' }
  }
  if (!otpMatches(code, row.token_hash)) {
    await db.execute({ sql: 'UPDATE auth_otps SET attempts = attempts + 1 WHERE email = ? AND purpose = ? AND attempts < ?', args: [email, purpose, OTP_MAX_ATTEMPTS] })
    return { ok: false, error: 'That code is incorrect.' }
  }
  return { ok: true, row }
}

authRouter.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  if (req.method === 'POST' && !originAllowed(req)) return res.status(403).json({ error: 'Request origin is not allowed.' })
  next()
})

authRouter.post('/register', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const password = req.body?.password
    if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' })
    if (!name || name.length > 60) return res.status(400).json({ error: 'Name must be between 1 and 60 characters.' })
    if (!validatePassword(password)) return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' })
    if (req.body?.legalAccepted !== true) return res.status(400).json({ error: 'Please review and accept the Terms and Privacy Policy.' })

    const ip = clientIp(req)
    const [ipLimit, emailLimit] = await Promise.all([
      checkRateLimit('register:ip:' + ip, 5, 15 * 60 * 1000),
      checkRateLimit('register:email:' + email, 4, 15 * 60 * 1000),
    ])
    if (!ipLimit || !emailLimit) return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' })

    if (await findUserByEmail(email)) {
      try { await sendAccountExistsEmail(email) } catch (mailError) { console.warn('Account notice email could not be sent:', mailError?.message || mailError) }
      return res.status(409).json({ error: 'An account already exists for this email. Sign in instead or reset its password.' })
    }
    await issueOtp({ email, purpose: 'register', name, passwordHash: await hashPassword(password), legalAccepted: true })
    res.json({ success: true, email, expiresInSeconds: OTP_TTL_MS / 1000 })
  } catch (error) { next(error) }
})

authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const code = typeof req.body?.code === 'string' ? req.body.code : ''
    if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Enter the six-digit code sent to your email.' })
    const limit = await checkRateLimit('verify-otp:ip:' + clientIp(req), 10, 15 * 60 * 1000)
    if (!limit) return res.status(429).json({ error: 'Too many attempts. Please request a new code later.' })

    const verified = await checkOtp(email, 'register', code)
    if (!verified.ok) return res.status(400).json({ error: verified.error })
    const row = verified.row
    const inserted = await db.transaction(async tx => {
      const consumed = await tx.execute({
        sql: 'DELETE FROM auth_otps WHERE email = ? AND purpose = ? AND token_hash = ? AND expires_at > CURRENT_TIMESTAMP AND attempts < ?',
        args: [email, 'register', row.token_hash, OTP_MAX_ATTEMPTS],
      })
      if (consumed.rowsAffected !== 1) return null
      const userId = crypto.randomUUID()
      const created = await tx.execute({
        sql: "INSERT INTO users (id, email, name, password_hash, auth_provider, role, email_verified_at, legal_accepted_at) VALUES (?, ?, ?, ?, 'password', 'USER', CURRENT_TIMESTAMP, ?) RETURNING id, email, name, role, email_verified_at",
        args: [userId, email, row.name, row.password_hash, row.legal_accepted_at || new Date().toISOString()],
      })
      return created.rows[0] || null
    })
    if (!inserted) return res.status(409).json({ error: 'This code was already used. Request a new one.' })
    const current = await applyOwnerRole(inserted)
    await createSession(current.id, res)
    res.status(201).json({ user: publicUser(current) })
  } catch (error) {
    if (error?.code === '23505') return res.status(409).json({ error: 'That email was just registered. Please sign in.' })
    next(error)
  }
})

authRouter.post('/resend-otp', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' })
    const limit = await checkRateLimit('resend-otp:ip:' + clientIp(req), 5, 15 * 60 * 1000)
    if (!limit) return res.status(429).json({ error: 'Too many resend requests. Try again later.' })
    const pending = await db.execute({
      sql: 'SELECT name, password_hash, legal_accepted_at, last_sent_at FROM auth_otps WHERE email = ? AND purpose = ? LIMIT 1',
      args: [email, 'register'],
    })
    const row = pending.rows[0]
    if (!row) return res.status(400).json({ error: 'No pending registration. Start again.' })
    const lastSent = new Date(row.last_sent_at).getTime()
    if (Number.isFinite(lastSent) && Date.now() - lastSent < OTP_RESEND_MS) return res.status(429).json({ error: 'Please wait before requesting another code.' })
    await issueOtp({ email, purpose: 'register', name: row.name, passwordHash: row.password_hash, legalAccepted: Boolean(row.legal_accepted_at) })
    res.json({ success: true })
  } catch (error) { next(error) }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!EMAIL_RE.test(email) || email.length > 254 || !password || password.length > MAX_PASSWORD_LENGTH) return res.status(401).json({ error: 'Email or password is incorrect.' })
    const ip = clientIp(req)
    const [ipLimit, identityLimit] = await Promise.all([
      checkRateLimit('login:ip:' + ip, 20, 5 * 60 * 1000),
      checkRateLimit('login:email:' + email, 8, 15 * 60 * 1000),
    ])
    if (!ipLimit || !identityLimit) return res.status(429).json({ error: 'Too many sign-in attempts. Please try again later.' })
    const user = await findUserByEmail(email)
    if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' })
    const current = await applyOwnerRole(user)
    if (!current.legal_accepted_at && req.body?.legalAccepted !== true) {
      return res.status(428).json({ error: 'Please review and accept the Terms and Privacy Policy before signing in.' })
    }
    if (req.body?.legalAccepted === true) {
      const acceptedAt = new Date().toISOString()
      await db.execute({ sql: 'UPDATE users SET legal_accepted_at = ? WHERE id = ?', args: [acceptedAt, current.id] })
      current.legal_accepted_at = acceptedAt
    }
    await createSession(current.id, res)
    res.json({ user: publicUser(current) })
  } catch (error) { next(error) }
})

authRouter.post('/google', async (req, res, next) => {
  try {
    const credential = typeof req.body?.credential === 'string' ? req.body.credential : ''
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) return res.status(503).json({ error: 'Google sign-in is not configured on the server yet.' })
    if (!credential || credential.length > 12000) return res.status(400).json({ error: 'Invalid Google credential.' })
    if (req.body?.legalAccepted !== true) return res.status(400).json({ error: 'Please accept the Terms and Privacy Policy before continuing with Google.' })
    const limit = await checkRateLimit('google:ip:' + clientIp(req), 20, 15 * 60 * 1000)
    if (!limit) return res.status(429).json({ error: 'Too many Google sign-in attempts. Try again later.' })

    const verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential)
    const response = await fetch(verifyUrl, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) })
    if (!response.ok) return res.status(401).json({ error: 'Google sign-in could not be verified.' })
    const claims = await response.json()
    const expires = Number(claims.exp)
    const emailVerified = claims.email_verified === true || claims.email_verified === 'true'
    if (claims.aud !== clientId || (claims.azp && claims.azp !== clientId) ||
        !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) ||
        !Number.isFinite(expires) || expires * 1000 <= Date.now() ||
        !emailVerified || !claims.sub || !claims.email) return res.status(401).json({ error: 'Google sign-in could not be verified.' })

    const email = normalizeEmail(claims.email)
    if (!EMAIL_RE.test(email)) return res.status(401).json({ error: 'Google did not return a valid email address.' })
    const byGoogle = await db.execute({ sql: 'SELECT id, email, name, role, email_verified_at, has_donated FROM users WHERE google_sub = ? LIMIT 1', args: [claims.sub] })
    let user = byGoogle.rows[0]
    if (!user) {
      const byEmail = await findUserByEmail(email)
      if (byEmail) {
        if (byEmail.google_sub && byEmail.google_sub !== claims.sub) return res.status(409).json({ error: 'This email is linked to another Google account.' })
        const googleIsAuthoritative = email.endsWith('@gmail.com') || Boolean(claims.hd)
        if (!googleIsAuthoritative) return res.status(409).json({ error: 'This email already has an account. Sign in with its password first, then contact support to link Google.' })
        const linked = await db.execute({
          sql: 'UPDATE users SET google_sub = ?, email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP) WHERE id = ? RETURNING id, email, name, role, email_verified_at, has_donated',
          args: [claims.sub, byEmail.id],
        })
        user = linked.rows[0]
      } else {
        const id = crypto.randomUUID()
        const name = String(claims.name || email.split('@')[0]).trim().slice(0, 60) || 'MangoCode learner'
        const created = await db.execute({
          sql: "INSERT INTO users (id, email, name, google_sub, auth_provider, role, email_verified_at) VALUES (?, ?, ?, ?, 'google', 'USER', CURRENT_TIMESTAMP) RETURNING id, email, name, role, email_verified_at",
          args: [id, email, name, claims.sub],
        })
        user = created.rows[0]
      }
    }
    const current = await applyOwnerRole(user)
    // The Google sign-in screen requires an explicit acceptance checkbox.
    // Persist that event instead of silently treating sign-in as consent.
    await db.execute({ sql: 'UPDATE users SET legal_accepted_at = CURRENT_TIMESTAMP WHERE id = ?', args: [current.id] })
    await createSession(current.id, res)
    res.json({ user: publicUser(current) })
  } catch (error) { next(error) }
})

authRouter.post('/password-reset/request', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' })
    const ip = clientIp(req)
    const [ipLimit, emailLimit] = await Promise.all([
      checkRateLimit('password-reset:ip:' + ip, 5, 15 * 60 * 1000),
      checkRateLimit('password-reset:email:' + email, 3, 60 * 60 * 1000),
    ])
    if (!ipLimit || !emailLimit) return res.status(429).json({ error: 'Too many reset requests. Try again later.' })
    const user = await findUserByEmail(email)
    if (user) {
      try { await issueOtp({ email, purpose: 'password_reset' }) }
      catch (mailError) { console.error('Password reset email failed:', mailError?.message || mailError) }
    }
    res.json({ success: true, message: 'If an account exists for that address, a reset code has been sent.' })
  } catch (error) { next(error) }
})

authRouter.post('/password-reset/confirm', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const code = typeof req.body?.code === 'string' ? req.body.code : ''
    const password = req.body?.newPassword
    if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Invalid or expired reset code.' })
    if (!validatePassword(password)) return res.status(400).json({ error: 'New password must be between 8 and 128 characters.' })
    const limit = await checkRateLimit('password-reset-confirm:ip:' + clientIp(req), 10, 15 * 60 * 1000)
    if (!limit) return res.status(429).json({ error: 'Too many attempts. Request a new code later.' })
    const verified = await checkOtp(email, 'password_reset', code)
    if (!verified.ok) return res.status(400).json({ error: 'Invalid or expired reset code.' })
    const updated = await db.transaction(async tx => {
      const consumed = await tx.execute({
        sql: 'DELETE FROM auth_otps WHERE email = ? AND purpose = ? AND token_hash = ? AND expires_at > CURRENT_TIMESTAMP AND attempts < ?',
        args: [email, 'password_reset', verified.row.token_hash, OTP_MAX_ATTEMPTS],
      })
      if (consumed.rowsAffected !== 1) return false
      const passwordHash = await hashPassword(password)
      const result = await tx.execute({ sql: 'UPDATE users SET password_hash = ? WHERE email = ?', args: [passwordHash, email] })
      await tx.execute({ sql: 'DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)', args: [email] })
      return result.rowsAffected === 1
    })
    if (!updated) return res.status(400).json({ error: 'Invalid or expired reset code.' })
    res.json({ success: true })
  } catch (error) { next(error) }
})

authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]
    if (token) await db.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [sessionHash(token)] })
    clearSessionCookie(res)
    res.json({ success: true })
  } catch (error) { next(error) }
})

authRouter.get('/me', async (req, res, next) => {
  try { res.json({ user: publicUser(await getCurrentUser(req)) }) }
  catch (error) { next(error) }
})
