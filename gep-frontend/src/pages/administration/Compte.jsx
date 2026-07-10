import { useEffect, useState } from 'react'
import { api, dashboardApi } from '../../api'
import useAuth from '../../hooks/useAuth'
import './Compte.css'

const ROLE_LABELS = { 1: 'Directeur', 2: 'Secrétaire', 3: 'Comptable' }

export default function Compte() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profil')
  const [admin, setAdmin] = useState(null)
  const [stats, setStats] = useState(null)
  const [username, setUsername] = useState('')
  const [langue, setLangue] = useState('fr')
  const [loading, setLoading] = useState(true)
  const [profileFeedback, setProfileFeedback] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [passwords, setPasswords] = useState({ next: '', confirm: '' })
  const [securityFeedback, setSecurityFeedback] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    document.title = 'Gep Nebula — Compte'
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    Promise.all([api.get(`/admins/${user.id}`), dashboardApi.stats()])
      .then(([adminRes, statsRes]) => {
        if (cancelled) return
        setAdmin(adminRes.data)
        setUsername(adminRes.data.username || '')
        setLangue(adminRes.data.langue || 'fr')
        setStats(statsRes.data)
      })
      .catch(() => { if (!cancelled) setProfileFeedback('Impossible de charger les informations du compte.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  const initials = (username || user?.login || '?').slice(0, 2).toUpperCase()

  async function handleSaveProfile() {
    setIsSavingProfile(true)
    setProfileFeedback('')
    try {
      await api.put(`/admins/${user.id}`, { username, langue })
      setProfileFeedback('Profil mis à jour avec succès.')
    } catch (error) {
      setProfileFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la mise à jour.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    if (!passwords.next || passwords.next.length < 8) {
      setSecurityFeedback('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (passwords.next !== passwords.confirm) {
      setSecurityFeedback('Les mots de passe ne correspondent pas.')
      return
    }
    setIsSavingPassword(true)
    setSecurityFeedback('')
    try {
      await api.put(`/admins/${user.id}`, { password: passwords.next })
      setSecurityFeedback('Mot de passe mis à jour avec succès.')
      setPasswords({ next: '', confirm: '' })
    } catch (error) {
      setSecurityFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la mise à jour.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="account-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 Mon Compte</h1>
          <p className="page-subtitle">Gérez votre profil et votre sécurité.</p>
        </div>
      </div>

      <div className="account-tabs" role="tablist" aria-label="Compte">
        <button type="button" className={`atab ${tab === 'profil' ? 'active' : ''}`} onClick={() => setTab('profil')}>👤 Profil</button>
        <button type="button" className={`atab ${tab === 'securite' ? 'active' : ''}`} onClick={() => setTab('securite')}>🔒 Sécurité</button>
      </div>

      <div className={`tab-panel ${tab === 'profil' ? 'active' : ''}`}>
        <div className="profile-layout">
          <div>
            <div className="profile-card">
              <div className="profile-banner" />
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">{initials}</div>
              </div>
              <div className="profile-info-card">
                <div className="profile-name">{username || admin?.login || '—'}</div>
                <div className="profile-role-badge">🛡️ {ROLE_LABELS[admin?.typeAdmin] || 'Administrateur'}</div>
                {stats && (
                  <div className="profile-stats">
                    <div className="ps-item"><div className="ps-val">{stats.totals.eleves}</div><div className="ps-lbl">Élèves</div></div>
                    <div className="ps-item"><div className="ps-val">{stats.totals.enseignants}</div><div className="ps-lbl">Enseignants</div></div>
                    <div className="ps-item"><div className="ps-val">{stats.totals.classes}</div><div className="ps-lbl">Classes</div></div>
                  </div>
                )}
                <div className="profile-divider" />
                <div className="profile-meta-item"><div className="pm-icon">🔑</div><div className="pm-val">{admin?.login}</div></div>
                {admin?.createdAt && (
                  <div className="profile-meta-item"><div className="pm-icon">🗓️</div><div className="pm-val">Membre depuis {new Date(admin.createdAt).toLocaleDateString('fr-FR')}</div></div>
                )}
                <div className="profile-meta-item"><div className="pm-icon">{admin?.actif ? '✅' : '⛔'}</div><div className="pm-val">{admin?.actif ? 'Compte actif' : 'Compte désactivé'}</div></div>
              </div>
            </div>
          </div>

          <div className="form-sections">
            <div className="form-section">
              <div className="fs-header">
                <div>
                  <div className="fs-title">Informations personnelles</div>
                  <div className="fs-subtitle">Modifiez votre nom d'affichage et votre langue</div>
                </div>
                <button className="btn-save" type="button" onClick={handleSaveProfile} disabled={isSavingProfile || loading}>{isSavingProfile ? '⏳' : '💾'} Sauvegarder</button>
              </div>
              <div className="form-grid form-grid-profile">
                <div className="form-group"><label>Nom d'utilisateur</label><input className="form-input" value={username} onChange={e => setUsername(e.target.value)} /></div>
                <div className="form-group"><label>Login</label><input className="form-input" value={admin?.login || ''} disabled /></div>
                <div className="form-group">
                  <label>Langue</label>
                  <select className="form-select" value={langue} onChange={e => setLangue(e.target.value)}>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              {profileFeedback && <p className="hint">{profileFeedback}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className={`tab-panel ${tab === 'securite' ? 'active' : ''}`}>
        <div className="form-section">
          <div className="fs-header">
            <div>
              <div className="fs-title">🔐 Changer le mot de passe</div>
              <div className="fs-subtitle">Utilisez un mot de passe fort et unique (8 caractères minimum)</div>
            </div>
          </div>
          <div className="form-grid full password-grid">
            <div className="form-group"><label>Nouveau mot de passe</label><input className="form-input" type="password" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} placeholder="••••••••" /></div>
            <div className="form-group"><label>Confirmer</label><input className="form-input" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" /></div>
          </div>
          {securityFeedback && <p className="hint">{securityFeedback}</p>}
          <button className="btn-save full-btn" type="button" onClick={handleChangePassword} disabled={isSavingPassword}>{isSavingPassword ? '⏳' : '🔐'} Mettre à jour</button>
        </div>
      </div>
    </div>
  )
}
