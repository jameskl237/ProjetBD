import { useContext } from 'react'
import { NavLink, Link } from 'react-router-dom'
import BrandLogo from '../../components/ui/BrandLogo'
import UserMenu from '../../components/layout/UserMenu'
import { AuthContext } from '../../context/AuthContext'
import { getNavForRole, getRoleKey } from '../../config/navigation'
import './module33.css'

function buildNavGroups(roleKey) {
  return [
    {
      label: 'Principal',
      items: [
        { label: 'Élèves', icon: '👦', to: '/eleves' },
        { label: 'Nouvel élève', icon: '＋', to: '/eleves/create' },
      ],
    },
    {
      label: 'Autres modules',
      items: getNavForRole(roleKey).filter(item => item.to !== '/eleves'),
    },
  ]
}

function renderBreadcrumb(breadcrumb) {
  if (!breadcrumb || breadcrumb.length === 0) return null

  return breadcrumb.map((part, index) => (
    <span key={`${part}-${index}`}>
      {index > 0 ? <span> &rsaquo; </span> : null}
      {index === breadcrumb.length - 1 ? <strong>{part}</strong> : part}
    </span>
  ))
}

export default function Module33Layout({ breadcrumb, backTo, children }) {
  const { user } = useContext(AuthContext)
  const roleKey = getRoleKey(user)
  const navGroups = buildNavGroups(roleKey)

  return (
    <div className="module33-shell">
      <aside className="module33-sidebar">
        <div className="module33-logo">
          <BrandLogo size={36} radius={10} fontSize={15} />
          <div>
            <div className="module33-brand-name"><span className="module33-brand-main">GEP</span> <span className="module33-brand-accent">Nebular</span></div>
            <div className="module33-brand-role">Module 3.3</div>
          </div>
        </div>

        {navGroups.map(group => (
          <div key={group.label} className="module33-nav-group">
            <div className="module33-nav-label">{group.label}</div>
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `module33-nav-link${isActive ? ' active' : ''}`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </aside>

      <div className="module33-main">
        <header className="module33-topbar">
          {backTo ? (
            <Link className="module33-back-btn" to={backTo}>
              ← Retour
            </Link>
          ) : null}
          <div className="module33-breadcrumb">{renderBreadcrumb(breadcrumb)}</div>
          <div className="module33-top-actions">
            <UserMenu />
          </div>
        </header>

        <main className="module33-content">{children}</main>
      </div>
    </div>
  )
}
