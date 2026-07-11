export default function BrandLogo({ size = 38, radius, fontSize, shadow }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? 12,
        background: shadow ? '#1677ff' : 'linear-gradient(135deg, var(--accent), var(--cyan))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 900,
        fontFamily: 'var(--font)',
        fontSize: fontSize ?? size * 0.42,
        boxShadow: shadow ?? '0 10px 25px rgba(22, 119, 255, 0.35)',
        flexShrink: 0,
      }}
    >
      G
    </div>
  )
}
