import { NavLink, Outlet } from 'react-router-dom'
import './notesLayout.css'

const NAV = [
  { to: '/notes', label: 'Saisie des notes', end: true },
  { to: '/notes/consulter', label: 'Consulter' },
  { to: '/notes/moyennes', label: 'Moyennes' },
  { to: '/notes/bulletins', label: 'Bulletins' },
]

export default function NotesLayout() {
  return (
    <div className="notes-shell">
      <div className="notes-shell-top">
        <div>
          <div className="notes-shell-eyebrow">Module Notes</div>
          <h1 className="notes-shell-title">Gestion des notes</h1>
        </div>
        <NavLink to="/admin/dashboard" className="notes-shell-back">
          ← Retour admin
        </NavLink>
      </div>

      <nav className="notes-shell-nav">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `notes-shell-nav-item${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="notes-shell-content">
        <Outlet />
      </div>
    </div>
  )
}
