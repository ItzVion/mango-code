import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, XCircle } from 'lucide-react'

export function QuizBlock({ id, question, options }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null) // { correct, correctIndex }

  async function pick(index) {
    if (result) return
    setSelected(index)
    const res = await fetch('/api/quiz/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: id, selectedIndex: index }),
    })
    setResult(await res.json())
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <p className="font-medium">{question}</p>
      <div className="mt-3 flex flex-col gap-2">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrectReveal = result && i === result.correctIndex
          const isWrongPick = result && isSelected && !result.correct
          return (
            <motion.button
              key={i}
              whileHover={!result ? { x: 3 } : {}}
              onClick={() => pick(i)}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                isCorrectReveal
                  ? 'border-leaf/40 bg-leaf/10 text-leaf'
                  : isWrongPick
                  ? 'border-rose/40 bg-rose/10 text-rose'
                  : 'border-ink/10 hover:bg-ink/5'
              }`}
            >
              {opt}
              {isCorrectReveal && <CheckCircle2 size={16} />}
              {isWrongPick && <XCircle size={16} />}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
