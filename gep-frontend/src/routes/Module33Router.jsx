import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { ROLES } from '../config/navigation'
import EleveIndex from '../pages/eleves/EleveIndex'
import EleveShow from '../pages/eleves/EleveShow'
import EleveCreate from '../pages/eleves/EleveCreate'
import EleveEdit from '../pages/eleves/EleveEdit'
import EleveDelete from '../pages/eleves/EleveDelete'
import EleveSearch from '../pages/eleves/EleveSearch'

const ONLY_ADMIN = [ROLES.ADMINISTRATEUR]

export default function Module33Router() {
  return (
    <Routes>
      <Route index element={<EleveIndex />} />
      <Route path="create" element={<Navigate to="/eleves" replace />} />
      <Route path="show/:id" element={<EleveShow />} />
      <Route path="edit/:id" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><EleveEdit /></ProtectedRoute>} />
      <Route path="delete/:id" element={<ProtectedRoute allowedRoles={ONLY_ADMIN}><EleveDelete /></ProtectedRoute>} />
      <Route path="search" element={<EleveSearch />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  )
}
