import { useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import { useResource } from '../../hooks/useResource'
import { quartiersApi } from '../../api/quartiers.api'

export default function Quartiers() {
  const quartiers = useResource(quartiersApi)
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      const payload = { libelle: modal.values.libelle, description: modal.values.description }
      if (modal.mode === 'edit') {
        await quartiersApi.update(modal.values.idQuartier, payload)
      } else {
        await quartiersApi.create(payload)
      }
      quartiers.reload()
      setModal(null)
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div>
      <PageHeader
        title="Quartiers"
        subtitle="Liste des quartiers et de la ville associée"
        actions={
          <Button onClick={() => { setModal({ mode: 'create', values: { libelle: '', description: '' } }); setFormError('') }}>＋ Quartier</Button>
        }
      />

      <Card style={{ padding: 0 }}>
        <Alert tone="error">{quartiers.error}</Alert>
        <Table
          columns={[
            { key: 'libelle', label: 'Quartier' },
            { key: 'description', label: 'Ville' },
          ]}
          rows={quartiers.data}
          loading={quartiers.loading}
          keyField="idQuartier"
          actions={(row) => (
            <button onClick={() => { setModal({ mode: 'edit', values: row }); setFormError('') }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
              Modifier
            </button>
          )}
        />
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter un quartier' : 'Modifier le quartier'} onClose={() => setModal(null)}>
        <form onSubmit={handleSubmit}>
          <Alert tone="error">{formError}</Alert>
          <InputField label="Quartier" required value={modal?.values.libelle || ''} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
          <InputField label="Ville" value={modal?.values.description || ''} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
