import { useState } from 'react'
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
import { adminsApi } from '../../api/admin.api'
import { useAuth } from '../../hooks/useAuth'
import { isDirecteur } from '../../config/navigation'

const TYPES = [{ value: '1', label: 'Directeur' }, { value: '2', label: 'Secrétaire' }, { value: '3', label: 'Comptable' }]

// Comptes Admin (Directeur / Secrétaire / Comptable) — réservé au directeur
// (typeAdmin === 1), conformément à requireDirecteur côté backend.
export default function Comptes() {
  const { data, loading, error, reload } = useResource(adminsApi)
  const { user } = useAuth()
  const canWrite = isDirecteur(user)
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      const v = modal.values
      const payload = { login: v.login, username: v.username, typeAdmin: Number(v.typeAdmin) }
      if (modal.mode === 'create') await adminsApi.create({ ...payload, password: v.password })
      else await adminsApi.update(v.ID, { ...payload, ...(v.password ? { password: v.password } : {}) })
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div>
      <PageHeader
        title="Comptes administrateurs"
        subtitle="Directeur, secrétaires et comptables"
        actions={canWrite ? <Button onClick={() => { setModal({ mode: 'create', values: { login: '', username: '', typeAdmin: '2', password: '' } }); setFormError('') }}>＋ Nouveau compte</Button> : null}
      />
      <Alert tone="error">{error}</Alert>
      {!canWrite && <Alert tone="info">Réservé au directeur.</Alert>}
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'username', label: 'Nom' },
            { key: 'login', label: 'Identifiant' },
            { key: 'typeAdmin', label: 'Rôle', render: (r) => TYPES.find((t) => Number(t.value) === r.typeAdmin)?.label },
            { key: 'actif', label: 'Statut', render: (r) => <Badge tone={r.actif ? 'success' : 'neutral'}>{r.actif ? 'Actif' : 'Désactivé'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="ID"
          actions={canWrite ? (row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal({ mode: 'edit', values: { ...row, password: '' } }); setFormError('') }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
              <button onClick={async () => { await adminsApi.toggleActif(row.ID, row.actif ? 0 : 1); reload() }} style={{ color: 'var(--warning)', fontSize: 13, fontWeight: 600 }}>{row.actif ? 'Désactiver' : 'Activer'}</button>
            </div>
          ) : null}
        />
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Nouveau compte admin' : 'Modifier'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Nom d'utilisateur" value={modal.values.username} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, username: e.target.value } }))} />
            <InputField label="Identifiant de connexion" required value={modal.values.login} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, login: e.target.value } }))} />
            <SelectField label="Rôle" required value={String(modal.values.typeAdmin)} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, typeAdmin: e.target.value } }))} options={TYPES} />
            <InputField label={modal.mode === 'create' ? 'Mot de passe' : 'Nouveau mot de passe (optionnel)'} type="password" required={modal.mode === 'create'}
              value={modal.values.password} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, password: e.target.value } }))} />
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
