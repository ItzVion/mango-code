import { createClient } from '@libsql/client'
import { courses, lessons, exercises, quizzes } from './catalog.js'

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
    ], 'write')
    const statements = []
    for (const row of courses) statements.push({ sql: 'INSERT OR IGNORE INTO courses VALUES (?, ?, ?, ?)', args: row })
    for (const row of lessons) statements.push({ sql: 'INSERT OR IGNORE INTO lessons VALUES (?, ?, ?, ?, ?)', args: row })
    for (const row of exercises) statements.push({ sql: 'INSERT OR IGNORE INTO exercises VALUES (?, ?, ?, ?, ?, ?, ?)', args: row })
    for (const row of quizzes) statements.push({ sql: 'INSERT OR IGNORE INTO quiz_questions VALUES (?, ?, ?, ?, ?)', args: [row[0], row[1], row[2], JSON.stringify(row[3]), row[4]] })
    await d.batch(statements, 'write')
  })().catch((error) => { initialized = null; throw error })
  return initialized
}

function json(res, status, value) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(value))
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return json(res, 204, {})

  try {
    if (req.body === undefined && req.method !== 'GET' && req.method !== 'HEAD') {
      let raw = ''
      for await (const chunk of req) raw += chunk
      try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }
    }
    await init()
    const d = database()
    const url = new URL(req.url, 'https://mango-code.vercel.app')
    const path = url.pathname.replace(/\/+$/, '') || '/'

    if (req.method === 'GET' && path === '/api/health') return json(res, 200, { ok: true, database: true })
    if (req.method === 'GET' && path === '/api/courses') {
      const r = await d.execute('SELECT * FROM courses ORDER BY sort_order')
      return json(res, 200, r.rows)
    }

    const cm = path.match(/^\/api\/courses\/([^/]+)\/lessons$/)
    if (req.method === 'GET' && cm) {
      const r = await d.execute({ sql: 'SELECT id, title, sort_order FROM lessons WHERE course_id = ? ORDER BY sort_order', args: [cm[1]] })
      return json(res, 200, r.rows)
    }

    const lm = path.match(/^\/api\/lessons\/([^/]+)$/)
    if (req.method === 'GET' && lm) {
      const lesson = await d.execute({ sql: 'SELECT * FROM lessons WHERE id = ?', args: [lm[1]] })
      if (!lesson.rows.length) return json(res, 404, { error: 'Lesson not found' })
      const ex = await d.execute({ sql: 'SELECT id, language, prompt, starter_code FROM exercises WHERE lesson_id = ?', args: [lm[1]] })
      const quiz = await d.execute({ sql: 'SELECT id, question, options FROM quiz_questions WHERE lesson_id = ?', args: [lm[1]] })
      return json(res, 200, { ...lesson.rows[0], exercises: ex.rows, quiz: quiz.rows.map(q => ({ id: q.id, question: q.question, options: JSON.parse(q.options) })) })
    }

    if (req.method === 'POST' && path === '/api/quiz/check') {
      const { questionId, selectedIndex } = req.body || {}
      if (!questionId || !Number.isInteger(selectedIndex) || selectedIndex < 0) return json(res, 400, { error: 'Invalid answer' })
      const r = await d.execute({ sql: 'SELECT correct_index FROM quiz_questions WHERE id = ?', args: [questionId] })
      if (!r.rows.length) return json(res, 404, { error: 'Question not found' })
      const correct = selectedIndex === Number(r.rows[0].correct_index)
      return json(res, 200, { correct, message: correct ? 'Correct!' : 'Not quite — try another answer.' })
    }

    if (req.method === 'POST' && path === '/api/exercises/check') {
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
      if (run.code !== 0) return json(res, 200, { pass: false, message: 'Your code produced an error. Fix it and try again.', stderr: run.stderr || '' })
      const actual = String(run.stdout || '').trim()
      const expected = String(exercise.expected_output || '').trim()
      return json(res, 200, { pass: actual === expected, message: actual === expected ? 'Correct! Your output matched.' : 'Not quite. Check your output and try again.', stdout: run.stdout || '' })
    }

    return json(res, 404, { error: 'Not found' })
  } catch (error) {
    console.error('MangoCode API error', error)
    return json(res, 500, { error: 'Internal server error' })
  }
}
