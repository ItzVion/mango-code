// Keep the existing component API while rendering children without per-item motion wrappers.
export function AnimatedGroup({ children, className = '' }) {
  return <div className={className}>{children}</div>
}
