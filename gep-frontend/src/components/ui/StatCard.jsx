import './StatCard.css'

export default function StatCard({ label, value, color, icon }) {
  const colors = {
    purple: { bg: 'var(--accent)' },
    cyan:   { bg: 'var(--cyan)' },
    green:  { bg: 'var(--success)' },
    orange: { bg: 'var(--warning)' },
  }
  const c = colors[color] || colors.purple
  const emoji = icon || '✨'

  return (
    <div className="stat-card card">
      <div className="stat-info">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
      <div className="stat-icon" style={{ background: c.bg }}>
        <span>{emoji}</span>
      </div>
    </div>
  )
}
