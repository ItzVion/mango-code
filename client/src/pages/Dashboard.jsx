import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Code2, ArrowRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiHeaders } from '../lib/user'

export default function Dashboard() {
  const [courses, setCourses] = useState(null)
  const [lessonGroups, setLessonGroups] = useState({})
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/courses')
      .then(async (res) => { if (!res.ok) throw new Error('Could not load courses'); return res.json() })
      .then(async (list) => {
        if (!active) return
        setCourses(list)
        const entries = await Promise.all(list.map(async (course) => {
          const response = await fetch(`/api/courses/${course.id}/lessons`, { headers: apiHeaders() })
          if (!response.ok) throw new Error('Could not load course lessons')
          return [course.id, await response.json()]
        }))
        if (active) setLessonGroups(Object.fromEntries(entries))
      })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [])

  const summary = useMemo(() => (courses || []).map(course => {
    const lessons = (lessonGroups[course.id] || []).filter(unit => unit.unit_type === 'lesson')
    const first = lessons.find(unit => unit.unlocked) || lessons[0]
    return { ...course, lessons, first }
  }), [courses, lessonGroups])
  const totalLessons = summary.reduce((sum, course) => sum + course.lessons.length, 0)

  return (
    <div className="space-y-8">
      <section className="border-b border-ink/10 pb-7 pt-2">
        <p className="text-sm font-semibold text-mango-deep">MANGOCODE · LEARNING PATHS</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Learn programming by understanding it, then building with it.</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-soft">Start from the fundamentals. Follow clear explanations and worked examples, practise each idea in code, and finish with projects that bring everything together.</p>
        <div className="mt-5 flex flex-wrap gap-5 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-2"><BookOpen size={16}/>{courses ? `${totalLessons} lessons` : 'Loading curriculum'}</span>
          <span className="inline-flex items-center gap-2"><Code2 size={16}/>Hands-on exercises</span>
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-rose/30 bg-rose/5 p-4 text-sm text-rose">Courses could not be loaded. Check your connection and refresh the page.</div>}
      {!courses && !error && <p className="py-5 text-sm text-ink-soft">Loading courses…</p>}

      {courses && <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h3 className="text-xl font-bold">Choose a course</h3><p className="mt-1 text-sm text-ink-soft">Every path includes lessons, checkpoints and practical work.</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summary.map((course, index) => (
            <article key={course.id} className="flex min-h-52 flex-col rounded-xl border border-ink/10 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: course.color }}/>{course.name}</span>
                <span className="text-xs text-ink-soft">{course.lessons.length || '—'} lessons</span>
              </div>
              <h4 className="mt-5 text-lg font-semibold">{['Build pages and style responsive interfaces','Make websites interactive and work with data','Automate tasks and build useful programs','Understand memory and build efficient programs','Write modern applications with object-oriented tools'][index] || 'Learn programming step by step'}</h4>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{course.first ? `Begin with: ${course.first.title}` : 'Explore the learning path and its practical checkpoints.'}</p>
              <div className="mt-auto pt-5">
                <Link to={`/course/${course.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-mango-deep">View learning path <ArrowRight size={16}/></Link>
              </div>
            </article>
          ))}
        </div>
      </section>}

      <section className="rounded-xl border border-ink/10 bg-paper-dim p-5 sm:p-6">
        <h3 className="font-semibold">How learning works</h3>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div><p className="font-semibold">01 · Understand</p><p className="mt-1 leading-6 text-ink-soft">Learn what a concept means and when to use it.</p></div>
          <div><p className="font-semibold">02 · Work through an example</p><p className="mt-1 leading-6 text-ink-soft">Read code with line-by-line explanations and output.</p></div>
          <div><p className="font-semibold">03 · Build something</p><p className="mt-1 leading-6 text-ink-soft">Write code, run it, fix mistakes and check your understanding.</p></div>
        </div>
      </section>
    </div>
  )
}
