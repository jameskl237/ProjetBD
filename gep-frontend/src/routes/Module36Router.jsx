import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { ROLES } from '../config/navigation'
import PaiementDashboard from '../pages/paiements/PaiementDashboard'
import PaiementCreate from '../pages/paiements/PaiementCreate'
import Factures from '../pages/paiements/Factures'
import Historique from '../pages/paiements/Historique'
import Impayes from '../pages/paiements/Impayes'
import PaiementList from '../pages/paiements/PaiementList'
import Bulletin from '../pages/paiements/exports/Bulletin'
import ExportExcel from '../pages/paiements/exports/ExportExcel'
import ExportFacture from '../pages/paiements/exports/ExportFacture'
import FicheEleve from '../pages/paiements/exports/FicheEleve'
import ListeClasse from '../pages/paiements/exports/ListeClasse'

export default function Module36Router() {
  return (
    <Routes>
      <Route index element={<PaiementDashboard />} />
      <Route path="liste" element={<PaiementList />} />
      <Route path="create" element={<ProtectedRoute allowedRoles={[ROLES.COMPTABLE]}><PaiementCreate /></ProtectedRoute>} />
      <Route path="impayes" element={<Impayes />} />
      <Route path="historique" element={<Historique />} />
      <Route path="factures" element={<Factures />} />
      <Route path="factures/:id" element={<Factures />} />
      <Route path="exports/liste-classe" element={<ListeClasse />} />
      <Route path="exports/bulletin" element={<Bulletin />} />
      <Route path="exports/facture" element={<ExportFacture />} />
      <Route path="exports/fiche-eleve" element={<FicheEleve />} />
      <Route path="exports/excel" element={<ExportExcel />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  )
}
