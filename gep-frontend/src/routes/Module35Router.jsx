import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { ROLES } from '../config/navigation'
import ClasseIndex from '../pages/classes/ClasseIndex'
import ClasseCreate from '../pages/classes/ClasseCreate'
import ClasseShow from '../pages/classes/ClasseShow'
import ClasseEdit from '../pages/classes/ClasseEdit'
import Affecter from '../pages/classes/Affecter'
import AffecterEnseignant from '../pages/classes/AffecterEnseignant'

const ONLY_ADMIN = [ROLES.ADMINISTRATEUR]

export default function Module35Router() {
  return (
    <Routes>
      <Route index element={<ClasseIndex />} />
      <Route path="create" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><ClasseCreate /></ProtectedRoute>} />
      <Route path="show/:id" element={<ClasseShow />} />
      <Route path="show" element={<ClasseShow />} />
      <Route path="edit/:id" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><ClasseEdit /></ProtectedRoute>} />
      <Route path="edit" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><ClasseEdit /></ProtectedRoute>} />
      <Route path="affecter" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><Affecter /></ProtectedRoute>} />
      <Route path="affecter-enseignant" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><AffecterEnseignant /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  )
}
