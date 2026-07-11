export default function BrandLogo({ size = 38 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 12,
        background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontFamily: 'var(--font)', fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      GN
    </div>
  )
}
