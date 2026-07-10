import { useEffect, useState } from 'react'
import { api, extractList } from '../../api'
import useAuth from '../../hooks/useAuth'
import './Parametres.css'

const ROLE_LABELS = { 1: 'Directeur', 2: 'Secrétaire', 3: 'Comptable' }

const INITIAL_FORM = { login: '', username: '', password: '', typeAdmin: 2 }
const INITIAL_PENSION_FORM = { inscription: '', pension: '', description: '' }

export default function Parametres() {
  const { user } = useAuth()
  const isDirecteur = user?.typeAdmin === 1
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [classesPension, setClassesPension] = useState([])
  const [pensionLoading, setPensionLoading] = useState(true)
  const [pensionEdit, setPensionEdit] = useState(null)
  const [pensionForm, setPensionForm] = useState(INITIAL_PENSION_FORM)
  const [pensionSubmitting, setPensionSubmitting] = useState(false)
  const [pensionFeedback, setPensionFeedback] = useState('')

  useEffect(() => {
    document.title = 'Gep Nebula — Paramètres'
  }, [])

  async function loadClassesPension() {
    setPensionLoading(true)
    try {
      const response = await api.get('/scolarite/classes')
      setClassesPension(extractList(response))
    } catch (error) {
      console.error('Failed to load classes pension', error)
      setPensionFeedback('Impossible de charger la pension par classe.')
    } finally {
      setPensionLoading(false)
    }
  }

  useEffect(() => { loadClassesPension() }, [])

  function openPensionEdit(classe) {
    setPensionEdit(classe)
    setPensionForm({
      inscription: classe.scolarite?.inscription ?? '',
      pension: classe.scolarite?.pension ?? '',
      description: classe.scolarite?.description ?? `Scolarité ${classe.libelle}`,
    })
    setPensionFeedback('')
  }

  async function handlePensionSubmit() {
    if (!pensionForm.pension || !pensionForm.inscription) {
      setPensionFeedback('Inscription et pension sont requises.')
      return
    }
    setPensionSubmitting(true)
    setPensionFeedback('')
    try {
      const payload = {
        idClasse: pensionEdit.idClasse,
        inscription: Number(pensionForm.inscription),
        pension: Number(pensionForm.pension),
        description: pensionForm.description || `Scolarité ${pensionEdit.libelle}`,
      }
      if (pensionEdit.scolarite) {
        await api.put(`/scolarite/${pensionEdit.scolarite.idScolarite}`, payload)
      } else {
        await api.post('/scolarite', payload)
      }
      setPensionEdit(null)
      loadClassesPension()
    } catch (error) {
      setPensionFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de l\'enregistrement.')
    } finally {
      setPensionSubmitting(false)
    }
  }

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

      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">💰</div>
          <div>
            <div className="section-title">Pension par classe</div>
            <div className="section-desc">
              {isDirecteur
                ? 'Fixez la pension de chaque classe — elle est automatiquement divisée en 3 tranches (1 par trimestre).'
                : 'Réservée au directeur. Vue en lecture seule.'}
            </div>
          </div>
        </div>
        <div className="section-body">
          {pensionFeedback && <p style={{ color: '#b91c1c', fontSize: 13 }}>{pensionFeedback}</p>}
          {pensionLoading ? (
            <p>Chargement…</p>
          ) : classesPension.length === 0 ? (
            <p>Aucune classe trouvée.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: 12, color: '#6b7280' }}>
                  <th style={{ padding: '8px 4px' }}>Classe</th>
                  <th style={{ padding: '8px 4px' }}>Filière (cycle)</th>
                  <th style={{ padding: '8px 4px' }}>Pension annuelle</th>
                  <th style={{ padding: '8px 4px' }}>Tranche (1/3)</th>
                  {isDirecteur && <th style={{ padding: '8px 4px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {classesPension.map(classe => (
                  <tr key={classe.idClasse} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '8px 4px' }}>{classe.libelle}</td>
                    <td style={{ padding: '8px 4px' }}>{classe.cycle?.libelle || '—'}</td>
                    <td style={{ padding: '8px 4px' }}>{classe.scolarite ? `${Number(classe.scolarite.pension).toLocaleString('fr-FR')} FCFA` : 'Non configurée'}</td>
                    <td style={{ padding: '8px 4px' }}>{classe.scolarite ? `${(Number(classe.scolarite.pension) / 3).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} FCFA` : '—'}</td>
                    {isDirecteur && (
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                        <button className="btn-sec" type="button" onClick={() => openPensionEdit(classe)}>
                          {classe.scolarite ? 'Modifier' : 'Configurer'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {pensionEdit && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setPensionEdit(null) }}>
          <div className="modal">
            <div className="modal-head"><div><div className="modal-title">💰 Pension — {pensionEdit.libelle}</div></div><button className="modal-close" onClick={() => setPensionEdit(null)}>✕</button></div>
            <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
              {pensionFeedback && <p style={{ color: '#b91c1c', fontSize: 13 }}>{pensionFeedback}</p>}
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Frais d'inscription (FCFA)</label>
                <input type="number" className="search-input" style={{ width: '100%' }} value={pensionForm.inscription} onChange={e => setPensionForm(f => ({ ...f, inscription: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Pension annuelle (FCFA)</label>
                <input type="number" className="search-input" style={{ width: '100%' }} value={pensionForm.pension} onChange={e => setPensionForm(f => ({ ...f, pension: e.target.value }))} />
                {pensionForm.pension > 0 && (
                  <p style={{ fontSize: 12, color: '#6b7280' }}>Soit {(Number(pensionForm.pension) / 3).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} FCFA par tranche (3 tranches, 1 par trimestre).</p>
                )}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Description</label>
                <input className="search-input" style={{ width: '100%' }} value={pensionForm.description} onChange={e => setPensionForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="modal-foot"><button className="mf-out" onClick={() => setPensionEdit(null)}>Annuler</button><button className="mf-sol" onClick={handlePensionSubmit} disabled={pensionSubmitting}>{pensionSubmitting ? 'Enregistrement…' : 'Enregistrer'}</button></div>
          </div>
        </div>
      )}

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
