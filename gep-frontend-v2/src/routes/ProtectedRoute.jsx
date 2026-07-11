import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getRoleKey } from '../config/navigation'
import Spinner from '../components/ui/Spinner'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return <div style={{ padding: 48 }}><Spinner label="Vérification de la session…" /></div>
  if (!user) return <Navigate to="/login" replace />

  const roleKey = getRoleKey(user)
  if (allowedRoles && !allowedRoles.includes(roleKey)) {
    return <Navigate to="/" replace />
  }

  return children
}
