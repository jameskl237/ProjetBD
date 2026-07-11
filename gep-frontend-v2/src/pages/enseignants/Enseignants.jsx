import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { enseignantsApi, coursApi } from '../../api/cours.api'
import { personnesApi } from '../../api/personnes.api'

export default function Enseignants() {
  const { data, loading, error, reload } = useResource(enseignantsApi)
  const [personnes, setPersonnes] = useState([])
  const [cours, setCours] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    personnesApi.list().then((rows) => setPersonnes(rows.filter((p) => p.typePersonne === 1))).catch(() => {})
    coursApi.list().then(setCours).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      await enseignantsApi.create({ idPers: Number(modal.values.idPers), idCours: Number(modal.values.idCours) })
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur lors de l\'affectation') }
  }

  return (
    <div>
      <PageHeader
        title="Enseignants"
        subtitle="Affectation des enseignants aux cours"
        actions={<Button onClick={() => setModal({ values: { idPers: '', idCours: '' } })}>＋ Affecter un enseignant</Button>}
      />
      <Alert tone="error">{error}</Alert>
      {personnes.length === 0 && (
        <Alert tone="info">Aucun compte enseignant disponible — créez-en un dans "Comptes (Personnes)" avant de l'affecter à un cours.</Alert>
      )}
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'personne', label: 'Enseignant', render: (r) => r.personne ? `${r.personne.nom} ${r.personne.prenom}` : '—' },
            { key: 'cours', label: 'Cours', render: (r) => r.cours?.libelle || '—' },
            { key: 'classe', label: 'Classe', render: (r) => r.cours?.classe?.libelle || '—' },
            { key: 'Actif', label: 'Statut', render: (r) => <Badge tone={r.Actif ? 'success' : 'neutral'}>{r.Actif ? 'Actif' : 'Inactif'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idEnseignant"
          actions={(row) => (
            <button onClick={async () => { if (confirm('Retirer cette affectation ?')) { await enseignantsApi.remove(row.idEnseignant); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
              Retirer
            </button>
          )}
        />
      </Card>

      <Modal open={!!modal} title="Affecter un enseignant" onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Enseignant" required value={modal.values.idPers} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idPers: e.target.value } }))}
              options={personnes.map((p) => ({ value: p.idPers, label: `${p.nom} ${p.prenom}` }))} />
            <SelectField label="Cours" required value={modal.values.idCours} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idCours: e.target.value } }))}
              options={cours.map((c) => ({ value: c.idCours, label: c.libelle }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Affecter</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
