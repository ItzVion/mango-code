import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, LockKeyhole, RotateCcw, Trophy } from 'lucide-react'
import { apiHeaders } from '../../lib/user'

export function TestBlock({ lessonId, questions, final = false, passed = false, onPassed }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const required = final ? 8 : 4
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
      <div className="rounded-2xl border border-leaf/30 bg-leaf/10 p-6">
        <div className="flex items-center gap-3 text-leaf">
          <Trophy size={22} />
          <div>
            <p className="font-semibold">Checkpoint passed</p>
            <p className="text-sm opacity-90">You can continue to the next section.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{final ? 'Final Test' : 'Difficulty Test'}</h3>
          <p className="mt-1 text-sm text-ink-soft">Answer all {questions.length} questions. You need {required}/{questions.length} to pass.</p>
        </div>
        <LockKeyhole size={18} className="text-ink-soft" />
      </div>

      <div className="mt-5 flex flex-col gap-5">
        {questions.map((q, qi) => (
          <div key={q.id}>
            <p className="font-medium">{qi + 1}. {q.question}</p>
            <div className="mt-2 grid gap-2">
              {q.options.map((option, i) => {
                const selected = answers[q.id] === i
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [q.id]: i }))}
                    className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${selected ? 'border-mango bg-mango/15' : 'border-ink/10 hover:bg-ink/5'}`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={!complete || loading}
          className="rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit test'}
        </motion.button>
        {result && !result.passed && (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm text-ink-soft hover:bg-ink/5">
            <RotateCcw size={15} /> Try again
          </button>
        )}
      </div>

      {result && (
        <div className={`mt-4 rounded-xl border p-4 text-sm ${result.passed ? 'border-leaf/30 bg-leaf/10 text-leaf' : 'border-rose/30 bg-rose/10 text-rose'}`}>
          <div className="flex items-center gap-2 font-semibold">
            {result.passed && <CheckCircle2 size={17} />}
            {result.score}/{result.total} — {result.message}
          </div>
        </div>
      )}
    </div>
  )
}
