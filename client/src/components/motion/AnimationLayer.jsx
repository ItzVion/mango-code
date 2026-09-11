import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react'
import { useLocation } from 'react-router-dom'

const TRAIL_COUNT = 10
const BURST_PARTICLES = 12

export function AnimationLayer() {
  const location = useLocation()
  const [enabled, setEnabled] = useState(false)
  const [scroll, setScroll] = useState(0)
  const [bursts, setBursts] = useState([])
  const trailRefs = useRef([])
  const trailTarget = useRef({ x: -300, y: -300 })
  const trailPositions = useRef(Array.from({ length: TRAIL_COUNT }, () => ({ x: -300, y: -300 })))
  const raf = useRef(0)
  const burstId = useRef(0)

  const x = useMotionValue(-300)
  const y = useMotionValue(-300)
  const sx = useSpring(x, { stiffness: 170, damping: 20, mass: .28 })
  const sy = useSpring(y, { stiffness: 170, damping: 20, mass: .28 })
  const particles = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ id: i, left: `${(i * 47 + 13) % 100}%`, top: `${(i * 71 + 9) % 100}%`, size: 2 + (i % 4), delay: (i % 11) * .23, duration: 4 + (i % 7) * .8 })), [])
  const orbs = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ id: i, left: `${12 + i * 21}%`, top: `${18 + (i % 3) * 30}%`, size: 180 + i * 45, delay: i * .8 })), [])

  useEffect(() => {
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarseQuery = window.matchMedia('(pointer: coarse)')
    const updateEnabled = () => setEnabled(!reduceQuery.matches && !coarseQuery.matches)
    updateEnabled()
    reduceQuery.addEventListener?.('change', updateEnabled)
    coarseQuery.addEventListener?.('change', updateEnabled)
    return () => { reduceQuery.removeEventListener?.('change', updateEnabled); coarseQuery.removeEventListener?.('change', updateEnabled) }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    const move = (e) => {
      trailTarget.current = { x: e.clientX, y: e.clientY }
      x.set(e.clientX); y.set(e.clientY)
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`)
      document.documentElement.style.setProperty('--my', `${e.clientY}px`)
    }
    const animateTrail = () => {
      let previous = trailTarget.current
      trailPositions.current.forEach((point, i) => {
        const ease = .34 - i * .018
        point.x += (previous.x - point.x) * ease
        point.y += (previous.y - point.y) * ease
        const node = trailRefs.current[i]
        if (node) node.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) scale(${1 - i * .055})`
        previous = point
      })
      raf.current = requestAnimationFrame(animateTrail)
    }
    const scrollUpdate = () => { const h = document.documentElement.scrollHeight - window.innerHeight; setScroll(h > 0 ? window.scrollY / h : 0) }
    const click = (e) => {
      const id = ++burstId.current
      setBursts(prev => [...prev.slice(-3), { id, x: e.clientX, y: e.clientY }])
      window.setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 850)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('scroll', scrollUpdate, { passive: true })
    window.addEventListener('pointerdown', click, { passive: true })
    scrollUpdate()
    raf.current = requestAnimationFrame(animateTrail)
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('pointermove', move); window.removeEventListener('scroll', scrollUpdate); window.removeEventListener('pointerdown', click) }
  }, [enabled, x, y])

  if (!enabled) return null
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[55] opacity-70" style={{ background: 'radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(245,166,35,.09), transparent 65%)' }} />
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[60] h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mango/12 blur-3xl" style={{ x: sx, y: sy }} />
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[61] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-mango/60 bg-mango/10 shadow-[0_0_30px_rgba(245,166,35,.35)]" style={{ x: sx, y: sy }} />
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[61] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mango shadow-[0_0_18px_rgba(245,166,35,.9)]" style={{ x, y }} />
      <div className="pointer-events-none fixed inset-0 z-[59] overflow-hidden">
        {trailPositions.current.map((_, i) => <span key={i} ref={node => { trailRefs.current[i] = node }} className="absolute left-0 top-0 h-2.5 w-2.5 rounded-full bg-mango/35 blur-[1px] will-change-transform" style={{ opacity: Math.max(.08, .52 - i * .045) }} />)}
      </div>
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        {orbs.map(o => <motion.div key={o.id} className="absolute rounded-full bg-mango/[.035] blur-3xl" style={{ left: o.left, top: o.top, width: o.size, height: o.size }} animate={{ x: [0, 55, -35, 0], y: [0, -35, 45, 0], scale: [1, 1.16, .92, 1] }} transition={{ duration: 12 + o.id * 1.4, delay: o.delay, repeat: Infinity, ease: 'easeInOut' }} />)}
        {particles.map(p => <motion.span key={p.id} className="absolute rounded-full bg-mango/25" style={{ left: p.left, top: p.top, width: p.size, height: p.size }} animate={{ y: [0, -30, 4, -18, 0], x: [0, 10, -8, 7, 0], opacity: [.08, .7, .18, .55, .08], scale: [1, 1.8, .75, 1.45, 1] }} transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />)}
      </div>
      <AnimatePresence>
        {bursts.map(b => <motion.div key={b.id} className="pointer-events-none fixed z-[75] h-0 w-0" style={{ left: b.x, top: b.y }} initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: .8 }}>
          <motion.span className="absolute -left-5 -top-5 h-10 w-10 rounded-full border-2 border-mango/70" initial={{ scale: .2, opacity: 1 }} animate={{ scale: 4.8, opacity: 0 }} transition={{ duration: .65, ease: [0.16, 1, .3, 1] }} />
          {Array.from({ length: BURST_PARTICLES }, (_, i) => { const angle = (Math.PI * 2 * i) / BURST_PARTICLES; const distance = 42 + (i % 3) * 17; return <motion.span key={i} className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-mango shadow-[0_0_12px_rgba(245,166,35,.75)]" initial={{ x: 0, y: 0, scale: 1, opacity: 1 }} animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, scale: 0, opacity: 0 }} transition={{ duration: .55 + (i % 4) * .05, ease: 'easeOut' }} /> })}
        </motion.div>)}
      </AnimatePresence>
      <motion.div className="pointer-events-none fixed left-0 right-0 top-0 z-[80] h-1 origin-left bg-gradient-to-r from-mango via-ember to-leaf shadow-[0_0_14px_rgba(245,166,35,.55)]" style={{ scaleX: scroll }} />
      <motion.div key={location.pathname} initial={{ opacity: 0, scale: 1.015, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ duration: .55, ease: [0.22, 1, .36, 1] }} className="pointer-events-none fixed inset-0 z-50 bg-mango/0" />
    </>
  )
}
