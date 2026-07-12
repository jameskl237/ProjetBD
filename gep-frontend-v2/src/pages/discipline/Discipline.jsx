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
import { rapportsApi, disciplinesApi } from '../../api/parents.api'
import { elevesApi } from '../../api/eleves.api'
import { anneesApi } from '../../api/annees.api'

const TABS = [{ key: 'rapports', label: 'Incidents' }, { key: 'disciplines', label: 'Types de sanction' }]

export default function Discipline() {
  const [tab, setTab] = useState('rapports')
  const rapports = useResource(rapportsApi)
  const disciplines = useResource(disciplinesApi)
  const [eleves, setEleves] = useState([])
  const [annees, setAnnees] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    elevesApi.list().then(setEleves).catch(() => {})
    anneesApi.list().then(setAnnees).catch(() => {})
  }, [])

  async function handleSubmitRapport(e) {
    e.preventDefault()
    setFormError('')
    try {
      const p = {
        matricule: Number(modal.values.matricule), idAca: Number(modal.values.idAca),
        commentaire: modal.values.commentaire, event_date: modal.values.event_date,
        idDiscipline: modal.values.idDiscipline ? Number(modal.values.idDiscipline) : undefined,
      }
      if (modal.mode === 'edit') await rapportsApi.update(modal.values.idRap, p); else await rapportsApi.create(p)
      setModal(null); rapports.reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  async function handleSubmitDiscipline(e) {
    e.preventDefault()
    setFormError('')
    try {
      await disciplinesApi.create({ libelle: modal.values.libelle, points: Number(modal.values.points || 0) })
      setModal(null); disciplines.reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div>
      <PageHeader
        title="Discipline"
        subtitle="Incidents disciplinaires et sanctions"
        actions={tab === 'rapports'
          ? <Button onClick={() => { setModal({ mode: 'create', kind: 'rapport', values: { matricule: '', idAca: '', commentaire: '', event_date: '', idDiscipline: '' } }); setFormError('') }}>＋ Signaler un incident</Button>
          : <Button onClick={() => { setModal({ mode: 'create', kind: 'discipline', values: { libelle: '', points: '' } }); setFormError('') }}>＋ Type de sanction</Button>}
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

      {tab === 'rapports' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{rapports.error}</Alert>
          <Table columns={[
            { key: 'eleve', label: 'Élève', render: (r) => r.eleve ? `${r.eleve.nom} ${r.eleve.prenom}` : `#${r.eleve?.matriculeCode || r.matricule}` },
            { key: 'discipline', label: 'Sanction', render: (r) => r.discipline?.libelle || '—' },
            { key: 'event_date', label: 'Date', render: (r) => r.event_date?.slice(0, 10) },
            { key: 'commentaire', label: 'Commentaire' },
          ]} rows={rapports.data} loading={rapports.loading} keyField="idRap"
            actions={(row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setModal({ mode: 'edit', kind: 'rapport', values: row }); setFormError('') }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                <button onClick={async () => { if (confirm('Supprimer ?')) { await rapportsApi.remove(row.idRap); rapports.reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
              </div>
            )} />
        </Card>
      )}

      {tab === 'disciplines' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{disciplines.error}</Alert>
          <Table columns={[{ key: 'libelle', label: 'Libellé' }, { key: 'points', label: 'Points' }]} rows={disciplines.data} loading={disciplines.loading} keyField="ID" />
        </Card>
      )}

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter' : 'Modifier'} onClose={() => setModal(null)}>
        {modal?.kind === 'rapport' && (
          <form onSubmit={handleSubmitRapport}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Élève" required value={modal.values.matricule} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, matricule: e.target.value } }))}
              options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))} />
            <SelectField label="Année académique" required value={modal.values.idAca} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idAca: e.target.value } }))}
              options={annees.map((a) => ({ value: a.idAnnee, label: a.libelle }))} />
            <SelectField label="Type de sanction" value={modal.values.idDiscipline} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idDiscipline: e.target.value } }))}
              options={disciplines.data.map((d) => ({ value: d.ID, label: d.libelle }))} />
            <InputField label="Date de l'incident" type="date" required value={modal.values.event_date} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, event_date: e.target.value } }))} />
            <InputField label="Commentaire" required value={modal.values.commentaire} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, commentaire: e.target.value } }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
        {modal?.kind === 'discipline' && (
          <form onSubmit={handleSubmitDiscipline}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
            <InputField label="Points" type="number" value={modal.values.points} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, points: e.target.value } }))} />
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
