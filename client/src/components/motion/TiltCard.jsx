import { cn } from '../../lib/utils'

// Static, accessible card. No pointer tracking or transform work.
export function TiltCard({ children, className = '' }) {
  return <div className={cn('rounded-xl border border-ink/10 bg-card shadow-sm', className)}>{children}</div>
}
