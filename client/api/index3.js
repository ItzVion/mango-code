import { createClient } from '@libsql/client'

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston'
let db
let initialized
let runtimeCache = { at: 0, map: {} }

function database() {
  if (!db) {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) throw new Error('Turso is not configured')
    db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  }
  return db
}

async function init() {
  if (initialized) return initialized
  initialized = (async () => {
    const d = database()
    await d.batch([
      { sql: 'CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0)', args: [] },
      { sql: 'CREATE TABLE IF NOT EXISTS lessons (id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id), title TEXT NOT NULL, content TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0)', args: [] },
      { sql: 'CREATE TABLE IF NOT EXISTS exercises (id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id), language TEXT NOT NULL, prompt TEXT NOT NULL, starter_code TEXT DEFAULT "", test_input TEXT DEFAULT "", expected_output TEXT NOT NULL)', args: [] },
      { sql: 'CREATE TABLE IF NOT EXISTS quiz_questions (id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id), question TEXT NOT NULL, options TEXT NOT NULL, correct_index INTEGER NOT NULL)', args: [] },
      { sql: 'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)', args: [] },
      { sql: 'CREATE TABLE IF NOT EXISTS progress (user_id TEXT NOT NULL REFERENCES users(id), lesson_id TEXT NOT NULL REFERENCES lessons(id), completed_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, lesson_id))', args: [] },
      { sql: 'CREATE TABLE IF NOT EXISTS exercise_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id), exercise_id TEXT NOT NULL REFERENCES exercises(id), passed INTEGER NOT NULL, submitted_code TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)', args: [] },
      { sql: 'CREATE TABLE IF NOT EXISTS streaks (user_id TEXT PRIMARY KEY REFERENCES users(id), current_streak INTEGER NOT NULL DEFAULT 0, longest_streak INTEGER NOT NULL DEFAULT 0, last_active_date TEXT)', args: [] },
      { sql: 'CREATE TABLE IF NOT EXISTS test_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id), lesson_id TEXT NOT NULL REFERENCES lessons(id), score INTEGER NOT NULL, total INTEGER NOT NULL, passed INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)', args: [] },
    ], 'write')
    for (const sql of ['ALTER TABLE lessons ADD COLUMN level TEXT NOT NULL DEFAULT "easy"', 'ALTER TABLE lessons ADD COLUMN unit_type TEXT NOT NULL DEFAULT "lesson"']) {
      try { await d.execute(sql) } catch (error) { if (!String(error?.message || error).toLowerCase().includes('duplicate column')) throw error }
    }
    await d.batch([
      { sql: 'CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, sort_order)', args: [] },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_quiz_lesson ON quiz_questions(lesson_id)', args: [] },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_exercises_lesson ON exercises(lesson_id)', args: [] },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id)', args: [] },
      { sql: 'CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(user_id)', args: [] },
    ], 'write')
  })().catch((error) => { initialized = null; throw error })
  return initialized
}

function json(res, status, value) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(value))
}

function userIdFrom(req) {
  const value = String(req.headers['x-mango-user'] || '').trim()
  return /^[A-Za-z0-9_-]{16,80}$/.test(value) ? value : null
}

async function ensureUser(d, req) {
  const id = userIdFrom(req)
  if (!id) return null
  await d.execute({ sql: 'INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)', args: [id, `anonymous-${id}@mangocode.local`, 'MangoCoder'] })
  await d.execute({ sql: 'INSERT OR IGNORE INTO streaks (user_id) VALUES (?)', args: [id] })
  return id
}

async function touchStreak(d, userId) {
  if (!userId) return
  const today = new Date().toISOString().slice(0, 10)
  const r = await d.execute({ sql: 'SELECT current_streak, longest_streak, last_active_date FROM streaks WHERE user_id = ?', args: [userId] })
  const row = r.rows[0]
  if (!row || row.last_active_date === today) return
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const current = row.last_active_date === yesterday ? Number(row.current_streak) + 1 : 1
  const longest = Math.max(Number(row.longest_streak), current)
  await d.execute({ sql: 'UPDATE streaks SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE user_id = ?', args: [current, longest, today, userId] })
}

async function courseAccess(d, courseId, userId) {
  const rows = await d.execute({ sql: 'SELECT id, title, sort_order, level, unit_type FROM lessons WHERE course_id = ? ORDER BY sort_order', args: [courseId] })
  const completed = new Set()
  if (userId) {
    const p = await d.execute({ sql: 'SELECT lesson_id FROM progress WHERE user_id = ?', args: [userId] })
    for (const row of p.rows) completed.add(row.lesson_id)
  }
  const tests = {}
  if (userId) {
    const t = await d.execute({ sql: 'SELECT lesson_id, MAX(passed) AS passed FROM test_attempts WHERE user_id = ? GROUP BY lesson_id', args: [userId] })
    for (const row of t.rows) tests[row.lesson_id] = Number(row.passed) === 1
  }
  const output = []
  for (const lesson of rows.rows) {
    let unlocked = lesson.level === 'easy'
    if (lesson.level === 'medium') unlocked = Boolean(tests[`${courseId}-easy-test`])
    if (lesson.level === 'hard') unlocked = Boolean(tests[`${courseId}-medium-test`])
    if (lesson.level === 'final') unlocked = Boolean(tests[`${courseId}-hard-test`])
    if (lesson.unit_type === 'test') {
      const levelLessons = rows.rows.filter((x) => x.level === lesson.level && x.unit_type === 'lesson')
      unlocked = levelLessons.every((x) => completed.has(x.id))
    }
    if (lesson.unit_type === 'final') unlocked = Boolean(tests[`${courseId}-hard-test`])
    output.push({ ...lesson, completed: completed.has(lesson.id), unlocked, passed: Boolean(tests[lesson.id]) })
  }
  return output
}

async function runtimes() {
  if (Date.now() - runtimeCache.at < 3600000) return runtimeCache.map
  const response = await fetch(`${PISTON_URL}/runtimes`)
  if (!response.ok) throw new Error('Piston runtimes unavailable')
  const list = await response.json()
  const map = {}
  for (const runtime of list) {
    map[runtime.language] = runtime.version
    for (const alias of runtime.aliases || []) map[alias] = runtime.version
  }
  runtimeCache = { at: Date.now(), map }
  return map
}

const languages = { javascript: ['javascript', 'main.js'], python: ['python', 'main.py'], c: ['c', 'main.c'], cpp: ['c++', 'main.cpp'] }

export default async function handler(req, res) {
  const origin = req.headers.origin
  if (origin === 'https://mango-code.vercel.app' || origin === 'http://localhost:5173') res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Mango-User')
  if (req.method === 'OPTIONS') return json(res, 204, {})

  try {
    if (req.body === undefined && req.method !== 'GET' && req.method !== 'HEAD') {
      let raw = ''
      for await (const chunk of req) raw += chunk
      try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }
    }
    await init()
    const d = database()
    const userId = await ensureUser(d, req)
    const url = new URL(req.url, 'https://mango-code.vercel.app')
    const path = url.pathname.replace(/\/+$/, '') || '/'

    if (req.method === 'GET' && path === '/api/health') return json(res, 200, { ok: true, database: true })
    if (req.method === 'GET' && path === '/api/courses') {
      const r = await d.execute('SELECT * FROM courses ORDER BY sort_order')
      return json(res, 200, r.rows)
    }
    const cm = path.match(/^\/api\/courses\/([^/]+)\/lessons$/)
    if (req.method === 'GET' && cm) return json(res, 200, await courseAccess(d, cm[1], userId))
    if (req.method === 'GET' && path === '/api/progress') {
      if (!userId) return json(res, 200, { user: null, completed: [], tests: [], streak: null })
      const [p, t, s] = await Promise.all([
        d.execute({ sql: 'SELECT lesson_id, completed_at FROM progress WHERE user_id = ?', args: [userId] }),
        d.execute({ sql: 'SELECT lesson_id, score, total, passed, created_at FROM test_attempts WHERE user_id = ? ORDER BY created_at DESC', args: [userId] }),
        d.execute({ sql: 'SELECT current_streak, longest_streak, last_active_date FROM streaks WHERE user_id = ?', args: [userId] }),
      ])
      return json(res, 200, { user: userId, completed: p.rows, tests: t.rows, streak: s.rows[0] || null })
    }
    const lm = path.match(/^\/api\/lessons\/([^/]+)$/)
    if (req.method === 'GET' && lm) {
      const lesson = await d.execute({ sql: 'SELECT * FROM lessons WHERE id = ?', args: [lm[1]] })
      if (!lesson.rows.length) return json(res, 404, { error: 'Lesson not found' })
      const row = lesson.rows[0]
      const access = await courseAccess(d, row.course_id, userId)
      const state = access.find((x) => x.id === row.id)
      if (state && !state.unlocked) return json(res, 403, { error: 'This unit is locked until you complete the previous checkpoint.' })
      const ex = await d.execute({ sql: 'SELECT id, language, prompt, starter_code FROM exercises WHERE lesson_id = ?', args: [lm[1]] })
      const quiz = await d.execute({ sql: 'SELECT id, question, options FROM quiz_questions WHERE lesson_id = ? ORDER BY id', args: [lm[1]] })
      return json(res, 200, { ...row, completed: state?.completed || false, passed: state?.passed || false, exercises: ex.rows, quiz: quiz.rows.map((q) => ({ id: q.id, question: q.question, options: JSON.parse(q.options) })) })
    }
    if (req.method === 'POST' && path === '/api/progress/complete') {
      if (!userId) return json(res, 401, { error: 'Progress requires a browser user id.' })
      const { lessonId } = req.body || {}
      if (!lessonId) return json(res, 400, { error: 'Missing lessonId.' })
      const lesson = await d.execute({ sql: 'SELECT id, course_id, level, unit_type FROM lessons WHERE id = ?', args: [lessonId] })
      if (!lesson.rows.length) return json(res, 404, { error: 'Lesson not found.' })
      const row = lesson.rows[0]
      if (row.unit_type !== 'lesson') return json(res, 400, { error: 'Tests must be submitted through the test endpoint.' })
      const access = await courseAccess(d, row.course_id, userId)
      const state = access.find((x) => x.id === lessonId)
      if (!state?.unlocked) return json(res, 403, { error: 'This lesson is locked.' })
      await d.execute({ sql: 'INSERT OR REPLACE INTO progress (user_id, lesson_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)', args: [userId, lessonId] })
      await touchStreak(d, userId)
      return json(res, 200, { ok: true, lessonId })
    }
    if (req.method === 'POST' && path === '/api/quiz/check') {
      const { questionId, selectedIndex } = req.body || {}
      if (!questionId || !Number.isInteger(selectedIndex) || selectedIndex < 0) return json(res, 400, { error: 'Invalid answer' })
      const r = await d.execute({ sql: 'SELECT correct_index FROM quiz_questions WHERE id = ?', args: [questionId] })
      if (!r.rows.length) return json(res, 404, { error: 'Question not found' })
      const correct = selectedIndex === Number(r.rows[0].correct_index)
      return json(res, 200, { correct, message: correct ? 'Correct!' : 'Not quite — try another answer.' })
    }
    if (req.method === 'POST' && path === '/api/tests/submit') {
      if (!userId) return json(res, 401, { error: 'Progress requires a browser user id.' })
      const { lessonId, answers } = req.body || {}
      if (!lessonId || !Array.isArray(answers)) return json(res, 400, { error: 'Invalid test submission.' })
      const lesson = await d.execute({ sql: 'SELECT * FROM lessons WHERE id = ?', args: [lessonId] })
      if (!lesson.rows.length || !['test', 'final'].includes(lesson.rows[0].unit_type)) return json(res, 400, { error: 'Not a test.' })
      const row = lesson.rows[0]
      const access = await courseAccess(d, row.course_id, userId)
      const state = access.find((x) => x.id === lessonId)
      if (!state?.unlocked) return json(res, 403, { error: 'This test is locked.' })
      const qs = await d.execute({ sql: 'SELECT id, correct_index FROM quiz_questions WHERE lesson_id = ? ORDER BY id', args: [lessonId] })
      const map = new Map(answers.map((a) => [String(a.questionId), Number(a.selectedIndex)]))
      let score = 0
      for (const q of qs.rows) if (map.get(q.id) === Number(q.correct_index)) score++
      const total = qs.rows.length
      const required = 8
      const passed = score >= required
      await d.execute({ sql: 'INSERT INTO test_attempts (user_id, lesson_id, score, total, passed) VALUES (?, ?, ?, ?, ?)', args: [userId, lessonId, score, total, passed ? 1 : 0] })
      if (passed) await d.execute({ sql: 'INSERT OR REPLACE INTO progress (user_id, lesson_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)', args: [userId, lessonId] })
      await touchStreak(d, userId)
      return json(res, 200, { score, total, required, passed, message: passed ? 'Checkpoint passed! Next section unlocked.' : `You need ${required}/${total} to pass. Try again.` })
    }
    if (req.method === 'POST' && path === '/api/exercises/check') {
      if (!userId) return json(res, 401, { pass: false, message: 'Progress requires a browser user id.' })
      const { exerciseId, code } = req.body || {}
      if (!exerciseId || typeof code !== 'string') return json(res, 400, { pass: false, message: 'Missing exerciseId or code.' })
      if (code.length > 20000) return json(res, 413, { pass: false, message: 'Code is too long.' })
      const r = await d.execute({ sql: 'SELECT * FROM exercises WHERE id = ?', args: [exerciseId] })
      const exercise = r.rows[0]
      if (!exercise) return json(res, 404, { pass: false, message: 'Exercise not found.' })
      const config = languages[exercise.language]
      if (!config) return json(res, 400, { pass: false, message: 'Unsupported language.' })
      const version = (await runtimes())[config[0]]
      if (!version) return json(res, 503, { pass: false, message: 'This runtime is unavailable.' })
      const response = await fetch(`${PISTON_URL}/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: config[0], version, files: [{ name: config[1], content: code }], stdin: exercise.test_input || '' }) })
      if (!response.ok) return json(res, 502, { pass: false, message: 'Code runner unavailable.' })
      const data = await response.json()
      const run = data.run || {}
      const actual = String(run.stdout || '').trim()
      const expected = String(exercise.expected_output || '').trim()
      const pass = run.code === 0 && actual === expected
      await d.execute({ sql: 'INSERT INTO exercise_attempts (user_id, exercise_id, passed, submitted_code) VALUES (?, ?, ?, ?)', args: [userId, exerciseId, pass ? 1 : 0, code] })
      if (pass) await touchStreak(d, userId)
      if (run.code !== 0) return json(res, 200, { pass: false, message: 'Your code produced an error. Fix it and try again.', stderr: run.stderr || '' })
      return json(res, 200, { pass, message: pass ? 'Correct! Your output matched.' : 'Not quite. Check your output and try again.', stdout: run.stdout || '' })
    }
    return json(res, 404, { error: 'Not found' })
  } catch (error) {
    console.error('MangoCode API error', error)
    return json(res, 500, { error: 'Internal server error' })
  }
}
