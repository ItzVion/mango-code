import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, ClipboardCheck, LockKeyhole, CheckCircle2, BookOpen, Code2 } from 'lucide-react'
import { apiHeaders } from '../lib/user'

const groups = [
  { id: 'easy', title: 'Beginner foundations', description: 'Learn the syntax and the building blocks.' },
  { id: 'medium', title: 'Core programming', description: 'Combine concepts and start building useful features.' },
  { id: 'hard', title: 'Advanced topics & projects', description: 'Apply what you know in larger, more realistic programs.' },
  { id: 'final', title: 'Final assessment', description: 'Bring the whole course together.' },
]

export default function Course() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setCourse(null); setLessons(null); setError(false)
    Promise.all([
      fetch('/api/courses').then(async res => { if (!res.ok) throw new Error(); return res.json() }),
      fetch(`/api/courses/${id}/lessons`, { headers: apiHeaders() }).then(async res => { if (!res.ok) throw new Error(); return res.json() }),
    ]).then(([all, units]) => {
      if (!active) return
      setCourse(all.find(c => c.id === id) ?? null)
      setLessons(units)
    }).catch(() => { if (active) { setLessons([]); setError(true) } })
    return () => { active = false }
  }, [id])

  const grouped = useMemo(() => {
    if (!lessons) return []
    return groups.map(group => {
      const items = lessons.filter(unit => group.id === 'final'
        ? unit.unit_type === 'final'
        : unit.level === group.id && unit.unit_type !== 'final')
      return { ...group, items }
    }).filter(group => group.items.length)
  }, [lessons])

  if (!lessons && !error) return <p className="py-8 text-sm text-ink-soft">Loading course…</p>
  if (!course || error) return <div className="rounded-lg border border-rose/30 p-4 text-sm text-rose">This course could not be loaded. Please refresh the page.</div>

  const lessonCount = lessons.filter(unit => unit.unit_type === 'lesson').length
  const completedCount = lessons.filter(unit => unit.completed).length

  return (
    <div className="max-w-4xl space-y-7 pb-10">
      <div><Link to="/" className="text-sm text-ink-soft hover:text-ink">← All courses</Link></div>
      <header className="border-b border-ink/10 pb-6">
        <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: course.color }}/>{course.name}</div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Your learning path</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">Work through the lessons in order. Each checkpoint unlocks the next section, and the later lessons turn the fundamentals into practical work.</p>
        <div className="mt-5 flex flex-wrap gap-5 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-2"><BookOpen size={16}/>{lessonCount} lessons</span>
          <span className="inline-flex items-center gap-2"><ClipboardCheck size={16}/>3 checkpoints + final</span>
          <span>{completedCount} completed</span>
        </div>
      </header>

      <div className="space-y-8">
        {grouped.map(group => (
          <section key={group.id}>
            <div className="mb-3">
              <h3 className="text-lg font-bold">{group.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{group.description}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-ink/10 bg-card">
              {group.items.map((unit, index) => {
                const checkpoint = unit.unit_type !== 'lesson'
                const locked = !unit.unlocked
                const to = locked ? '#' : `/lesson/${unit.id}`
                return (
                  <Link key={unit.id} to={to} onClick={event => locked && event.preventDefault()} aria-disabled={locked}
                    className={`flex items-center gap-3 border-b border-ink/10 px-4 py-3.5 last:border-b-0 ${locked ? 'cursor-not-allowed bg-paper/50 text-ink-soft' : 'hover:bg-paper'}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${locked ? 'bg-paper-dim text-ink-soft' : unit.completed ? 'bg-leaf/10 text-leaf' : 'bg-ink text-paper'}`}>
                      {locked ? <LockKeyhole size={14}/> : unit.completed ? <CheckCircle2 size={16}/> : checkpoint ? <ClipboardCheck size={15}/> : <span>{index + 1}</span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{unit.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-soft">{locked ? 'Complete the previous checkpoint to unlock this unit' : checkpoint ? 'Assessment · pass to continue' : 'Lesson · explanation, example and practical'}</span>
                    </span>
                    {!locked && <ChevronRight size={17} className="shrink-0 text-ink-soft"/>}
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
