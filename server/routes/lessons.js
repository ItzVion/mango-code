import { Router } from 'express'
import { db } from '../db.js'

export const lessonsRouter = Router()

lessonsRouter.get('/courses', async (req, res) => {
  const result = await db.execute('SELECT * FROM courses ORDER BY sort_order')
  res.json(result.rows)
})

lessonsRouter.get('/courses/:courseId/lessons', async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT id, title, sort_order FROM lessons WHERE course_id = ? ORDER BY sort_order',
    args: [req.params.courseId],
  })
  res.json(result.rows)
})

lessonsRouter.get('/lessons/:lessonId', async (req, res) => {
  const lesson = await db.execute({
    sql: 'SELECT * FROM lessons WHERE id = ?',
    args: [req.params.lessonId],
  })
  if (lesson.rows.length === 0) return res.status(404).json({ error: 'Lesson not found' })

  const exercises = await db.execute({
    sql: 'SELECT id, language, prompt, starter_code FROM exercises WHERE lesson_id = ?',
    args: [req.params.lessonId],
  })
  const quiz = await db.execute({
    sql: 'SELECT id, question, options FROM quiz_questions WHERE lesson_id = ?',
    args: [req.params.lessonId],
  })

  res.json({
    ...lesson.rows[0],
    exercises: exercises.rows,
    quiz: quiz.rows.map((q) => ({ id: q.id, question: q.question, options: JSON.parse(q.options) })),
  })
})

lessonsRouter.post('/quiz/check', async (req, res) => {
  const { questionId, selectedIndex } = req.body
  if (!questionId || typeof selectedIndex !== 'number') {
    return res.status(400).json({ error: 'Missing questionId or selectedIndex' })
  }

  const result = await db.execute({
    sql: 'SELECT correct_index FROM quiz_questions WHERE id = ?',
    args: [questionId],
  })
  if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' })

  const correctIndex = result.rows[0].correct_index
  res.json({ correct: selectedIndex === correctIndex, correctIndex })
})
