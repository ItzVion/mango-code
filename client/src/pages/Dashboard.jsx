import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, BookOpen, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TextEffect } from '../components/motion/TextEffect'
import { AnimatedGroup } from '../components/motion/AnimatedGroup'
import { AnimatedCounter } from '../components/motion/AnimatedCounter'
import { TiltCard } from '../components/motion/TiltCard'

export default function Dashboard() {
  const [courses, setCourses] = useState(null)
  const [firstLessons, setFirstLessons] = useState({}) // courseId -> first lesson {id, title}

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then(async (list) => {
        setCourses(list)
        const entries = await Promise.all(
          list.map(async (c) => {
            const res = await fetch(`/api/courses/${c.id}/lessons`)
            const lessons = await res.json()
            return [c.id, lessons]
          })
        )
        const map = {}
        for (const [id, lessons] of entries) map[id] = lessons
        setFirstLessons(map)
      })
  }, [])

  const totalLessons = Object.values(firstLessons).reduce((sum, l) => sum + l.length, 0)
  const heroCourse = courses?.[0]
  const heroLesson = heroCourse ? firstLessons[heroCourse.id]?.[0] : null

  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-ink px-6 py-8 text-paper md:px-10 md:py-10"
      >
        <motion.div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mango/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-ember/25 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div className="relative flex flex-col gap-4 md:max-w-xl">
          <span className="w-fit rounded-full bg-paper/10 px-3 py-1 text-xs font-medium text-mango">
            Start learning
          </span>
          <TextEffect as="h2" className="text-3xl font-semibold leading-tight md:text-4xl">
            {heroCourse ? `Start with ${heroCourse.name}` : 'Loading your courses…'}
          </TextEffect>
          <p className="text-paper/70">
            Read the lesson, then run real code and get instant right/wrong feedback.
          </p>

          {heroLesson && (
            <Link to={`/lesson/${heroLesson.id}`}>
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink"
              >
                Start "{heroLesson.title}" <ArrowRight size={16} />
              </motion.button>
            </Link>
          )}
        </div>
      </motion.section>

      {/* Stats */}
      {courses && (
        <AnimatedGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TiltCard className="p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-mango-deep">
              <Layers size={18} />
            </div>
            <p className="font-display text-3xl font-semibold">
              <AnimatedCounter value={courses.length} />
            </p>
            <p className="text-sm text-ink-soft">Courses</p>
          </TiltCard>
          <TiltCard className="p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-leaf">
              <BookOpen size={18} />
            </div>
            <p className="font-display text-3xl font-semibold">
              <AnimatedCounter value={totalLessons} />
            </p>
            <p className="text-sm text-ink-soft">Lessons live</p>
          </TiltCard>
        </AnimatedGroup>
      )}

      {/* Course grid */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Your courses</h3>
        {!courses && <p className="text-sm text-ink-soft">Loading…</p>}
        {courses && (
          <AnimatedGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const lessons = firstLessons[course.id] ?? []
              return (
                <Link key={course.id} to={`/course/${course.id}`}>
                  <TiltCard className="p-5 h-full">
                    <div className="mb-4 flex items-center justify-between">
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: course.color }}
                      >
                        {course.name}
                      </span>
                      <span className="text-xs text-ink-soft">{lessons.length} lessons</span>
                    </div>
                    <p className="text-sm text-ink-soft">
                      {lessons.length > 0 ? `Start with "${lessons[0].title}"` : 'Coming soon'}
                    </p>
                  </TiltCard>
                </Link>
              )
            })}
          </AnimatedGroup>
        )}
      </section>
    </div>
  )
}
