import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Code2, Gamepad2, Lightbulb, Sparkles, Trophy } from 'lucide-react'
import { TextEffect } from '../components/motion/TextEffect'
import { ExerciseBlock } from '../components/motion/ExerciseBlock'
import { QuizBlock } from '../components/motion/QuizBlock'
import { TestBlock } from '../components/motion/TestBlock'
import { apiHeaders } from '../lib/user'

function parseLesson(content) {
  const sections = {}
  const matches = [...String(content || '').matchAll(/(?:^|\n)(LEARN|EXAMPLE|KEY_IDEA|YOUR_TURN|CHECK)\n([\s\S]*?)(?=\n(?:LEARN|EXAMPLE|KEY_IDEA|YOUR_TURN|CHECK)\n|$)/g)]
  for (const match of matches) sections[match[1]] = match[2].trim()
  return sections.LEARN ? sections : { LEARN: content || '' }
}

const stepMeta = [
  { key: 'LEARN', title: 'Meet the idea', icon: BookOpen, buddy: 'Okay, tiny steps. Let’s make this make sense.' },
  { key: 'EXAMPLE', title: 'See it in action', icon: Code2, buddy: 'Watch what each part is doing. Nothing magical here!' },
  { key: 'KEY_IDEA', title: 'Lock it in', icon: Lightbulb, buddy: 'One more little idea, then you get to try it.' },
  { key: 'YOUR_TURN', title: 'Your turn', icon: Gamepad2, buddy: 'Your keyboard, your rules. Give it a shot!' },
  { key: 'CHECK', title: 'Quick check', icon: Sparkles, buddy: 'You just learned this. Now prove it to yourself.' },
]

function Buddy({ text, step }) {
  const faces = ['🥭', '👀', '💡', '😎', '🏆']
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mb-5 flex items-center gap-3 rounded-2xl border border-mango/30 bg-mango/10 px-4 py-3"
    >
      <motion.div
        key={step}
        initial={{ rotate: -12, scale: 0.7 }}
        animate={{ rotate: [0, -7, 7, 0], scale: 1 }}
        transition={{ duration: 0.55 }}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mango text-2xl shadow-sm"
      >
        {faces[step] || '🥭'}
      </motion.div>
      <p className="text-sm font-medium leading-5 text-ink">{text}</p>
    </motion.div>
  )
}

function LessonContent({ sections, step, hasExercise }) {
  const meta = stepMeta[step]
  const Icon = meta.icon
  const key = meta.key

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={key}
        initial={{ opacity: 0, x: 24, scale: 0.985 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -24, scale: 0.985 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="mb-4 flex items-center gap-3">
          <motion.div
            initial={{ rotate: -15, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-paper"
          >
            <Icon size={19} />
          </motion.div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Step {step + 1}</p>
            <h3 className="text-xl font-semibold">{meta.title}</h3>
          </div>
        </div>

        {key === 'EXAMPLE' && sections[key] ? (
          <pre className="overflow-x-auto rounded-2xl border border-black/10 bg-ink p-5 font-mono text-[13px] leading-6 text-paper shadow-sm"><code>{sections[key]}</code></pre>
        ) : key === 'YOUR_TURN' && hasExercise ? (
          <p className="rounded-2xl border border-mango/25 bg-mango/10 p-5 text-[15px] leading-7 text-ink-soft">{sections[key]}</p>
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-card p-5 text-[15px] leading-7 text-ink-soft shadow-sm">
            <p className="whitespace-pre-line">{sections[key] || 'Take a moment to review what you just learned.'}</p>
          </div>
        )}
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
  const [questionAnswered, setQuestionAnswered] = useState(false)

  useEffect(() => {
    setLesson(null)
    setError(false)
    setStep(0)
    setQuestionIndex(0)
    setQuestionAnswered(false)
    fetch(`/api/lessons/${id}`, { headers: apiHeaders() })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Lesson not found')
        return data
      })
      .then(setLesson)
      .catch(() => setError(true))
  }, [id])

  async function completeLesson() {
    if (!lesson || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ lessonId: lesson.id }),
      })
      if (!res.ok) throw new Error()
      navigate(`/course/${lesson.course_id}`)
    } catch {
      setSaving(false)
    }
  }

  const isTest = lesson?.unit_type === 'test' || lesson?.unit_type === 'final'
  const sections = useMemo(() => parseLesson(lesson?.content), [lesson?.content])
  const hasExercise = Boolean(lesson?.exercises?.length)
  const steps = useMemo(() => {
    if (isTest) return []
    return stepMeta.filter((item) => item.key !== 'YOUR_TURN' || sections.YOUR_TURN || hasExercise)
  }, [isTest, sections.YOUR_TURN, hasExercise])
  const currentKey = steps[step]?.key
  const isCheck = currentKey === 'CHECK'
  const currentQuestion = lesson?.quiz?.[questionIndex]
  const isLastQuestion = questionIndex >= (lesson?.quiz?.length || 1) - 1

  function next() {
    if (isCheck) {
      if (!questionAnswered) return
      if (!isLastQuestion) {
        setQuestionIndex((value) => value + 1)
        setQuestionAnswered(false)
        return
      }
      return
    }
    setStep((value) => Math.min(value + 1, steps.length - 1))
  }

  function previous() {
    if (isCheck && questionIndex > 0) {
      setQuestionIndex((value) => value - 1)
      setQuestionAnswered(true)
      return
    }
    setStep((value) => Math.max(value - 1, 0))
  }

  if (error) return <p className="pt-8">Lesson not found or locked.</p>
  if (!lesson) return <p className="pt-8 text-ink-soft">Loading…</p>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl pt-8 pb-16">
      <Link to={`/course/${lesson.course_id}`} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={14} /> Back to course
      </Link>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <TextEffect as="h2" className="text-2xl font-semibold" delay={0.08}>{lesson.title}</TextEffect>
          {!isTest && <p className="mt-2 text-sm text-ink-soft">Learn it → see it → try it → check it.</p>}
        </div>
        {!isTest && (
          <div className="hidden sm:block text-right text-xs text-ink-soft">
            {step + 1} / {steps.length}
          </div>
        )}
      </div>

      {isTest ? (
        <div className="mt-7">
          <TestBlock
            lessonId={lesson.id}
            questions={lesson.quiz}
            final={lesson.unit_type === 'final'}
            passed={lesson.passed}
            onPassed={() => setLesson((current) => ({ ...current, passed: true, completed: true }))}
          />
        </div>
      ) : (
        <div className="mt-7">
          <div className="mb-5 flex gap-1.5" aria-label="Lesson progress">
            {steps.map((item, index) => (
              <motion.div
                key={item.key}
                animate={{ width: index === step ? 38 : 10, opacity: index <= step ? 1 : 0.25 }}
                className="h-1.5 rounded-full bg-mango"
              />
            ))}
          </div>

          <Buddy text={stepMeta.find((x) => x.key === currentKey)?.buddy || 'Nice work!'} step={step} />

          {isCheck ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion?.id || 'check'}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
              >
                {currentQuestion ? (
                  <QuizBlock
                    id={currentQuestion.id}
                    question={currentQuestion.question}
                    options={currentQuestion.options}
                    onAnswered={() => setQuestionAnswered(true)}
                  />
                ) : (
                  <div className="rounded-2xl border border-leaf/30 bg-leaf/10 p-6 text-center">
                    <Trophy className="mx-auto text-leaf" />
                    <p className="mt-2 font-semibold">You made it!</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <LessonContent sections={sections} step={step} hasExercise={hasExercise} />
          )}

          {currentKey === 'YOUR_TURN' && hasExercise && (
            <div className="mt-5">
              {lesson.exercises.map((ex) => (
                <ExerciseBlock key={ex.id} id={ex.id} prompt={ex.prompt} starterCode={ex.starter_code} />
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={previous}
              disabled={step === 0 && (!isCheck || questionIndex === 0)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/5 disabled:invisible"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {isCheck && isLastQuestion ? (
              <button
                type="button"
                onClick={completeLesson}
                disabled={!questionAnswered || saving || lesson.completed}
                className="inline-flex items-center gap-2 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                <CheckCircle2 size={17} />
                {lesson.completed ? 'Lesson completed' : saving ? 'Saving…' : 'Finish lesson'}
              </button>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={next}
                disabled={isCheck && !questionAnswered}
                className="inline-flex items-center gap-2 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink shadow-sm disabled:opacity-50"
              >
                Continue <ArrowRight size={16} />
              </motion.button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
