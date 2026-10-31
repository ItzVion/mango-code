// Numeric information appears immediately; do not animate numbers on every render.
export function AnimatedCounter({ value, suffix = '', className = '' }) {
  return <span className={className}>{Number(value) || 0}{suffix}</span>
}
