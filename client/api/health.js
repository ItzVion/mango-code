import { createClient } from '@libsql/client'

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston'

export default async function handler(req, res) {
  const result = { ok: true, runtime: 'vercel', tursoConfigured: Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN), database: false, catalog: null, piston: false }
  try {
    if (result.tursoConfigured) {
      const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
      const [courses, lessons, exercises, quizzes] = await Promise.all([
        db.execute('SELECT COUNT(*) AS count FROM courses'),
        db.execute('SELECT COUNT(*) AS count FROM lessons'),
        db.execute('SELECT COUNT(*) AS count FROM exercises'),
        db.execute('SELECT COUNT(*) AS count FROM quiz_questions'),
      ])
      result.database = true
      result.catalog = {
        courses: Number(courses.rows[0]?.count || 0),
        lessons: Number(lessons.rows[0]?.count || 0),
        exercises: Number(exercises.rows[0]?.count || 0),
        quizzes: Number(quizzes.rows[0]?.count || 0),
      }
    }
    const response = await fetch(`${PISTON_URL}/runtimes`, { signal: AbortSignal.timeout(5000) })
    result.piston = response.ok
  } catch {
    result.ok = false
  }
  res.statusCode = result.ok ? 200 : 503
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(result))
}
