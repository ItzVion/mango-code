import { Router } from 'express'
import { db } from '../db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

export const lessonsRouter = Router()

async function getCourseUnitStates(courseId, userId) {
  const result = await db.execute({
    sql: 'SELECT id, title, sort_order, level, unit_type FROM lessons WHERE course_id = ? ORDER BY sort_order',
    args: [courseId],
  })
  const units = result.rows
  if (!units.length) return []

  let completed = new Set()
  let passedTests = new Set()
  if (userId) {
    const [progressResult, testsResult] = await Promise.all([
      db.execute({ sql: 'SELECT lesson_id FROM progress WHERE user_id = ?', args: [userId] }),
      db.execute({ sql: 'SELECT lesson_id, MAX(passed)::int AS passed FROM test_attempts WHERE user_id = ? GROUP BY lesson_id', args: [userId] }),
    ])
    completed = new Set(progressResult.rows.map(row => row.lesson_id))
    passedTests = new Set(testsResult.rows.filter(row => Number(row.passed) === 1).map(row => row.lesson_id))
  }

  let nextUnlocked = true
  return units.map((unit) => {
    const passed = unit.unit_type !== 'lesson' && passedTests.has(unit.id)
    const isCompleted = unit.unit_type === 'lesson' ? completed.has(unit.id) : passed
    const state = { ...unit, unlocked: nextUnlocked, completed: isCompleted, passed }
    nextUnlocked = nextUnlocked && isCompleted
    return state
  })
}

lessonsRouter.get('/courses', async (_req, res, next) => {
  try {
    const result = await db.execute('SELECT id, name, color, sort_order FROM courses ORDER BY sort_order')
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
    res.json(result.rows)
  } catch (error) { next(error) }
})

lessonsRouter.get('/courses/:courseId/lessons', optionalAuth, async (req, res, next) => {
  try {
    if (!/^[a-z0-9_-]{1,80}$/.test(req.params.courseId)) return res.status(400).json({ error: 'Invalid course.' })
    const units = await getCourseUnitStates(req.params.courseId, req.userId)
    res.setHeader('Cache-Control', 'private, no-store')
    res.json(units)
  } catch (error) { next(error) }
})

lessonsRouter.get('/lessons/:lessonId', optionalAuth, async (req, res, next) => {
  try {
    if (!/^[a-zA-Z0-9_-]{1,120}$/.test(req.params.lessonId)) return res.status(400).json({ error: 'Invalid lesson.' })
    const lessonResult = await db.execute({ sql: 'SELECT * FROM lessons WHERE id = ?', args: [req.params.lessonId] })
    const lesson = lessonResult.rows[0]
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' })

    const states = await getCourseUnitStates(lesson.course_id, req.userId)
    const state = states.find(unit => unit.id === lesson.id)
    if (!state?.unlocked) return res.status(403).json({ error: 'This unit is locked. Complete the previous lesson or checkpoint first.' })

    const [exercises, quiz] = await Promise.all([
      db.execute({ sql: 'SELECT id, language, prompt, starter_code FROM exercises WHERE lesson_id = ? ORDER BY id', args: [req.params.lessonId] }),
      db.execute({ sql: 'SELECT id, question, options FROM quiz_questions WHERE lesson_id = ? ORDER BY id', args: [req.params.lessonId] }),
    ])

    res.setHeader('Cache-Control', 'private, no-store')
    res.json({
      ...lesson,
      completed: state.completed,
      passed: state.passed,
      exercises: exercises.rows,
      quiz: quiz.rows.map(q => ({ id: q.id, question: q.question, options: JSON.parse(q.options) })),
    })
  } catch (error) { next(error) }
})

lessonsRouter.post('/quiz/check', async (req, res, next) => {
  try {
    const { questionId, selectedIndex } = req.body || {}
    if (typeof questionId !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(questionId) ||
        !Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 20) {
      return res.status(400).json({ error: 'Invalid quiz answer.' })
    }
    const result = await db.execute({ sql: 'SELECT correct_index FROM quiz_questions WHERE id = ?', args: [questionId] })
    if (!result.rows.length) return res.status(404).json({ error: 'Question not found' })
    const correct = selectedIndex === Number(result.rows[0].correct_index)
    res.json({ correct, message: correct ? 'Correct. Nice work.' : 'Not quite. Review the explanation and try again.' })
  } catch (error) { next(error) }
})

lessonsRouter.post('/progress/complete', requireAuth, async (req, res, next) => {
  try {
    const lessonId = typeof req.body?.lessonId === 'string' ? req.body.lessonId : ''
    if (!/^[a-zA-Z0-9_-]{1,120}$/.test(lessonId)) return res.status(400).json({ error: 'Invalid lesson.' })
    const result = await db.execute({ sql: "SELECT id, course_id FROM lessons WHERE id = ? AND unit_type = 'lesson'", args: [lessonId] })
    const lesson = result.rows[0]
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' })

    const states = await getCourseUnitStates(lesson.course_id, req.userId)
    const state = states.find(unit => unit.id === lessonId)
    if (!state?.unlocked) return res.status(403).json({ error: 'Complete the previous unit first.' })

    const exerciseCount = await db.execute({ sql: 'SELECT COUNT(*)::int AS total FROM exercises WHERE lesson_id = ?', args: [lessonId] })
    if (Number(exerciseCount.rows[0]?.total || 0) > 0) {
      const passed = await db.execute({
        sql: 'SELECT COUNT(DISTINCT exercise_id)::int AS total FROM exercise_attempts WHERE user_id = ? AND passed = 1 AND exercise_id IN (SELECT id FROM exercises WHERE lesson_id = ?)',
        args: [req.userId, lessonId],
      })
      if (Number(passed.rows[0]?.total || 0) < Number(exerciseCount.rows[0]?.total || 0)) return res.status(400).json({ error: 'Complete and pass every practical exercise before finishing this lesson.' })
    }

    const saved = await db.execute({
      sql: 'INSERT INTO progress (user_id, lesson_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT (user_id, lesson_id) DO NOTHING',
      args: [req.userId, lessonId],
    })
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const streak = await db.execute({ sql: 'SELECT current_streak, longest_streak, last_active_date FROM streaks WHERE user_id = ?', args: [req.userId] })
    const old = streak.rows[0]
    const current = !old ? 1 : old.last_active_date === today ? Number(old.current_streak) : old.last_active_date === yesterday ? Number(old.current_streak) + 1 : 1
    const longest = Math.max(current, Number(old?.longest_streak || 0))
    await db.execute({
      sql: 'INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date) VALUES (?, ?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET current_streak = EXCLUDED.current_streak, longest_streak = EXCLUDED.longest_streak, last_active_date = EXCLUDED.last_active_date',
      args: [req.userId, current, longest, today],
    })
    res.json({ success: true, alreadyCompleted: saved.rowsAffected === 0, currentStreak: current, longestStreak: longest })
  } catch (error) { next(error) }
})

lessonsRouter.post('/tests/submit', requireAuth, async (req, res, next) => {
  try {
    const lessonId = typeof req.body?.lessonId === 'string' ? req.body.lessonId : ''
    const answers = req.body?.answers
    if (!/^[a-zA-Z0-9_-]{1,120}$/.test(lessonId) || !Array.isArray(answers) || answers.length < 1 || answers.length > 20) {
      return res.status(400).json({ error: 'Invalid assessment submission.' })
    }
    const lessonResult = await db.execute({ sql: "SELECT id, course_id FROM lessons WHERE id = ? AND unit_type IN ('test', 'final')", args: [lessonId] })
    const lesson = lessonResult.rows[0]
    if (!lesson) return res.status(404).json({ error: 'Assessment not found.' })
    const states = await getCourseUnitStates(lesson.course_id, req.userId)
    const state = states.find(unit => unit.id === lessonId)
    if (!state?.unlocked) return res.status(403).json({ error: 'Complete the previous lessons before taking this assessment.' })

    const questionResult = await db.execute({ sql: 'SELECT id, correct_index FROM quiz_questions WHERE lesson_id = ? ORDER BY id', args: [lessonId] })
    const questions = questionResult.rows
    if (!questions.length || answers.length !== questions.length) return res.status(400).json({ error: 'Answer every question before submitting.' })
    const answerMap = new Map()
    for (const answer of answers) {
      if (!answer || typeof answer.questionId !== 'string' || !Number.isInteger(answer.selectedIndex) || answer.selectedIndex < 0 || answer.selectedIndex > 20 || answerMap.has(answer.questionId)) {
        return res.status(400).json({ error: 'Invalid or duplicate answer.' })
      }
      answerMap.set(answer.questionId, answer.selectedIndex)
    }
    if (questions.some(question => !answerMap.has(question.id))) return res.status(400).json({ error: 'Answer every question before submitting.' })

    const score = questions.reduce((total, question) => total + (answerMap.get(question.id) === Number(question.correct_index) ? 1 : 0), 0)
    const total = questions.length
    const passed = score >= Math.ceil(total * 0.8)
    await db.execute({
      sql: 'INSERT INTO test_attempts (user_id, lesson_id, score, total, passed) VALUES (?, ?, ?, ?, ?)',
      args: [req.userId, lessonId, score, total, passed ? 1 : 0],
    })
    res.json({
      score, total, passed,
      message: passed ? 'Checkpoint passed. The next section is unlocked.' : 'Not quite yet. Review the lessons and try again. You need at least 80%.',
    })
  } catch (error) { next(error) }
})

lessonsRouter.get('/results/me', requireAuth, async (req, res, next) => {
  try {
    const [exerciseResults, testResults, progress] = await Promise.all([
      db.execute({
        sql: 'SELECT ea.id, ea.exercise_id, ea.passed, ea.submitted_code, ea.created_at, e.prompt, l.id AS lesson_id, l.title AS lesson_title, c.name AS course_name FROM exercise_attempts ea JOIN exercises e ON e.id = ea.exercise_id JOIN lessons l ON l.id = e.lesson_id JOIN courses c ON c.id = l.course_id WHERE ea.user_id = ? ORDER BY ea.created_at DESC LIMIT 100',
        args: [req.userId],
      }),
      db.execute({
        sql: 'SELECT ta.id, ta.lesson_id, ta.score, ta.total, ta.passed, ta.created_at, l.title AS lesson_title, c.name AS course_name FROM test_attempts ta JOIN lessons l ON l.id = ta.lesson_id JOIN courses c ON c.id = l.course_id WHERE ta.user_id = ? ORDER BY ta.created_at DESC LIMIT 100',
        args: [req.userId],
      }),
      db.execute({
        sql: 'SELECT p.lesson_id, p.completed_at, l.title AS lesson_title, c.name AS course_name FROM progress p JOIN lessons l ON l.id = p.lesson_id JOIN courses c ON c.id = l.course_id WHERE p.user_id = ? ORDER BY p.completed_at DESC LIMIT 100',
        args: [req.userId],
      }),
    ])
    res.setHeader('Cache-Control', 'private, no-store')
    res.json({ exercises: exerciseResults.rows, tests: testResults.rows, completedLessons: progress.rows })
  } catch (error) { next(error) }
})
