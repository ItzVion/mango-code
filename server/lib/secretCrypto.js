import crypto from 'node:crypto'

function keyFromEnvironment() {
  const secret = String(process.env.SESSION_SECRET || '')
  if (secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.')
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFromEnvironment(), iv)
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.')
}

export function decryptSecret(value) {
  const parts = String(value || '').split('.')
  if (parts.length !== 3 || parts.some(part => !part)) throw new Error('Stored secret is invalid.')
  const [iv, tag, ciphertext] = parts
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyFromEnvironment(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')
}
