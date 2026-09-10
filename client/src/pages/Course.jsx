import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronRight, ClipboardCheck } from 'lucide-react'
import { AnimatedGroup } from '../components/motion/AnimatedGroup'

const groups = [
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['hard', 'Hard'],
  ['final', 'Final Assessment'],
]

export default function Course() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState(null)

  useEffect(() => {
    fetch('/api/courses').then((res) => res.json()).then((all) => setCourse(all.find((c) => c.id === id) ?? null))
    fetch(`/api/courses/${id}/lessons`).then((res) => res.json()).then(setLessons)
  }, [id])

  if (course === null && lessons === null) return <p className="pt-8 text-ink-soft">Loading…</p>
  if (course === null && lessons !== null) return <p className="pt-8">Course not found.</p>

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 max-w-2xl pb-16">
      <Link to="/" className="text-sm text-ink-soft hover:text-ink">&larr; Back to dashboard</Link>
      <h2 className="mt-3 text-2xl font-semibold">{course?.name}</h2>
      <p className="mt-1 text-sm text-ink-soft">15 lessons · 3 difficulty tests · 1 final test</p>

      {lessons && lessons.length === 0 && <p className="mt-6 text-sm text-ink-soft">No lessons published yet — check back soon.</p>}

      {lessons && groups.map(([level, label]) => {
        // Ignore the three legacy lesson IDs from the original demo curriculum.
        const items = lessons.filter((lesson) => lesson.level === level && (level === 'final' || lesson.id.includes(`-${level}-`)))
        if (!items.length) return null
        return (
          <section key={level} className="mt-7">
            <div className="flex items-center gap-2 mb-3">
              {level === 'final' ? <ClipboardCheck size={17} /> : <span className="text-sm font-semibold">{label}</span>}
              {level !== 'final' && <span className="text-xs text-ink-soft">5 lessons + test</span>}
            </div>
            <AnimatedGroup className="flex flex-col gap-2">
              {items.map((lesson, i) => {
                const isTest = lesson.unit_type !== 'lesson'
                return (
                  <Link key={lesson.id} to={`/lesson/${lesson.id}`}>
                    <div className="flex items-center justify-between rounded-2xl border border-ink/5 bg-card px-4 py-3.5 hover:border-ink/15 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: course?.color }}>
                          {isTest ? '✓' : i + 1}
                        </span>
                        <span className="text-sm font-medium">{lesson.title}</span>
                      </div>
                      <ChevronRight size={16} className="text-ink-soft" />
                    </div>
                  </Link>
                )
              })}
            </AnimatedGroup>
          </section>
        )
      })}
    </motion.div>
  )
}
