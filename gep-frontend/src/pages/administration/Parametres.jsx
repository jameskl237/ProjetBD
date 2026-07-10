import { useEffect, useState } from 'react'
import { api, extractList } from '../../api'
import './Parametres.css'

const ROLE_LABELS = { 1: 'Directeur', 2: 'Secrétaire', 3: 'Comptable' }

const INITIAL_FORM = { login: '', username: '', password: '', typeAdmin: 2 }

export default function Parametres() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Gep Nebula — Paramètres'
  }, [])

  async function loadAdmins() {
    setLoading(true)
    try {
      const response = await api.get('/admins')
      setAdmins(extractList(response))
    } catch (error) {
      console.error('Failed to load admins', error)
      setFeedback('Impossible de charger les comptes administrateurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAdmins() }, [])

  async function toggleActif(admin) {
    try {
      await api.put(`/admins/${admin.ID}/actif`, { actif: admin.actif ? 0 : 1 })
      loadAdmins()
    } catch (error) {
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la mise à jour.')
    }
  }

  async function removeAdmin(admin) {
    try {
      await api.delete(`/admins/${admin.ID}`)
      loadAdmins()
    } catch (error) {
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la suppression.')
    }
  }

  async function handleCreate() {
    if (!form.login.trim() || form.password.length < 8) {
      setFeedback('Login requis et mot de passe d’au moins 8 caractères.')
      return
    }
    setIsSubmitting(true)
    setFeedback('')
    try {
      await api.post('/admins', {
        login: form.login.trim(),
        username: form.username.trim() || undefined,
        password: form.password,
        typeAdmin: Number(form.typeAdmin),
      })
      setCreateOpen(false)
      setForm(INITIAL_FORM)
      loadAdmins()
    } catch (error) {
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la création du compte.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="params-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Paramètres</h1>
          <p className="page-subtitle">Gérez les comptes administrateurs de l'établissement</p>
        </div>
        <div className="header-actions">
          <button className="btn-prim" type="button" onClick={() => setCreateOpen(true)}>＋ Nouveau compte</button>
        </div>
      </div>

      {feedback && <div className="settings-section" style={{ padding: 16 }}>{feedback}</div>}

      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">🛡️</div>
          <div>
            <div className="section-title">Comptes administrateurs</div>
            <div className="section-desc">Directeurs, secrétaires et comptables ayant accès à l'administration</div>
          </div>
        </div>
        <div className="section-body">
          {loading ? (
            <p>Chargement…</p>
          ) : admins.length === 0 ? (
            <p>Aucun compte administrateur trouvé.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: 12, color: '#6b7280' }}>
                  <th style={{ padding: '8px 4px' }}>Login</th>
                  <th style={{ padding: '8px 4px' }}>Nom</th>
                  <th style={{ padding: '8px 4px' }}>Rôle</th>
                  <th style={{ padding: '8px 4px' }}>Statut</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.ID} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '8px 4px' }}>{admin.login}</td>
                    <td style={{ padding: '8px 4px' }}>{admin.username || '—'}</td>
                    <td style={{ padding: '8px 4px' }}>{ROLE_LABELS[admin.typeAdmin] || '—'}</td>
                    <td style={{ padding: '8px 4px' }}>{admin.actif ? '✅ Actif' : '⛔ Inactif'}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                      <button className="btn-sec" type="button" onClick={() => toggleActif(admin)} style={{ marginRight: 8 }}>
                        {admin.actif ? 'Désactiver' : 'Activer'}
                      </button>
                      <button className="btn-danger" type="button" onClick={() => removeAdmin(admin)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {createOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setCreateOpen(false) }}>
          <div className="modal">
            <div className="modal-head"><div><div className="modal-title">＋ Nouveau compte administrateur</div></div><button className="modal-close" onClick={() => setCreateOpen(false)}>✕</button></div>
            <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Login</label>
                <input className="search-input" style={{ width: '100%' }} value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Nom d'utilisateur</label>
                <input className="search-input" style={{ width: '100%' }} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Mot de passe</label>
                <input type="password" className="search-input" style={{ width: '100%' }} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Rôle</label>
                <select className="search-input" style={{ width: '100%' }} value={form.typeAdmin} onChange={e => setForm(f => ({ ...f, typeAdmin: e.target.value }))}>
                  <option value={1}>Directeur</option>
                  <option value={2}>Secrétaire</option>
                  <option value={3}>Comptable</option>
                </select>
              </div>
            </div>
            <div className="modal-foot"><button className="mf-out" onClick={() => setCreateOpen(false)}>Annuler</button><button className="mf-sol" onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? 'Création…' : 'Créer'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
