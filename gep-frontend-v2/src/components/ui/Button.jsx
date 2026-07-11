const VARIANTS = {
  primary: { background: 'var(--accent)', color: '#fff' },
  secondary: { background: 'var(--border-light)', color: 'var(--text-primary)' },
  danger: { background: 'var(--danger)', color: '#fff' },
  ghost: { background: 'transparent', color: 'var(--text-secondary)' },
}

export default function Button({ variant = 'primary', children, className = '', style, ...props }) {
  return (
    <button
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '10px 18px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600,
        transition: 'opacity .15s ease', ...VARIANTS[variant], ...style,
      }}
      onMouseDown={(e) => { e.currentTarget.style.opacity = '0.85' }}
      onMouseUp={(e) => { e.currentTarget.style.opacity = '1' }}
      {...props}
    >
      {children}
    </button>
  )
}
