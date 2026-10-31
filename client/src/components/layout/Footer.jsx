import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = String(import.meta.env.VITE_SUPPORT_EMAIL || '').trim()

export function Footer() {
  return <footer className="border-t border-ink/10 px-4 py-6 sm:px-6 md:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-semibold text-ink">MangoCode</p><p className="mt-1">Learn the idea. Understand the code. Build something useful.</p></div>
      <nav aria-label="Legal and information" className="flex flex-wrap gap-x-4 gap-y-2">
        <Link to="/about" className="hover:text-ink">About</Link>
        <Link to="/privacy" className="hover:text-ink">Privacy</Link>
        <Link to="/terms" className="hover:text-ink">Terms</Link>
        <Link to="/third-party-notice" className="hover:text-ink">Third-party notice</Link>
        {SUPPORT_EMAIL && <a href={'mailto:' + SUPPORT_EMAIL} className="hover:text-ink">Contact</a>}
      </nav>
    </div>
  </footer>
}
