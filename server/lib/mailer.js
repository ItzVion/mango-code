import nodemailer from 'nodemailer'
import crypto from 'node:crypto'
import { db } from '../db.js'
import { resolvePublicSmtpHost } from './smtpSecurity.js'

function required(name, value) {
  if (!value) throw new Error(name + ' is not configured.')
  return value
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  })
}

async function transporterConfig() {
  const stored = await db.execute({ sql: "SELECT value FROM admin_settings WHERE key = 'smtp_config'" })
  const encrypted = stored.rows[0]?.value
  let config
  if (encrypted) {
    const secret = String(process.env.SESSION_SECRET || '')
    if (secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters to decrypt SMTP settings.')
    const parts = String(encrypted).split('.')
    if (parts.length !== 3 || parts.some(part => !part)) throw new Error('Stored SMTP credentials are invalid.')
    const [iv, tag, data] = parts
    const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.createHash('sha256').update(secret).digest(), Buffer.from(iv, 'base64url'))
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    const decoded = Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8')
    config = JSON.parse(decoded)
  } else {
    config = {
      host: process.env.SMTP_HOST,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
    }
  }
  const host = required('SMTP_HOST', config.host)
  await resolvePublicSmtpHost(host)
  const user = required('SMTP_USER', config.user)
  const pass = required('SMTP_PASS', config.pass)
  const port = Number(config.port || 587)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be a valid TCP port.')
  const secure = typeof config.secure === 'boolean'
    ? config.secure
    : String(config.secure || '').toLowerCase() === 'true' || port === 465
  const fromAddress = config.from || user
  return {
    transporter: nodemailer.createTransport({
      host, port, secure, auth: { user, pass },
      connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000,
    }),
    from: process.env.SMTP_FROM_NAME
      ? '"' + String(process.env.SMTP_FROM_NAME).replace(/["\r\n]/g, '') + '" <' + fromAddress + '>'
      : fromAddress,
  }
}
function emailShell(title, content) {
  return '<!doctype html><html><body style="margin:0;padding:28px 14px;background:#f5f6f3;font-family:Arial,sans-serif;color:#18201c">' +
    '<main style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e4e7e1;border-radius:16px;overflow:hidden">' +
    '<div style="height:5px;background:#efad32"></div><div style="padding:30px">' +
    '<p style="margin:0 0 22px;font-size:12px;font-weight:700;letter-spacing:.14em;color:#98630b">MANGOCODE</p>' +
    '<h1 style="font-size:25px;line-height:1.2;margin:0 0 14px">' + title + '</h1>' + content +
    '</div></main><p style="max-width:520px;margin:16px auto 0;text-align:center;color:#818981;font-size:11px">MangoCode · Learn by understanding and building</p>' +
    '</body></html>'
}

export async function sendCodeEmail(email, code, purpose = 'verification') {
  const config = await transporterConfig()
  const reset = purpose === 'password_reset'
  const title = reset ? 'Reset your password' : 'Verify your email address'
  const intro = reset
    ? 'Use this one-time code to reset the password on your MangoCode account.'
    : 'Use this one-time code to finish creating your MangoCode account.'
  await config.transporter.sendMail({
    from: config.from,
    to: email,
    subject: code + ' is your MangoCode ' + (reset ? 'password reset' : 'verification') + ' code',
    text: intro + '\n\n' + code + '\n\nThis code expires in 10 minutes. If you did not request it, ignore this email.',
    html: emailShell(title, '<p style="font-size:14px;line-height:1.6;color:#59635e">' + intro + '</p>' +
      '<div style="margin:24px 0;padding:22px;text-align:center;border-radius:12px;background:#18201c;color:#fff;font-size:34px;font-weight:700;letter-spacing:.28em">' + escapeHtml(code) + '</div>' +
      '<p style="font-size:13px;line-height:1.6;color:#59635e">This code expires in <strong>10 minutes</strong>, can be used once, and should never be shared. If you did not request it, ignore this email.</p>'),
  })
}

export async function sendAccountExistsEmail(email) {
  const config = await transporterConfig()
  await config.transporter.sendMail({
    from: config.from,
    to: email,
    subject: 'Your MangoCode account already exists',
    text: 'Someone tried to register with this email address. Sign in to your existing account if that was you. If it was not you, no action is needed.',
    html: emailShell('Your account already exists', '<p style="font-size:14px;line-height:1.7;color:#59635e">Someone tried to create a MangoCode account using this email address. If that was you, sign in to your existing account. If it was not you, no action is needed.</p>'),
  })
}
