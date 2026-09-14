import app from '../server/index.js'
import { emergencyMiddleware, securityStatus, activateLockdown, recoverLockdown } from '../server/security/emergencyLockdown.js'

export default async function handler(req, res) {
  if (req.url?.startsWith('/api/security/status')) return securityStatus(req, res)
  if (req.url?.startsWith('/api/security/lockdown')) return activateLockdown(req, res)
  if (req.url?.startsWith('/api/security/recover')) return recoverLockdown(req, res)

  await new Promise((resolve) => emergencyMiddleware(req, res, () => resolve()))
  if (res.headersSent) return
  return app(req, res)
}
