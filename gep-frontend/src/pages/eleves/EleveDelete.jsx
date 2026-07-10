import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { eleveApi, api, anneeAcademiqueApi, extractList } from '../../api'
import Module33Layout from '../inscriptions/Module33Layout'

const MOTIFS = [
  { label: 'Transfert vers un autre établissement', value: 'transfert' },
  { label: 'Arrêt temporaire de scolarité', value: 'pause' },
  { label: 'Dossier incomplet / à régulariser', value: 'incomplet' },
  { label: 'Autre motif', value: 'autre' },
]

export default function Delete() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [eleve, setEleve] = useState(null)
  const [anneeActive, setAnneeActive] = useState(null)
  const [motif, setMotif] = useState('transfert')
  const [detail, setDetail] = useState('')
  const [confirmValue, setConfirmValue] = useState('')
  const [showOverlay, setShowOverlay] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadEleve() {
      try {
        const [eleveRes, anneesRes] = await Promise.all([eleveApi.get(id), anneeAcademiqueApi.list()])
        if (cancelled) return
        setEleve(eleveRes.data)
        const annees = extractList(anneesRes)
        const latest = annees.reduce((best, current) => (!best || current.idAnnee > best.idAnnee ? current : best), null)
        setAnneeActive(latest)
      } catch (error) {
        console.error('Failed to load eleve', error)
      }
    }
    loadEleve()
    return () => { cancelled = true }
  }, [id])

  const ready = confirmValue.trim().toUpperCase() === 'SUPPRIMER'
  const fullName = eleve ? `${eleve.prenom || ''} ${eleve.nom || ''}`.trim() : ''
  const initials = eleve ? `${(eleve.prenom?.[0] || 'E').toUpperCase()}${(eleve.nom?.[0] || 'L').toUpperCase()}` : '?'
  const matricule = eleve?.matricule || id
  const inscription = eleve?.inscriptions?.[0]
  const motifLabel = MOTIFS.find(item => item.value === motif)?.label || motif

  async function handleConfirm() {
    if (!ready) return
    setFeedback('')
    try {
      if (anneeActive) {
        await api.post('/parents/rapports', {
          matricule: Number(id),
          idAca: anneeActive.idAnnee,
          commentaire: `Désactivation du dossier — ${motifLabel}${detail ? ` : ${detail}` : ''}`,
          event_date: new Date().toISOString().slice(0, 10),
        })
      }
      await eleveApi.update(id, { actif: 0 })
      setShowOverlay(true)
    } catch (error) {
      console.error('Disable failed', error)
      setFeedback(error?.response?.data?.error || error?.message || 'Impossible de désactiver cet élève.')
    }
  }

  return (
    <>
      <Module33Layout breadcrumb={['Élèves', fullName, 'Désactiver']} backTo={`/eleves/show/${id}`}>
        <div className="module33-danger-hero">
          <div className="module33-danger-icon">🗑</div>
          <div className="module33-danger-title">Désactiver un élève</div>
          <div className="module33-danger-subtitle">L’élève sera retiré des listes actives. Le dossier restera consultable dans l’archive du module 3.3.</div>
        </div>

        <div className="module33-layout-card" style={{ marginBottom: 20 }}>
          <div className="module33-card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="module33-hero-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>{initials}</div>
            <div>
              <div className="module33-page-title" style={{ fontSize: 16 }}>{fullName}</div>
              <div className="module33-row-subtitle">{matricule}</div>
              <div className="module33-hero-tags" style={{ marginTop: 8 }}>
                <span className="module33-hero-tag primary">{inscription?.classe?.libelle || 'Non inscrit'} — Section {eleve?.langue || '—'}</span>
                <span className="module33-hero-tag cyan">{eleve?.sexe === 1 ? '♀ Fille' : '♂ Garçon'}</span>
                <span className="module33-hero-tag green">{inscription?.annee?.libelle || '—'}</span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className={`module33-row-tag ${eleve?.actif ? 'success' : 'warning'}`}><span className="bdot" />{eleve?.actif ? 'Actif' : 'Inactif'}</span>
            </div>
          </div>
        </div>

        <div className="module33-impact-grid" style={{ marginBottom: 20 }}>
          <div className="module33-impact-card warn">
            <div className="module33-impact-icon">📋</div>
            <div>
              <div className="module33-impact-title">Inscription retirée</div>
              <div className="module33-impact-description">L’élève ne figurera plus dans les listes actives de sa classe.</div>
            </div>
          </div>
          <div className="module33-impact-card info">
            <div className="module33-impact-icon">📝</div>
            <div>
              <div className="module33-impact-title">Notes conservées</div>
              <div className="module33-impact-description">Le bulletin et l’historique restent consultables dans l’archive.</div>
            </div>
          </div>
          <div className="module33-impact-card success">
            <div className="module33-impact-icon">🚌</div>
            <div>
              <div className="module33-impact-title">Transport suspendu</div>
              <div className="module33-impact-description">Le dossier transport sera mis en pause à la désactivation.</div>
            </div>
          </div>
          <div className="module33-impact-card danger">
            <div className="module33-impact-icon">⚠️</div>
            <div>
              <div className="module33-impact-title">Action réversible à vérifier</div>
              <div className="module33-impact-description">Mieux vaut valider le motif avant l’archivage définitif.</div>
            </div>
          </div>
        </div>

        <div className="module33-diff-box">
          <div className="module33-diff-title">Ce que fait la désactivation</div>
          <div className="module33-diff-grid">
            <div className="module33-diff-col success">
              <div className="module33-diff-label" style={{ color: 'var(--succes)' }}>Conservé</div>
              <div className="module33-impact-description">Notes, paiements et historique du dossier restent accessibles.</div>
            </div>
            <div className="module33-diff-col danger">
              <div className="module33-diff-label" style={{ color: 'var(--danger)' }}>Retiré</div>
              <div className="module33-impact-description">Affichage dans les listes actives, la classe et les sélections en cours.</div>
            </div>
          </div>
        </div>

        <div className="module33-card" style={{ marginBottom: 16 }}>
          <div className="module33-card-header">
            <div className="module33-card-icon amber">🧭</div>
            <div>
              <div className="module33-card-title">Motif de désactivation</div>
              <div className="module33-card-subtitle">Choisissez une raison avant de confirmer</div>
            </div>
          </div>
          <div className="module33-card-body">
            <div style={{ display: 'grid', gap: 8 }}>
              {MOTIFS.map(option => (
                <div
                  key={option.value}
                  className={`module33-radio-option${motif === option.value ? ' selected' : ''}`}
                  onClick={() => setMotif(option.value)}
                >
                  <div className="module33-radio-dot" />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
            <div className="module33-form-group" style={{ marginTop: 14 }}>
              <label className="module33-label">Précision complémentaire</label>
              <textarea className="module33-textarea" rows="4" value={detail} onChange={event => setDetail(event.target.value)} placeholder="Précisez le contexte si nécessaire..." />
            </div>
          </div>
        </div>

        <div className="module33-confirm-box">
          <div className="module33-confirm-label">
            Tapez <strong>SUPPRIMER</strong> pour confirmer la désactivation de <strong>{fullName}</strong>.
          </div>
          <input
            className={`module33-confirm-input${ready ? ' valid' : ''}`}
            type="text"
            value={confirmValue}
            onChange={event => setConfirmValue(event.target.value)}
            placeholder="SUPPRIMER"
          />
          <div className="module33-hint" style={{ marginTop: 6 }}>Cette confirmation reprend la logique du prototype HTML, avec une validation explicite.</div>
          {feedback && <div className="module33-hint" style={{ marginTop: 8, color: '#b91c1c' }}>{feedback}</div>}
        </div>

        <div className="module33-layout-card">
          <div className="module33-layout-card-footer module33-action-row">
            <button className="module33-button-secondary" type="button" onClick={() => navigate(`/eleves/show/${id}`)}>Annuler</button>
            <button className={`module33-button-danger${ready ? ' ready' : ''}`} type="button" onClick={handleConfirm}>Confirmer la désactivation</button>
          </div>
        </div>
      </Module33Layout>

      <div className={`module33-overlay${showOverlay ? ' show' : ''}`}>
        <div className="module33-overlay-card">
          <div className="module33-overlay-icon">✅</div>
          <div className="module33-overlay-title">Élève désactivé</div>
          <div className="module33-overlay-description">Le dossier a été archivé. Vous pouvez revenir à la liste pour continuer la gestion du module 3.3.</div>
          <button className="module33-button" type="button" onClick={() => navigate('/eleves')}>Retour à la liste</button>
        </div>
      </div>
    </>
  )
}
