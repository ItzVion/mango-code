import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronRight, ClipboardCheck, LockKeyhole, CheckCircle2 } from 'lucide-react'
import { AnimatedGroup } from '../components/motion/AnimatedGroup'
import { apiHeaders } from '../lib/user'

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

  function load() {
    Promise.all([
      fetch('/api/courses').then((res) => res.json()),
      fetch(`/api/courses/${id}/lessons`, { headers: apiHeaders() }).then((res) => res.json()),
    ]).then(([all, units]) => {
      setCourse(all.find((c) => c.id === id) ?? null)
      setLessons(units)
    }).catch(() => setLessons([]))
  }

  useEffect(() => { load() }, [id])

  if (course === null && lessons === null) return <p className="pt-8 text-ink-soft">Loading…</p>
  if (course === null && lessons !== null) return <p className="pt-8">Course not found.</p>

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 max-w-2xl pb-16">
      <Link to="/" className="text-sm text-ink-soft hover:text-ink">&larr; Back to dashboard</Link>
      <h2 className="mt-3 text-2xl font-semibold">{course?.name}</h2>
      <p className="mt-1 text-sm text-ink-soft">5 lessons + test in each difficulty · final assessment</p>

      {lessons && groups.map(([level, label]) => {
        const items = lessons.filter((lesson) => {
          if (level === 'final') return lesson.unit_type === 'final' && lesson.id === `${id}-final`
          return lesson.level === level && lesson.id.startsWith(`${id}-${level}-`)
        })
        if (!items.length) return null
        return (
          <section key={level} className="mt-7">
            <div className="mb-3 flex items-center gap-2">
              {level === 'final' ? <ClipboardCheck size={17} /> : <span className="text-sm font-semibold">{label}</span>}
              {level !== 'final' && <span className="text-xs text-ink-soft">5 lessons + test</span>}
            </div>
            <AnimatedGroup className="flex flex-col gap-2">
              {items.map((unit, i) => {
                const isTest = unit.unit_type !== 'lesson'
                const locked = !unit.unlocked
                return (
                  <Link key={unit.id} to={locked ? '#' : `/lesson/${unit.id}`} onClick={(e) => locked && e.preventDefault()} aria-disabled={locked}>
                    <div className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-colors ${locked ? 'border-ink/5 bg-ink/[0.02] opacity-55' : 'border-ink/5 bg-card hover:border-ink/15'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${locked ? 'bg-ink/10 text-ink-soft' : 'text-white'}`} style={!locked ? { backgroundColor: course?.color } : undefined}>
                          {locked ? <LockKeyhole size={13} /> : unit.completed ? <CheckCircle2 size={15} /> : isTest ? '✓' : i + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium">{unit.title}</span>
                          {locked && <p className="text-xs text-ink-soft">Complete the previous checkpoint first</p>}
                        </div>
                      </div>
                      {!locked && <ChevronRight size={16} className="text-ink-soft" />}
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
