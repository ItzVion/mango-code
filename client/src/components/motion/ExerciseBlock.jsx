import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle, Play, Lightbulb } from 'lucide-react'
import { apiHeaders } from '../../lib/user'

export function ExerciseBlock({ id, prompt, starterCode }) {
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
      setResult({ pass: false, message: 'Could not reach the code runner. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mango/15 text-mango"><Lightbulb size={17} /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Your challenge</p>
          <p className="mt-1 font-medium leading-6">{prompt}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-xl bg-ink/[0.04] p-3 text-xs text-ink-soft sm:grid-cols-3">
        <div><span className="font-bold text-ink">1.</span> Read the goal</div>
        <div><span className="font-bold text-ink">2.</span> Try it yourself</div>
        <div><span className="font-bold text-ink">3.</span> Run & learn from the result</div>
      </div>

      <label className="mt-4 block text-xs font-semibold text-ink-soft">Your code</label>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} aria-label="Your code" className="mt-2 h-40 w-full rounded-xl border border-ink/10 bg-ink p-4 font-mono text-sm leading-6 text-paper outline-none transition focus:border-mango focus:ring-2 focus:ring-mango/15" />
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={runCheck} disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-full bg-mango px-5 py-2 text-sm font-semibold text-ink disabled:opacity-60">
        <Play size={15} /> {loading ? 'Checking…' : 'Run & check'}
      </motion.button>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-sm ${result.pass ? 'border-leaf/30 bg-leaf/10 text-leaf' : 'border-rose/30 bg-rose/10 text-rose'}`}>
            {result.pass ? <CheckCircle2 size={17} className="shrink-0" /> : <XCircle size={17} className="shrink-0" />}
            <span>{result.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
