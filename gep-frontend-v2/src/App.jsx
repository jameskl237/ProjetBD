import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ROLES } from './config/navigation'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

import Home from './pages/Home'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'

import EleveIndex from './pages/eleves/EleveIndex'
import EleveShow from './pages/eleves/EleveShow'
import EleveForm from './pages/eleves/EleveForm'

import ClasseIndex from './pages/classes/ClasseIndex'
import ClasseShow from './pages/classes/ClasseShow'
import ClasseForm from './pages/classes/ClasseForm'
import Salles from './pages/classes/Salles'

import Cours from './pages/cours/Cours'
import EmploiDuTemps from './pages/cours/EmploiDuTemps'
import Enseignants from './pages/enseignants/Enseignants'

import Examens from './pages/evaluations/Examens'
import Notes from './pages/evaluations/Notes'
import Bulletins from './pages/evaluations/Bulletins'

import Scolarite from './pages/scolarite/Scolarite'

import Paiements from './pages/paiements/Paiements'

import Parents from './pages/parents/Parents'
import Discipline from './pages/discipline/Discipline'

import Annonces from './pages/messages/Annonces'
import Quartiers from './pages/quartiers/Quartiers'
import Livres from './pages/livres/Livres'
import Absences from './pages/absences/Absences'
import Transport from './pages/transport/Transport'

import Personnes from './pages/personnes/Personnes'
import Compte from './pages/personnes/Compte'

import EnseignantDashboard from './pages/enseignant/EnseignantDashboard'

import ParentDashboard from './pages/parent/ParentDashboard'
import ParentNotes from './pages/parent/Notes'
import ParentAbsences from './pages/parent/Absences'
import ParentEmploiDuTemps from './pages/parent/EmploiDuTemps'
import ParentTransport from './pages/parent/Transport'
import ParentPaiements from './pages/parent/Paiements'

const ADMIN = [ROLES.ADMINISTRATEUR]
const SEC = [ROLES.SECRETAIRE]
const ADMIN_SEC = [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE]
const ADMIN_COMPTABLE = [ROLES.ADMINISTRATEUR, ROLES.COMPTABLE]
const ADMIN_SEC_COMPTABLE = [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.COMPTABLE]
const ADMIN_SEC_ENSEIGNANT = [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.ENSEIGNANT]
const ANNONCES_ROLES = [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.ENSEIGNANT, ROLES.PARENT]
const ALL_ROLES = [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.COMPTABLE, ROLES.ENSEIGNANT, ROLES.PARENT]
const COMPTABLE = [ROLES.COMPTABLE]
const ENSEIGNANT = [ROLES.ENSEIGNANT]
const PARENT = [ROLES.PARENT]

function guarded(roles, element) {
  return <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute allowedRoles={ALL_ROLES}><AppLayout /></ProtectedRoute>}>

            {/* ─── Tableaux de bord ─── */}
            <Route path="/dashboard" element={guarded(ADMIN_SEC, <Dashboard />)} />
            <Route path="/enseignant" element={guarded(ENSEIGNANT, <EnseignantDashboard />)} />
            <Route path="/parent" element={guarded(PARENT, <ParentDashboard />)} />

            {/* ─── Élèves ─── */}
            <Route path="/eleves" element={guarded(ADMIN_SEC_COMPTABLE, <EleveIndex />)} />
            <Route path="/eleves/nouveau" element={guarded(ADMIN, <EleveForm />)} />
            <Route path="/eleves/:id" element={guarded(ADMIN_SEC_COMPTABLE, <EleveShow />)} />
            <Route path="/eleves/:id/modifier" element={guarded(ADMIN, <EleveForm />)} />

            {/* ─── Classes / Salles ─── */}
            <Route path="/classes" element={guarded(ADMIN_SEC_ENSEIGNANT, <ClasseIndex />)} />
            <Route path="/classes/nouvelle" element={guarded(ADMIN, <ClasseForm />)} />
            <Route path="/classes/:id" element={guarded(ADMIN_SEC_ENSEIGNANT, <ClasseShow />)} />
            <Route path="/classes/:id/modifier" element={guarded(ADMIN, <ClasseForm />)} />
            <Route path="/salles" element={guarded(ADMIN, <Salles />)} />

            {/* ─── Cours / Enseignants / Emploi du temps ─── */}
            <Route path="/cours" element={guarded(ADMIN_SEC, <Cours />)} />
            <Route path="/emploi-du-temps" element={guarded(ADMIN_SEC_ENSEIGNANT, <EmploiDuTemps />)} />
            <Route path="/enseignants" element={guarded(ADMIN_SEC, <Enseignants />)} />

            {/* ─── Examens / Notes / Bulletins ─── */}
            <Route path="/examens" element={guarded(ADMIN_SEC_ENSEIGNANT, <Examens />)} />
            <Route path="/notes" element={guarded(ADMIN_SEC_ENSEIGNANT, <Notes />)} />
            <Route path="/bulletins" element={guarded(ADMIN_SEC, <Bulletins />)} />

            {/* ─── Scolarité ─── */}
            <Route path="/scolarite" element={guarded(ADMIN_SEC, <Scolarite />)} />

            {/* ─── Paiements ─── */}
            <Route path="/paiements" element={guarded(ADMIN_SEC_COMPTABLE, <Paiements />)} />

            {/* ─── Parents / Personnel / Discipline ─── */}
            <Route path="/parents" element={guarded(ADMIN_SEC, <Parents />)} />
            <Route path="/personnes" element={guarded(ADMIN_SEC, <Personnes />)} />
            <Route path="/discipline" element={guarded(ADMIN_SEC, <Discipline />)} />

            {/* ─── Transport / Quartiers / Bibliothèque ─── */}
            <Route path="/transport" element={guarded(ADMIN_SEC, <Transport />)} />
            <Route path="/quartiers" element={guarded(ADMIN_SEC, <Quartiers />)} />
            <Route path="/bibliotheque" element={guarded(ADMIN, <Livres />)} />

            {/* ─── Annonces ─── */}
            <Route path="/annonces" element={guarded(ANNONCES_ROLES, <Annonces />)} />

            {/* ─── Mon compte ─── */}
            <Route path="/compte" element={guarded(ALL_ROLES, <Compte />)} />

            {/* ─── Espace Parent ─── */}
            <Route path="/parent/notes" element={guarded(PARENT, <ParentNotes />)} />
            <Route path="/parent/absences" element={guarded(PARENT, <ParentAbsences />)} />
            <Route path="/parent/emploi-du-temps" element={guarded(PARENT, <ParentEmploiDuTemps />)} />
            <Route path="/parent/transport" element={guarded(PARENT, <ParentTransport />)} />
            <Route path="/parent/paiements" element={guarded(PARENT, <ParentPaiements />)} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
