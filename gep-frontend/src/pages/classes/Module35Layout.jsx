import { useContext } from 'react'
import { Link, NavLink } from 'react-router-dom'
import BrandLogo from '../../components/ui/BrandLogo'
import UserMenu from '../../components/layout/UserMenu'
import { AuthContext } from '../../context/AuthContext'
import { getNavForRole, getRoleKey } from '../../config/navigation'
import './module35.css'

function buildNavGroups(roleKey) {
  return [
    {
      label: 'Principal',
      items: [
        { label: 'Classes', icon: '🏫', to: '/classes' },
        { label: 'Nouvelle classe', icon: '＋', to: '/classes/create' },
      ],
    },
    {
      label: 'Autres modules',
      items: getNavForRole(roleKey).filter(item => item.to !== '/classes'),
    },
  ]
}

function renderBreadcrumb(breadcrumb) {
  if (!breadcrumb?.length) return null

  return breadcrumb.map((part, index) => (
    <span key={`${part}-${index}`}>
      {index > 0 ? <span> &rsaquo; </span> : null}
      {index === breadcrumb.length - 1 ? <strong>{part}</strong> : part}
    </span>
  ))
}

export default function Module35Layout({ breadcrumb, backTo, children }) {
  const { user } = useContext(AuthContext)
  const roleKey = getRoleKey(user)
  const navGroups = buildNavGroups(roleKey)

  return (
    <div className="module35-shell">
      <aside className="module35-sidebar">
        <div className="module35-logo">
          <BrandLogo size={36} radius={10} fontSize={15} />
          <div>
            <div className="module35-brand-name"><span className="module35-brand-main">GEP</span> <span className="module35-brand-accent">Nebular</span></div>
            <div className="module35-brand-role">Module 3.5</div>
          </div>
        </div>

        {navGroups.map(group => (
          <div key={group.label} className="module35-nav-group">
            <div className="module35-nav-label">{group.label}</div>
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `module35-nav-link${isActive ? ' active' : ''}`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </aside>

      <div className="module35-main">
        <header className="module35-topbar">
          {backTo ? (
            <Link className="module35-back-btn" to={backTo}>
              ← Retour
            </Link>
          ) : null}
          <div className="module35-breadcrumb">{renderBreadcrumb(breadcrumb)}</div>
          <div className="module35-top-actions">
            <UserMenu />
          </div>
        </header>

        <main className="module35-content">{children}</main>
      </div>
    </div>
  )
}
