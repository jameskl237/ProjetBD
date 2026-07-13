import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
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
      if (rows.length > 0) setMatricule(String(rows[0].matricule))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!matricule) return
    setData(null)
    paiementsExtra.parEleve(matricule).then(setData).catch((e) => setError(e.response?.data?.error || 'Erreur'))
  }, [matricule])

  const selectedEnfant = enfants.find((e) => String(e.matricule) === String(matricule))

  return (
    <div>
      <PageHeader
        title="Paiements"
        subtitle={selectedEnfant ? `Historique des paiements de ${selectedEnfant.nom} ${selectedEnfant.prenom}` : 'Historique des règlements de scolarité'}
      />
      {enfants.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <SelectField
            label="Enfant"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            options={enfants.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom} (${e.matriculeCode || e.matricule})` }))}
          />
        </Card>
      )}
      <Alert tone="error">{error}</Alert>
      {matricule && !data && <Spinner />}
      {data && (
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Total versé : </span>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>{Number(data.total).toLocaleString('fr-FR')} FCFA</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.paiements.length} paiement(s)</span>
          </div>
          <Table
            columns={[
              { key: 'montant', label: 'Montant', render: (r) => <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{Number(r.montant).toLocaleString('fr-FR')} FCFA</span> },
              { key: 'comentaire', label: 'Motif', render: (r) => <span style={{ color: 'var(--text-secondary)' }}>{r.comentaire || '—'}</span> },
              { key: 'datePaie', label: 'Date', render: (r) => r.datePaie?.slice(0, 10) || '—' },
              { key: 'annee', label: 'Année', render: (r) => r.annee?.libelle || '—' },
              { key: 'mode', label: 'Mode', render: (r) => r.mode?.libelle || '—' },
              { key: 'recu', label: 'Reçu', render: (r) => <button onClick={() => paiementsExtra.openRecu(r.idPaie)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 12 }}>Télécharger</button> },
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
