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
import { quartiersApi, villesApi, residentsApi } from '../../api/quartiers.api'
import { personnesApi } from '../../api/personnes.api'

const TABS = [
  { key: 'quartiers', label: 'Quartiers' },
  { key: 'villes', label: 'Villes de naissance' },
  { key: 'residents', label: 'Résidents' },
]

export default function Quartiers() {
  const [tab, setTab] = useState('quartiers')
  const quartiers = useResource(quartiersApi)
  const villes = useResource(villesApi)
  const residents = useResource(residentsApi)
  const [personnes, setPersonnes] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => { personnesApi.list().then(setPersonnes).catch(() => {}) }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      if (modal.kind === 'quartier') {
        const p = { libelle: modal.values.libelle, description: modal.values.description }
        if (modal.mode === 'edit') await quartiersApi.update(modal.values.idQuartier, p); else await quartiersApi.create(p)
        quartiers.reload()
      } else if (modal.kind === 'ville') {
        const p = { libelle: modal.values.libelle }
        if (modal.mode === 'edit') await villesApi.update(modal.values.idVille, p); else await villesApi.create(p)
        villes.reload()
      } else {
        await residentsApi.create({ idPers: Number(modal.values.idPers), idQuartier: Number(modal.values.idQuartier), description: modal.values.description })
        residents.reload()
      }
      setModal(null)
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div>
      <PageHeader
        title="Quartiers"
        subtitle="Répartition géographique des familles et villes de naissance"
        actions={
          tab === 'quartiers' ? <Button onClick={() => { setModal({ mode: 'create', kind: 'quartier', values: { libelle: '', description: '' } }); setFormError('') }}>＋ Quartier</Button> :
          tab === 'villes' ? <Button onClick={() => { setModal({ mode: 'create', kind: 'ville', values: { libelle: '' } }); setFormError('') }}>＋ Ville</Button> :
          <Button onClick={() => { setModal({ mode: 'create', kind: 'resident', values: { idPers: '', idQuartier: '', description: '' } }); setFormError('') }}>＋ Résident</Button>
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

      {tab === 'quartiers' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{quartiers.error}</Alert>
          <Table columns={[{ key: 'libelle', label: 'Libellé' }, { key: 'description', label: 'Description' }]} rows={quartiers.data} loading={quartiers.loading} keyField="idQuartier"
            actions={(row) => <button onClick={() => { setModal({ mode: 'edit', kind: 'quartier', values: row }); setFormError('') }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>} />
        </Card>
      )}
      {tab === 'villes' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{villes.error}</Alert>
          <Table columns={[{ key: 'libelle', label: 'Libellé' }]} rows={villes.data} loading={villes.loading} keyField="idVille"
            actions={(row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setModal({ mode: 'edit', kind: 'ville', values: row }); setFormError('') }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                <button onClick={async () => { if (confirm('Supprimer ?')) { await villesApi.remove(row.idVille); villes.reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
              </div>
            )} />
        </Card>
      )}
      {tab === 'residents' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{residents.error}</Alert>
          <Table columns={[
            { key: 'personne', label: 'Personne', render: (r) => personnes.find((p) => p.idPers === r.idPers) ? `${personnes.find((p) => p.idPers === r.idPers).nom} ${personnes.find((p) => p.idPers === r.idPers).prenom}` : `#${r.idPers}` },
            { key: 'idQuartier', label: 'Quartier', render: (r) => quartiers.data.find((q) => q.idQuartier === r.idQuartier)?.libelle || `#${r.idQuartier}` },
            { key: 'description', label: 'Description' },
          ]} rows={residents.data} loading={residents.loading} keyField="idResi"
            actions={(row) => <button onClick={async () => { if (confirm('Supprimer ?')) { await residentsApi.remove(row.idResi); residents.reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>} />
        </Card>
      )}

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter' : 'Modifier'} onClose={() => setModal(null)}>
        {modal?.kind === 'quartier' && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
            <InputField label="Description" value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
        {modal?.kind === 'ville' && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
        {modal?.kind === 'resident' && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Personne" required value={modal.values.idPers} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idPers: e.target.value } }))}
              options={personnes.map((p) => ({ value: p.idPers, label: `${p.nom} ${p.prenom}` }))} />
            <SelectField label="Quartier" required value={modal.values.idQuartier} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idQuartier: e.target.value } }))}
              options={quartiers.data.map((q) => ({ value: q.idQuartier, label: q.libelle }))} />
            <InputField label="Description" value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
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
