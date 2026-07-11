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

import Annees from './pages/annees/Annees'
import Inscriptions from './pages/annees/Inscriptions'

import Cours from './pages/cours/Cours'
import EmploiDuTemps from './pages/cours/EmploiDuTemps'
import Enseignants from './pages/enseignants/Enseignants'

import Examens from './pages/evaluations/Examens'
import Notes from './pages/evaluations/Notes'

import Cycles from './pages/scolarite/Cycles'
import Scolarite from './pages/scolarite/Scolarite'

import Paiements from './pages/paiements/Paiements'
import Modes from './pages/paiements/Modes'

import Parents from './pages/parents/Parents'
import Discipline from './pages/discipline/Discipline'

import Annonces from './pages/messages/Annonces'
import Quartiers from './pages/quartiers/Quartiers'
import Livres from './pages/livres/Livres'
import Absences from './pages/absences/Absences'
import Transport from './pages/transport/Transport'

import Personnes from './pages/personnes/Personnes'
import Compte from './pages/personnes/Compte'
import Comptes from './pages/admin/Comptes'

import EnseignantDashboard from './pages/enseignant/EnseignantDashboard'

import ParentDashboard from './pages/parent/ParentDashboard'
import ParentNotes from './pages/parent/Notes'
import ParentAbsences from './pages/parent/Absences'
import ParentEmploiDuTemps from './pages/parent/EmploiDuTemps'
import ParentTransport from './pages/parent/Transport'
import ParentPaiements from './pages/parent/Paiements'

const ADMIN = [ROLES.ADMINISTRATEUR]
const ADMIN_COMPTABLE = [ROLES.ADMINISTRATEUR, ROLES.COMPTABLE]
const ADMIN_ENSEIGNANT = [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT]
const ADMIN_COMPTABLE_ENSEIGNANT = [ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.ENSEIGNANT]
const ANNONCES_ROLES = [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT]
const ALL_ROLES = [ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.ENSEIGNANT, ROLES.PARENT]
const COMPTABLE = [ROLES.COMPTABLE]
const ENSEIGNANT = [ROLES.ENSEIGNANT]
const PARENT = [ROLES.PARENT]

function guarded(roles, element) {
  return <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
}

// Arbre de routes UNIQUE pour toute l'application authentifiée : une seule
// <AppLayout> (donc une seule Sidebar) englobe toutes les pages, chaque route
// ne portant plus que sa propre logique métier. Corrige l'anomalie du frontend
// précédent où chaque module (Module33Router, Module35Router, NotesRouter,
// DisciplineRouter, …) remontait sa propre mise en page et sa propre nav.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute allowedRoles={ALL_ROLES}><AppLayout /></ProtectedRoute>}>

            <Route path="/dashboard" element={guarded(ADMIN, <Dashboard />)} />
            <Route path="/enseignant" element={guarded(ENSEIGNANT, <EnseignantDashboard />)} />
            <Route path="/parent" element={guarded(PARENT, <ParentDashboard />)} />

            <Route path="/eleves" element={guarded(ADMIN_COMPTABLE_ENSEIGNANT, <EleveIndex />)} />
            <Route path="/eleves/nouveau" element={guarded(ADMIN, <EleveForm />)} />
            <Route path="/eleves/:id" element={guarded(ADMIN_COMPTABLE_ENSEIGNANT, <EleveShow />)} />
            <Route path="/eleves/:id/modifier" element={guarded(ADMIN, <EleveForm />)} />

            <Route path="/inscriptions" element={guarded(ADMIN, <Inscriptions />)} />

            <Route path="/classes" element={guarded(ADMIN_ENSEIGNANT, <ClasseIndex />)} />
            <Route path="/classes/nouvelle" element={guarded(ADMIN, <ClasseForm />)} />
            <Route path="/classes/:id" element={guarded(ADMIN_ENSEIGNANT, <ClasseShow />)} />
            <Route path="/classes/:id/modifier" element={guarded(ADMIN, <ClasseForm />)} />
            <Route path="/salles" element={guarded(ADMIN, <Salles />)} />

            <Route path="/annees" element={guarded(ADMIN, <Annees />)} />

            <Route path="/cours" element={guarded(ADMIN, <Cours />)} />
            <Route path="/emploi-du-temps" element={guarded(ADMIN_ENSEIGNANT, <EmploiDuTemps />)} />
            <Route path="/enseignants" element={guarded(ADMIN, <Enseignants />)} />

            <Route path="/examens" element={guarded(ADMIN_ENSEIGNANT, <Examens />)} />
            <Route path="/notes" element={guarded(ADMIN_ENSEIGNANT, <Notes />)} />

            <Route path="/scolarite" element={guarded(ADMIN, <Scolarite />)} />
            <Route path="/scolarite/cycles" element={guarded(ADMIN, <Cycles />)} />

            <Route path="/paiements" element={guarded(ADMIN_COMPTABLE, <Paiements />)} />
            <Route path="/paiements/modes" element={guarded(ADMIN, <Modes />)} />

            <Route path="/parents" element={guarded(ADMIN, <Parents />)} />
            <Route path="/personnes" element={guarded(ADMIN, <Personnes />)} />
            <Route path="/discipline" element={guarded(ADMIN, <Discipline />)} />

            <Route path="/absences" element={guarded(ADMIN_ENSEIGNANT, <Absences />)} />
            <Route path="/transport" element={guarded(ADMIN, <Transport />)} />
            <Route path="/quartiers" element={guarded(ADMIN, <Quartiers />)} />
            <Route path="/bibliotheque" element={guarded(ADMIN, <Livres />)} />
            <Route path="/annonces" element={guarded(ANNONCES_ROLES, <Annonces />)} />

            <Route path="/comptes" element={guarded(ADMIN, <Comptes />)} />
            <Route path="/compte" element={guarded(ALL_ROLES, <Compte />)} />

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
