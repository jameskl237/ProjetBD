import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLE_LABELS } from '../../config/navigation'

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const roleKey = getRoleKey(user)
  const displayName = user?.nom || user?.login || 'Utilisateur'
  const initials = displayName.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div>
        {title && <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>}
        {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{subtitle}</div>}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-light)',
            color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13,
          }}>
            {initials || '?'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{user?.role || ROLE_LABELS[roleKey]}</div>
          </div>
        </button>

        {open && (
          <div style={{
            position: 'absolute', right: 0, top: '110%', background: '#fff',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)', minWidth: 180, overflow: 'hidden',
          }}>
            <a href="/compte" style={{ display: 'block', padding: '10px 14px', fontSize: 13.5 }}>Mon compte</a>
          </div>
        )}
      </div>
    </header>
  )
}
