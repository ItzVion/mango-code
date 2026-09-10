import { motion } from 'motion/react'
import { ArrowRight, CheckCircle2, XCircle, Trophy, Flame, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TextEffect } from '../components/motion/TextEffect'
import { AnimatedGroup } from '../components/motion/AnimatedGroup'
import { AnimatedCounter } from '../components/motion/AnimatedCounter'
import { TiltCard } from '../components/motion/TiltCard'
import { COURSES, RECENT_ACTIVITY } from '../data/courses'

const STATS = [
  { label: 'Day streak', value: 6, suffix: '', icon: Flame, color: 'text-ember' },
  { label: 'Lessons done', value: 31, suffix: '', icon: BookOpen, color: 'text-mango-deep' },
  { label: 'XP earned', value: 1240, suffix: '', icon: Trophy, color: 'text-leaf' },
]

export default function Dashboard() {
  const continueCourse = COURSES.find((c) => c.progress > 0 && c.progress < 100) ?? COURSES[0]

  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* Hero: continue learning */}
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
            Continue where you left off
          </span>
          <TextEffect
            as="h2"
            className="text-3xl font-semibold leading-tight md:text-4xl"
          >
            {`Pick up ${continueCourse.name} again`}
          </TextEffect>
          <p className="text-paper/70">{continueCourse.blurb}</p>

          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 max-w-xs overflow-hidden rounded-full bg-paper/15">
              <motion.div
                className="h-full rounded-full bg-mango"
                initial={{ width: 0 }}
                animate={{ width: `${continueCourse.progress}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              />
            </div>
            <span className="text-sm text-paper/70">{continueCourse.progress}%</span>
          </div>

          <Link to={`/course/${continueCourse.id}`}>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-mango px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Resume lesson <ArrowRight size={16} />
            </motion.button>
          </Link>
        </div>
      </motion.section>

      {/* Stats row */}
      <AnimatedGroup className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map(({ label, value, suffix, icon: Icon, color }) => (
          <TiltCard key={label} className="p-5">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-ink/5 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="font-display text-3xl font-semibold">
              <AnimatedCounter value={value} suffix={suffix} />
            </p>
            <p className="text-sm text-ink-soft">{label}</p>
          </TiltCard>
        ))}
      </AnimatedGroup>

      {/* Course grid */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Your courses</h3>
        <AnimatedGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => (
            <Link key={course.id} to={`/course/${course.id}`}>
              <TiltCard className="p-5 h-full">
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: course.color }}
                  >
                    {course.name}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {course.lessonsDone}/{course.lessonsTotal}
                  </span>
                </div>
                <p className="mb-4 text-sm text-ink-soft">{course.blurb}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: course.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${course.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </TiltCard>
            </Link>
          ))}
        </AnimatedGroup>
      </section>

      {/* Recent activity */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Recent activity</h3>
        <AnimatedGroup className="flex flex-col gap-2">
          {RECENT_ACTIVITY.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-card px-4 py-3"
            >
              {item.result === 'correct' ? (
                <CheckCircle2 size={18} className="text-leaf shrink-0" />
              ) : (
                <XCircle size={18} className="text-rose shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="text-xs text-ink-soft">{item.course}</p>
              </div>
              <span className="text-xs text-ink-soft shrink-0">{item.time}</span>
            </div>
          ))}
        </AnimatedGroup>
      </section>
    </div>
  )
}
