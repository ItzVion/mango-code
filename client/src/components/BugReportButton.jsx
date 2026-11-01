import { useState } from 'react'
import { Bug, X, Send } from 'lucide-react'
import { useLocation } from 'react-router-dom'

export default function BugReportButton() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Bug')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [delivered, setDelivered] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (description.trim().length < 10) { setMessage('Please describe the issue in at least 10 characters.'); return }
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/bugreport', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), category, page: location.pathname }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not send the report.')
      setDelivered(data.delivered === true)
      setSent(true)
      setDescription('')
    } catch (error) { setMessage(error.message || 'Could not send the report.') }
    finally { setBusy(false) }
  }

  function close() {
    setOpen(false)
    setMessage('')
    setSent(false)
    setDelivered(false)
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Report a bug" title="Report a bug" className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card px-4 py-3 text-sm font-semibold text-ink shadow-md hover:bg-paper md:bottom-6">
      <Bug size={17}/> <span>Report a bug</span>
    </button>
    {open && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-3 sm:items-center" onClick={close}>
      <section role="dialog" aria-modal="true" aria-labelledby="bug-report-title" className="w-full max-w-lg rounded-xl border border-ink/10 bg-card p-5 shadow-2xl sm:p-6" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-mango-deep">FEEDBACK</p><h2 id="bug-report-title" className="mt-1 text-xl font-bold">Report a problem</h2></div><button type="button" onClick={close} aria-label="Close" className="rounded-lg p-2 text-ink-soft hover:bg-paper"><X size={18}/></button></div>
        {sent ? <div className="mt-5 rounded-lg border border-leaf/30 bg-leaf/5 p-4"><p className="font-semibold text-leaf">Report saved. Thank you.</p><p className="mt-1 text-sm text-ink-soft">{delivered ? 'Your report was also delivered to the MangoCode Discord channel.' : 'Your report is saved in MangoCode and can be reviewed in the admin Reports panel, but Discord notification was not delivered.'}</p><button type="button" onClick={close} className="mt-3 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper">Done</button></div> : <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block"><span className="mb-1.5 block text-sm font-semibold">Type</span><select value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2.5 text-sm"><option>Bug</option><option>Content issue</option><option>Suggestion</option><option>Accessibility</option></select></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold">What happened?</span><textarea value={description} onChange={event => setDescription(event.target.value)} rows={5} maxLength={1000} required placeholder="Tell us what you clicked, what you expected, and what happened instead." className="w-full resize-y rounded-lg border border-ink/15 bg-paper px-3 py-3 text-sm leading-6 outline-none focus:border-mango-deep"/></label>
          <p className="text-xs text-ink-soft">Page: {location.pathname}. Do not include passwords, verification codes, API keys or private information.</p>
          {message && <p role="alert" className="rounded-lg bg-rose/5 p-3 text-sm text-rose">{message}</p>}
          <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-paper hover:bg-ink/85 disabled:opacity-50"><Send size={15}/>{busy ? 'Sending…' : 'Send report'}</button>
        </form>}
      </section>
    </div>}
  </>
}
