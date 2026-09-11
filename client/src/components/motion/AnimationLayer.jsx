import { useEffect, useMemo, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { useLocation } from 'react-router-dom'

export function AnimationLayer() {
  const location = useLocation()
  const [enabled, setEnabled] = useState(false)
  const [scroll, setScroll] = useState(0)
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)
  const sx = useSpring(x, { stiffness: 90, damping: 22, mass: .5 })
  const sy = useSpring(y, { stiffness: 90, damping: 22, mass: .5 })
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ id: i, left: `${(i * 47) % 100}%`, top: `${(i * 71) % 100}%`, size: 2 + (i % 3), delay: (i % 7) * .4, duration: 5 + (i % 5) })), [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    setEnabled(!reduce && !coarse)
    if (reduce) return
    const move = (e) => { x.set(e.clientX); y.set(e.clientY) }
    const update = () => { const h = document.documentElement.scrollHeight - window.innerHeight; setScroll(h > 0 ? window.scrollY / h : 0) }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('scroll', update, { passive: true }); update()
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('scroll', update) }
  }, [x, y])

  if (!enabled) return null
  return (
    <>
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[60] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mango/10 blur-3xl" style={{ x: sx, y: sy }} />
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        {particles.map((p) => <motion.span key={p.id} className="absolute rounded-full bg-mango/20" style={{ left: p.left, top: p.top, width: p.size, height: p.size }} animate={{ y: [0, -22, 0], opacity: [.1, .55, .1], scale: [1, 1.7, 1] }} transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />)}
      </div>
      <motion.div className="fixed left-0 right-0 top-0 z-[70] h-1 origin-left bg-gradient-to-r from-mango via-ember to-leaf" style={{ scaleX: scroll }} />
      <motion.div key={location.pathname} initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: .45, ease: [0.22, 1, .36, 1] }} className="pointer-events-none fixed inset-0 z-50 bg-mango/0" />
    </>
  )
}
