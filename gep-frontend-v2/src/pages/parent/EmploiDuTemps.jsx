import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import { useResource } from '../../hooks/useResource'
import { emploiDuTempsApi } from '../../api/cours.api'

export default function ParentEmploiDuTemps() {
  const { data, loading, error } = useResource(emploiDuTempsApi)
  return (
    <div>
      <PageHeader title="Emploi du temps" subtitle="Planning de la classe de votre enfant" />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'jour', label: 'Jour' },
            { key: 'heure', label: 'Heure' },
            { key: 'cours', label: 'Cours', render: (r) => r.cours?.libelle || `#${r.idCours}` },
          ]}
          rows={data}
          loading={loading}
          keyField="idTemps"
          emptyLabel="Aucun créneau programmé"
        />
      </Card>
    </div>
  )
}
