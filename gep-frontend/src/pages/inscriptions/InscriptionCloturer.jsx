import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Module34Layout from './Module34Layout'
import { inscriptionApi, extractData } from '../../api'
import { mapInscriptionToRow } from '../../utils/apiMappers'

export default function Cloturer() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [inscription, setInscription] = useState(null)
  const [confirmValue, setConfirmValue] = useState('')
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)

  const ready = confirmValue.trim().toUpperCase() === 'CLOTURER'

  useEffect(() => {
    if (!id) return
    let cancelled = false
    inscriptionApi.get(id)
      .then(response => { if (!cancelled) setInscription(mapInscriptionToRow(extractData(response))) })
      .catch(error => { console.error('Failed to load inscription', error) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  async function handleCloseInscription() {
    if (!ready || !id) return
    setFeedback('')
    try {
      await inscriptionApi.remove(id)
      setOpen(true)
    } catch (error) {
      console.error('Close inscription failed', error)
      setFeedback(error?.response?.data?.error || error?.message || 'Impossible de clôturer cette inscription.')
    }
  }

  if (loading || !inscription) {
    return (
      <Module34Layout breadcrumb={['Inscriptions', 'Clôturer']} backTo="/inscriptions">
        <div className="module34-panel"><div className="module34-panel-body">Chargement…</div></div>
      </Module34Layout>
    )
  }

  return (
    <>
      <Module34Layout breadcrumb={['Inscriptions', inscription.id, 'Clôturer']} backTo={id ? `/inscriptions/show/${id}` : '/inscriptions'}>
        <div className="module34-page-header">
          <div>
            <h1 className="module34-page-title">Clôturer une inscription</h1>
            <p className="module34-page-subtitle">Cette action supprime définitivement l'affectation de l'élève à cette classe pour cette année scolaire.</p>
          </div>
        </div>

        <div className="module34-alert">
          <div className="module34-alert-icon">⚠️</div>
          <div>
            <div className="module34-alert-title">Action irréversible</div>
            <div className="module34-alert-desc">La clôture supprime l'inscription. Vérifiez les paiements avant de procéder.</div>
          </div>
        </div>

        <div className="module34-grid-2">
          <div>
            <div className="module34-panel">
              <div className="module34-panel-header"><div className="module34-card-icon ci-a">📋</div><div><div className="module34-panel-title">Confirmation</div><div className="module34-panel-subtitle">Tapez CLOTURER pour confirmer</div></div></div>
              <div className="module34-panel-body">
                <div className="module34-form-group">
                  <label className="module34-label">Tapez « CLOTURER » pour confirmer</label>
                  <input className="module34-input" value={confirmValue} onChange={event => setConfirmValue(event.target.value)} placeholder="CLOTURER" />
                </div>
              </div>
            </div>

            <div className="module34-footer">
              <button className="module34-button-secondary" type="button" onClick={() => navigate(id ? `/inscriptions/show/${id}` : '/inscriptions')}>Annuler</button>
              <button className="module34-button-danger" type="button" onClick={handleCloseInscription} disabled={!ready}>Confirmer la clôture</button>
            </div>
            {feedback && <div className="module34-panel" style={{ marginTop: 12 }}><div className="module34-panel-body" style={{ color: '#b91c1c' }}>{feedback}</div></div>}
          </div>

          <aside className="module34-summary-card">
            <div className="module34-summary-hero"><div className="module34-summary-avatar">{inscription.initials}</div></div>
            <div className="module34-summary-body">
              <div className="module34-summary-name">{inscription.fullName}</div>
              <div className="module34-summary-id">{inscription.id}</div>
              <div className="module34-summary-divider" />
              <div className="module34-summary-row"><span className="module34-summary-label">Section</span><span className="module34-summary-value">{inscription.section}</span></div>
              <div className="module34-summary-row"><span className="module34-summary-label">Classe</span><span className="module34-summary-value">{inscription.className}</span></div>
              <div className="module34-summary-row"><span className="module34-summary-label">Année</span><span className="module34-summary-value">{inscription.year}</span></div>
            </div>
          </aside>
        </div>
      </Module34Layout>

      <div className={`module34-overlay${open ? ' show' : ''}`}>
        <div className="module34-overlay-card">
          <div className="module34-overlay-icon">✅</div>
          <div className="module34-overlay-title">Inscription clôturée</div>
          <div className="module34-overlay-description">L'inscription a été supprimée. Vous pouvez revenir à la liste pour continuer la gestion des inscriptions.</div>
          <button className="module34-button" type="button" onClick={() => navigate('/inscriptions')}>Retour à la liste</button>
        </div>
      </div>
    </>
  )
}
