import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'

export default function ParentDashboard() {
  const { user } = useAuth()
  const [enfants, setEnfants] = useState(null)

  useEffect(() => { elevesApi.list().then(setEnfants).catch(() => setEnfants([])) }, [])

  if (enfants === null) return <Spinner label="Chargement de votre espace…" />

  return (
    <div>
      <PageHeader title={`Bienvenue, ${user?.nom || ''}`} subtitle="Suivi de la scolarité de votre / vos enfant(s)" />

      {enfants.length === 0 && <Card>Aucun enfant lié à votre compte pour le moment.</Card>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {enfants.map((e) => (
          <Card key={e.matricule}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{e.nom} {e.prenom}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{e.inscriptions?.[0]?.classe?.libelle || 'Non inscrit'}</div>
              </div>
              <Badge tone={e.actif ? 'success' : 'neutral'}>{e.actif ? 'Actif' : 'Inactif'}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <Link to="/parent/notes"><Badge tone="info">📊 Notes</Badge></Link>
              <Link to="/parent/absences"><Badge tone="warning">🗓️ Absences</Badge></Link>
              <Link to="/parent/paiements"><Badge tone="success">💳 Paiements</Badge></Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
