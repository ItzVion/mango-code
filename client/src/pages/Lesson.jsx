import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Code2, Gamepad2, Lightbulb, Sparkles, Trophy } from 'lucide-react'
import { TextEffect } from '../components/motion/TextEffect'
import { ExerciseBlock } from '../components/motion/ExerciseBlock'
import { QuizBlock } from '../components/motion/QuizBlock'
import { TestBlock } from '../components/motion/TestBlock'
import { apiHeaders } from '../lib/user'

const stepMeta = [
  { key: 'LEARN', title: 'Understand it', icon: BookOpen, buddy: 'First, we make the idea make sense. No rushing.' },
  { key: 'EXAMPLE', title: 'See an example', icon: Code2, buddy: 'Now look at a real example and connect it to the idea.' },
  { key: 'KEY_IDEA', title: 'Remember this', icon: Lightbulb, buddy: 'If you remember one thing, make it this.' },
  { key: 'YOUR_TURN', title: 'Try it yourself', icon: Gamepad2, buddy: 'Your turn! Learning sticks much better when you do it.' },
  { key: 'CHECK', title: 'Quick check', icon: Sparkles, buddy: 'One tiny question to make sure the idea is locked in.' },
]

function looksLikeCode(block) {
  const text = String(block || '').trim()
  if (!text) return false
  const lines = text.split('\n')
  if (lines.length > 18) return false
  return /(^|\n)\s*(#include|import |from |using |const |let |var |def |function |class |if\s*\(|for\s*\(|while\s*\(|print\(|console\.log|printf\(|cout\s*<<|<\/?[a-z][^>]*>)/m.test(text)
    || /[{};]|=>|\breturn\b/.test(text)
}

function parseLesson(content) {
  const raw = String(content || '').trim()
  const sections = {}
  const matches = [...raw.matchAll(/(?:^|\n)(LEARN|EXAMPLE|KEY_IDEA|YOUR_TURN|CHECK)\n([\s\S]*?)(?=\n(?:LEARN|EXAMPLE|KEY_IDEA|YOUR_TURN|CHECK)\n|$)/g)]
  for (const match of matches) sections[match[1]] = match[2].trim()
  if (sections.LEARN) return { sections, structured: true }

  // Older lessons are intentionally just readable text + code. Turn those into
  // the same learning flow instead of showing empty/fake steps.
  const blocks = raw.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  const code = blocks.filter(looksLikeCode)
  const prose = blocks.filter((part) => !looksLikeCode(part))
  return {
    structured: false,
    sections: {
      LEARN: prose.join('\n\n') || raw,
      EXAMPLE: code.join('\n\n'),
      KEY_IDEA: prose[0] || raw,
    },
  }
}

function splitReadableText(text) {
  return String(text || '').split(/\n{2,}|\n(?=[•*-] )/).map((part) => part.trim()).filter(Boolean)
}

function Buddy({ text, step }) {
  const faces = ['🥭', '👀', '💡', '😎', '🏆']
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mb-5 flex items-center gap-3 rounded-2xl border border-mango/30 bg-mango/10 px-4 py-3">
      <motion.div key={step} initial={{ rotate: -12, scale: 0.7 }} animate={{ rotate: [0, -7, 7, 0], scale: 1 }} transition={{ duration: 0.55 }} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mango text-2xl shadow-sm">{faces[step] || '🥭'}</motion.div>
      <p className="text-sm font-medium leading-5 text-ink">{text}</p>
    </motion.div>
  )
}

function ReadableText({ text }) {
  const parts = splitReadableText(text)
  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        const isList = /^[-•*] /.test(part)
        const clean = isList ? part.replace(/^[-•*] /, '') : part
        return (
          <motion.div key={`${index}-${clean.slice(0, 12)}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className={`leading-7 ${isList ? 'flex gap-3' : ''}`}>
            {isList && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-mango" />}
            <span>{clean}</span>
          </motion.div>
        )
      })}
    </div>
  )
}

function CodeExample({ code }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }
  const lines = String(code || '').split('\n')
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="overflow-hidden rounded-2xl border border-ink/10 bg-ink shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs text-white/55">
        <span>Example code</span>
        <button type="button" onClick={copy} className="rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15">{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-paper"><code>{lines.map((line, index) => <span key={index} className="block"><span className="mr-4 inline-block w-5 select-none text-right text-white/25">{index + 1}</span>{line || ' '}</span>)}</code></pre>
    </motion.div>
  )
}

function LessonContent({ sections, step, hasExercise, structured }) {
  const meta = stepMeta.find((item) => item.key === step) || stepMeta[0]
  const Icon = meta.icon
  const key = meta.key
  const exampleParts = key === 'EXAMPLE' ? String(sections.EXAMPLE || '').split(/\n{2,}/).filter(Boolean) : []
  const exampleCode = exampleParts.filter(looksLikeCode).join('\n\n') || sections.EXAMPLE || ''
  const exampleNote = exampleParts.filter((part) => part !== exampleCode && !looksLikeCode(part)).join('\n\n')

  return (
    <AnimatePresence mode="wait">
      <motion.section key={key} initial={{ opacity: 0, x: 24, scale: 0.985 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -24, scale: 0.985 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
        <div className="mb-4 flex items-center gap-3">
          <motion.div initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-paper"><Icon size={19} /></motion.div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Step</p><h3 className="text-xl font-semibold">{meta.title}</h3></div>
        </div>

        {key === 'LEARN' ? (
          <div className="rounded-2xl border border-ink/10 bg-card p-5 text-[15px] text-ink-soft shadow-sm sm:p-6">
            <div className="mb-5 rounded-xl bg-mango/10 p-4 text-sm font-medium leading-6 text-ink"><span className="font-bold">🎯 The goal:</span> understand the idea before you try to remember any syntax.</div>
            <ReadableText text={sections.LEARN} />
          </div>
        ) : key === 'EXAMPLE' && sections.EXAMPLE ? (
          <div className="space-y-3">
            <CodeExample code={exampleCode} />
            {exampleNote && <div className="rounded-2xl border border-ink/10 bg-card p-4 text-sm leading-6 text-ink-soft"><span className="font-semibold text-ink">What to notice:</span> {exampleNote}</div>}
          </div>
        ) : key === 'KEY_IDEA' ? (
          <div className="rounded-2xl border border-mango/30 bg-mango/10 p-5 text-[15px] leading-7 text-ink shadow-sm sm:p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink/60">⭐ Remember this</p>
            <ReadableText text={sections.KEY_IDEA || sections.LEARN} />
          </div>
        ) : key === 'YOUR_TURN' && hasExercise ? (
          <div className="rounded-2xl border border-mango/25 bg-mango/10 p-5 text-[15px] leading-7 text-ink-soft"><ReadableText text={sections.YOUR_TURN || 'Use the example as a guide, then write it yourself.'} /></div>
        ) : structured && sections[key] ? (
          <div className="rounded-2xl border border-ink/10 bg-card p-5 text-[15px] leading-7 text-ink-soft shadow-sm"><ReadableText text={sections[key]} /></div>
        ) : null}
      </motion.section>
    </AnimatePresence>
  )
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
    setLesson(null); setError(false); setStep(0); setQuestionIndex(0); setAnsweredQuestions({})
    fetch(`/api/lessons/${id}`, { headers: apiHeaders() })
      .then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Lesson not found'); return data })
      .then(setLesson).catch(() => setError(true))
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
  const hasExercise = Boolean(lesson?.exercises?.length)
  const hasQuiz = Boolean(lesson?.quiz?.length)
  const hasExample = Boolean(sections.EXAMPLE)
  const steps = useMemo(() => {
    if (isTest) return []
    const explicit = parsed.structured
      ? stepMeta.filter((item) => sections[item.key] || (item.key === 'YOUR_TURN' && hasExercise))
      : stepMeta.filter((item) => {
          if (item.key === 'LEARN') return Boolean(sections.LEARN)
          if (item.key === 'EXAMPLE') return hasExample
          if (item.key === 'KEY_IDEA') return Boolean(sections.KEY_IDEA)
          if (item.key === 'YOUR_TURN') return hasExercise
          if (item.key === 'CHECK') return hasQuiz
          return false
        })
    return explicit.length ? explicit : [stepMeta[0]]
  }, [isTest, parsed.structured, sections, hasExercise, hasQuiz, hasExample])
  const currentKey = steps[step]?.key
  const isCheck = currentKey === 'CHECK'
  const currentQuestion = lesson?.quiz?.[questionIndex]
  const isLastQuestion = questionIndex >= (lesson?.quiz?.length || 1) - 1
  const questionAnswered = Boolean(currentQuestion && answeredQuestions[currentQuestion.id])

  function next() {
    if (isCheck) {
      if (!questionAnswered) return
      if (!isLastQuestion) setQuestionIndex((value) => value + 1)
      return
    }
    setStep((value) => Math.min(value + 1, steps.length - 1))
  }

  function previous() {
    if (isCheck && questionIndex > 0) { setQuestionIndex((value) => value - 1); return }
    setStep((value) => Math.max(value - 1, 0))
  }

  if (error) return <p className="pt-8">Lesson not found or locked.</p>
  if (!lesson) return <p className="pt-8 text-ink-soft">Loading…</p>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl pt-8 pb-16">
      <Link to={`/course/${lesson.course_id}`} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={14} /> Back to course</Link>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div><TextEffect as="h2" className="text-2xl font-semibold" delay={0.08}>{lesson.title}</TextEffect>{!isTest && <p className="mt-2 text-sm text-ink-soft">Understand → see → remember → try → check.</p>}</div>
        {!isTest && <div className="hidden text-right text-xs text-ink-soft sm:block">{step + 1} / {steps.length}</div>}
      </div>

      {isTest ? (
        <div className="mt-7"><TestBlock lessonId={lesson.id} questions={lesson.quiz} final={lesson.unit_type === 'final'} passed={lesson.passed} onPassed={() => setLesson((current) => ({ ...current, passed: true, completed: true }))} /></div>
      ) : (
        <div className="mt-7">
          <div className="mb-5 flex gap-1.5" aria-label="Lesson progress">{steps.map((item, index) => <motion.div key={item.key} animate={{ width: index === step ? 42 : 10, opacity: index <= step ? 1 : 0.25 }} className="h-1.5 rounded-full bg-mango" />)}</div>
          <Buddy text={stepMeta.find((x) => x.key === currentKey)?.buddy || 'Nice work!'} step={step} />

          {isCheck ? (
            <AnimatePresence mode="wait"><motion.div key={currentQuestion?.id || 'check'} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>{currentQuestion ? <QuizBlock id={currentQuestion.id} question={currentQuestion.question} options={currentQuestion.options} onAnswered={(result) => setAnsweredQuestions((current) => ({ ...current, [currentQuestion.id]: Boolean(result?.correct) }))} /> : <div className="rounded-2xl border border-leaf/30 bg-leaf/10 p-6 text-center"><Trophy className="mx-auto text-leaf" /><p className="mt-2 font-semibold">You made it!</p></div>}</motion.div></AnimatePresence>
          ) : <LessonContent sections={sections} step={currentKey} hasExercise={hasExercise} structured={parsed.structured} />}

          {currentKey === 'YOUR_TURN' && hasExercise && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">{lesson.exercises.map((ex) => <ExerciseBlock key={ex.id} id={ex.id} prompt={ex.prompt} starterCode={ex.starter_code} />)}</motion.div>}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button type="button" onClick={previous} disabled={step === 0 && (!isCheck || questionIndex === 0)} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/5 disabled:invisible"><ArrowLeft size={16} /> Back</button>
            {isCheck && isLastQuestion ? <button type="button" onClick={completeLesson} disabled={!questionAnswered || saving || lesson.completed} className="inline-flex items-center gap-2 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50"><CheckCircle2 size={17} />{lesson.completed ? 'Lesson completed' : saving ? 'Saving…' : 'Finish lesson'}</button> : <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={next} disabled={isCheck && !questionAnswered} className="inline-flex items-center gap-2 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink shadow-sm disabled:opacity-50">Continue <ArrowRight size={16} /></motion.button>}
          </div>
        </div>
      )}
    </motion.div>
  )
}
