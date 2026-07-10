import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eleveApi, villeApi, classeApi, salleApi, anneeAcademiqueApi, extractList } from '../../api'
import Module33Layout from '../inscriptions/Module33Layout'
import { module33Sections } from '../inscriptions/module33Data'

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  birthDate: '',
  birthPlace: '',
  gender: 'M',
  section: 'Francophone',
  villeNaissance: '',
  classeId: '',
  salleId: '',
  anneeId: '',
  parentFirstName: '',
  parentLastName: '',
  parentEmail: '',
  parentMobile: '',
  parentLogin: '',
  parentPassword: '',
}

function getInitials(firstName, lastName) {
  return `${(firstName[0] || 'E').toUpperCase()}${(lastName[0] || 'L').toUpperCase()}`
}

export default function Create() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [villes, setVilles] = useState([])
  const [classes, setClasses] = useState([])
  const [salles, setSalles] = useState([])
  const [annees, setAnnees] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  useEffect(() => {
    let cancelled = false
    Promise.all([villeApi.list(), classeApi.list(), salleApi.list(), anneeAcademiqueApi.list()])
      .then(([villesRes, classesRes, sallesRes, anneesRes]) => {
        if (cancelled) return
        setVilles(extractList(villesRes))
        const classesData = extractList(classesRes)
        const anneesData = extractList(anneesRes)
        setClasses(classesData)
        setSalles(extractList(sallesRes))
        setAnnees(anneesData)
        const latestAnnee = anneesData.reduce((best, current) => (!best || current.idAnnee > best.idAnnee ? current : best), null)
        setForm(previous => ({
          ...previous,
          classeId: previous.classeId || String(classesData[0]?.idClasse || ''),
          anneeId: previous.anneeId || String(latestAnnee?.idAnnee || ''),
        }))
      })
      .catch(() => { if (!cancelled) setFeedback({ type: 'warning', message: 'Impossible de charger les listes de villes/classes/salles/années.' }) })
    return () => { cancelled = true }
  }, [])

  const sallesForClasse = useMemo(
    () => salles.filter(salle => String(salle.idClasse) === String(form.classeId)),
    [salles, form.classeId],
  )

  useEffect(() => {
    setForm(previous => ({ ...previous, salleId: sallesForClasse[0] ? String(sallesForClasse[0].idSalle) : '' }))
  }, [sallesForClasse])

  const summaryName = [form.firstName, form.lastName].filter(Boolean).join(' ') || 'Nom non saisi...'
  const summaryInitials = getInitials(form.firstName, form.lastName)
  const summaryGender = form.gender === 'M' ? 'Masculin' : 'Féminin'

  function updateField(field, value) {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.birthDate || !form.villeNaissance.trim()) {
      setFeedback({
        type: 'warning',
        message: 'Veuillez remplir les champs obligatoires (prénom, nom, date de naissance, ville de naissance).',
      })
      return
    }

    if (!form.classeId || !form.salleId || !form.anneeId) {
      setFeedback({
        type: 'warning',
        message: "Veuillez choisir une classe (avec une salle disponible) et une année scolaire pour l'affectation de l'élève.",
      })
      return
    }

    if (!form.parentFirstName || !form.parentLastName || !form.parentLogin || !form.parentPassword) {
      setFeedback({
        type: 'warning',
        message: 'Veuillez remplir les champs obligatoires du parent (prénom, nom, identifiant, mot de passe).',
      })
      return
    }

    if (form.parentPassword.length < 8) {
      setFeedback({
        type: 'warning',
        message: 'Le mot de passe du parent doit contenir au moins 8 caractères.',
      })
      return
    }

    setIsSubmitting(true)
    setFeedback({ type: '', message: '' })

    try {
      const payload = {
        nom: form.lastName,
        prenom: form.firstName,
        dateNaissance: form.birthDate,
        lieuNaissance: form.birthPlace || 'Non renseigné',
        sexe: form.gender === 'F' ? 1 : 0,
        langue: form.section,
        photoURL: '',
        actif: 1,
        villeNaissance: form.villeNaissance.trim(),
        isDelete: 0,
        inscription: {
          idSalle: Number(form.salleId),
          idAnnee: Number(form.anneeId),
        },
        parent: {
          nom: form.parentLastName,
          prenom: form.parentFirstName,
          login: form.parentLogin,
          password: form.parentPassword,
          email: form.parentEmail || undefined,
          mobile: form.parentMobile || undefined,
        },
      }

      const response = await eleveApi.create(payload)
      const matricule = response?.data?.eleve?.matricule
      setFeedback({
        type: 'success',
        message: 'Élève créé avec succès!',
      })
      setTimeout(() => navigate(matricule ? `/eleves/show/${matricule}` : '/eleves'), 1200)
    } catch (error) {
      console.error('Create failed', error)
      setFeedback({
        type: 'error',
        message: error?.response?.data?.error || error?.message || 'Erreur lors de la création.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Module33Layout breadcrumb={['Élèves', 'Nouvel élève']} backTo="/eleves">
      <div className="module33-page-header">
        <div>
          <h1 className="module33-page-title">Ajouter un élève</h1>
          <p className="module33-page-subtitle">Enregistrez l'état civil de l'élève, sa classe d'affectation et son parent/tuteur.</p>
        </div>
      </div>

      <div className="module33-grid-2" style={{ alignItems: 'start' }}>
        <div>
          <div className="module33-card" style={{ marginBottom: 16 }}>
            <div className="module33-card-header">
              <div className="module33-card-icon">👦</div>
              <div>
                <div className="module33-card-title">Informations personnelles</div>
                <div className="module33-card-subtitle">Données d’état civil de l’élève</div>
              </div>
            </div>
            <div className="module33-card-body">
              <div className="module33-form-row cols-2">
                <div className="module33-form-group">
                  <label className="module33-label">Nom *</label>
                  <input className="module33-input" type="text" value={form.lastName} onChange={event => updateField('lastName', event.target.value)} placeholder="Ex : Mbarga" />
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Prénom(s) *</label>
                  <input className="module33-input" type="text" value={form.firstName} onChange={event => updateField('firstName', event.target.value)} placeholder="Ex : Emile Jean" />
                </div>
              </div>

              <div className="module33-form-row cols-3">
                <div className="module33-form-group">
                  <label className="module33-label">Date de naissance *</label>
                  <input className="module33-input" type="date" value={form.birthDate} onChange={event => updateField('birthDate', event.target.value)} />
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Lieu de naissance</label>
                  <input className="module33-input" type="text" value={form.birthPlace} onChange={event => updateField('birthPlace', event.target.value)} placeholder="Ex : Quartier, ville" />
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Ville de naissance *</label>
                  <input
                    className="module33-input"
                    type="text"
                    list="villes-suggestions"
                    value={form.villeNaissance}
                    onChange={event => updateField('villeNaissance', event.target.value)}
                    placeholder="Ex : Yaoundé"
                  />
                  <datalist id="villes-suggestions">
                    {villes.map(ville => (
                      <option key={ville.idVille} value={ville.libelle} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="module33-form-row cols-2">
                <div className="module33-form-group">
                  <label className="module33-label">Sexe *</label>
                  <div className="module33-radio-group">
                    <div className={`module33-radio-option${form.gender === 'M' ? ' selected' : ''}`} onClick={() => updateField('gender', 'M')}>
                      <div className="module33-radio-dot" />
                      <span>♂ Masculin</span>
                    </div>
                    <div className={`module33-radio-option${form.gender === 'F' ? ' selected' : ''}`} onClick={() => updateField('gender', 'F')}>
                      <div className="module33-radio-dot" />
                      <span>♀ Féminin</span>
                    </div>
                  </div>
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Section *</label>
                  <select className="module33-select" value={form.section} onChange={event => updateField('section', event.target.value)}>
                    {module33Sections.filter(item => item !== 'Tous').map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="module33-card" style={{ marginBottom: 16 }}>
            <div className="module33-card-header">
              <div className="module33-card-icon">🏫</div>
              <div>
                <div className="module33-card-title">Affectation à une classe</div>
                <div className="module33-card-subtitle">L'élève est inscrit dans cette classe dès sa création</div>
              </div>
            </div>
            <div className="module33-card-body">
              <div className="module33-form-row cols-2">
                <div className="module33-form-group">
                  <label className="module33-label">Classe *</label>
                  <select className="module33-select" value={form.classeId} onChange={event => updateField('classeId', event.target.value)}>
                    <option value="">Sélectionner…</option>
                    {classes.map(classe => <option key={classe.idClasse} value={classe.idClasse}>{classe.libelle}</option>)}
                  </select>
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Salle *</label>
                  <select className="module33-select" value={form.salleId} onChange={event => updateField('salleId', event.target.value)}>
                    {sallesForClasse.length === 0 && <option value="">Aucune salle pour cette classe</option>}
                    {sallesForClasse.map(salle => <option key={salle.idSalle} value={salle.idSalle}>{salle.libelle}</option>)}
                  </select>
                </div>
              </div>
              <div className="module33-form-group">
                <label className="module33-label">Année scolaire *</label>
                <select className="module33-select" value={form.anneeId} onChange={event => updateField('anneeId', event.target.value)}>
                  <option value="">Sélectionner…</option>
                  {annees.map(annee => <option key={annee.idAnnee} value={annee.idAnnee}>{annee.libelle}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="module33-card" style={{ marginBottom: 16 }}>
            <div className="module33-card-header">
              <div className="module33-card-icon">👨‍👩‍👧</div>
              <div>
                <div className="module33-card-title">Parent / Tuteur</div>
                <div className="module33-card-subtitle">Un compte parent est créé automatiquement avec ces informations</div>
              </div>
            </div>
            <div className="module33-card-body">
              <div className="module33-form-row cols-2">
                <div className="module33-form-group">
                  <label className="module33-label">Nom *</label>
                  <input className="module33-input" type="text" value={form.parentLastName} onChange={event => updateField('parentLastName', event.target.value)} placeholder="Ex : Mbarga" />
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Prénom(s) *</label>
                  <input className="module33-input" type="text" value={form.parentFirstName} onChange={event => updateField('parentFirstName', event.target.value)} placeholder="Ex : Paul" />
                </div>
              </div>

              <div className="module33-form-row cols-2">
                <div className="module33-form-group">
                  <label className="module33-label">Email</label>
                  <input className="module33-input" type="email" value={form.parentEmail} onChange={event => updateField('parentEmail', event.target.value)} placeholder="parent@exemple.com" />
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Téléphone</label>
                  <input className="module33-input" type="tel" value={form.parentMobile} onChange={event => updateField('parentMobile', event.target.value)} placeholder="Ex : 6 12 34 56 78" />
                </div>
              </div>

              <div className="module33-form-row cols-2">
                <div className="module33-form-group">
                  <label className="module33-label">Identifiant de connexion *</label>
                  <input className="module33-input" type="text" value={form.parentLogin} onChange={event => updateField('parentLogin', event.target.value)} placeholder="Ex : paul.mbarga" autoComplete="off" />
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Mot de passe *</label>
                  <input className="module33-input" type="password" value={form.parentPassword} onChange={event => updateField('parentPassword', event.target.value)} placeholder="8 caractères minimum" autoComplete="new-password" />
                </div>
              </div>
            </div>
          </div>

          <div className="module33-layout-card">
            {feedback.message && (
              <div className={`module33-status-banner ${feedback.type === 'error' ? 'error' : feedback.type === 'warning' ? 'warning' : 'success'}`} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14 }}>{feedback.message}</div>
              </div>
            )}
            <div className="module33-layout-card-footer module33-form-footer">
                <button className="module33-button-secondary" type="button" onClick={() => navigate('/eleves')} disabled={isSubmitting}>✕ Annuler</button>
              <button className="module33-button" type="button" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? '⏳ Enregistrement...' : '✓ Enregistrer l\'élève'}</button>
            </div>
          </div>
        </div>

        <div>
          <div className="module33-summary-card">
            <div className="module33-summary-hero">
              <div className="module33-summary-avatar">{summaryInitials}</div>
            </div>
            <div className="module33-summary-body">
              <div className="module33-summary-name" style={summaryName === 'Nom non saisi...' ? { color: 'var(--texte-sec)', fontStyle: 'italic', fontSize: 12, fontWeight: 400 } : undefined}>
                {summaryName}
              </div>
              <div className="module33-summary-divider" />
              <div className="module33-summary-line">
                <span className="module33-summary-label">Section</span>
                <span className={`module33-summary-value${form.section ? '' : ' placeholder'}`}>{form.section || '—'}</span>
              </div>
              <div className="module33-summary-line">
                <span className="module33-summary-label">Classe</span>
                <span className={`module33-summary-value${form.classeId ? '' : ' placeholder'}`}>{classes.find(c => String(c.idClasse) === String(form.classeId))?.libelle || '—'}</span>
              </div>
              <div className="module33-summary-line">
                <span className="module33-summary-label">Date de naissance</span>
                <span className={`module33-summary-value${form.birthDate ? '' : ' placeholder'}`}>{form.birthDate || '—'}</span>
              </div>
              <div className="module33-summary-line">
                <span className="module33-summary-label">Sexe</span>
                <span className="module33-summary-value">{summaryGender}</span>
              </div>
              <div className="module33-summary-divider" />
              <div className="module33-status-banner success">
                <div style={{ fontSize: 14 }}>ℹ️</div>
                <div>
                  <div className="module33-status-title">Matricule automatique</div>
                  <div className="module33-status-subtitle">Il sera attribué par la base de données à l'enregistrement.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="module33-layout-card" style={{ marginTop: 16 }}>
            <div className="module33-layout-card-body">
              <div className="module33-card-title" style={{ marginBottom: 12 }}>Prochaines étapes</div>
              <div className="module33-hint">L'élève est directement inscrit dans la classe et la salle choisies pour l'année scolaire sélectionnée. Le compte du parent est créé automatiquement avec l'identifiant et le mot de passe renseignés.</div>
            </div>
          </div>
        </div>
      </div>
    </Module33Layout>
  )
}
