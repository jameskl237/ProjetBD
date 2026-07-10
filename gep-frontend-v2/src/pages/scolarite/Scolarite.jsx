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

// Gestion des frais de scolarité par classe (réservé au directeur en écriture,
// cf. requireDirecteur côté backend). Les tranches de paiement sont affichées
// en lecture, rattachées à chaque scolarité.
export default function Scolarite() {
  const { data, loading, error, reload } = useResource(scolariteApi)
  const [classes, setClasses] = useState([])
  const [tranches, setTranches] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const { user } = useAuth()
  const canWrite = isDirecteur(user)

  useEffect(() => {
    scolariteClassesApi.list().then(setClasses).catch(() => {})
    tranchesApi.list().then(setTranches).catch(() => {})
  }, [])

  function trancheCount(idScolarite) {
    return tranches.filter((t) => t.idScolarite === idScolarite).length
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      const payload = { description: modal.values.description, idClasse: Number(modal.values.idClasse) }
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
        subtitle="Frais de scolarité définis par classe"
        actions={canWrite ? <Button onClick={() => setModal({ mode: 'create', values: { description: '', idClasse: '' } })}>＋ Ajouter</Button> : null}
      />
      <Alert tone="error">{error}</Alert>
      {!canWrite && <Alert tone="info">Lecture seule — la création et la modification sont réservées au directeur.</Alert>}
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'description', label: 'Description' },
            { key: 'idClasse', label: 'Classe', render: (r) => classes.find((c) => c.idClasse === r.idClasse)?.libelle || `#${r.idClasse}` },
            { key: 'tranches', label: 'Tranches', render: (r) => trancheCount(r.idScolarite) },
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
            <SelectField label="Classe" required value={modal.values.idClasse} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idClasse: e.target.value } }))}
              options={classes.map((c) => ({ value: c.idClasse, label: c.libelle }))} />
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
