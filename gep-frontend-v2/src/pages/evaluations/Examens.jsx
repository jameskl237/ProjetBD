import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { sessionsApi, epreuvesApi, naturesApi, epreuveValidationApi } from '../../api/evaluations.api'
import { trimestresApi } from '../../api/annees.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const TABS = [
  { key: 'sessions', label: 'Sessions d\'examen' },
  { key: 'epreuves', label: 'Épreuves' },
  { key: 'natures', label: 'Natures d\'épreuve' },
]

export default function Examens() {
  const [tab, setTab] = useState('sessions')
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isAdmin = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE

  const sessions = useResource(sessionsApi)
  const epreuves = useResource(epreuvesApi)
  const natures = useResource(naturesApi)
  const [trimestres, setTrimestres] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { trimestresApi.list().then(setTrimestres).catch(() => {}) }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      if (modal.kind === 'session') {
        const p = { libelle: modal.values.libelle, description: modal.values.description, idTrimestre: Number(modal.values.idTrimestre), idPers: user.id, date_passage: modal.values.date_passage || undefined }
        if (modal.mode === 'edit') await sessionsApi.update(modal.values.idSession, p); else await sessionsApi.create(p)
        sessions.reload()
      } else if (modal.kind === 'epreuve') {
        const p = { libelle: modal.values.libelle, idNature: Number(modal.values.idNature), urlDoc: modal.values.urlDoc, auteur: modal.values.auteur }
        if (modal.mode === 'edit') await epreuvesApi.update(modal.values.idEpreuve, p); else await epreuvesApi.create(p)
        epreuves.reload()
      } else {
        const p = { libelle: modal.values.libelle, description: modal.values.description }
        await naturesApi.create(p)
        natures.reload()
      }
      setModal(null)
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur lors de l\'enregistrement') }
  }

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 4000) }

  async function handleValiderEpreuve(id) {
    try {
      await epreuveValidationApi.valider(id)
      flash('Épreuve validée avec succès')
      epreuves.reload()
    } catch (err) { flash(err.response?.data?.error || 'Erreur lors de la validation') }
  }

  async function handleRejeterEpreuve(id) {
    try {
      await epreuveValidationApi.rejeter(id)
      flash('Épreuve rejetée')
      epreuves.reload()
    } catch (err) { flash(err.response?.data?.error || 'Erreur lors du rejet') }
  }

  return (
    <div>
      <PageHeader
        title="Examens"
        subtitle="Sessions, épreuves et natures d'épreuve"
        actions={
          tab === 'sessions' && isAdmin ? <Button onClick={() => setModal({ mode: 'create', kind: 'session', values: { libelle: '', description: '', idTrimestre: '', date_passage: '' } })}>＋ Session</Button> :
          tab === 'epreuves' ? <Button onClick={() => setModal({ mode: 'create', kind: 'epreuve', values: { libelle: '', idNature: '', urlDoc: '', auteur: '' } })}>＋ Épreuve</Button> :
          tab === 'natures' && isAdmin ? <Button onClick={() => setModal({ mode: 'create', kind: 'nature', values: { libelle: '', description: '' } })}>＋ Nature</Button> : null
        }
      />

      {message && <Alert tone="info">{message}</Alert>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            background: tab === t.key ? 'var(--accent)' : 'var(--border-light)',
            color: tab === t.key ? '#fff' : 'var(--text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'sessions' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{sessions.error}</Alert>
          <Table columns={[
            { key: 'libelle', label: 'Libellé' },
            { key: 'trimestre', label: 'Trimestre', render: (r) => r.trimestre?.libelle || '—' },
            { key: 'responsable', label: 'Responsable', render: (r) => r.responsable ? `${r.responsable.nom} ${r.responsable.prenom}` : '—' },
            { key: 'date_passage', label: 'Date', render: (r) => r.date_passage?.slice(0, 10) || '—' },
          ]} rows={sessions.data} loading={sessions.loading} keyField="idSession"
            actions={isAdmin ? (row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal({ mode: 'edit', kind: 'session', values: row })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                <button onClick={async () => { if (confirm('Supprimer cette session ?')) { await sessionsApi.remove(row.idSession); sessions.reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
              </div>
            ) : null} />
        </Card>
      )}

      {tab === 'epreuves' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{epreuves.error}</Alert>
          <Table columns={[
            { key: 'libelle', label: 'Libellé' },
            { key: 'nature', label: 'Nature', render: (r) => r.nature?.libelle || '—' },
            { key: 'auteur', label: 'Auteur' },
            { key: 'valider', label: 'Statut', render: (r) => <Badge tone={r.valider ? 'success' : 'warning'}>{r.valider ? 'Validée' : 'En attente'}</Badge> },
          ]} rows={epreuves.data} loading={epreuves.loading} keyField="idEpreuve"
            actions={(row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {isAdmin && !row.valider && <button onClick={() => handleValiderEpreuve(row.idEpreuve)} style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>Valider</button>}
                {isAdmin && row.valider && <button onClick={() => handleRejeterEpreuve(row.idEpreuve)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Rejeter</button>}
                <button onClick={() => setModal({ mode: 'edit', kind: 'epreuve', values: row })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                {isAdmin && <button onClick={async () => { if (confirm('Supprimer cette épreuve ?')) { await epreuvesApi.remove(row.idEpreuve); epreuves.reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>}
              </div>
            )} />
        </Card>
      )}

      {tab === 'natures' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{natures.error}</Alert>
          <Table columns={[{ key: 'libelle', label: 'Libellé' }, { key: 'description', label: 'Description' }]} rows={natures.data} loading={natures.loading} keyField="idNature" />
        </Card>
      )}

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter' : 'Modifier'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
            {modal.kind === 'session' && (
              <>
                <SelectField label="Trimestre" required value={modal.values.idTrimestre} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idTrimestre: e.target.value } }))}
                  options={trimestres.map((t) => ({ value: t.idTrimes, label: t.libelle }))} />
                <InputField label="Date de passage" type="date" value={modal.values.date_passage} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, date_passage: e.target.value } }))} />
              </>
            )}
            {modal.kind === 'epreuve' && (
              <>
                <SelectField label="Nature" required value={modal.values.idNature} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idNature: e.target.value } }))}
                  options={natures.data.map((n) => ({ value: n.idNature, label: n.libelle }))} />
                <InputField label="Auteur" value={modal.values.auteur} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, auteur: e.target.value } }))} />
              </>
            )}
            {modal.kind !== 'epreuve' && (
              <InputField label="Description" value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
            )}
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
