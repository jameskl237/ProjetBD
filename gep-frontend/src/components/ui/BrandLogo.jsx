export default function BrandLogo({ size = 38, radius = 10, fontSize = 16, shadow = '0 10px 25px rgba(22, 119, 255, 0.35)' }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: '#1677ff',
        display: 'grid',
        placeItems: 'center',
        boxShadow: shadow,
        flexShrink: 0,
      }}
    >
      <span style={{ color: '#fff', fontWeight: 900, fontSize, lineHeight: 1 }}>G</span>
    </div>
  )
}