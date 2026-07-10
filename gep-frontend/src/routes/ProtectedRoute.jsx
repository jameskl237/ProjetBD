import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { getRoleKey, getDashboardPath } from '../config/navigation'

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { isAuthenticated, user, isLoading } = useContext(AuthContext)
  const location = useLocation()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div>Chargement...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const roleKey = getRoleKey(user)

  // Bloque réellement l'accès à la page (pas seulement le lien du menu) si le rôle
  // de l'utilisateur ne fait pas partie de ceux autorisés pour cette route.
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(roleKey)) {
    return <Navigate to={getDashboardPath(roleKey)} replace />
  }

  return children
}
