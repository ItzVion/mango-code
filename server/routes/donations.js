import { Router } from 'express'
import crypto from 'node:crypto'
import { db } from '../db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { checkRateLimit, clientIp } from '../rateLimit.js'

export const donationsRouter = Router()

const UTR_RE = /^[A-Z0-9]{8,22}$/
const MAX_AMOUNT_RUPEES = 100000

function secretKey() {
  const secret = String(process.env.SESSION_SECRET || '')
  if (secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.')
  return crypto.createHash('sha256').update(secret).digest()
}
function decryptSecret(value) {
  const parts = String(value || '').split('.')
  if (parts.length !== 3 || parts.some(part => !part)) throw new Error('Stored payment credentials are invalid.')
  const [iv, tag, data] = parts
  const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8')
}
async function setting(key, fallback = '') {
  const result = await db.execute({ sql: 'SELECT value FROM admin_settings WHERE key = ?', args: [key] })
  return result.rows[0]?.value ?? fallback
}
async function razorpayConfig() {
  const [keyId, encryptedSecret] = await Promise.all([setting('razorpay_key_id'), setting('razorpay_key_secret')])
  return { keyId, keySecret: encryptedSecret ? decryptSecret(encryptedSecret) : '' }
}
function safeAmount(value) {
  const amount = Number(value)
  return Number.isSafeInteger(amount) && amount >= 1 && amount <= MAX_AMOUNT_RUPEES ? amount : null
}
function safeCompareHex(expected, received) {
  if (!/^[a-f0-9]{64}$/i.test(received)) return false
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(received, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

donationsRouter.get('/public', async (_req, res, next) => {
  try {
    const [donationMessage, qrMode, upiVpa, supportEmail, config] = await Promise.all([
      setting('donation_message', 'MangoCode is free to use. Contributions help cover hosting and keep learning resources available.'),
      setting('qr_mode', 'false'),
      setting('upi_vpa'),
      setting('support_email', process.env.SUPPORT_EMAIL || ''),
      razorpayConfig(),
    ])
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.json({
      donationMessage, qrMode: qrMode === 'true', upiVpa, supportEmail,
      razorpayKeyId: config.keyId || null,
      razorpayConfigured: Boolean(config.keyId && config.keySecret),
      maxAmountRupees: MAX_AMOUNT_RUPEES,
    })
  } catch (error) { next(error) }
})

donationsRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await db.execute({
      sql: "SELECT id, amount_rupees, status, created_at FROM donations WHERE user_id = ? AND status = 'paid' ORDER BY created_at DESC LIMIT 100",
      args: [req.userId],
    })
    res.json(result.rows)
  } catch (error) { next(error) }
})

donationsRouter.get('/upi-claim/me', requireAuth, async (req, res, next) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, amount_rupees, utr_number, status, created_at, reviewed_at, review_note FROM upi_donation_claims WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      args: [req.userId],
    })
    res.json(result.rows[0] || null)
  } catch (error) { next(error) }
})

donationsRouter.post('/upi-claim', requireAuth, async (req, res, next) => {
  try {
    const allowed = await checkRateLimit('upi-claim:ip:' + clientIp(req), 5, 60 * 60 * 1000)
    if (!allowed) return res.status(429).json({ error: 'Too many UPI claims. Please try again later.' })
    const amountRupees = safeAmount(req.body?.amountRupees)
    const utrNumber = typeof req.body?.utrNumber === 'string' ? req.body.utrNumber.trim().toUpperCase() : ''
    if (!amountRupees) return res.status(400).json({ error: 'Enter a whole amount between ₹1 and ₹1,00,000.' })
    if (!UTR_RE.test(utrNumber)) return res.status(400).json({ error: 'Enter a valid UTR / bank reference number (8–22 letters or numbers).' })
    const pending = await db.execute({
      sql: "SELECT id, amount_rupees, status, created_at FROM upi_donation_claims WHERE user_id = ? AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1",
      args: [req.userId],
    })
    if (pending.rows[0]) return res.status(409).json({ error: 'You already have a UPI payment awaiting review.', claim: pending.rows[0] })
    try {
      const created = await db.execute({
        sql: 'INSERT INTO upi_donation_claims (user_id, amount_rupees, utr_number) VALUES (?, ?, ?) RETURNING id, amount_rupees, utr_number, status, created_at',
        args: [req.userId, amountRupees, utrNumber],
      })
      return res.status(201).json({ success: true, claim: created.rows[0] })
    } catch (error) {
      if (error?.code === '23505') return res.status(409).json({ error: 'This UTR has already been submitted, or you already have a claim awaiting review.' })
      throw error
    }
  } catch (error) { next(error) }
})

donationsRouter.post('/create-order', optionalAuth, async (req, res, next) => {
  try {
    const allowed = await checkRateLimit('donation-order:ip:' + clientIp(req), 8, 60 * 1000)
    if (!allowed) return res.status(429).json({ error: 'Too many donation attempts. Please wait a minute.' })
    const amountRupees = safeAmount(req.body?.amountRupees)
    if (!amountRupees) return res.status(400).json({ error: 'Enter a whole amount between ₹1 and ₹1,00,000.' })
    const { keyId, keySecret } = await razorpayConfig()
    if (!keyId || !keySecret) return res.status(503).json({ error: "Razorpay isn't configured yet. The site owner can add the credentials in /admin." })
    let providerResponse
    try {
      providerResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountRupees * 100,
          currency: 'INR',
          receipt: 'mc_' + Date.now() + '_' + crypto.randomBytes(5).toString('hex'),
        }),
        signal: AbortSignal.timeout(8000),
      })
    } catch (error) {
      console.error('Razorpay order request failed:', error?.message || 'network error')
      return res.status(502).json({ error: 'Payment provider is temporarily unavailable. Please try again.' })
    }
    const order = await providerResponse.json().catch(() => null)
    if (!providerResponse.ok || typeof order?.id !== 'string' || order.amount !== amountRupees * 100 || order.currency !== 'INR') {
      console.error('Razorpay returned an invalid order response.')
      return res.status(502).json({ error: 'Razorpay could not create the payment order.' })
    }
    await db.execute({
      sql: "INSERT INTO donations (user_id, amount_rupees, razorpay_order_id, status) VALUES (?, ?, ?, 'created')",
      args: [req.userId || null, amountRupees, order.id],
    })
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId })
  } catch (error) { next(error) }
})

donationsRouter.post('/verify', optionalAuth, async (req, res, next) => {
  try {
    const allowed = await checkRateLimit('donation-verify:ip:' + clientIp(req), 16, 60 * 1000)
    if (!allowed) return res.status(429).json({ error: 'Too many payment verification attempts. Please wait.' })
    const orderId = typeof req.body?.razorpay_order_id === 'string' ? req.body.razorpay_order_id : ''
    const paymentId = typeof req.body?.razorpay_payment_id === 'string' ? req.body.razorpay_payment_id : ''
    const signature = typeof req.body?.razorpay_signature === 'string' ? req.body.razorpay_signature : ''
    if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) {
      return res.status(400).json({ error: 'Missing or invalid payment details.' })
    }
    const config = await razorpayConfig()
    if (!config.keyId || !config.keySecret) return res.status(503).json({ error: "Razorpay isn't configured." })
    const existingResult = await db.execute({
      sql: 'SELECT id, user_id, amount_rupees, status, razorpay_payment_id FROM donations WHERE razorpay_order_id = ? LIMIT 1',
      args: [orderId],
    })
    const existing = existingResult.rows[0]
    if (!existing || (existing.user_id && existing.user_id !== req.userId)) return res.status(404).json({ error: 'Unknown payment order.' })
    const expectedSignature = crypto.createHmac('sha256', config.keySecret).update(orderId + '|' + paymentId).digest('hex')
    if (!safeCompareHex(expectedSignature, signature)) return res.status(400).json({ error: 'Payment signature verification failed.' })

    let paymentResponse
    try {
      paymentResponse = await fetch('https://api.razorpay.com/v1/payments/' + encodeURIComponent(paymentId), {
        method: 'GET',
        headers: { Authorization: 'Basic ' + Buffer.from(config.keyId + ':' + config.keySecret).toString('base64') },
        signal: AbortSignal.timeout(8000),
      })
    } catch (error) {
      console.error('Razorpay payment lookup failed:', error?.message || 'network error')
      return res.status(502).json({ error: 'Payment status could not be confirmed with Razorpay. Please retry.' })
    }
    const payment = await paymentResponse.json().catch(() => null)
    if (!paymentResponse.ok) return res.status(502).json({ error: 'Payment status could not be confirmed with Razorpay. Please retry.' })
    if (payment?.id !== paymentId || payment?.order_id !== orderId || payment?.status !== 'captured' ||
        payment?.currency !== 'INR' || payment?.amount !== Number(existing.amount_rupees) * 100) {
      return res.status(400).json({ error: 'The payment is not captured for this order or the amount does not match.' })
    }

    const updated = await db.transaction(async tx => {
      const locked = await tx.execute({
        sql: 'SELECT id, user_id, amount_rupees, status, razorpay_payment_id FROM donations WHERE razorpay_order_id = ? FOR UPDATE',
        args: [orderId],
      })
      const row = locked.rows[0]
      if (!row) return false
      if (row.status === 'paid') return row.razorpay_payment_id === paymentId
      if (row.status !== 'created' || (row.razorpay_payment_id && row.razorpay_payment_id !== paymentId)) return false
      const changed = await tx.execute({
        sql: "UPDATE donations SET razorpay_payment_id = ?, status = 'paid' WHERE id = ? AND status = 'created'",
        args: [paymentId, row.id],
      })
      if (changed.rowsAffected !== 1) return false
      if (row.user_id) await tx.execute({ sql: 'UPDATE users SET has_donated = TRUE WHERE id = ?', args: [row.user_id] })
      return true
    })
    if (!updated) return res.status(409).json({ error: 'This order has already been linked to another payment.' })
    res.json({ success: true })
  } catch (error) {
    if (error?.code === '23505') return res.status(409).json({ error: 'This payment has already been recorded.' })
    next(error)
  }
})

export default donationsRouter
