import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { parentsApi } from '../../api/parents.api'
import { personnesApi } from '../../api/personnes.api'
import { elevesApi } from '../../api/eleves.api'

export default function Parents() {
  const { data, loading, error, reload } = useResource(parentsApi)
  const [personnes, setPersonnes] = useState([])
  const [eleves, setEleves] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    personnesApi.list().then((rows) => setPersonnes(rows.filter((p) => p.typePersonne === 2))).catch(() => {})
    elevesApi.list().then(setEleves).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      await parentsApi.create({ idPers: Number(modal.values.idPers), matricule: Number(modal.values.matricule) })
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur lors de la liaison') }
  }

  return (
    <div>
      <PageHeader
        title="Parents"
        subtitle="Liens entre comptes parents et élèves"
        actions={<Button onClick={() => { setModal({ values: { idPers: '', matricule: '' } }); setFormError('') }}>＋ Lier un parent</Button>}
      />
      <Alert tone="error">{error}</Alert>
      {personnes.length === 0 && (
        <Alert tone="info">Aucun compte parent disponible — créez-en un dans "Comptes (Personnes)" avant de le lier à un élève.</Alert>
      )}
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'personne', label: 'Parent', render: (r) => r.personne ? `${r.personne.nom} ${r.personne.prenom}` : '—' },
            { key: 'eleve', label: 'Élève', render: (r) => r.eleve ? `${r.eleve.nom} ${r.eleve.prenom}` : '—' },
          ]}
          rows={data}
          loading={loading}
          keyField="idParent"
          actions={(row) => (
            <button onClick={async () => { if (confirm('Retirer ce lien ?')) { await parentsApi.remove(row.idParent); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
              Retirer
            </button>
          )}
        />
      </Card>

      <Modal open={!!modal} title="Lier un parent à un élève" onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Compte parent" required value={modal.values.idPers} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idPers: e.target.value } }))}
              options={personnes.map((p) => ({ value: p.idPers, label: `${p.nom} ${p.prenom}` }))} />
            <SelectField label="Élève" required value={modal.values.matricule} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, matricule: e.target.value } }))}
              options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Lier</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
