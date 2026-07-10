import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import { useResource } from '../../hooks/useResource'
import { absencesApi } from '../../api/absences.api'

export default function ParentAbsences() {
  const { data, loading, error } = useResource(absencesApi)
  return (
    <div>
      <PageHeader title="Absences" subtitle="Absences enregistrées pour votre / vos enfant(s)" />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'eleve', label: 'Enfant', render: (r) => r.eleve ? `${r.eleve.nom} ${r.eleve.prenom}` : '—' },
            { key: 'cours', label: 'Cours', render: (r) => r.cours?.libelle || '—' },
            { key: 'date', label: 'Date', render: (r) => r.date?.slice(0, 10) },
            { key: 'justifiee', label: 'Statut', render: (r) => <Badge tone={r.justifiee ? 'success' : 'warning'}>{r.justifiee ? 'Justifiée' : 'Non justifiée'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idAbsence"
          emptyLabel="Aucune absence enregistrée"
        />
      </Card>
    </div>
  )
}
