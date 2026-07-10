export default function FormError({ error }) {
  if (!error) return null
  return (
    <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 14 }}>
      {error}
    </div>
  )
}
