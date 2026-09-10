import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { lessonsRouter } from './routes/lessons.js'
import { exercisesRouter } from './routes/exercises.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', lessonsRouter)
app.use('/api/exercises', exercisesRouter)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`MangoCode server running on :${PORT}`))
