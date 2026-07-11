import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import { useResource } from '../../hooks/useResource'
import { abonnementsApi } from '../../api/transport.api'

const TYPES = ['Aller-retour', 'Aller simple', 'Retour simple']

export default function ParentTransport() {
  const { data, loading, error } = useResource(abonnementsApi)
  return (
    <div>
      <PageHeader title="Transport" subtitle="Abonnement au service de transport scolaire" />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'type', label: 'Type', render: (r) => TYPES[r.type] || '—' },
            { key: 'dateDebut', label: 'Début', render: (r) => r.dateDebut?.slice(0, 10) },
            { key: 'dateFin', label: 'Fin', render: (r) => r.dateFin?.slice(0, 10) || '—' },
            { key: 'actif', label: 'Statut', render: (r) => <Badge tone={r.actif ? 'success' : 'neutral'}>{r.actif ? 'Actif' : 'Inactif'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idAbonnement"
          emptyLabel="Aucun abonnement transport"
        />
      </Card>
    </div>
  )
}
