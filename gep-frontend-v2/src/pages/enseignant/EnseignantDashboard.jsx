import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { enseignantsApi } from '../../api/cours.api'
import { evaluationsApi } from '../../api/evaluations.api'
import { absencesApi } from '../../api/absences.api'
import { useAuth } from '../../hooks/useAuth'

export default function EnseignantDashboard() {
  const { user } = useAuth()
  const [mesCours, setMesCours] = useState(null)
  const [notes, setNotes] = useState(null)
  const [absences, setAbsences] = useState(null)

  useEffect(() => {
    enseignantsApi.list().then((rows) => setMesCours(rows.filter((r) => r.idPers === user.id))).catch(() => setMesCours([]))
    evaluationsApi.list().then(setNotes).catch(() => setNotes([]))
    absencesApi.list().then(setAbsences).catch(() => setAbsences([]))
  }, [user])

  if (mesCours === null) return <Spinner label="Chargement de votre espace…" />

  return (
    <div>
      <PageHeader title={`Bienvenue, ${user?.nom || ''}`} subtitle="Votre espace enseignant" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard icon="📚" label="Cours assurés" value={mesCours.length} tone="info" />
        <StatCard icon="📊" label="Notes saisies" value={notes?.length ?? '—'} tone="success" />
        <StatCard icon="🗓️" label="Absences signalées" value={absences?.length ?? '—'} tone="warning" />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 14 }}>Mes cours</h3>
        {mesCours.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Aucun cours affecté pour le moment.</p>}
        {mesCours.map((c) => (
          <div key={c.idEnseignant} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
            <span>{c.cours?.libelle || '—'}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{c.cours?.classe?.libelle || '—'}</span>
          </div>
        ))}
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/notes" style={{ flex: 1 }}><Card style={{ textAlign: 'center', cursor: 'pointer' }}>📊 Saisir des notes</Card></Link>
        <Link to="/absences" style={{ flex: 1 }}><Card style={{ textAlign: 'center', cursor: 'pointer' }}>🗓️ Signaler une absence</Card></Link>
      </div>
    </div>
  )
}
