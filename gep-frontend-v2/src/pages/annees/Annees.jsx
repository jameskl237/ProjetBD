import { useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Badge from '../../components/ui/Badge'
import { useResource } from '../../hooks/useResource'
import { anneesApi, trimestresApi } from '../../api/annees.api'

const TABS = [{ key: 'annees', label: 'Années académiques' }, { key: 'trimestres', label: 'Trimestres' }]

export default function Annees() {
  const [tab, setTab] = useState('annees')
  const annees = useResource(anneesApi)
  const trimestres = useResource(trimestresApi)
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  async function handleSubmitAnnee(e) {
    e.preventDefault()
    setFormError('')
    try {
      const payload = { libelle: modal.values.libelle, periode: modal.values.periode }
      if (modal.mode === 'create') await anneesApi.create(payload)
      else await anneesApi.update(modal.values.idAnnee, payload)
      setModal(null); annees.reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  async function handleSubmitTrimestre(e) {
    e.preventDefault()
    setFormError('')
    try {
      const payload = { libelle: modal.values.libelle, periode: modal.values.periode, idAca: Number(modal.values.idAca) }
      if (modal.mode === 'create') await trimestresApi.create(payload)
      else await trimestresApi.update(modal.values.idTrimes, payload)
      setModal(null); trimestres.reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div>
      <PageHeader
        title="Années académiques"
        subtitle="Années scolaires et découpage en trimestres"
        actions={
          <Button onClick={() => setModal(tab === 'annees'
            ? { mode: 'create', kind: 'annee', values: { libelle: '', periode: '' } }
            : { mode: 'create', kind: 'trimestre', values: { libelle: '', periode: '', idAca: '' } })}>
            ＋ Ajouter
          </Button>
        }
      />
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            background: tab === t.key ? 'var(--accent)' : 'var(--border-light)',
            color: tab === t.key ? '#fff' : 'var(--text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'annees' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{annees.error}</Alert>
          <Table
            columns={[{ key: 'libelle', label: 'Libellé' }, { key: 'periode', label: 'Période' }]}
            rows={annees.data}
            loading={annees.loading}
            keyField="idAnnee"
            actions={(row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal({ mode: 'edit', kind: 'annee', values: row })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
              </div>
            )}
          />
        </Card>
      )}

      {tab === 'trimestres' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{trimestres.error}</Alert>
          <Table
            columns={[
              { key: 'libelle', label: 'Libellé' },
              { key: 'periode', label: 'Période' },
              { key: 'idAca', label: 'Année', render: (r) => annees.data.find((a) => a.idAnnee === r.idAca)?.libelle || `#${r.idAca}` },
            ]}
            rows={trimestres.data}
            loading={trimestres.loading}
            keyField="idTrimes"
            actions={(row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal({ mode: 'edit', kind: 'trimestre', values: row })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                <button onClick={async () => { if (confirm('Supprimer ?')) { await trimestresApi.remove(row.idTrimes); trimestres.reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
              </div>
            )}
          />
        </Card>
      )}

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter' : 'Modifier'} onClose={() => setModal(null)}>
        {modal?.kind === 'annee' && (
          <form onSubmit={handleSubmitAnnee}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
            <InputField label="Période" value={modal.values.periode} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, periode: e.target.value } }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
        {modal?.kind === 'trimestre' && (
          <form onSubmit={handleSubmitTrimestre}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
            <InputField label="Période" value={modal.values.periode} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, periode: e.target.value } }))} />
            <SelectField label="Année académique" required value={modal.values.idAca} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idAca: e.target.value } }))}
              options={annees.data.map((a) => ({ value: a.idAnnee, label: a.libelle }))} />
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
