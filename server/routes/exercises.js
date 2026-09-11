import { Router } from 'express'
import { db } from '../db.js'

export const exercisesRouter = Router()

const PISTON_URL = (process.env.PISTON_URL || 'https://emkc.org/api/v2/piston').replace(/\/$/, '')
const PISTON_API_KEY = process.env.PISTON_API_KEY || ''
const MAX_CODE_LENGTH = 20_000
const MAX_OUTPUT_LENGTH = 4_000
const REQUEST_TIMEOUT_MS = 10_000

let runtimeCache = { at: 0, map: {} }

async function pistonFetch(url, init = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const headers = new Headers(init.headers || {})
    headers.set('Accept', 'application/json')
    if (PISTON_API_KEY) headers.set('Authorization', `Bearer ${PISTON_API_KEY}`)
    return await fetch(url, { ...init, headers, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function getRuntimeVersion(language) {
  const now = Date.now()
  if (now - runtimeCache.at > 60 * 60 * 1000) {
    const res = await pistonFetch(`${PISTON_URL}/runtimes`)
    if (!res.ok) throw new Error(`Code runner runtime lookup failed (${res.status})`)
    const runtimes = await res.json()
    if (!Array.isArray(runtimes)) throw new Error('Code runner returned an invalid runtime list')
    const map = {}
    for (const rt of runtimes) {
      if (!rt?.language || !rt?.version) continue
      map[rt.language] = rt.version
      for (const alias of rt.aliases || []) map[alias] = rt.version
    }
    runtimeCache = { at: now, map }
  }
  return runtimeCache.map[language]
}

const PISTON_LANGUAGE = {
  python: 'python',
  javascript: 'javascript',
  c: 'c',
  cpp: 'c++',
}

const FILENAME = {
  python: 'main.py',
  javascript: 'main.js',
  c: 'main.c',
  cpp: 'main.cpp',
}

exercisesRouter.post('/check', async (req, res) => {
  const { exerciseId, code } = req.body || {}
  if (typeof exerciseId !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(exerciseId) || typeof code !== 'string') {
    return res.status(400).json({ pass: false, message: 'Invalid exercise or code.' })
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(413).json({ pass: false, message: `Your code is too long. Keep it under ${MAX_CODE_LENGTH.toLocaleString()} characters.` })
  }

  const result = await db.execute({
    sql: 'SELECT id, language, test_input, expected_output FROM exercises WHERE id = ?',
    args: [exerciseId],
  })
  const exercise = result.rows[0]
  if (!exercise) return res.status(404).json({ pass: false, message: 'Exercise not found.' })

  const language = PISTON_LANGUAGE[exercise.language]
  if (!language) return res.status(400).json({ pass: false, message: `Unsupported language: ${exercise.language}` })

  try {
    const version = await getRuntimeVersion(language)
    if (!version) return res.status(503).json({ pass: false, message: 'This language is temporarily unavailable. Please try again later.' })

    const runRes = await pistonFetch(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version,
        files: [{ name: FILENAME[exercise.language], content: code }],
        stdin: String(exercise.test_input || '').slice(0, 4_000),
        run_timeout: 3000,
        run_cpu_time: 3000,
        run_memory_limit: 64 * 1024 * 1024,
        compile_timeout: 5000,
        compile_cpu_time: 5000,
        compile_memory_limit: 128 * 1024 * 1024,
      }),
    })

    const raw = await runRes.text()
    let data
    try { data = JSON.parse(raw) } catch { data = null }
    if (!runRes.ok || !data) {
      console.error('Piston execution failed:', runRes.status)
      return res.status(runRes.status === 429 ? 429 : 502).json({
        pass: false,
        message: runRes.status === 429
          ? 'The code runner is busy. Please wait a moment and try again.'
          : 'The code runner is temporarily unavailable. Please try again later.',
      })
    }

    const run = data.run || {}
    const compile = data.compile || {}
    const stderr = String(run.stderr || compile.stderr || '').slice(0, MAX_OUTPUT_LENGTH)

    if ((compile.code != null && compile.code !== 0) || (run.code != null && run.code !== 0)) {
      return res.json({ pass: false, message: explainError(stderr || 'The program failed to run.') })
    }

    const actual = String(run.stdout || '').slice(0, MAX_OUTPUT_LENGTH).trim()
    const expected = String(exercise.expected_output || '').slice(0, MAX_OUTPUT_LENGTH).trim()
    const pass = actual === expected

    return res.json({
      pass,
      message: pass
        ? 'Correct! Your output matched.'
        : `Not quite. Expected "${expected}" but got "${actual || '(nothing)'}".`,
    })
  } catch (err) {
    console.error('Code execution error:', err?.message || err)
    return res.status(502).json({
      pass: false,
      message: err?.name === 'AbortError'
        ? 'The code runner took too long to respond. Please try again.'
        : 'The code runner is temporarily unavailable. Please try again later.',
    })
  }
})

function explainError(stderr) {
  const firstLine = String(stderr).split('\n').find(Boolean)?.slice(0, 500) || 'The program reported an error.'
  if (/SyntaxError/i.test(stderr)) return `Syntax error: ${firstLine}`
  if (/NameError/i.test(stderr)) return `Name error: ${firstLine}`
  if (/error:/i.test(stderr)) return `Compile error: ${firstLine}`
  return `Error: ${firstLine}`
}
