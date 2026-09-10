import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { TextEffect } from '../components/motion/TextEffect'
import { ExerciseBlock } from '../components/motion/ExerciseBlock'
import { QuizBlock } from '../components/motion/QuizBlock'
import { TestBlock } from '../components/motion/TestBlock'
import { apiHeaders } from '../lib/user'

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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl pt-8 pb-16">
      <Link to={`/course/${lesson.course_id}`} className="text-sm text-ink-soft hover:text-ink">&larr; Back to course</Link>
      <TextEffect as="h2" className="mt-3 text-2xl font-semibold" delay={0.1}>{lesson.title}</TextEffect>

      <p className="mt-4 whitespace-pre-line text-ink-soft leading-relaxed">{lesson.content}</p>

      {isTest ? (
        <div className="mt-8">
          <TestBlock
            lessonId={lesson.id}
            questions={lesson.quiz}
            final={lesson.unit_type === 'final'}
            passed={lesson.passed}
            onPassed={() => setLesson((current) => ({ ...current, passed: true, completed: true }))}
          />
        </div>
      ) : (
        <>
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
