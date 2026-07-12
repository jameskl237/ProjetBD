import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import Spinner from '../../components/ui/Spinner'
import { personnesApi } from '../../api/personnes.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'
import ParentMonCompte from '../parent/MonCompte'

// "Mon compte" — utilisable par Enseignant et Parent via GET/PUT /personnes/me.
// Les comptes Admin/Comptable n'ont pas d'entrée Personne : /personnes/me ne
// leur est pas applicable côté backend (authorize exclut même le Comptable),
// donc on les redirige vers la gestion des comptes admin plutôt que d'appeler
// un endpoint qui ne les concerne pas.
// Le Parent bénéficie d'une dédiée avec avatar, tabs et liste d'enfants.
export default function Compte() {
  const { user } = useAuth()
  const roleKey = getRoleKey(user)

  if (roleKey === ROLES.PARENT) return <ParentMonCompte />

  if (roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.COMPTABLE) {
    return (
      <div>
        <PageHeader title="Mon compte" subtitle={user?.role} />
        <Card style={{ maxWidth: 480 }}>
          <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
            Les comptes {user?.role} se gèrent depuis le module "Comptes administrateurs".
          </p>
          {roleKey === ROLES.ADMINISTRATEUR && <Link to="/comptes"><Button>Aller aux comptes administrateurs</Button></Link>}
        </Card>
      </div>
    )
  }

  return <PersonneCompte />
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
