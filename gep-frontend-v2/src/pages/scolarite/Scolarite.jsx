import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { scolariteApi, scolariteClassesApi, tranchesApi } from '../../api/scolarite.api'
import { useAuth } from '../../hooks/useAuth'
import { isDirecteur } from '../../config/navigation'

export default function Scolarite() {
  const { data, loading, error, reload } = useResource(scolariteApi)
  const [cycles, setCycles] = useState([])
  const [tranches, setTranches] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const { user } = useAuth()
  const canWrite = isDirecteur(user)

  useEffect(() => {
    scolariteClassesApi.list().then(setCycles).catch(() => {})
    tranchesApi.list().then(setTranches).catch(() => {})
  }, [])

  function trancheCount(idScolarite) {
    return tranches.filter((t) => t.idScolarite === idScolarite).length
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      const payload = { description: modal.values.description, pension: Number(modal.values.pension || 0), inscription: Number(modal.values.inscription || 0), nbreTranche: Number(modal.values.nbreTranche || 3), idCycle: Number(modal.values.idCycle) }
      if (modal.mode === 'create') await scolariteApi.create(payload)
      else await scolariteApi.update(modal.values.idScolarite, payload)
      setModal(null)
      reload()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Réservé au directeur ou données invalides')
    }
  }

  return (
    <div>
      <PageHeader
        title="Scolarité"
        subtitle="Frais de scolarité définis par cycle"
        actions={canWrite ? <Button onClick={() => setModal({ mode: 'create', values: { description: '', pension: '', inscription: '', nbreTranche: 3, idCycle: '' } })}>＋ Ajouter</Button> : null}
      />
      <Alert tone="error">{error}</Alert>
      {!canWrite && <Alert tone="info">Lecture seule — la création et la modification sont réservées au directeur.</Alert>}
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'description', label: 'Description' },
            { key: 'idCycle', label: 'Cycle', render: (r) => cycles.find((c) => c.idCycle === r.idCycle)?.libelle || `#${r.idCycle}` },
            { key: 'inscription', label: 'Inscription' },
            { key: 'pension', label: 'Pension' },
            { key: 'nbreTranche', label: 'Tranches' },
          ]}
          rows={data}
          loading={loading}
          keyField="idScolarite"
          actions={canWrite ? (row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal({ mode: 'edit', values: row })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
              <button onClick={async () => { if (confirm('Supprimer ?')) { await scolariteApi.remove(row.idScolarite); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
            </div>
          ) : null}
        />
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter une scolarité' : 'Modifier'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Description" required value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
            <SelectField label="Cycle" required value={modal.values.idCycle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idCycle: e.target.value } }))}
              options={cycles.map((c) => ({ value: c.idCycle, label: c.libelle }))} />
            <InputField label="Frais d'inscription" type="number" value={modal.values.inscription} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, inscription: e.target.value } }))} />
            <InputField label="Pension" type="number" value={modal.values.pension} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, pension: e.target.value } }))} />
            <InputField label="Nombre de tranches" type="number" value={modal.values.nbreTranche} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, nbreTranche: e.target.value } }))} />
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
