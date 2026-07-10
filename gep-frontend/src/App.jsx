import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import AppRouter from './routes/AppRouter'
import Module33Router from './routes/Module33Router'
import Module34Router from './routes/Module34Router'
import Module35Router from './routes/Module35Router'
import Module36Router from './routes/Module36Router'
import NotesRouter from './routes/NotesRouter'
import DisciplineRouter from './routes/DisciplineRouter'
import EnseignantRouter from './routes/EnseignantRouter'
import ParentRouter from './routes/ParentRouter'
import ProtectedRoute from './routes/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { ROLES } from './config/navigation'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* /admin/* héberge aussi Examens (Administrateur+Enseignant) et Annonces (+Parent) ;
            le contrôle fin par page est fait à l'intérieur d'AppRouter. */}
        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT]}><AppRouter /></ProtectedRoute>} />
        <Route path="/eleves/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.ENSEIGNANT]}><Module33Router /></ProtectedRoute>} />
        <Route path="/ps/module-3-3/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.ENSEIGNANT]}><Module33Router /></ProtectedRoute>} />
        <Route path="/inscriptions/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR]}><Module34Router /></ProtectedRoute>} />
        <Route path="/ps/module-3-4/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR]}><Module34Router /></ProtectedRoute>} />
        <Route path="/classes/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT]}><Module35Router /></ProtectedRoute>} />
        <Route path="/ps/module-3-5/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT]}><Module35Router /></ProtectedRoute>} />
        <Route path="/paiements/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR, ROLES.COMPTABLE]}><Module36Router /></ProtectedRoute>} />
        <Route path="/ps/module-3-6/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR, ROLES.COMPTABLE]}><Module36Router /></ProtectedRoute>} />
        <Route path="/notes/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT]}><NotesRouter /></ProtectedRoute>} />
        <Route path="/discipline/*" element={<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATEUR]}><DisciplineRouter /></ProtectedRoute>} />
        <Route path="/enseignant/*" element={<ProtectedRoute allowedRoles={[ROLES.ENSEIGNANT]}><EnseignantRouter /></ProtectedRoute>} />
        <Route path="/parent/*" element={<ProtectedRoute allowedRoles={[ROLES.PARENT]}><ParentRouter /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
