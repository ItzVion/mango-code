import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, LockKeyhole, RotateCcw, Trophy } from 'lucide-react'
import { apiHeaders } from '../../lib/user'

export function TestBlock({ lessonId, questions, final = false, passed = false, onPassed }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const required = 8
  const complete = useMemo(() => questions.every((q) => Number.isInteger(answers[q.id])), [questions, answers])

  async function submit() {
    if (!complete || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/tests/submit', {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ lessonId, answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit test')
      setResult(data)
      if (data.passed) onPassed?.()
    } catch (error) {
      setResult({ passed: false, message: error.message || 'Could not submit this test. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setAnswers({})
    setResult(null)
  }

  if (passed && !result) {
    return (
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="rounded-3xl border border-leaf/30 bg-leaf/10 p-6">
        <div className="flex items-center gap-3 text-leaf">
          <motion.div animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}><Trophy size={24} /></motion.div>
          <div><p className="font-semibold">Checkpoint passed 🎉</p><p className="text-sm opacity-90">Nice! The next section is unlocked.</p></div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-ink/10 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><h3 className="font-semibold">{final ? 'Final Assessment' : 'Checkpoint Challenge'}</h3><p className="mt-1 text-sm text-ink-soft">10 questions · {required}/10 to pass</p></div>
        <LockKeyhole size={18} className="text-ink-soft" />
      </div>

      <div className="mt-5 flex flex-col gap-5">
        {questions.map((q, qi) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.035 }}>
            <p className="font-medium">{qi + 1}. {q.question}</p>
            <div className="mt-2 grid gap-2">
              {q.options.map((option, i) => {
                const selected = answers[q.id] === i
                return <motion.button key={i} type="button" whileTap={{ scale: 0.985 }} onClick={() => setAnswers((current) => ({ ...current, [q.id]: i }))} className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${selected ? 'border-mango bg-mango/15' : 'border-ink/10 hover:border-mango/40 hover:bg-mango/5'}`}>{option}</motion.button>
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={submit} disabled={!complete || loading} className="rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">{loading ? 'Checking…' : 'Check my answers'}</motion.button>
        {result && !result.passed && <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm text-ink-soft hover:bg-ink/5"><RotateCcw size={15} /> Try again</button>}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 rounded-2xl border p-4 text-sm ${result.passed ? 'border-leaf/30 bg-leaf/10 text-leaf' : 'border-rose/30 bg-rose/10 text-rose'}`}>
            <div className="flex items-center gap-2 font-semibold">{result.passed && <CheckCircle2 size={17} />}{result.score != null ? `${result.score}/${result.total} — ` : ''}{result.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
