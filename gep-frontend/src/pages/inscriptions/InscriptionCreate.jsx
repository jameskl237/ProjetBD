import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Module34Layout from './Module34Layout'
import { anneeAcademiqueApi, classeApi, eleveApi, inscriptionApi, salleApi, extractList } from '../../api'

const INITIAL_FORM = {
  observations: '',
  eleveId: '',
  classeId: '',
  anneeAcademiqueId: '',
  salleId: '',
}

export default function Create() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [eleves, setEleves] = useState([])
  const [classes, setClasses] = useState([])
  const [salles, setSalles] = useState([])
  const [annees, setAnnees] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    async function loadOptions() {
      try {
        const [elevesResponse, classesResponse, anneesResponse, sallesResponse] = await Promise.all([
          eleveApi.list(),
          classeApi.list(),
          anneeAcademiqueApi.list(),
          salleApi.list(),
        ])
        const elevesData = extractList(elevesResponse)
        const classesData = extractList(classesResponse)
        const anneesData = extractList(anneesResponse)
        const sallesData = extractList(sallesResponse)
        setEleves(elevesData)
        setClasses(classesData)
        setAnnees(anneesData)
        setSalles(sallesData)
        const latestAnnee = anneesData.reduce((best, current) => (!best || current.idAnnee > best.idAnnee ? current : best), null)
        setForm(previous => ({
          ...previous,
          eleveId: previous.eleveId || String(elevesData[0]?.matricule || ''),
          classeId: previous.classeId || String(classesData[0]?.idClasse || ''),
          anneeAcademiqueId: previous.anneeAcademiqueId || String(latestAnnee?.idAnnee || ''),
        }))
      } catch (error) {
        console.error('Failed to load inscription options', error)
        setFeedback('Impossible de charger les élèves/classes/années depuis le backend.')
      }
    }
    loadOptions()
  }, [])

  const sallesForClasse = useMemo(
    () => salles.filter(salle => String(salle.idClasse) === String(form.classeId)),
    [salles, form.classeId],
  )

  useEffect(() => {
    setForm(previous => ({ ...previous, salleId: sallesForClasse[0] ? String(sallesForClasse[0].idSalle) : '' }))
  }, [sallesForClasse])

  const selectedEleve = eleves.find(e => String(e.matricule) === String(form.eleveId))
  const selectedClasse = classes.find(c => String(c.idClasse) === String(form.classeId))
  const selectedAnnee = annees.find(a => String(a.idAnnee) === String(form.anneeAcademiqueId))

  function updateField(field, value) {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.eleveId || !form.salleId || !form.anneeAcademiqueId) {
      setFeedback('Veuillez choisir un élève, une classe avec une salle disponible, et une année académique.')
      return
    }

    setIsSubmitting(true)
    setFeedback('')
    try {
      await inscriptionApi.create({
        matricule: Number(form.eleveId),
        idSalle: Number(form.salleId),
        idAnnee: Number(form.anneeAcademiqueId),
        commentaire: form.observations || '',
      })
      navigate('/inscriptions')
    } catch (error) {
      console.error('Create inscription failed', error)
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la création de l’inscription.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Module34Layout breadcrumb={['Inscriptions', 'Nouvelle inscription']} backTo="/inscriptions">
      <div className="module34-page-header">
        <div>
          <h1 className="module34-page-title">Nouvelle inscription</h1>
          <p className="module34-page-subtitle">Associez un élève à une classe et une salle pour une année scolaire.</p>
        </div>
      </div>

      <div className="module34-grid-2">
        <div>
          <div className="module34-card" style={{ marginBottom: 16 }}>
            <div className="module34-card-header"><div className="module34-card-icon ci-v">👦</div><div><div className="module34-card-title">Sélection de l'élève</div><div className="module34-card-subtitle">Choisissez l'élève à affecter</div></div></div>
            <div className="module34-card-body">
              <div className="module34-form-group">
                <label className="module34-label">Élève</label>
                <select className="module34-select" value={form.eleveId} onChange={event => updateField('eleveId', event.target.value)}>
                  <option value="">Sélectionner…</option>
                  {eleves.map(eleve => <option key={eleve.matricule} value={eleve.matricule}>{`${eleve.prenom || ''} ${eleve.nom || ''}`.trim() || `Élève #${eleve.matricule}`}</option>)}
                </select>
              </div>
              <div className="module34-form-row cols-2">
                <div className="module34-form-group">
                  <label className="module34-label">Classe</label>
                  <select className="module34-select" value={form.classeId} onChange={event => updateField('classeId', event.target.value)}>
                    <option value="">Sélectionner…</option>
                    {classes.map(classe => <option key={classe.idClasse} value={classe.idClasse}>{classe.libelle}</option>)}
                  </select>
                </div>
                <div className="module34-form-group">
                  <label className="module34-label">Salle</label>
                  <select className="module34-select" value={form.salleId} onChange={event => updateField('salleId', event.target.value)}>
                    {sallesForClasse.length === 0 && <option value="">Aucune salle pour cette classe</option>}
                    {sallesForClasse.map(salle => <option key={salle.idSalle} value={salle.idSalle}>{salle.libelle}</option>)}
                  </select>
                </div>
              </div>
              <div className="module34-form-group">
                <label className="module34-label">Année scolaire</label>
                <select className="module34-select" value={form.anneeAcademiqueId} onChange={event => updateField('anneeAcademiqueId', event.target.value)}>
                  <option value="">Sélectionner…</option>
                  {annees.map(annee => <option key={annee.idAnnee} value={annee.idAnnee}>{annee.libelle}</option>)}
                </select>
              </div>
              <div className="module34-form-group"><label className="module34-label">Observations</label><textarea className="module34-textarea" rows="4" value={form.observations} onChange={event => updateField('observations', event.target.value)} /></div>
            </div>
          </div>

          <div className="module34-footer">
            <button className="module34-button-secondary" type="button" onClick={() => navigate('/inscriptions')}>Annuler</button>
            <button className="module34-button" type="button" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Enregistrer l’inscription'}</button>
          </div>
          {feedback && <div className="module34-card" style={{ marginTop: 12, padding: 12, color: feedback.startsWith('Erreur') ? '#b91c1c' : undefined }}>{feedback}</div>}
        </div>

        <aside className="module34-summary-card">
          <div className="module34-summary-hero"><div className="module34-summary-avatar">{selectedEleve ? `${(selectedEleve.prenom?.[0] || '')}${(selectedEleve.nom?.[0] || '')}` : '—'}</div></div>
          <div className="module34-summary-body">
            <div className="module34-summary-name">{selectedEleve ? `${selectedEleve.prenom || ''} ${selectedEleve.nom || ''}`.trim() : 'Aucun élève sélectionné'}</div>
            <div className="module34-summary-id">{selectedEleve?.matricule || '—'}</div>
            <div className="module34-summary-divider" />
            <div className="module34-summary-row"><span className="module34-summary-label">Section</span><span className="module34-summary-value">{selectedEleve?.langue || '—'}</span></div>
            <div className="module34-summary-row"><span className="module34-summary-label">Classe</span><span className="module34-summary-value">{selectedClasse?.libelle || '—'}</span></div>
            <div className="module34-summary-row"><span className="module34-summary-label">Année</span><span className="module34-summary-value">{selectedAnnee?.libelle || '—'}</span></div>
          </div>
        </aside>
      </div>
    </Module34Layout>
  )
}
