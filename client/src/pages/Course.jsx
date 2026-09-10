import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { AnimatedGroup } from '../components/motion/AnimatedGroup'

export default function Course() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState(null)

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((all) => setCourse(all.find((c) => c.id === id) ?? null))

    fetch(`/api/courses/${id}/lessons`)
      .then((res) => res.json())
      .then(setLessons)
  }, [id])

  if (course === null && lessons === null) return <p className="pt-8 text-ink-soft">Loading…</p>
  if (course === null && lessons !== null) return <p className="pt-8">Course not found.</p>

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 max-w-2xl">
      <Link to="/" className="text-sm text-ink-soft hover:text-ink">&larr; Back to dashboard</Link>
      <h2 className="mt-3 text-2xl font-semibold">{course?.name}</h2>

      {lessons && lessons.length === 0 && (
        <p className="mt-6 text-sm text-ink-soft">No lessons published yet — check back soon.</p>
      )}

      {lessons && lessons.length > 0 && (
        <AnimatedGroup className="mt-6 flex flex-col gap-2">
          {lessons.map((lesson, i) => (
            <Link key={lesson.id} to={`/lesson/${lesson.id}`}>
              <div className="flex items-center justify-between rounded-2xl border border-ink/5 bg-card px-4 py-3.5 hover:border-ink/15 transition-colors">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: course?.color }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{lesson.title}</span>
                </div>
                <ChevronRight size={16} className="text-ink-soft" />
              </div>
            </Link>
          ))}
        </AnimatedGroup>
      )}
    </motion.div>
  )
}
