export default function Card({ children, className = '', style, ...props }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: 22, ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
