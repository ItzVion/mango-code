import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'motion/react'

// Counts up to `value` when it mounts / changes
export function AnimatedCounter({ value, suffix = '', className = '' }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v))
  const ref = useRef(null)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
    })
    return controls.stop
  }, [value])

  useEffect(() => {
    return rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = v + suffix
    })
  }, [rounded, suffix])

  return (
    <motion.span ref={ref} className={className}>
      0{suffix}
    </motion.span>
  )
}
