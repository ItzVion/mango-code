import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, Lightbulb, RotateCcw, XCircle } from 'lucide-react'

export function MangoChallenge({ challenge, onResult }) {
  const [selected, setSelected] = useState(null)
  const [hintOpen, setHintOpen] = useState(false)

  const answered = selected !== null
  const correct = selected === challenge.correctIndex

  function choose(index) {
    if (answered && correct) return
    setSelected(index)
    onResult?.({ correct: index === challenge.correctIndex })
  }

  function retry() {
    setSelected(null)
    setHintOpen(false)
  }

  return (
    <section className="mango-challenge-card">
      <div className="mango-challenge-heading">
        <span className="mango-challenge-icon"><Lightbulb size={19} /></span>
        <div>
          <p className="mango-eyebrow">MANGO’S MINI CHALLENGE</p>
          <h3>{challenge.prompt}</h3>
        </div>
      </div>
      <div className="mango-answer-grid">
        {challenge.options.map((option, index) => {
          const isSelected = selected === index
          const isCorrect = answered && isSelected && correct
          const isWrong = answered && isSelected && !correct
          return (
            <motion.button
              key={index}
              type="button"
              whileHover={!correct ? { y: -2 } : {}}
              whileTap={!correct ? { scale: 0.985 } : {}}
              onClick={() => choose(index)}
              disabled={correct}
              className={'mango-answer-option' + (isCorrect ? ' is-correct' : '') + (isWrong ? ' is-wrong' : '')}
            >
              <span className="mango-answer-letter">{String.fromCharCode(65 + index)}</span>
              <span className="mango-answer-text">{option}</span>
              {isCorrect && <CheckCircle2 size={18} />}
              {isWrong && <XCircle size={18} />}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {answered && (
          <motion.div
            key={correct ? 'correct' : 'wrong'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={'mango-challenge-feedback' + (correct ? ' feedback-correct' : ' feedback-wrong')}
            role="status"
            aria-live="polite"
          >
            <div className="mango-feedback-copy">
              <strong>{correct ? 'You got it! Mango is smiling.' : 'Not quite — that’s how we learn.'}</strong>
              <p>{correct ? challenge.explanation : challenge.hint}</p>
            </div>
            {!correct && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="mango-small-action" onClick={() => setHintOpen(value => !value)}>
                  {hintOpen ? 'Hide hint' : 'Need a hint?'}
                </button>
                <button type="button" className="mango-small-action" onClick={retry}><RotateCcw size={13} /> Try again</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {hintOpen && !correct && <p className="mango-hint-panel">{challenge.explanation}</p>}
    </section>
  )
}
