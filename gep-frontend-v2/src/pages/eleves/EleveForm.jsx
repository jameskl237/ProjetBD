import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { elevesApi } from '../../api/eleves.api'
import { sallesApi } from '../../api/classes.api'
import { anneesApi } from '../../api/annees.api'

const empty = {
  nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', sexe: '0',
  langue: 'Francophone', actif: '1', villeNaissance: '',
  idSalle: '', idAnnee: '',
  parent: { nom: '', prenom: '', login: '', password: '', email: '', mobile: '' },
  withParent: false,
}

// Formulaire de création/édition d'élève — respecte exactement le contrat
// POST/PUT /eleves du backend : { ...champsEleve, villeNaissance, inscription: { idSalle, idAnnee }, parent? }.
export default function EleveForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [values, setValues] = useState(empty)
  const [salles, setSalles] = useState([])
  const [annees, setAnnees] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    sallesApi.list().then(setSalles).catch(() => {})
    anneesApi.list().then(setAnnees).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    elevesApi.get(id).then((e) => {
      setValues((v) => ({
        ...v,
        nom: e.nom, prenom: e.prenom, dateNaissance: e.dateNaissance?.slice(0, 10) || '',
        lieuNaissance: e.lieuNaissance || '', sexe: String(e.sexe), langue: e.langue || '',
        actif: String(e.actif), villeNaissance: e.ville?.libelle || '',
      }))
    }).finally(() => setLoading(false))
  }, [id, isEdit])

  function setField(name, value) {
    setValues((v) => ({ ...v, [name]: value }))
  }
  function setParentField(name, value) {
    setValues((v) => ({ ...v, parent: { ...v.parent, [name]: value } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        nom: values.nom, prenom: values.prenom, dateNaissance: values.dateNaissance,
        lieuNaissance: values.lieuNaissance, sexe: Number(values.sexe), langue: values.langue,
        actif: Number(values.actif), villeNaissance: values.villeNaissance,
      }
      if (isEdit) {
        await elevesApi.update(id, payload)
      } else {
        await elevesApi.create({
          ...payload,
          inscription: { idSalle: Number(values.idSalle), idAnnee: Number(values.idAnnee) },
          parent: values.withParent ? values.parent : undefined,
        })
      }
      navigate('/eleves')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div>
      <PageHeader title={isEdit ? 'Modifier un élève' : 'Nouvel élève'} subtitle="Renseignez les informations de l'élève" />
      <form onSubmit={handleSubmit}>
        <Card style={{ marginBottom: 16 }}>
          <Alert tone="error">{error}</Alert>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InputField label="Nom" required value={values.nom} onChange={(e) => setField('nom', e.target.value)} />
            <InputField label="Prénom" required value={values.prenom} onChange={(e) => setField('prenom', e.target.value)} />
            <InputField label="Date de naissance" type="date" required value={values.dateNaissance} onChange={(e) => setField('dateNaissance', e.target.value)} />
            <InputField label="Lieu de naissance" required value={values.lieuNaissance} onChange={(e) => setField('lieuNaissance', e.target.value)} />
            <InputField label="Ville de naissance" required value={values.villeNaissance} onChange={(e) => setField('villeNaissance', e.target.value)} />
            <SelectField label="Sexe" value={values.sexe} onChange={(e) => setField('sexe', e.target.value)}
              options={[{ value: '1', label: 'Masculin' }, { value: '0', label: 'Féminin' }]} />
            <SelectField label="Section" value={values.langue} onChange={(e) => setField('langue', e.target.value)}
              options={[
                { value: 'Anglophone', label: 'Anglophone' },
                { value: 'Francophone', label: 'Francophone' },
                { value: 'Bilingue', label: 'Bilingue' },
              ]} />
            <SelectField label="Statut" value={values.actif} onChange={(e) => setField('actif', e.target.value)}
              options={[{ value: '1', label: 'Actif' }, { value: '0', label: 'Inactif' }]} />
          </div>
        </Card>

        {!isEdit && (
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 14 }}>Inscription initiale</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SelectField label="Salle / Classe" required value={values.idSalle} onChange={(e) => setField('idSalle', e.target.value)}
                options={salles.map((s) => ({ value: s.idSalle, label: s.libelle || `Salle ${s.idSalle}` }))} />
              <SelectField label="Année académique" required value={values.idAnnee} onChange={(e) => setField('idAnnee', e.target.value)}
                options={annees.map((a) => ({ value: a.idAnnee, label: a.libelle }))} />
            </div>
          </Card>
        )}

        {!isEdit && (
          <Card style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: values.withParent ? 16 : 0 }}>
              <input type="checkbox" checked={values.withParent} onChange={(e) => setField('withParent', e.target.checked)} />
              Créer un compte parent/tuteur associé
            </label>
            {values.withParent && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <InputField label="Nom du parent" required value={values.parent.nom} onChange={(e) => setParentField('nom', e.target.value)} />
                <InputField label="Prénom du parent" required value={values.parent.prenom} onChange={(e) => setParentField('prenom', e.target.value)} />
                <InputField label="Identifiant de connexion" required value={values.parent.login} onChange={(e) => setParentField('login', e.target.value)} />
                <InputField label="Mot de passe" type="password" required value={values.parent.password} onChange={(e) => setParentField('password', e.target.value)} />
                <InputField label="Email" type="email" value={values.parent.email} onChange={(e) => setParentField('email', e.target.value)} />
                <InputField label="Mobile" value={values.parent.mobile} onChange={(e) => setParentField('mobile', e.target.value)} />
              </div>
            )}
          </Card>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/eleves')}>Annuler</Button>
        </div>
      </form>
    </div>
  )
}
