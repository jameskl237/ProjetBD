import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

// Layout unique pour toute l'app authentifiée : Sidebar montée une seule fois,
// et chaque route enfant est rendue dans <Outlet/>. Corrige l'anomalie du
// frontend précédent où chaque module remontait sa propre barre latérale.
export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
