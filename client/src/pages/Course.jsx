import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { COURSES } from '../data/courses'

export default function Course() {
  const { id } = useParams()
  const course = COURSES.find((c) => c.id === id)

  if (!course) return <p className="pt-8">Course not found.</p>

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-8"
    >
      <Link to="/" className="text-sm text-ink-soft hover:text-ink">&larr; Back to dashboard</Link>
      <h2 className="mt-3 text-2xl font-semibold">{course.name}</h2>
      <p className="mt-1 text-ink-soft">{course.blurb}</p>
      <div className="mt-6 rounded-2xl border border-ink/5 bg-card p-6 text-sm text-ink-soft">
        Lesson list + exercises for {course.name} go here.
      </div>
    </motion.div>
  )
}
