import { Router } from 'express'
import { db } from '../db.js'

export const exercisesRouter = Router()

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston'

// Cache Piston's runtime list (language -> latest version) for an hour
let runtimeCache = { at: 0, map: {} }

async function getRuntimeVersion(language) {
  const now = Date.now()
  if (now - runtimeCache.at > 60 * 60 * 1000) {
    const res = await fetch(`${PISTON_URL}/runtimes`)
    const runtimes = await res.json()
    const map = {}
    for (const rt of runtimes) {
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
  const { exerciseId, code } = req.body
  if (!exerciseId || typeof code !== 'string') {
    return res.status(400).json({ pass: false, message: 'Missing exerciseId or code.' })
  }

  const result = await db.execute({
    sql: 'SELECT * FROM exercises WHERE id = ?',
    args: [exerciseId],
  })
  const exercise = result.rows[0]
  if (!exercise) return res.status(404).json({ pass: false, message: 'Exercise not found.' })

  const language = PISTON_LANGUAGE[exercise.language]
  if (!language) {
    return res.status(400).json({ pass: false, message: `Unsupported language: ${exercise.language}` })
  }

  try {
    const version = await getRuntimeVersion(language)
    const runRes = await fetch(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version,
        files: [{ name: FILENAME[exercise.language], content: code }],
        stdin: exercise.test_input || '',
      }),
    })
    const data = await runRes.json()
    const run = data.run || {}

    if (run.code !== 0 && run.stderr) {
      return res.json({
        pass: false,
        message: explainError(run.stderr),
        stderr: run.stderr,
      })
    }

    const actual = (run.stdout || '').trim()
    const expected = exercise.expected_output.trim()
    const pass = actual === expected

    return res.json({
      pass,
      message: pass
        ? 'Correct! Your output matched.'
        : `Not quite. Expected "${expected}" but got "${actual || '(nothing)'}".`,
      stdout: run.stdout,
    })
  } catch (err) {
    console.error(err)
    return res.status(502).json({ pass: false, message: 'Could not run your code right now. Try again.' })
  }
})

// Turn a raw compiler/interpreter error into a shorter, friendlier hint
function explainError(stderr) {
  const firstLine = stderr.split('\n').find(Boolean) || stderr
  if (/SyntaxError/i.test(stderr)) return `Syntax error: ${firstLine}`
  if (/NameError/i.test(stderr)) return `Name error: ${firstLine}`
  if (/error:/i.test(stderr)) return `Compile error: ${firstLine}`
  return `Error: ${firstLine}`
}
