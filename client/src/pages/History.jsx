import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock3, Code2, ClipboardCheck, XCircle } from 'lucide-react'
import { getAccount } from '../lib/user'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString()
}

export default function History() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/results/me', { credentials: 'include', cache: 'no-store' })
      .then(async response => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) {
          const failure = new Error(body.error || 'Could not load your results.')
          failure.status = response.status
          throw failure
        }
        return body
      })
      .then(body => { if (active) setData(body) })
      .catch(failure => { if (active) setError(failure.message || 'Could not load saved results.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const activities = useMemo(() => {
    if (!data) return []
    return [
      ...(data.exercises || []).map(item => ({ ...item, kind: 'exercise', date: item.created_at })),
      ...(data.tests || []).map(item => ({ ...item, kind: 'test', date: item.created_at })),
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data])

  if (loading) return <p className="py-8 text-sm text-ink-soft">Loading your saved results…</p>
  if (error && !data) return <div className="max-w-3xl space-y-4 py-6"><Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-soft"><ArrowLeft size={15}/> Back</Link><div className="rounded-xl border border-ink/10 bg-card p-6"><h2 className="text-xl font-bold">Your saved results</h2><p className="mt-2 text-sm text-ink-soft">{error}</p><Link to="/auth" className="mt-4 inline-flex rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-paper">Sign in</Link></div></div>

  return <div className="max-w-4xl space-y-6 pb-10">
    <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-soft"><ArrowLeft size={15}/> Back to learning</Link>
    <header className="border-b border-ink/10 pb-5"><p className="text-xs font-semibold uppercase tracking-wide text-mango-deep">ACCOUNT HISTORY</p><h2 className="mt-2 text-3xl font-bold">Saved results</h2><p className="mt-2 text-sm text-ink-soft">Your completed practicals, checkpoint scores and course progress, saved to your account.</p></header>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-ink/10 bg-card p-4"><p className="text-2xl font-bold">{(data.exercises || []).length}</p><p className="text-xs text-ink-soft">Coding attempts</p></div>
      <div className="rounded-xl border border-ink/10 bg-card p-4"><p className="text-2xl font-bold">{(data.tests || []).length}</p><p className="text-xs text-ink-soft">Assessment attempts</p></div>
      <div className="rounded-xl border border-ink/10 bg-card p-4"><p className="text-2xl font-bold">{(data.completedLessons || []).length}</p><p className="text-xs text-ink-soft">Lessons completed</p></div>
    </div>
    {activities.length === 0 ? <div className="rounded-xl border border-ink/10 bg-card p-6"><h3 className="font-semibold">No saved attempts yet</h3><p className="mt-2 text-sm leading-6 text-ink-soft">Complete a practical exercise or checkpoint while signed in. Your result will appear here automatically.</p><Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Choose a course</Link></div> : <div className="overflow-hidden rounded-xl border border-ink/10 bg-card">
      {activities.map((item,index) => <article key={item.kind + '-' + item.id} className="border-b border-ink/10 p-4 last:border-0 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-dim">{item.kind === 'exercise' ? <Code2 size={17}/> : <ClipboardCheck size={17}/>}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.kind === 'exercise' ? item.prompt : item.lesson_title}</p><span className={'rounded-full px-2 py-0.5 text-[11px] font-semibold ' + (Number(item.passed) === 1 || item.passed === true ? 'bg-leaf/10 text-leaf' : 'bg-paper-dim text-ink-soft')}>{Number(item.passed) === 1 || item.passed === true ? 'Passed' : item.kind === 'exercise' ? 'Needs work' : 'Not passed'}</span></div>
            <p className="mt-1 text-xs text-ink-soft">{item.course_name} · {item.kind === 'exercise' ? 'Practical exercise' : 'Assessment'} · {formatDate(item.date)}</p>
            {item.kind === 'test' && <p className="mt-2 text-sm font-semibold tabular-nums">{item.score} / {item.total} correct</p>}
            {item.kind === 'exercise' && <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-ink-soft">View submitted code</summary><pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-[#171d1a] p-3 text-xs leading-5 text-[#f1f4ee]"><code>{item.submitted_code}</code></pre></details>}
          </div>
        </div>
      </article>)}
    </div>}
    <section className="rounded-xl border border-ink/10 bg-paper-dim p-4 text-xs leading-5 text-ink-soft">Guest runs are not attached to an account. Sign in before running a practical or submitting a checkpoint to save it here.</section>
  </div>
}
