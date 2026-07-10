import { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import BrandLogo from '../ui/BrandLogo'
import { AuthContext } from '../../context/AuthContext'
import { getNavForRole, getRoleKey } from '../../config/navigation'
import './AdminSidebar.css'

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const roleKey = getRoleKey(user)
  const nav = getNavForRole(roleKey)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandLogo />
        <div>
          <div className="brand-name"><span className="brand-name-main">GEP</span> <span className="brand-name-accent">Nebular</span></div>
          <div className="brand-role">{user?.role || 'Administrateur'}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
