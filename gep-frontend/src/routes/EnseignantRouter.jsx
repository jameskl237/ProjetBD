import { Routes, Route, Navigate } from 'react-router-dom'
import AdminSidebar from '../components/layout/AdminSidebar'
import EnseignantDashboard from '../pages/enseignant/EnseignantDashboard'
import AbsencesSaisie from '../pages/enseignant/AbsencesSaisie'
import EnseignantCompte from '../pages/enseignant/EnseignantCompte'

export default function EnseignantRouter() {
  return (
    <div className="app-layout">
      <AdminSidebar />
      <main className="main-content">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EnseignantDashboard />} />
          <Route path="absences" element={<AbsencesSaisie />} />
          <Route path="compte" element={<EnseignantCompte />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
