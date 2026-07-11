const TONES = {
  error: { background: 'var(--danger-light)', color: 'var(--danger)', icon: '⚠️' },
  success: { background: 'var(--success-light)', color: 'var(--success)', icon: '✅' },
  info: { background: 'var(--info-light)', color: 'var(--info)', icon: 'ℹ️' },
}

export default function Alert({ tone = 'info', children }) {
  if (!children) return null
  const t = TONES[tone]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
      borderRadius: 'var(--radius-sm)', background: t.background, color: t.color,
      fontSize: 14, fontWeight: 500, marginBottom: 16,
    }}>
      <span>{t.icon}</span>
      <span>{children}</span>
    </div>
  )
}
