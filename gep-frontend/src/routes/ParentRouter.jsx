import { Routes, Route, Navigate } from 'react-router-dom'
import AdminSidebar from '../components/layout/AdminSidebar'
import ParentDashboard from '../pages/parent/ParentDashboard'
import ParentNotes from '../pages/parent/Notes'
import ParentAbsences from '../pages/parent/Absences'
import ParentEmploiDuTemps from '../pages/parent/EmploiDuTemps'
import ParentTransport from '../pages/parent/Transport'

export default function ParentRouter() {
  return (
    <div className="app-layout">
      <AdminSidebar />
      <main className="main-content">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="notes" element={<ParentNotes />} />
          <Route path="absences" element={<ParentAbsences />} />
          <Route path="emploi-du-temps" element={<ParentEmploiDuTemps />} />
          <Route path="transport" element={<ParentTransport />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
