import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { personnesApi } from '../../api/personnes.api'
import { adminMeApi } from '../../api/admin.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES, ROLE_LABELS } from '../../config/navigation'

const LANGUES = [
  { value: 'fr', label: 'Français' },
  { value: 'ln', label: 'Lingala' },
  { value: 'en', label: 'Anglais' },
]

export default function Compte() {
  const { user } = useAuth()
  const roleKey = getRoleKey(user)

  if (roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.COMPTABLE || roleKey === ROLES.SECRETAIRE) {
    return <AdminCompte user={user} roleKey={roleKey} />
  }

  return <PersonneCompte />
}

function AdminCompte({ user, roleKey }) {
  const [values, setValues] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminMeApi.get().then(setValues).catch((e) => setError(e.response?.data?.error || 'Impossible de charger le profil'))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      const payload = { username: values.username, langue: values.langue }
      if (password) payload.password = password
      const updated = await adminMeApi.update(payload)
      setValues(updated)
      setPassword('')
      setSuccess('Profil mis à jour avec succès.')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally { setSaving(false) }
  }

  if (!values) return <Spinner label="Chargement du profil…" />

  const typeLabel = values.typeAdmin === 1 ? 'Directeur' : values.typeAdmin === 2 ? 'Secrétaire' : 'Comptable'

  return (
    <div>
      <PageHeader title="Mon compte" subtitle={typeLabel} />
      <form onSubmit={handleSubmit}>
        <Card style={{ maxWidth: 520 }}>
          <Alert tone="error">{error}</Alert>
          <Alert tone="success">{success}</Alert>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Identifiant</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{values.login}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Rôle</div>
            <Badge tone="info">{typeLabel}</Badge>
          </div>

          <InputField label="Nom d'affichage" value={values.username || ''} onChange={(e) => setValues((v) => ({ ...v, username: e.target.value }))} />
          <SelectField label="Langue" value={values.langue || 'fr'} onChange={(e) => setValues((v) => ({ ...v, langue: e.target.value }))} options={LANGUES} />
          <InputField label="Nouveau mot de passe (optionnel)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </Card>
      </form>
    </div>
  )
}

function PersonneCompte() {
  const { user } = useAuth()
  const [values, setValues] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    personnesApi.me().then(setValues).catch((e) => setError(e.response?.data?.error || 'Impossible de charger le profil'))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      const payload = { nom: values.nom, prenom: values.prenom, email: values.email, mobile: values.mobile }
      if (password) payload.password = password
      const updated = await personnesApi.updateMe(payload)
      setValues(updated)
      setPassword('')
      setSuccess('Profil mis à jour avec succès.')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally { setSaving(false) }
  }

  if (!values) return <Spinner label="Chargement du profil…" />

  return (
    <div>
      <PageHeader title="Mon compte" subtitle={user?.role} />
      <form onSubmit={handleSubmit}>
        <Card style={{ maxWidth: 520 }}>
          <Alert tone="error">{error}</Alert>
          <Alert tone="success">{success}</Alert>
          <InputField label="Nom" value={values.nom || ''} onChange={(e) => setValues((v) => ({ ...v, nom: e.target.value }))} />
          <InputField label="Prénom" value={values.prenom || ''} onChange={(e) => setValues((v) => ({ ...v, prenom: e.target.value }))} />
          <InputField label="Email" type="email" value={values.email || ''} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} />
          <InputField label="Mobile" value={values.mobile || ''} onChange={(e) => setValues((v) => ({ ...v, mobile: e.target.value }))} />
          <InputField label="Nouveau mot de passe (optionnel)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </Card>
      </form>
    </div>
  )
}
