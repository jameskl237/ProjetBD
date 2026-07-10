import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import Table from '../../components/ui/Table'
import { classesApi } from '../../api/classes.api'

export default function ClasseShow() {
  const { id } = useParams()
  const [classe, setClasse] = useState(null)
  const [eleves, setEleves] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([classesApi.get(id), classesApi.eleves(id).catch(() => [])])
      .then(([c, e]) => { setClasse(c); setEleves(e) })
      .catch((e) => setError(e.response?.data?.error || 'Classe introuvable'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner label="Chargement de la classe…" />
  if (error) return <Alert tone="error">{error}</Alert>
  if (!classe) return null

  return (
    <div>
      <PageHeader title={classe.libelle} subtitle={classe.cycle?.libelle} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard icon="👦" label="Effectif" value={classe.effectif ?? 0} />
        <StatCard icon="📊" label="Moyenne" value={classe.moyenne != null ? `${Number(classe.moyenne).toFixed(2)}/20` : '—'} tone="success" />
        <StatCard icon="🛡️" label="Incidents" value={classe.incidents ?? 0} tone="danger" />
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: 18, fontWeight: 700 }}>Élèves de la classe</div>
        <Table
          columns={[
            { key: 'nom', label: 'Nom' },
            { key: 'prenom', label: 'Prénom' },
            { key: 'matricule', label: 'Matricule' },
          ]}
          rows={eleves}
          keyField="matricule"
          emptyLabel="Aucun élève dans cette classe"
        />
      </Card>
    </div>
  )
}
