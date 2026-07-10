import { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { module36NavGroups } from './module36Data'
import UserMenu from '../../components/layout/UserMenu'
import { AuthContext } from '../../context/AuthContext'
import { getNavForRole, getRoleKey } from '../../config/navigation'
import './module36.css'

export default function Module36Layout({ children }) {
  const { user } = useContext(AuthContext)
  const roleKey = getRoleKey(user)
  const navGroups = [
    ...module36NavGroups,
    { label: 'Autres modules', items: getNavForRole(roleKey).filter(item => item.to !== '/paiements') },
  ]

  return (
    <div className="module36-shell">
      <aside className="module36-sidebar">
        <div className="module36-logo">
          <div className="module36-brand-icon">🎓</div>
          <div>
            <div className="module36-brand-name">EcolePro</div>
            <div className="module36-brand-role">{user?.role || 'Espace Secrétaire'}</div>
          </div>
        </div>

        <nav className="module36-nav">
          {navGroups.map(group => (
            <div key={group.label} className="module36-nav-group">
              <div className="module36-nav-label">{group.label}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `module36-nav-link${isActive ? ' active' : ''}`}
                >
                  <span className="module36-nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="module36-main">
        <header className="module36-topbar">
          <button type="button" className="module36-menu-btn" aria-label="Menu">☰</button>
          <div className="module36-search-wrap">
            <span className="module36-search-icon">🔍</span>
            <input
              className="module36-search-input"
              placeholder="Rechercher un élève, une facture..."
            />
          </div>
          <div className="module36-top-actions">
            <div className="module36-notif">
              <span>🔔</span>
              <span className="module36-notif-dot" />
            </div>
            <UserMenu />
          </div>
        </header>

        <main className="module36-content">{children}</main>
      </div>
    </div>
  )
}
