import { Routes, Route, Navigate } from 'react-router-dom'
import AdminSidebar from '../components/layout/AdminSidebar'
import ProtectedRoute from './ProtectedRoute'
import { ROLES } from '../config/navigation'
import Dashboard from '../pages/administration/Dashboard'
import Enseignants from '../pages/administration/Enseignants'
import Parents from '../pages/administration/Parents'
import Compte from '../pages/administration/Compte'
import Examens from '../pages/administration/Examens'
import AbsencesAdmin from '../pages/administration/Absences'
import Salles from '../pages/administration/Salles'
import Transport from '../pages/transport/Transport'
import Annonces from '../pages/administration/Annonces'
import Parametres from '../pages/administration/Parametres'
import Sauvegardes from '../pages/administration/Sauvegardes'

const ONLY_ADMIN = [ROLES.ADMINISTRATEUR]
const ADMIN_ET_ENSEIGNANT = [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT]
const ANNONCES_ROLES = [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT]

export default function AppRouter() {
  return (
    <div className="app-layout">
      <AdminSidebar />
      <main className="main-content">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><Dashboard /></ProtectedRoute>} />
          <Route path="eleves" element={<Navigate to="/eleves" replace />} />
          <Route path="enseignants" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><Enseignants /></ProtectedRoute>} />
          <Route path="parents" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><Parents /></ProtectedRoute>} />
          <Route path="compte" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><Compte /></ProtectedRoute>} />
          <Route path="classes" element={<Navigate to="/classes" replace />} />
          <Route path="examens" element={<ProtectedRoute allowedRoles={ADMIN_ET_ENSEIGNANT}><Examens /></ProtectedRoute>} />
          <Route path="absences" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><AbsencesAdmin /></ProtectedRoute>} />
          <Route path="salles" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><Salles /></ProtectedRoute>} />
          <Route path="notes" element={<Navigate to="/notes" replace />} />
          <Route path="discipline" element={<Navigate to="/discipline" replace />} />
          <Route path="transport" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><Transport /></ProtectedRoute>} />
          <Route path="annonces" element={<ProtectedRoute allowedRoles={ANNONCES_ROLES}><Annonces /></ProtectedRoute>} />
          <Route path="parametres" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><Parametres /></ProtectedRoute>} />
          <Route path="sauvegardes" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><Sauvegardes /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
