import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = String(import.meta.env.VITE_SUPPORT_EMAIL || '').trim()

export function Footer() {
  const [supportEmail, setSupportEmail] = useState(SUPPORT_EMAIL)
  useEffect(() => {
    let active = true
    fetch('/api/status', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => {
      if (active && typeof data?.supportEmail === 'string' && data.supportEmail.trim()) setSupportEmail(data.supportEmail.trim())
    }).catch(() => {})
    return () => { active = false }
  }, [])
  return <footer className="border-t border-ink/10 px-4 py-6 sm:px-6 md:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-semibold text-ink">MangoCode</p><p className="mt-1">Learn the idea. Understand the code. Build something useful.</p></div>
      <nav aria-label="Legal and information" className="flex flex-wrap gap-x-4 gap-y-2">
        <Link to="/donations" className="hover:text-ink">Support</Link>
        <Link to="/about" className="hover:text-ink">About</Link>
        <Link to="/privacy" className="hover:text-ink">Privacy</Link>
        <Link to="/terms" className="hover:text-ink">Terms</Link>
        <Link to="/refund" className="hover:text-ink">Refunds</Link>
        <Link to="/third-party-notice" className="hover:text-ink">Third-party notice</Link>
        {supportEmail && <a href={'mailto:' + supportEmail} className="hover:text-ink">Contact</a>}
      </nav>
    </div>
  </footer>
}
