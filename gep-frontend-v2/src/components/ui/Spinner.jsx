export default function Spinner({ label = 'Chargement…' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      {label}
    </div>
  )
}
