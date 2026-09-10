import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle, Play } from 'lucide-react'

export function ExerciseBlock({ id, prompt, starterCode }) {
  const [code, setCode] = useState(starterCode || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function runCheck() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/exercises/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: id, code }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ pass: false, message: 'Could not reach the server.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <p className="font-medium">{prompt}</p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="mt-3 h-40 w-full rounded-xl border border-ink/10 bg-ink p-4 font-mono text-sm text-paper outline-none focus:border-mango"
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={runCheck}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-mango px-5 py-2 text-sm font-semibold text-ink disabled:opacity-60"
      >
        <Play size={15} /> {loading ? 'Checking…' : 'Run & check'}
      </motion.button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-sm ${
              result.pass ? 'border-leaf/30 bg-leaf/10 text-leaf' : 'border-rose/30 bg-rose/10 text-rose'
            }`}
          >
            {result.pass ? <CheckCircle2 size={17} className="shrink-0" /> : <XCircle size={17} className="shrink-0" />}
            <span>{result.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
