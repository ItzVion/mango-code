import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { TextEffect } from '../components/motion/TextEffect'
import { ExerciseBlock } from '../components/motion/ExerciseBlock'
import { QuizBlock } from '../components/motion/QuizBlock'
import { TestBlock } from '../components/motion/TestBlock'
import { apiHeaders } from '../lib/user'

function LessonContent({ content }) {
  const [intro, rest = ''] = content.split('\n\nExample:\n')
  const [example = '', afterExample = ''] = rest.split('\n\nWhat to notice:\n')
  const [notice = '', practice = ''] = afterExample.split('\n\nPractice before the check:\n')
  const hasStructuredContent = Boolean(rest)

  if (!hasStructuredContent) {
    return <p className="mt-4 whitespace-pre-line text-ink-soft leading-relaxed">{content}</p>
  }

  return (
    <div className="mt-5 space-y-6 text-[15px] leading-7 text-ink-soft">
      <section>
        <p className="whitespace-pre-line">{intro}</p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink">Example</h3>
        <pre className="overflow-x-auto rounded-2xl border border-black/10 bg-black/[0.04] p-4 font-mono text-[13px] leading-6 text-ink"><code>{example}</code></pre>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink">What to notice</h3>
        <p className="whitespace-pre-line">{notice}</p>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/50 p-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink">Practice before the check</h3>
        <p className="whitespace-pre-line">{practice}</p>
      </section>
    </div>
  )
}

export default function Lesson() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLesson(null)
    setError(false)
    fetch(`/api/lessons/${id}`, { headers: apiHeaders() })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Lesson not found')
        return data
      })
      .then(setLesson)
      .catch(() => setError(true))
  }, [id])

  async function completeLesson() {
    if (!lesson || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ lessonId: lesson.id }),
      })
      if (!res.ok) throw new Error()
      navigate(`/course/${lesson.course_id}`)
    } catch {
      setSaving(false)
    }
  }

  if (error) return <p className="pt-8">Lesson not found or locked.</p>
  if (!lesson) return <p className="pt-8 text-ink-soft">Loading…</p>

  const isTest = lesson.unit_type === 'test' || lesson.unit_type === 'final'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl pt-8 pb-16">
      <Link to={`/course/${lesson.course_id}`} className="text-sm text-ink-soft hover:text-ink">&larr; Back to course</Link>
      <TextEffect as="h2" className="mt-3 text-2xl font-semibold" delay={0.1}>{lesson.title}</TextEffect>

      {isTest ? (
        <>
          <LessonContent content={lesson.content} />
          <div className="mt-8">
            <TestBlock
              lessonId={lesson.id}
              questions={lesson.quiz}
              final={lesson.unit_type === 'final'}
              passed={lesson.passed}
              onPassed={() => setLesson((current) => ({ ...current, passed: true, completed: true }))}
            />
          </div>
        </>
      ) : (
        <>
          <LessonContent content={lesson.content} />

          {lesson.exercises.length > 0 && (
            <div className="mt-8 flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Try it</h3>
              {lesson.exercises.map((ex) => (
                <ExerciseBlock key={ex.id} id={ex.id} prompt={ex.prompt} starterCode={ex.starter_code} />
              ))}
            </div>
          )}

          {lesson.quiz.length > 0 && (
            <div className="mt-8 flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Quick check</h3>
              <p className="-mt-2 text-sm text-ink-soft">You have just learned the concept above. Use this question to check your understanding.</p>
              {lesson.quiz.map((q) => (
                <QuizBlock key={q.id} id={q.id} question={q.question} options={q.options} />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={completeLesson}
            disabled={saving || lesson.completed}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
          >
            <CheckCircle2 size={17} />
            {lesson.completed ? 'Lesson completed' : saving ? 'Saving…' : 'Mark lesson complete'}
          </button>
        </>
      )}
    </motion.div>
  )
}
