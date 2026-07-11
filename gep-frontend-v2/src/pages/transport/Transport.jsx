import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import { useResource } from '../../hooks/useResource'
import { abonnementsApi } from '../../api/transport.api'
import { elevesApi } from '../../api/eleves.api'

const TYPES = [{ value: '0', label: 'Aller-retour' }, { value: '1', label: 'Aller simple' }, { value: '2', label: 'Retour simple' }]

export default function Transport() {
  const { data, loading, error, reload } = useResource(abonnementsApi)
  const [eleves, setEleves] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => { elevesApi.list().then(setEleves).catch(() => {}) }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      const p = {
        matricule: Number(modal.values.matricule), type: Number(modal.values.type),
        dateDebut: modal.values.dateDebut, dateFin: modal.values.dateFin || undefined,
      }
      if (modal.mode === 'edit') await abonnementsApi.update(modal.values.idAbonnement, p); else await abonnementsApi.create(p)
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div>
      <PageHeader
        title="Transport scolaire"
        subtitle="Abonnements au service de transport"
        actions={<Button onClick={() => { setModal({ mode: 'create', values: { matricule: '', type: '0', dateDebut: '', dateFin: '' } }); setFormError('') }}>＋ Nouvel abonnement</Button>}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'matricule', label: 'Élève', render: (r) => eleves.find((e) => e.matricule === r.matricule) ? `${eleves.find((e) => e.matricule === r.matricule).nom} ${eleves.find((e) => e.matricule === r.matricule).prenom}` : `#${r.matricule}` },
            { key: 'type', label: 'Type', render: (r) => TYPES.find((t) => Number(t.value) === r.type)?.label || '—' },
            { key: 'dateDebut', label: 'Début', render: (r) => r.dateDebut?.slice(0, 10) },
            { key: 'dateFin', label: 'Fin', render: (r) => r.dateFin?.slice(0, 10) || '—' },
            { key: 'actif', label: 'Statut', render: (r) => <Badge tone={r.actif ? 'success' : 'neutral'}>{r.actif ? 'Actif' : 'Inactif'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idAbonnement"
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal({ mode: 'edit', values: { ...row, type: String(row.type) } }); setFormError('') }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
              <button onClick={async () => { if (confirm('Supprimer ?')) { await abonnementsApi.remove(row.idAbonnement); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
            </div>
          )}
        />
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Nouvel abonnement' : 'Modifier'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Élève" required value={modal.values.matricule} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, matricule: e.target.value } }))}
              options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))} />
            <SelectField label="Type" required value={modal.values.type} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, type: e.target.value } }))} options={TYPES} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Date de début" type="date" required value={modal.values.dateDebut} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, dateDebut: e.target.value } }))} />
              <InputField label="Date de fin" type="date" value={modal.values.dateFin} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, dateFin: e.target.value } }))} />
            </div>
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
