import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { checkRateLimit, clientIp } from '../rateLimit.js'
import { db } from '../db.js'

export const bugreportRouter = Router()

function getWebhookUrl() {
  const value = String(process.env.DISCORD_BUG_WEBHOOK || '').trim()
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !['discord.com', 'discordapp.com'].includes(url.hostname) || !/^\/api\/webhooks\/\d+\/[^/]+$/.test(url.pathname)) return null
    return url.toString()
  } catch { return null }
}

bugreportRouter.post('/', optionalAuth, async (req, res, next) => {
 try {
  const allowed = await checkRateLimit('bug-report:' + clientIp(req), 4, 10 * 60 * 1000)
  if (!allowed) return res.status(429).json({ error: 'Too many reports. Please wait before sending another.' })

  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : ''
  const page = typeof req.body?.page === 'string' ? req.body.page.trim().slice(0, 200) : '/'
  const category = typeof req.body?.category === 'string' ? req.body.category.trim().slice(0, 40) : 'Bug'
  if (description.length < 10 || description.length > 1000) {
    return res.status(400).json({ error: 'Describe the problem in 10–1000 characters.' })
  }
  if (!page.startsWith('/') || page.startsWith('//')) return res.status(400).json({ error: 'Invalid page path.' })

  const saved = await db.execute({ sql: 'INSERT INTO bug_reports (user_id, category, page, description) VALUES (?, ?, ?, ?) RETURNING id', args: [req.userId || null, category || 'Bug', page, description] })
  const reportId = saved.rows[0]?.id

  const webhook = getWebhookUrl()
  if (!webhook) return res.status(503).json({ error: 'Bug reporting is not configured yet.' })

  const payload = {
    username: 'MangoCode Bug Reports',
    allowed_mentions: { parse: [] },
    embeds: [{
      title: 'New MangoCode bug report',
      color: 0xefad32,
      fields: [
        { name: 'Category', value: category || 'Bug', inline: true },
        { name: 'Page', value: page, inline: true },
        { name: 'Reporter', value: req.user?.id ? 'Signed-in user (' + req.user.id + ')' : 'Guest', inline: true },
        { name: 'Description', value: description },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'MangoCode feedback' },
    }],
  }

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      console.error('Discord bug report delivery failed with status:', response.status)
      return res.status(502).json({ error: 'Discord could not accept the report. Please try again later.' })
    }
    res.json({ success: true, reportId })
  } catch (error) {
    console.error('Bug report delivery failed:', error?.message || error)
    res.status(502).json({ error: 'Could not deliver the report. Please try again later.' })
  }
 } catch (error) { next(error) }
})
