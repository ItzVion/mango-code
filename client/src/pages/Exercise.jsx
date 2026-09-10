import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle, Play } from 'lucide-react'

export default function Exercise() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null) // null | { pass, message }
  const [loading, setLoading] = useState(false)

  async function runCheck() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/exercises/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: 'sample', language: 'python', code }),
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 max-w-2xl">
      <h2 className="text-2xl font-semibold">Write a function that returns the sum of a list</h2>
      <p className="mt-1 text-ink-soft">Define <code>total(nums)</code> that returns the sum.</p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={'def total(nums):\n    return ...'}
        className="mt-4 h-48 w-full rounded-2xl border border-ink/10 bg-ink p-4 font-mono text-sm text-paper outline-none focus:border-mango"
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={runCheck}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
      >
        <Play size={16} /> {loading ? 'Checking…' : 'Run & check'}
      </motion.button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-4 flex items-start gap-2 rounded-2xl border p-4 text-sm ${
              result.pass ? 'border-leaf/30 bg-leaf/10 text-leaf' : 'border-rose/30 bg-rose/10 text-rose'
            }`}
          >
            {result.pass ? <CheckCircle2 size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
            <span>{result.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
