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
import { personnesApi } from '../../api/personnes.api'
import { useAuth } from '../../hooks/useAuth'
import { isDirecteur, isSecretaire } from '../../config/navigation'

// Comptes "Personne" (enseignants et parents) — la création/modification est
// réservée au directeur (requireDirecteur côté backend), conformément à la
// séparation des rôles imposée par le contrat API.
export default function Personnes() {
  const { data, loading, error, reload } = useResource(personnesApi)
  const { user } = useAuth()
  const canWrite = isDirecteur(user) || isSecretaire(user)
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  function openCreate() {
    setModal({ mode: 'create', values: { login: '', password: '', typePersonne: '1', nom: '', prenom: '', email: '', mobile: '' } })
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      const v = modal.values
      const payload = { login: v.login, typePersonne: Number(v.typePersonne), nom: v.nom, prenom: v.prenom, email: v.email || undefined, mobile: v.mobile || undefined }
      if (modal.mode === 'create') {
        await personnesApi.create({ ...payload, password: v.password })
      } else {
        const upd = { ...payload }
        if (v.password) upd.password = v.password
        await personnesApi.update(v.idPers, upd)
      }
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Réservé au directeur ou données invalides') }
  }

  return (
    <div>
      <PageHeader
        title="Comptes (Personnes)"
        subtitle="Comptes enseignants et parents pouvant se connecter à la plateforme"
        actions={canWrite ? <Button onClick={openCreate}>＋ Nouveau compte</Button> : null}
      />
      <Alert tone="error">{error}</Alert>
      {!canWrite && <Alert tone="info">Lecture seule — la gestion des comptes nécessite les droits Directeur ou Secrétaire.</Alert>}
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'nom', label: 'Nom', render: (r) => `${r.nom || ''} ${r.prenom || ''}` },
            { key: 'login', label: 'Identifiant' },
            { key: 'typePersonne', label: 'Type', render: (r) => <Badge tone={r.typePersonne === 1 ? 'info' : 'success'}>{r.typePersonne === 1 ? 'Enseignant' : 'Parent'}</Badge> },
            { key: 'email', label: 'Email' },
            { key: 'actif', label: 'Statut', render: (r) => <Badge tone={r.actif ? 'success' : 'neutral'}>{r.actif ? 'Actif' : 'Inactif'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idPers"
          actions={canWrite ? (row) => (
            <button onClick={() => { setModal({ mode: 'edit', values: { ...row, password: '' } }); setFormError('') }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
          ) : null}
        />
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Nouveau compte' : 'Modifier le compte'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Nom" value={modal.values.nom} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, nom: e.target.value } }))} />
              <InputField label="Prénom" value={modal.values.prenom} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, prenom: e.target.value } }))} />
            </div>
            <InputField label="Identifiant de connexion" required value={modal.values.login} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, login: e.target.value } }))} />
            <SelectField label="Type de compte" required value={String(modal.values.typePersonne)} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, typePersonne: e.target.value } }))}
              options={[{ value: '1', label: 'Enseignant' }, { value: '2', label: 'Parent' }]} />
            <InputField label={modal.mode === 'create' ? 'Mot de passe' : 'Nouveau mot de passe (optionnel)'} type="password" required={modal.mode === 'create'}
              value={modal.values.password} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, password: e.target.value } }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Email" type="email" value={modal.values.email || ''} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, email: e.target.value } }))} />
              <InputField label="Mobile" value={modal.values.mobile || ''} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, mobile: e.target.value } }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
