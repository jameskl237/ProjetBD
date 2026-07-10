import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { eleveApi, villeApi, extractList } from '../../api'
import Module33Layout from '../inscriptions/Module33Layout'
import { module33Sections } from '../inscriptions/module33Data'
import { toDateInput } from '../../utils/apiMappers'

const INITIAL_STATE = {
  firstName: '',
  lastName: '',
  birthDate: '',
  birthPlace: '',
  gender: 'M',
  section: 'Francophone',
  villeNaissance: '',
}

export default function Edit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(INITIAL_STATE)
  const [villes, setVilles] = useState([])
  const [inscription, setInscription] = useState(null)
  const [tuteur, setTuteur] = useState(null)
  const [dirty, setDirty] = useState(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setIsLoading(true)
      try {
        const [eleveRes, villesRes] = await Promise.all([eleveApi.get(id), villeApi.list()])
        if (cancelled) return
        const eleve = eleveRes.data
        setForm({
          firstName: eleve.prenom || '',
          lastName: eleve.nom || '',
          birthDate: toDateInput(eleve.dateNaissance),
          birthPlace: eleve.lieuNaissance || '',
          gender: eleve.sexe === 1 ? 'F' : 'M',
          section: eleve.langue || 'Francophone',
          villeNaissance: eleve.ville?.libelle || '',
        })
        setInscription(eleve.inscriptions?.[0] || null)
        setTuteur(eleve.tuteurs?.[0]?.tuteur || null)
        setVilles(extractList(villesRes))
      } catch (error) {
        console.error('Failed to load eleve', error)
        setFeedback({ type: 'error', message: "Impossible de charger les données de l'élève." })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [id])

  const summaryName = [form.firstName, form.lastName].filter(Boolean).join(' ')
  const diffCount = dirty.size

  const summaryState = useMemo(() => ({
    name: summaryName || 'Nom non saisi...',
    section: form.section,
    gender: form.gender === 'M' ? 'Masculin' : 'Féminin',
  }), [form, summaryName])

  function updateField(field, value) {
    setForm(previous => ({ ...previous, [field]: value }))
    setDirty(previous => {
      const next = new Set(previous)
      if (INITIAL_STATE[field] === value) next.delete(field)
      else next.add(field)
      return next
    })
  }

  async function handleSave() {
    if (!form.firstName || !form.lastName || !form.birthDate || !form.villeNaissance.trim()) {
      setFeedback({ type: 'warning', message: 'Veuillez remplir les champs obligatoires.' })
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
        villeNaissance: form.villeNaissance.trim(),
      }

      await eleveApi.update(id, payload)
      setFeedback({ type: 'success', message: 'Élève mis à jour avec succès!' })
      setTimeout(() => navigate(`/eleves/show/${id}`), 1200)
    } catch (error) {
      console.error('Update failed', error)
      setFeedback({
        type: 'error',
        message: error?.response?.data?.error || error?.message || 'Erreur lors de la mise à jour.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Module33Layout breadcrumb={['Élèves', 'Charger...', 'Modifier']} backTo="/eleves">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>Chargement des données...</div>
      </Module33Layout>
    )
  }

  return (
    <Module33Layout breadcrumb={['Élèves', summaryName, 'Modifier']} backTo="/eleves">
      <div className="module33-page-header">
        <div>
          <h1 className="module33-page-title">Modifier l’élève</h1>
          <p className="module33-page-subtitle">Seules les informations d'état civil sont modifiables ici. Gérez la classe depuis Inscriptions et le tuteur depuis Parents.</p>
        </div>
      </div>

      <div className="module33-grid-2" style={{ alignItems: 'start' }}>
        <div>
          <div className={`module33-status-banner${diffCount > 0 ? ' warning' : ' success'}`}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: diffCount > 0 ? 'var(--avertissement)' : 'var(--succes)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{diffCount}</div>
            <div>
              <div className="module33-status-title">{diffCount > 0 ? `${diffCount} champ(s) modifié(s)` : 'Aucune modification'}</div>
              <div className="module33-status-subtitle">Sauvegardez quand vous êtes prêt.</div>
            </div>
          </div>

          <div className="module33-card" style={{ marginTop: 16, marginBottom: 16 }}>
            <div className="module33-card-header">
              <div className="module33-card-icon">👤</div>
              <div>
                <div className="module33-card-title">Informations personnelles</div>
                <div className="module33-card-subtitle">Données d’état civil</div>
              </div>
            </div>
            <div className="module33-card-body">
              <div className="module33-form-row cols-2">
                <div className="module33-form-group">
                  <label className="module33-label">Nom *</label>
                  <input className="module33-input" value={form.lastName} onChange={event => updateField('lastName', event.target.value)} />
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Prénom(s) *</label>
                  <input className="module33-input" value={form.firstName} onChange={event => updateField('firstName', event.target.value)} />
                </div>
              </div>
              <div className="module33-form-row cols-3">
                <div className="module33-form-group">
                  <label className="module33-label">Date de naissance *</label>
                  <input className="module33-input" type="date" value={form.birthDate} onChange={event => updateField('birthDate', event.target.value)} />
                </div>
                <div className="module33-form-group">
                  <label className="module33-label">Lieu de naissance</label>
                  <input className="module33-input" value={form.birthPlace} onChange={event => updateField('birthPlace', event.target.value)} />
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

          <div className="module33-layout-card">
            {feedback.message && (
              <div className={`module33-status-banner ${feedback.type === 'error' ? 'error' : feedback.type === 'warning' ? 'warning' : 'success'}`} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14 }}>{feedback.message}</div>
              </div>
            )}
            <div className="module33-layout-card-footer">
              <button className="module33-button-secondary" type="button" onClick={() => navigate(`/eleves/show/${id}`)} disabled={isSubmitting}>Annuler</button>
              <button className="module33-button" type="button" onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? '⏳ Mise à jour...' : 'Enregistrer les modifications'}</button>
            </div>
          </div>
        </div>

        <div>
          <div className="module33-card" style={{ marginBottom: 16 }}>
            <div className="module33-card-header">
              <div className="module33-card-icon amber">📌</div>
              <div>
                <div className="module33-card-title">Synthèse</div>
                <div className="module33-card-subtitle">Prévisualisation du dossier</div>
              </div>
            </div>
            <div className="module33-card-body">
              <div className="module33-summary-card" style={{ position: 'static' }}>
                <div className="module33-summary-body">
                  <div className="module33-summary-name">{summaryState.name}</div>
                  <div className="module33-summary-id">{id}</div>
                  <div className="module33-summary-divider" />
                  <div className="module33-summary-line">
                    <span className="module33-summary-label">Classe actuelle</span>
                    <span className="module33-summary-value">{inscription?.classe?.libelle || 'Non inscrit'}</span>
                  </div>
                  <div className="module33-summary-line">
                    <span className="module33-summary-label">Section</span>
                    <span className="module33-summary-value">{summaryState.section}</span>
                  </div>
                  <div className="module33-summary-line">
                    <span className="module33-summary-label">Sexe</span>
                    <span className="module33-summary-value">{summaryState.gender}</span>
                  </div>
                  <div className="module33-summary-line">
                    <span className="module33-summary-label">Tuteur</span>
                    <span className="module33-summary-value">{tuteur ? `${tuteur.prenom || ''} ${tuteur.nom || ''}`.trim() : 'Aucun'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="module33-card">
            <div className="module33-card-header">
              <div className="module33-card-icon cyan">🛠</div>
              <div>
                <div className="module33-card-title">Raccourcis</div>
                <div className="module33-card-subtitle">Actions rapides sur le dossier</div>
              </div>
            </div>
            <div className="module33-card-body" style={{ display: 'grid', gap: 10 }}>
              <button className="module33-button-secondary" type="button" onClick={() => navigate(`/eleves/show/${id}`)}>Voir la fiche</button>
              <button className="module33-button-secondary" type="button" onClick={() => navigate('/inscriptions')}>Gérer l'inscription</button>
              <button className="module33-button-danger" type="button" onClick={() => navigate(`/eleves/delete/${id}`)}>Désactiver le dossier</button>
              <button className="module33-button" type="button" onClick={() => navigate('/eleves')}>Retour à la liste</button>
            </div>
          </div>
        </div>
      </div>
    </Module33Layout>
  )
}
