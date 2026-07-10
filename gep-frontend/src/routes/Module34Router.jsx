import { Navigate, Route, Routes } from 'react-router-dom'
import InscriptionList from '../pages/inscriptions/InscriptionList'
import InscriptionCreate from '../pages/inscriptions/InscriptionCreate'
import InscriptionShow from '../pages/inscriptions/InscriptionShow'
import InscriptionCloturer from '../pages/inscriptions/InscriptionCloturer'

export default function Module34Router() {
  return (
    <Routes>
      <Route index element={<InscriptionList />} />
      <Route path="create" element={<InscriptionCreate />} />
      <Route path="show/:id" element={<InscriptionShow />} />
      <Route path="show" element={<InscriptionShow />} />
      <Route path="cloturer/:id" element={<InscriptionCloturer />} />
      <Route path="cloturer" element={<InscriptionCloturer />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  )
}
