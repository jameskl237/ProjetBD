import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { inscriptionsApi, anneesApi } from '../../api/annees.api'
import { elevesApi } from '../../api/eleves.api'
import { sallesApi } from '../../api/classes.api'

export default function Inscriptions() {
  const { data, loading, error, reload } = useResource(inscriptionsApi)
  const [eleves, setEleves] = useState([])
  const [salles, setSalles] = useState([])
  const [annees, setAnnees] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    elevesApi.list().then(setEleves).catch(() => {})
    sallesApi.list().then(setSalles).catch(() => {})
    anneesApi.list().then(setAnnees).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      await inscriptionsApi.create({
        matricule: Number(modal.values.matricule),
        idAnnee: Number(modal.values.idAnnee),
        idSalle: Number(modal.values.idSalle),
      })
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div>
      <PageHeader
        title="Inscriptions"
        subtitle="Affectation des élèves aux salles pour une année académique"
        actions={<Button onClick={() => setModal({ values: { matricule: '', idSalle: '', idAnnee: '' } })}>＋ Nouvelle inscription</Button>}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'eleve', label: 'Élève', render: (r) => r.eleve ? `${r.eleve.nom} ${r.eleve.prenom}` : `#${r.eleve?.matriculeCode || r.matricule}` },
            { key: 'classe', label: 'Classe', render: (r) => r.classe?.libelle || '—' },
            { key: 'annee', label: 'Année', render: (r) => r.annee?.libelle || '—' },
          ]}
          rows={data}
          loading={loading}
          keyField="idFrequente"
          actions={(row) => (
            <button onClick={async () => { if (confirm('Supprimer cette inscription ?')) { await inscriptionsApi.remove(row.idFrequente); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
              Supprimer
            </button>
          )}
        />
      </Card>

      <Modal open={!!modal} title="Nouvelle inscription" onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Élève" required value={modal.values.matricule} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, matricule: e.target.value } }))}
              options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom} (#${e.matriculeCode || e.matricule})` }))} />
            <SelectField label="Salle / Classe" required value={modal.values.idSalle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idSalle: e.target.value } }))}
              options={salles.map((s) => ({ value: s.idSalle, label: s.libelle }))} />
            <SelectField label="Année académique" required value={modal.values.idAnnee} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idAnnee: e.target.value } }))}
              options={annees.map((a) => ({ value: a.idAnnee, label: a.libelle }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
