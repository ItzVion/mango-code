import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { apiHeaders } from '../../lib/user'

function Celebration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, x: '50%', y: '45%', scale: 0.4, rotate: 0 }}
          animate={{ opacity: 0, x: `${8 + ((i * 67) % 84)}%`, y: `${4 + ((i * 43) % 84)}%`, scale: 1, rotate: i * 53 }}
          transition={{ duration: 0.8, delay: i * 0.015, ease: 'easeOut' }}
          className="absolute h-2 w-2 rounded-sm bg-mango"
        />
      ))}
    </div>
  )
}

export function QuizBlock({ id, question, options, onAnswered }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function pick(index) {
    if (loading || result?.correct) return
    setSelected(index)
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ questionId: id, selectedIndex: index }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Quiz check failed')
      setResult(data)
      onAnswered?.(data)
    } catch {
      setResult({ correct: false, error: true, message: 'Could not check this answer. Please try again.' })
      setSelected(null)
      onAnswered?.(null)
    } finally {
      setLoading(false)
    }
  }

  function retry() {
    setSelected(null)
    setResult(null)
    onAnswered?.(null)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-card p-5 shadow-sm sm:p-6">
      {result?.correct && <Celebration />}
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-mango/15 px-3 py-1 text-xs font-semibold text-ink">Quick check</span>
          <motion.span animate={result?.correct ? { rotate: [0, -12, 12, 0], scale: [1, 1.25, 1] } : {}} className="text-lg">🧠</motion.span>
        </div>
        <p className="text-lg font-semibold leading-7">{question}</p>
        <div className="mt-5 flex flex-col gap-2.5">
          {options.map((opt, i) => {
            const isSelected = selected === i
            const isWrongPick = result && isSelected && !result.correct
            const isCorrectPick = result && isSelected && result.correct
            return (
              <motion.button
                key={i}
                type="button"
                whileHover={!result || !result.correct ? { x: 4, scale: 1.01 } : {}}
                whileTap={!result || !result.correct ? { scale: 0.985 } : {}}
                onClick={() => pick(i)}
                disabled={loading || Boolean(result?.correct)}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${
                  isCorrectPick ? 'border-leaf/40 bg-leaf/10 text-leaf' :
                  isWrongPick ? 'border-rose/40 bg-rose/10 text-rose' :
                  'border-ink/10 bg-paper hover:border-mango/50 hover:bg-mango/5'
                }`}
              >
                <span>{opt}</span>
                {isCorrectPick && <CheckCircle2 size={18} />}
                {isWrongPick && <XCircle size={18} />}
              </motion.button>
            )
          })}
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`mt-4 flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm font-medium ${result.correct ? 'border-leaf/30 bg-leaf/10 text-leaf' : 'border-rose/30 bg-rose/10 text-rose'}`}>
              <span>{result.correct ? '🎉 ' : '💭 '}{result.message}</span>
              {!result.correct && !result.error && <button type="button" onClick={retry} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-white"><RotateCcw size={13} /> Try again</button>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
