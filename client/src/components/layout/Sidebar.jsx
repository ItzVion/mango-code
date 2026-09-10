import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { LayoutDashboard, Code2, Braces, Hash, FileCode2, Flame, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/course/html-css', label: 'HTML & CSS', icon: FileCode2 },
  { to: '/course/javascript', label: 'JavaScript', icon: Braces },
  { to: '/course/python', label: 'Python', icon: Code2 },
  { to: '/course/c', label: 'C', icon: Hash },
  { to: '/course/cpp', label: 'C++', icon: Hash },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-6 border-r border-ink/5 bg-card/60 px-5 py-6">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 px-1"
      >
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-mango text-ink">
          <Sparkles size={18} strokeWidth={2.5} />
        </div>
        <span className="font-display text-lg font-semibold">MangoCode</span>
      </motion.div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i }}
          >
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-ink text-paper'
                    : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                )
              }
            >
              <Icon size={17} strokeWidth={2.25} />
              {label}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-auto flex items-center gap-2 rounded-xl bg-ember/10 px-3 py-3 text-sm text-ember"
      >
        <Flame size={16} />
        <span className="font-medium">Keep your streak alive today</span>
      </motion.div>
    </aside>
  )
}
