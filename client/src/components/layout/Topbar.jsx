import { motion } from 'motion/react'
import { Bell, Search } from 'lucide-react'

export function Topbar({ name = 'there' }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-5 md:px-8">
      <div>
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-ink-soft"
        >
          {greeting}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-2xl font-semibold"
        >
          {name} 👋
        </motion.h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-card border border-ink/10 px-4 py-2 text-sm text-ink-soft">
          <Search size={15} />
          <span>Search lessons…</span>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-card border border-ink/10 text-ink-soft hover:text-ink transition-colors">
          <Bell size={17} />
        </button>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-mango to-ember" />
      </div>
    </header>
  )
}
