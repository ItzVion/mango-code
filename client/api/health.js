import { db } from '../../server/db.js'

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston'

export default async function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')

  try {
    const [connection, courses, lessons, exercises, quizzes] = await Promise.all([
      db.execute('SELECT 1 AS ok'),
      db.execute('SELECT COUNT(*)::bigint AS count FROM courses'),
      db.execute('SELECT COUNT(*)::bigint AS count FROM lessons'),
      db.execute('SELECT COUNT(*)::bigint AS count FROM exercises'),
      db.execute('SELECT COUNT(*)::bigint AS count FROM quiz_questions'),
    ])

    let piston = false
    try {
      const response = await fetch(`${PISTON_URL}/runtimes`, { signal: AbortSignal.timeout(5000) })
      piston = response.ok
    } catch {
      // Database health is reported independently of the external code runner.
    }

    return res.status(200).json({
      ok: true,
      runtime: 'vercel',
      database: connection.rows[0]?.ok === 1,
      catalog: {
        courses: Number(courses.rows[0]?.count || 0),
        lessons: Number(lessons.rows[0]?.count || 0),
        exercises: Number(exercises.rows[0]?.count || 0),
        quizzes: Number(quizzes.rows[0]?.count || 0),
      },
      piston,
    })
  } catch (error) {
    console.error('MangoCode PostgreSQL health check failed:', error?.message || error)
    return res.status(503).json({ ok: false, runtime: 'vercel', database: false })
  }
}
