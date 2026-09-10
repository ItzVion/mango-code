import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, XCircle } from 'lucide-react'

export function QuizBlock({ id, question, options }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function pick(index) {
    if (result || loading) return
    setSelected(index)
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id, selectedIndex: index }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Quiz check failed')
      setResult(data)
    } catch {
      setResult({ correct: false, error: true, message: 'Could not check this answer. Please try again.' })
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <p className="font-medium">{question}</p>
      <div className="mt-3 flex flex-col gap-2">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const isWrongPick = result && isSelected && !result.correct
          const isCorrectPick = result && isSelected && result.correct
          return (
            <motion.button
              key={i}
              whileHover={!result && !loading ? { x: 3 } : {}}
              onClick={() => pick(i)}
              disabled={Boolean(result) || loading}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-default ${
                isCorrectPick
                  ? 'border-leaf/40 bg-leaf/10 text-leaf'
                  : isWrongPick
                  ? 'border-rose/40 bg-rose/10 text-rose'
                  : 'border-ink/10 hover:bg-ink/5'
              }`}
            >
              <span>{opt}</span>
              {isCorrectPick && <CheckCircle2 size={16} />}
              {isWrongPick && <XCircle size={16} />}
            </motion.button>
          )
        })}
      </div>
      {result && (
        <p className={`mt-3 text-sm ${result.correct ? 'text-leaf' : 'text-rose'}`}>
          {result.message}
        </p>
      )}
    </div>
  )
}
