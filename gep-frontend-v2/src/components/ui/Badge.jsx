const TONES = {
  success: { background: 'var(--success-light)', color: 'var(--success)' },
  danger: { background: 'var(--danger-light)', color: 'var(--danger)' },
  warning: { background: 'var(--warning-light)', color: 'var(--warning)' },
  info: { background: 'var(--info-light)', color: 'var(--info)' },
  neutral: { background: 'var(--border-light)', color: 'var(--text-secondary)' },
}

export default function Badge({ tone = 'neutral', children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 10px',
      borderRadius: 999, fontSize: 12, fontWeight: 600, ...TONES[tone],
    }}>
      {children}
    </span>
  )
}
