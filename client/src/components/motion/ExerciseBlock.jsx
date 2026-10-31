import { useState } from 'react'
import { CheckCircle2, XCircle, Play, Lightbulb, RotateCcw } from 'lucide-react'
import { apiHeaders } from '../../lib/user'

export function ExerciseBlock({ id, prompt, starterCode, language = 'Code' }) {
  const [code, setCode] = useState(starterCode || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function runCheck() {
    if (loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/exercises/check', {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ exerciseId: id, code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResult({ pass: false, message: data.message || data.error || 'The code runner could not check this yet. Please try again.' })
        return
      }
      setResult(data)
    } catch {
      setResult({ pass: false, message: 'Could not reach the code runner. Check your connection and try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-ink/15 bg-card">
      <div className="border-b border-ink/10 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-dim text-mango-deep"><Lightbulb size={17}/></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Practical exercise</p><h4 className="mt-1 font-semibold">Your turn to write the code</h4></div>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink-soft">{prompt}</p>
        <p className="mt-2 text-xs text-ink-soft">Write your solution below, run it, then use the result to decide what to fix.</p>
      </div>
      <div className="bg-[#171d1a]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-white/60">
          <span>{language} · editor</span><span>Editable code</span>
        </div>
        <textarea value={code} onChange={event => setCode(event.target.value)} spellCheck={false} aria-label="Your code"
          className="min-h-48 w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-6 text-[#f1f4ee] outline-none placeholder:text-white/30 focus:ring-2 focus:ring-inset focus:ring-mango/50" />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 px-4 py-3 sm:px-5">
        <button type="button" onClick={runCheck} disabled={loading || !code.trim()} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 disabled:opacity-50">
          <Play size={15}/>{loading ? 'Running code…' : 'Run code'}
        </button>
        <button type="button" onClick={() => { setCode(starterCode || ''); setResult(null) }} className="inline-flex items-center gap-2 rounded-lg border border-ink/15 px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper"><RotateCcw size={14}/>Reset</button>
      </div>
      {result && <div role="status" aria-live="polite" className={`flex items-start gap-2 border-t px-4 py-3 text-sm leading-6 sm:px-5 ${result.pass ? 'border-leaf/25 bg-leaf/5 text-leaf' : 'border-rose/25 bg-rose/5 text-rose'}`}>
        {result.pass ? <CheckCircle2 size={17} className="mt-0.5 shrink-0"/> : <XCircle size={17} className="mt-0.5 shrink-0"/>}
        <span>{result.message}</span>
      </div>}
    </section>
  )
}
