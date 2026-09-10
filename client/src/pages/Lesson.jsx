import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { TextEffect } from '../components/motion/TextEffect'
import { ExerciseBlock } from '../components/motion/ExerciseBlock'
import { QuizBlock } from '../components/motion/QuizBlock'

export default function Lesson() {
  const { id } = useParams()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLesson(null)
    setError(false)
    fetch(`/api/lessons/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(setLesson)
      .catch(() => setError(true))
  }, [id])

  if (error) return <p className="pt-8">Lesson not found.</p>
  if (!lesson) return <p className="pt-8 text-ink-soft">Loading…</p>

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl pt-8 pb-16"
    >
      <Link to={`/course/${lesson.course_id}`} className="text-sm text-ink-soft hover:text-ink">
        &larr; Back to course
      </Link>

      <TextEffect as="h2" className="mt-3 text-2xl font-semibold" delay={0.1}>
        {lesson.title}
      </TextEffect>

      <p className="mt-4 whitespace-pre-line text-ink-soft leading-relaxed">{lesson.content}</p>

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
    </motion.div>
  )
}
