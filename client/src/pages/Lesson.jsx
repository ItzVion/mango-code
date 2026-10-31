import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Code2, Lightbulb, ClipboardCheck, Trophy } from 'lucide-react'
import { ExerciseBlock } from '../components/motion/ExerciseBlock'
import { QuizBlock } from '../components/motion/QuizBlock'
import { TestBlock } from '../components/motion/TestBlock'
import { apiHeaders } from '../lib/user'

const stepMeta = [
  { key: 'LEARN', title: 'Understand the concept', icon: BookOpen },
  { key: 'EXAMPLE', title: 'Study a worked example', icon: Code2 },
  { key: 'KEY_IDEA', title: 'What to remember', icon: Lightbulb },
  { key: 'YOUR_TURN', title: 'Practical exercise', icon: ClipboardCheck },
  { key: 'CHECK', title: 'Check your understanding', icon: CheckCircle2 },
]

const headings = new Map([
  ['GOAL', 'What you will learn'],
  ['WHY', 'Why this matters'],
  ['HOW', 'How it works'],
  ['BREAKDOWN', 'Line-by-line explanation'],
  ['COMMON_MISTAKES', 'Common mistakes'],
  ['REAL_WORLD', 'Where you will use this'],
  ['OUTPUT', 'Expected output'],
  ['CHALLENGE', 'Try a variation'],
])

function parseLesson(content) {
  const raw = String(content || '').trim()
  const sections = {}
  const pattern = /(?:^|\n)(LEARN|EXAMPLE|KEY_IDEA|YOUR_TURN|CHECK)\n([\s\S]*?)(?=\n(?:LEARN|EXAMPLE|KEY_IDEA|YOUR_TURN|CHECK)\n|$)/g
  for (const match of raw.matchAll(pattern)) sections[match[1]] = match[2].trim()
  if (sections.LEARN || sections.EXAMPLE || sections.YOUR_TURN) return { sections, structured: true }

  const blocks = raw.split(/\n{2,}/).map(part => part.trim()).filter(Boolean)
  const code = blocks.filter(part => /(^|\n)\s*(#include|import |from |using |const |let |var |def |function |class |if\s*\(|for\s*\(|while\s*\(|print\(|console\.log|printf\(|cout\s*<<|<\/?[a-z][^>]*>)/m.test(part))
  const prose = blocks.filter(part => !code.includes(part))
  return { structured: false, sections: { LEARN: prose.join('\n\n') || raw, EXAMPLE: code.join('\n\n'), KEY_IDEA: prose[0] || raw } }
}

function splitReadableText(value) {
  return String(value || '').split(/\n{2,}/).map(part => part.trim()).filter(Boolean)
}

function LessonText({ value }) {
  const sections = splitReadableText(value)
  return <div className="space-y-4 text-[15px] leading-7 text-ink-soft">
    {sections.map((section, index) => {
      const lines = section.split('\n').filter(Boolean)
      const isList = lines.every(line => /^\s*(?:[-•*]|\d+[.)])\s/.test(line))
      if (isList) return <ul key={index} className="ml-5 list-disc space-y-2">{lines.map((line, i) => <li key={i}>{line.replace(/^\s*(?:[-•*]|\d+[.)])\s/, '')}</li>)}</ul>
      const labelMatch = section.match(/^([A-Z][A-Z_ ]+):\s*([\s\S]*)$/)
      if (labelMatch && headings.has(labelMatch[1].trim())) return <div key={index}><h4 className="mb-1 text-sm font-bold text-ink">{headings.get(labelMatch[1].trim())}</h4><p>{labelMatch[2]}</p></div>
      return <p key={index} className="whitespace-pre-wrap">{section}</p>
    })}
  </div>
}

function CodeExample({ code, language }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1400) } catch {}
  }
  return <section className="overflow-hidden rounded-xl border border-ink/15 bg-[#171d1a]">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs text-white/60">
      <span>{language || 'Code'} · worked example</span>
      <button type="button" onClick={copy} className="rounded-md bg-white/10 px-3 py-1.5 font-semibold text-white hover:bg-white/15">{copied ? 'Copied' : 'Copy code'}</button>
    </div>
    <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-[#f1f4ee]"><code>{String(code || '').split('\n').map((line, index) => <span key={index} className="block"><span className="mr-4 inline-block w-5 select-none text-right text-white/30">{index + 1}</span>{line || ' '}</span>)}</code></pre>
  </section>
}

function StepContent({ section, sections, lesson, exerciseLanguage }) {
  const codeBlocks = String(sections.EXAMPLE || '').split(/\n{2,}/).filter(Boolean)
  const code = codeBlocks.find(part => /(^|\n)\s*(#include|import |from |using |const |let |var |def |function |class |print\(|console\.log|printf\(|cout\s*<<|<\/?[a-z])/m.test(part)) || sections.EXAMPLE
  const notes = codeBlocks.filter(part => part !== code).join('\n\n')

  if (section === 'LEARN') return <div className="rounded-xl border border-ink/10 bg-card p-5 sm:p-7"><p className="mb-4 text-xs font-bold uppercase tracking-wide text-mango-deep">Lesson notes</p><LessonText value={sections.LEARN || 'This lesson introduces the key concept.'}/></div>
  if (section === 'EXAMPLE') return <div className="space-y-3">{code ? <CodeExample code={code} language={exerciseLanguage}/> : <div className="rounded-xl border border-ink/10 bg-card p-5"><LessonText value={sections.EXAMPLE || 'Review the examples in the lesson notes.'}/></div>}{notes && <div className="rounded-xl border border-ink/10 bg-card p-5"><h4 className="mb-2 text-sm font-bold text-ink">How to read this example</h4><LessonText value={notes}/></div>}</div>
  if (section === 'KEY_IDEA') return <div className="rounded-xl border-l-4 border-mango bg-paper-dim p-5 sm:p-6"><h4 className="mb-3 font-bold">Key points</h4><LessonText value={sections.KEY_IDEA || sections.LEARN}/></div>
  if (section === 'YOUR_TURN') return <div className="rounded-xl border border-ink/10 bg-card p-5"><h4 className="mb-2 font-bold">Before you run the practical</h4><LessonText value={sections.YOUR_TURN || 'Use the editor below to solve the exercise. Try it without copying the example first.'}/></div>
  if (section === 'CHECK') return <div className="rounded-xl border border-ink/10 bg-card p-5"><h4 className="font-bold">Knowledge check</h4><p className="mt-2 text-sm leading-6 text-ink-soft">Answer each question. You can retry incorrect answers before finishing the lesson.</p></div>
  return null
}

export default function Lesson() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState({})

  useEffect(() => {
    let active = true
    setLesson(null); setError(false); setStep(0); setQuestionIndex(0); setAnsweredQuestions({})
    fetch(`/api/lessons/${id}`, { headers: apiHeaders() })
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Lesson not found'); return data })
      .then(data => { if (active) setLesson(data) })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [id])

  async function completeLesson() {
    if (!lesson || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/progress/complete', { method: 'POST', headers: apiHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ lessonId: lesson.id }) })
      if (!res.ok) throw new Error()
      navigate(`/course/${lesson.course_id}`)
    } catch { setSaving(false) }
  }

  const isTest = lesson?.unit_type === 'test' || lesson?.unit_type === 'final'
  const parsed = useMemo(() => parseLesson(lesson?.content), [lesson?.content])
  const sections = parsed.sections
  const exercises = lesson?.exercises || []
  const quiz = lesson?.quiz || []
  const hasExercise = exercises.length > 0
  const hasQuiz = quiz.length > 0
  const steps = useMemo(() => {
    if (isTest) return []
    const available = stepMeta.filter(item => {
      if (item.key === 'LEARN') return Boolean(sections.LEARN)
      if (item.key === 'EXAMPLE') return Boolean(sections.EXAMPLE)
      if (item.key === 'KEY_IDEA') return Boolean(sections.KEY_IDEA)
      if (item.key === 'YOUR_TURN') return hasExercise || Boolean(sections.YOUR_TURN)
      if (item.key === 'CHECK') return hasQuiz
      return false
    })
    if (available.every(item => item.key !== 'YOUR_TURN') && hasExercise) available.splice(Math.min(available.length, 3), 0, stepMeta[3])
    return available.length ? available : [stepMeta[0]]
  }, [isTest, sections, hasExercise, hasQuiz])
  const currentKey = steps[step]?.key
  const currentQuestion = quiz[questionIndex]
  const questionAnswered = Boolean(currentQuestion && answeredQuestions[currentQuestion.id])
  const isCheck = currentKey === 'CHECK'
  const isLastQuestion = questionIndex >= quiz.length - 1

  function next() {
    if (isCheck) {
      if (!questionAnswered) return
      if (!isLastQuestion) setQuestionIndex(value => value + 1)
      return
    }
    setStep(value => Math.min(value + 1, steps.length - 1))
  }

  function previous() {
    if (isCheck && questionIndex > 0) { setQuestionIndex(value => value - 1); return }
    setStep(value => Math.max(value - 1, 0))
  }

  if (error) return <div role="alert" className="rounded-lg border border-rose/30 p-4 text-sm text-rose">This lesson could not be loaded. It may be locked or unavailable. Return to the course and try again.</div>
  if (!lesson) return <p className="py-8 text-sm text-ink-soft">Loading lesson…</p>

  return <div className="max-w-4xl space-y-6 pb-12">
    <Link to={`/course/${lesson.course_id}`} className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={15}/> Back to course</Link>
    <header className="border-b border-ink/10 pb-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-mango-deep">{isTest ? 'ASSESSMENT' : 'LESSON'}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h2>
      {!isTest && <p className="mt-2 text-sm text-ink-soft">Read the explanation, study the example, complete the practical and check what you learned.</p>}
    </header>

    {isTest ? <TestBlock lessonId={lesson.id} questions={quiz} final={lesson.unit_type === 'final'} passed={lesson.passed} onPassed={() => setLesson(current => ({ ...current, passed: true, completed: true }))}/> : <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" aria-label="Lesson steps">
          {steps.map((item, index) => <span key={item.key} title={item.title} className={`h-1.5 rounded-full ${index === step ? 'w-9 bg-mango-deep' : index < step ? 'w-5 bg-leaf' : 'w-5 bg-ink/15'}`}/>)}
        </div>
        <span className="text-xs tabular-nums text-ink-soft">Step {Math.min(step + 1, steps.length)} of {steps.length}</span>
      </div>

      {isCheck ? <div className="space-y-3">
        <div className="flex items-center gap-2"><CheckCircle2 size={18}/><h3 className="text-lg font-bold">Check your understanding</h3></div>
        {currentQuestion ? <QuizBlock key={currentQuestion.id} id={currentQuestion.id} question={currentQuestion.question} options={currentQuestion.options} onAnswered={result => setAnsweredQuestions(current => ({ ...current, [currentQuestion.id]: Boolean(result?.correct) }))}/> : <div className="rounded-xl border border-ink/10 bg-card p-6 text-center"><Trophy className="mx-auto text-leaf"/><p className="mt-2 font-semibold">You completed this lesson.</p></div>}
      </div> : <>
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-paper">{(() => { const Icon = stepMeta.find(item => item.key === currentKey)?.icon || BookOpen; return <Icon size={17}/> })()}</span><h3 className="text-lg font-bold">{stepMeta.find(item => item.key === currentKey)?.title || 'Lesson'}</h3></div>
        <StepContent section={currentKey} sections={sections} lesson={lesson} exerciseLanguage={exercises[0]?.language}/>
        {currentKey === 'YOUR_TURN' && hasExercise && <div className="space-y-4">{exercises.map(ex => <ExerciseBlock key={ex.id} id={ex.id} prompt={ex.prompt} starterCode={ex.starter_code} language={ex.language}/>)}</div>}
      </>}

      <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-5">
        <button type="button" onClick={previous} disabled={step === 0 && (!isCheck || questionIndex === 0)} className="inline-flex items-center gap-2 rounded-lg border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-paper disabled:invisible"><ArrowLeft size={15}/>Back</button>
        {isCheck && isLastQuestion ? <button type="button" onClick={completeLesson} disabled={!questionAnswered || saving || lesson.completed} className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 disabled:opacity-50"><CheckCircle2 size={16}/>{lesson.completed ? 'Completed' : saving ? 'Saving…' : 'Finish lesson'}</button> : <button type="button" onClick={next} disabled={isCheck && !questionAnswered} className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 disabled:opacity-50">Continue <ArrowRight size={15}/></button>}
      </div>
    </>}
  </div>
}
