import { useEffect, useState } from 'react'
import { annonceApi, parentApi, extractList } from '../../api'
import useAuth from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

export default function Annonces() {
  const { user } = useAuth()
  const canCompose = getRoleKey(user) !== ROLES.PARENT
  const [notices, setNotices] = useState([])
  const [parents, setParents] = useState([])
  const [titre, setTitre] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function loadNotices() {
    setLoading(true)
    try {
      const [messagesRes, parentsRes] = await Promise.all([annonceApi.list(), parentApi.list()])
      const msgs = extractList(messagesRes)
        .filter(m => m.valider)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 10)
      setNotices(msgs)
      setParents(extractList(parentsRes))
    } catch (error) {
      console.error('Failed to load annonces', error)
      setFeedback('Impossible de charger les annonces depuis le backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadNotices() }, [])

  async function handlePublish() {
    if (!titre.trim() || !message.trim()) {
      setFeedback('Le titre et le message sont obligatoires.')
      return
    }
    if (parents.length === 0) {
      setFeedback('Aucun lien parent-élève enregistré : impossible de publier une annonce pour le moment.')
      return
    }
    setIsPublishing(true)
    setFeedback('')
    try {
      await annonceApi.create({
        idParent: parents[0].idParent,
        objet: titre.trim(),
        subject: titre.trim(),
        information: message.trim(),
        content: message.trim(),
        type_message: 2,
        receiverRole: 'all',
        receiverLabel: 'Toute la communauté',
      })
      setTitre('')
      setMessage('')
      setFeedback('Annonce publiée avec succès.')
      loadNotices()
    } catch (error) {
      console.error('Publish annonce failed', error)
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la publication.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Annonces & communication</h1>
          <p className="page-subtitle">Publier les informations importantes pour les équipes et les familles</p>
        </div>
      </div>

      {feedback && <div className="card" style={{ padding: 16, marginBottom: 16 }}>{feedback}</div>}

      <div className="dashboard-highlight-grid">
        {canCompose && (
          <div className="card dashboard-section-card">
            <div className="dashboard-section-header">
              <div>
                <p className="dashboard-section-kicker">Composer</p>
                <h2 className="activities-title">Brouillon rapide</h2>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Titre</label>
              <input className="form-input" value={titre} onChange={e => setTitre(e.target.value)} placeholder="Réunion de rentrée" />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-input" rows="6" value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez l'annonce à publier..." />
            </div>
            <button className="btn-primary" type="button" onClick={handlePublish} disabled={isPublishing}>{isPublishing ? 'Publication…' : 'Publier'}</button>
          </div>
        )}

        <div className="card dashboard-section-card">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-section-kicker">Publications récentes</p>
              <h2 className="activities-title">Panneau de diffusion</h2>
            </div>
          </div>
          <div className="dashboard-notice-list">
            {!loading && notices.length === 0 && <p className="hint">Aucune annonce publiée pour le moment.</p>}
            {notices.map(item => (
              <div key={item.idMessages} className="dashboard-notice-item">
                <div className="dashboard-notice-icon">📢</div>
                <div className="dashboard-notice-content">
                  <p className="dashboard-notice-title">{item.objet || item.subject}</p>
                  <p className="dashboard-notice-meta">{item.created_at ? new Date(item.created_at).toLocaleString('fr-FR') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
