import { Navigate, Route, Routes } from 'react-router-dom'
import DisciplineLayout from '../pages/discipline/DisciplineLayout'
import IncidentsList from '../pages/discipline/IncidentsList'
import SanctionsList from '../pages/discipline/SanctionsList'

export default function DisciplineRouter() {
  return (
    <Routes>
      <Route element={<DisciplineLayout />}>
        <Route index element={<IncidentsList />} />
        <Route path="incidents" element={<IncidentsList />} />
        <Route path="sanctions" element={<SanctionsList />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  )
}
