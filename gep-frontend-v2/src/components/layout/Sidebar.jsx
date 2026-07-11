import { NavLink, useNavigate } from 'react-router-dom'
import BrandLogo from '../ui/BrandLogo'
import { useAuth } from '../../hooks/useAuth'
import { getNavForRole, getRoleKey, ROLE_LABELS } from '../../config/navigation'

// LA seule et unique Sidebar de l'application. Toute page authentifiée est
// rendue par <AppLayout>, qui monte ce composant une fois pour de bon —
// aucune page ni module ne doit plus définir sa propre barre latérale.
export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const roleKey = getRoleKey(user)
  const nav = getNavForRole(roleKey)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 'var(--sidebar-width)',
      background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column',
      padding: '22px 14px', zIndex: 40, overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 22px' }}>
        <BrandLogo />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font)', fontWeight: 800, color: '#fff', fontSize: 15 }}>
            GEP <span style={{ color: 'var(--cyan)' }}>Nebula</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
            {user?.role || ROLE_LABELS[roleKey] || ''}
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 'var(--radius-sm)', fontSize: 13.5, fontWeight: 500,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              background: isActive ? 'var(--accent)' : 'transparent',
            })}
          >
            <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          borderRadius: 'var(--radius-sm)', color: 'rgba(255,255,255,0.65)', fontSize: 13.5,
          fontWeight: 500, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16,
        }}
      >
        <span style={{ width: 18, textAlign: 'center' }}>🚪</span>
        Déconnexion
      </button>
    </aside>
  )
}
