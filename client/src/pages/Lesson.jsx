import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Code2, Gamepad2, Lightbulb, Trophy } from 'lucide-react'
import { ExerciseBlock } from '../components/motion/ExerciseBlock'
import { QuizBlock } from '../components/motion/QuizBlock'
import { TestBlock } from '../components/motion/TestBlock'
import { MangoMascot } from '../components/game/MangoMascot'
import { MangoChallenge } from '../components/game/MangoChallenge'
import { WebPlayground } from '../components/game/WebPlayground'
import { LESSON_GAMES, HTML_MISSIONS } from '../data/lessonGames'
import { LESSON_PRACTICE } from '../data/lessonPractice'
import { apiHeaders } from '../lib/user'

const stepMeta = {
  LEARN: { title: 'Mango explains', subtitle: 'One idea at a time', icon: BookOpen },
  PLAY: { title: 'Play the concept', subtitle: 'Make a choice and learn from the result', icon: Gamepad2 },
  EXAMPLE: { title: 'Watch it work', subtitle: 'Explore a real example', icon: Code2 },
  YOUR_TURN: { title: 'Build something', subtitle: 'Your turn to make it work', icon: Lightbulb },
  CHECK: { title: 'Quick boss check', subtitle: 'Show Mango what you remember', icon: Trophy },
}

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

function readSavedXP() {
  try {
    const value = Number(window.localStorage.getItem('mangocode-xp-v1') || 0)
    return Number.isFinite(value) && value >= 0 ? value : 0
  } catch {
    return 0
  }
}

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

export default function Lesson() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completionError, setCompletionError] = useState('')
  const [step, setStep] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState({})
  const [practiceResults, setPracticeResults] = useState({})
  const [playPassed, setPlayPassed] = useState(false)
  const [mascotMood, setMascotMood] = useState('idle')
  const [mascotMessage, setMascotMessage] = useState('Hey! Ready to learn something new?')
  const [xp, setXp] = useState(readSavedXP)
  const [finished, setFinished] = useState(false)
  const [finishStreak, setFinishStreak] = useState(null)
  const rewarded = useRef(new Set())

  useEffect(() => {
    let active = true
    setLesson(null)
    setError(false)
    setStep(0)
    setQuestionIndex(0)
    setAnsweredQuestions({})
    setPracticeResults({})
    setPlayPassed(false)
    setFinished(false)
    setFinishStreak(null)
    setCompletionError('')
    setMascotMood('idle')
    setMascotMessage('Hey! Ready to learn something new?')
    rewarded.current = new Set()

    fetch('/api/lessons/' + id, { headers: apiHeaders() })
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Lesson not found'); return data })
      .then(data => {
        if (!active) return
        setLesson(data)
        if (data.completed) {
          setPlayPassed(true)
          setPracticeResults(Object.fromEntries((data.exercises || []).map(ex => [ex.id, true]).concat([['web', true]])))
        }
      })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [id])

  const isTest = lesson?.unit_type === 'test' || lesson?.unit_type === 'final'
  const parsed = useMemo(() => parseLesson(lesson?.content), [lesson?.content])
  const sections = parsed.sections
  const game = LESSON_GAMES[id]
  const webMission = HTML_MISSIONS[id]
  const exercises = lesson?.exercises || []
  const quiz = lesson?.quiz || []
  const playQuizQuestion = game?.challenge ? null : quiz[0]
  const finalQuiz = game?.challenge ? [] : quiz.slice(1)
  const hasPlayStep = Boolean(game?.challenge || playQuizQuestion)
  const hasExercise = exercises.length > 0
  const hasPracticeRequirement = Boolean(webMission || hasExercise)
  const practicePassed = webMission
    ? practiceResults.web === true
    : hasExercise
      ? exercises.every(ex => practiceResults[ex.id] === true)
      : true
  const checkPassed = finalQuiz.every(question => answeredQuestions[question.id] === true)
  const playReady = !hasPlayStep || playPassed
  const currentQuestion = finalQuiz[questionIndex]
  const questionAnswered = Boolean(currentQuestion && answeredQuestions[currentQuestion.id] === true)

  const steps = useMemo(() => {
    if (!lesson || isTest) return []
    const available = [{ key: 'LEARN' }]
    if (hasPlayStep) available.push({ key: 'PLAY' })
    if (sections.EXAMPLE) available.push({ key: 'EXAMPLE' })
    if (hasExercise || webMission || sections.YOUR_TURN) available.push({ key: 'YOUR_TURN' })
    if (finalQuiz.length) available.push({ key: 'CHECK' })
    return available
  }, [lesson, isTest, hasPlayStep, sections, hasExercise, webMission, finalQuiz.length])

  const currentKey = steps[step]?.key
  const isLastQuestion = questionIndex >= finalQuiz.length - 1
  const progressPercent = steps.length ? Math.round(((step + 1) / steps.length) * 100) : 0

  function awardXP(points, rewardId) {
    const rewardKey = id + ':' + rewardId
    if (rewarded.current.has(rewardKey)) return
    rewarded.current.add(rewardKey)
    const storageKey = 'mangocode-xp-awarded:' + rewardKey
    try {
      if (window.localStorage.getItem(storageKey) === '1') return
      window.localStorage.setItem(storageKey, '1')
    } catch {}
    setXp(current => {
      const next = current + points
      try { window.localStorage.setItem('mangocode-xp-v1', String(next)) } catch {}
      return next
    })
  }

  function handlePlayResult(result) {
    const correct = Boolean(result?.correct)
    setPlayPassed(correct)
    if (correct) {
      setMascotMood('happy')
      setMascotMessage('Yes! You understood that idea. Let’s build with it.')
      awardXP(10, 'mini-challenge')
    } else {
      setMascotMood('sad')
      setMascotMessage('No worries. Read the hint, try another answer, and I’ll cheer you on.')
    }
  }

  function handlePlayQuiz(result) {
    const correct = Boolean(result?.correct)
    setPlayPassed(correct)
    if (correct) {
      setMascotMood('happy')
      setMascotMessage('Correct! You spotted the important idea.')
      awardXP(10, 'mini-quiz')
    } else if (result) {
      setMascotMood('sad')
      setMascotMessage('Close! Look at the lesson idea and give it another try.')
    } else {
      setMascotMood('thinking')
      setMascotMessage('Take a breath and think it through.')
    }
  }

  function handleFinalAnswer(question, result) {
    const correct = Boolean(result?.correct)
    setAnsweredQuestions(current => ({ ...current, [question.id]: correct }))
    if (correct) {
      setMascotMood('happy')
      setMascotMessage('Nice answer! Mango is getting happier.')
      awardXP(5, 'quiz-' + question.id)
    } else if (result) {
      setMascotMood('sad')
      setMascotMessage('That one needs another try. Use the feedback and keep going.')
    } else {
      setMascotMood('thinking')
      setMascotMessage('Think about the example before choosing.')
    }
  }

  function handlePracticeResult(exerciseId, result) {
    const passed = Boolean(result?.pass)
    setPracticeResults(current => ({ ...current, [exerciseId]: passed }))
    if (passed) {
      setMascotMood('celebrate')
      setMascotMessage('Your code works! Mango just earned a happy dance.')
      awardXP(20, 'practice-' + exerciseId)
    } else {
      setMascotMood('sad')
      setMascotMessage('A bug is just a clue. Read the output and try again.')
    }
  }

  function handleWebResult(result) {
    const passed = Boolean(result?.pass)
    setPracticeResults(current => ({ ...current, web: passed }))
    if (passed) {
      setMascotMood('celebrate')
      setMascotMessage('The page is coming together. You built that!')
      awardXP(20, 'web-practice')
    } else {
      setMascotMood('sad')
      setMascotMessage('Check the missing pieces and try again. You’re close.')
    }
  }

  function next() {
    if (currentKey === 'CHECK' && !questionAnswered) return
    if (currentKey === 'CHECK' && !isLastQuestion) {
      setQuestionIndex(value => value + 1)
      setMascotMood('thinking')
      setMascotMessage('Next question! Keep your streak going.')
      return
    }
    if (currentKey === 'LEARN') {
      setMascotMood('thinking')
      setMascotMessage('Let’s see if you can use that idea.')
    }
    setStep(value => Math.min(value + 1, steps.length - 1))
  }

  function previous() {
    if (currentKey === 'CHECK' && questionIndex > 0) {
      setQuestionIndex(value => value - 1)
      return
    }
    setStep(value => Math.max(value - 1, 0))
  }

  async function completeLesson() {
    if (!lesson || saving) return
    setCompletionError('')
    if (!playReady) {
      setCompletionError('Complete Mango’s mini challenge before finishing.')
      return
    }
    if (!practicePassed) {
      setCompletionError('Pass the practical mission before finishing this lesson.')
      return
    }
    if (!checkPassed) {
      setCompletionError('Answer the quick check correctly before finishing.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ lessonId: lesson.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save lesson progress.')
      setFinishStreak(data.currentStreak ?? null)
      setFinished(true)
      setLesson(current => ({ ...current, completed: true }))
      setMascotMood('celebrate')
      setMascotMessage('You did it! That lesson belongs to you now.')
      awardXP(20, 'lesson-complete')
    } catch (error) {
      setCompletionError(error.message || 'Could not save lesson progress.')
      setMascotMood('sad')
      setMascotMessage('I couldn’t save that lesson yet. Please try once more.')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div role="alert" className="rounded-lg border border-rose/30 p-4 text-sm text-rose">This lesson could not be loaded. It may be locked or unavailable. Return to the course and try again.</div>
  if (!lesson) return <p className="py-8 text-sm text-ink-soft">Loading lesson…</p>

  if (isTest) {
    return <div className="mango-lesson-shell space-y-5">
      <Link to={'/course/' + lesson.course_id} className="mango-back-link"><ArrowLeft size={15}/> Back to course</Link>
      <header className="mango-lesson-hero">
        <div className="mango-lesson-copy">
          <p className="mango-eyebrow">MANGO BOSS BATTLE</p>
          <h1 className="mango-lesson-title">{lesson.title}</h1>
          <p className="mango-lesson-subtitle">Bring the skills together. Take your time, and let Mango celebrate your progress.</p>
        </div>
        <MangoMascot mood={lesson.passed ? 'celebrate' : 'thinking'} message={lesson.passed ? 'You already passed this checkpoint!' : 'Ready for the boss battle?'} compact />
      </header>
      <TestBlock lessonId={lesson.id} questions={quiz} final={lesson.unit_type === 'final'} passed={lesson.passed} onPassed={() => { setMascotMood('celebrate'); setMascotMessage('Checkpoint cleared! The next path is open.') }} />
    </div>
  }

  if (finished) {
    return <div className="mango-lesson-shell">
      <div className="mango-finish-card">
        <MangoMascot mood="celebrate" message="That was brilliant. Let’s keep growing!" />
        <p className="mango-eyebrow">QUEST COMPLETE</p>
        <h2>Lesson completed!</h2>
        <p>You learned the idea, practised it and passed the quick check. That’s how real skills grow.</p>
        <div className="mango-finish-award"><Trophy size={16} /> +20 XP · {xp} total XP</div>
        {finishStreak != null && <p className="text-xs text-ink-soft">Learning streak: {finishStreak} day{finishStreak === 1 ? '' : 's'}</p>}
        <button type="button" onClick={() => navigate('/course/' + lesson.course_id)} className="mango-next-button mx-auto mt-3">Back to learning path <ArrowRight size={16}/></button>
      </div>
    </div>
  }

  const activeMeta = stepMeta[currentKey] || stepMeta.LEARN
  const Icon = activeMeta.icon
  const currentQuestionComplete = currentKey !== 'CHECK' || questionAnswered
  const canAdvance = currentKey === 'PLAY'
    ? playReady
    : currentKey === 'YOUR_TURN'
      ? practicePassed
      : currentQuestionComplete
  const lastStep = step === steps.length - 1
  const finishButton = lastStep && (currentKey !== 'CHECK' || isLastQuestion)

  return (
    <div className="mango-lesson-shell">
      <div className="mango-lesson-topline">
        <Link to={'/course/' + lesson.course_id} className="mango-back-link"><ArrowLeft size={15}/> Learning path</Link>
        <span className="mango-xp-pill">★ {xp.toLocaleString('en-IN')} XP</span>
      </div>

      <header className="mango-lesson-hero">
        <div className="mango-lesson-copy">
          <p className="mango-eyebrow">MANGO QUEST · {String(lesson.level || 'easy').toUpperCase()} LEVEL</p>
          <h1 className="mango-lesson-title">{lesson.title}</h1>
          <p className="mango-lesson-subtitle">{game?.teach ? 'Learn a bite-sized idea, play with it, then build something that works.' : 'A short lesson, a quick challenge and hands-on practice. Learn by doing, not just reading.'}</p>
        </div>
        <MangoMascot mood={mascotMood} message={mascotMessage} compact />
      </header>

      <div className="mango-lesson-progress" aria-label="Lesson progress">
        <div className="mango-progress-track"><div className="mango-progress-fill" style={{ width: progressPercent + '%' }} /></div>
        <span className="mango-progress-label">Step {step + 1} / {steps.length}</span>
      </div>

      <div className="mango-step-panel">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-paper"><Icon size={18}/></span>
          <div>
            <p className="mango-eyebrow mb-0">{activeMeta.subtitle}</p>
            <h2 className="m-0 text-lg font-extrabold">{activeMeta.title}</h2>
          </div>
        </div>

        {currentKey === 'LEARN' && (
          <div className="mango-teach-card">
            <p className="mango-eyebrow">TODAY’S IDEA</p>
            {game?.teach ? <p className="mb-0 max-w-[68ch] text-[1.04rem] font-semibold leading-8 text-ink">{game.teach}</p> : <LessonText value={sections.LEARN || 'This lesson introduces the key concept.'}/>}
            {sections.KEY_IDEA && <div className="mango-idea-strip"><Lightbulb size={18} className="mt-0.5 shrink-0"/><div><strong>Remember this</strong><LessonText value={sections.KEY_IDEA}/></div></div>}
          </div>
        )}

        {currentKey === 'PLAY' && (
          game?.challenge
            ? <MangoChallenge challenge={game.challenge} onResult={handlePlayResult} />
            : playQuizQuestion
              ? <QuizBlock key={playQuizQuestion.id} id={playQuizQuestion.id} question={playQuizQuestion.question} options={playQuizQuestion.options} onAnswered={handlePlayQuiz} />
              : <div className="mango-teach-card"><p>Try the idea once before moving on.</p></div>
        )}

        {currentKey === 'EXAMPLE' && (
          <div className="space-y-3">
            {sections.EXAMPLE ? <CodeExample code={sections.EXAMPLE} language={exercises[0]?.language}/> : <div className="mango-teach-card"><LessonText value="Review the example and look for the parts that make the concept work."/></div>}
          </div>
        )}

        {currentKey === 'YOUR_TURN' && (
          <div className="space-y-4">
            {sections.YOUR_TURN && <div className="mango-teach-card"><p className="mango-eyebrow">YOUR MISSION</p><LessonText value={sections.YOUR_TURN}/></div>}
            {webMission && <WebPlayground task={webMission} onResult={handleWebResult}/>}
            {!webMission && exercises.length > 0 && (
              <div className="space-y-4">
                {exercises.map(ex => {
                  const task = LESSON_PRACTICE[ex.id]
                  return <ExerciseBlock key={ex.id} id={ex.id} prompt={task?.prompt || ex.prompt} starterCode={task?.starterCode || ex.starter_code} language={ex.language} onResult={result => handlePracticeResult(ex.id, result)}/>
                })}
              </div>
            )}
            {!webMission && !hasExercise && <div className="mango-teach-card"><p className="text-sm leading-6 text-ink-soft">Try changing the example, predict what changes, and compare it with the original. Small experiments build strong instincts.</p></div>}
          </div>
        )}

        {currentKey === 'CHECK' && (
          <div className="space-y-3">
            {currentQuestion
              ? <QuizBlock key={currentQuestion.id} id={currentQuestion.id} question={currentQuestion.question} options={currentQuestion.options} onAnswered={result => handleFinalAnswer(currentQuestion, result)}/>
              : <div className="mango-teach-card text-center"><Trophy className="mx-auto text-mango-deep"/><p className="mt-2 font-bold">You finished the quick check.</p></div>}
          </div>
        )}
      </div>

      {completionError && <div role="alert" className="mt-4 rounded-xl border border-rose/25 bg-rose/5 p-3 text-sm text-rose">{completionError} {completionError.toLowerCase().includes('sign in') && <Link to="/auth" className="font-semibold underline">Sign in</Link>}</div>}

      <div className="mango-lesson-footer">
        <button type="button" onClick={previous} disabled={step === 0 && (!currentKey || questionIndex === 0)} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-4 py-3 text-sm font-bold text-ink-soft hover:bg-paper disabled:invisible"><ArrowLeft size={15}/>Back</button>
        {finishButton ? (
          lesson.completed
            ? <button type="button" onClick={() => navigate('/course/' + lesson.course_id)} className="mango-next-button">Back to course <ArrowRight size={16}/></button>
            : <button type="button" onClick={completeLesson} disabled={!canFinish || saving} className="mango-next-button">{saving ? 'Saving…' : 'Complete lesson'} <CheckCircle2 size={16}/></button>
        ) : (
          <button type="button" onClick={next} disabled={!canAdvance} className="mango-next-button">Continue <ArrowRight size={16}/></button>
        )}
      </div>
    </div>
  )
}
