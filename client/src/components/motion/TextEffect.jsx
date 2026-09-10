import { motion } from 'motion/react'

// Word-by-word reveal, Motion Primitives style
export function TextEffect({ children, as: Tag = 'div', className = '', delay = 0, stagger = 0.05 }) {
  const words = String(children).split(' ')
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: delay + i * stagger,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
