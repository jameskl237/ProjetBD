import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import SelectField from '../../components/forms/SelectField'
import { elevesApi } from '../../api/eleves.api'
import { paiementsExtra } from '../../api/paiements.api'

export default function ParentPaiements() {
  const [enfants, setEnfants] = useState([])
  const [matricule, setMatricule] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    elevesApi.list().then((rows) => {
      setEnfants(rows)
      if (rows.length === 1) setMatricule(String(rows[0].matricule))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!matricule) return
    paiementsExtra.parEleve(matricule).then(setData).catch((e) => setError(e.response?.data?.error || 'Erreur'))
  }, [matricule])

  return (
    <div>
      <PageHeader title="Paiements" subtitle="Historique des règlements de scolarité" />
      {enfants.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <SelectField label="Enfant" value={matricule} onChange={(e) => setMatricule(e.target.value)} options={enfants.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))} />
        </Card>
      )}
      <Alert tone="error">{error}</Alert>
      {matricule && !data && <Spinner />}
      {data && (
        <Card style={{ padding: 0 }}>
          <div style={{ padding: 18, fontWeight: 700 }}>Total versé : {Number(data.total).toLocaleString('fr-FR')} FCFA</div>
          <Table
            columns={[
              { key: 'mode', label: 'Mode', render: (r) => r.mode?.libelle || '—' },
              { key: 'annee', label: 'Année', render: (r) => r.annee?.libelle || '—' },
              { key: 'montant', label: 'Montant', render: (r) => `${Number(r.montant).toLocaleString('fr-FR')} FCFA` },
              { key: 'datePaie', label: 'Date', render: (r) => r.datePaie?.slice(0, 10) },
            ]}
            rows={data.paiements}
            keyField="idPaie"
            emptyLabel="Aucun paiement enregistré"
          />
        </Card>
      )}
    </div>
  )
}
