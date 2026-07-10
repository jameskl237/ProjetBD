import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { ROLES } from '../config/navigation'
import NotesLayout from '../pages/notes/NotesLayout'
import NotesSaisie from '../pages/notes/NotesSaisie'
import NotesConsulter from '../pages/notes/NotesConsulter'
import Moyennes from '../pages/notes/Moyennes'
import Bulletins from '../pages/notes/Bulletins'

export default function NotesRouter() {
  return (
    <Routes>
      <Route element={<NotesLayout />}>
        {/* Saisie des notes : privilège enseignant uniquement — l'administrateur ne peut pas entrer de notes (spec RBAC). */}
        <Route index element={<ProtectedRoute allowedRoles={[ROLES.ENSEIGNANT]}><NotesSaisie /></ProtectedRoute>} />
        <Route path="consulter" element={<NotesConsulter />} />
        <Route path="moyennes" element={<Moyennes />} />
        <Route path="bulletins" element={<Bulletins />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  )
}
