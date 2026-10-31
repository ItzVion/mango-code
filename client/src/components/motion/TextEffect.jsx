// Text is rendered immediately: reading content should never wait for an animation.
export function TextEffect({ children, as: Tag = 'div', className = '' }) {
  return <Tag className={className}>{children}</Tag>
}
