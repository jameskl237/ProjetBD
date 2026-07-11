export default function EmptyState({ icon = '📭', title = 'Aucune donnée', subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, marginTop: 4 }}>{subtitle}</div>}
    </div>
  )
}
