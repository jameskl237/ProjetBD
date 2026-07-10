import { NavLink, Outlet } from 'react-router-dom'
import './disciplineLayout.css'

const NAV = [
  { to: '/discipline', label: 'Incidents', end: true },
  { to: '/discipline/sanctions', label: 'Sanctions' },
]

export default function DisciplineLayout() {
  return (
    <div className="discipline-shell">
      <div className="discipline-shell-top">
        <div>
          <div className="discipline-shell-eyebrow">Module Discipline</div>
          <h1 className="discipline-shell-title">Suivi disciplinaire</h1>
        </div>
        <NavLink to="/admin/dashboard" className="discipline-shell-back">
          ← Retour admin
        </NavLink>
      </div>

      <nav className="discipline-shell-nav">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `discipline-shell-nav-item${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="discipline-shell-content">
        <Outlet />
      </div>
    </div>
  )
}
