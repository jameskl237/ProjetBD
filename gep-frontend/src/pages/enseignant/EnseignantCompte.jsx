import { useEffect, useState } from 'react'
import { compteApi } from '../../api'
import useAuth from '../../hooks/useAuth'
import '../../pages/administration/Compte.css'

export default function EnseignantCompte() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profil')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileFeedback, setProfileFeedback] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [username, setUsername] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')

  const [passwords, setPasswords] = useState({ next: '', confirm: '' })
  const [securityFeedback, setSecurityFeedback] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => { document.title = 'GEP Nebula — Mon Compte' }, [])

  useEffect(() => {
    let cancelled = false
    compteApi.get()
      .then(res => {
        if (cancelled) return
        const data = res.data
        setProfile(data)
        setUsername(data.username || '')
        setPrenom(data.prenom || '')
        setNom(data.nom || '')
        setEmail(data.email || '')
        setMobile(data.mobile || '')
      })
      .catch(() => { if (!cancelled) setProfileFeedback('Impossible de charger les informations du compte.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const initials = ((prenom || '') + ' ' + (nom || '')).trim().slice(0, 2).toUpperCase() || user?.login?.slice(0, 2).toUpperCase() || '?'

  async function handleSaveProfile() {
    setIsSavingProfile(true)
    setProfileFeedback('')
    try {
      await compteApi.update({ username, prenom, nom, email, mobile })
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
      await compteApi.update({ password: passwords.next })
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
                <div className="profile-name">{prenom} {nom || '—'}</div>
                <div className="profile-role-badge">🎓 Enseignant</div>
                <div className="profile-divider" />
                <div className="profile-meta-item"><div className="pm-icon">🔑</div><div className="pm-val">{profile?.login || user?.login || '—'}</div></div>
                {profile?.created_at && (
                  <div className="profile-meta-item"><div className="pm-icon">🗓️</div><div className="pm-val">Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR')}</div></div>
                )}
                <div className="profile-meta-item"><div className="pm-icon">{profile?.actif ? '✅' : '⛔'}</div><div className="pm-val">{profile?.actif ? 'Compte actif' : 'Compte désactivé'}</div></div>
              </div>
            </div>
          </div>

          <div className="form-sections">
            <div className="form-section">
              <div className="fs-header">
                <div>
                  <div className="fs-title">Informations personnelles</div>
                  <div className="fs-subtitle">Modifiez vos informations de profil</div>
                </div>
                <button className="btn-save" type="button" onClick={handleSaveProfile} disabled={isSavingProfile || loading}>{isSavingProfile ? '⏳' : '💾'} Sauvegarder</button>
              </div>
              <div className="form-grid form-grid-profile">
                <div className="form-group"><label>Prénom</label><input className="form-input" value={prenom} onChange={e => setPrenom(e.target.value)} /></div>
                <div className="form-group"><label>Nom</label><input className="form-input" value={nom} onChange={e => setNom(e.target.value)} /></div>
                <div className="form-group"><label>Nom d'utilisateur</label><input className="form-input" value={username} onChange={e => setUsername(e.target.value)} /></div>
                <div className="form-group"><label>Login</label><input className="form-input" value={profile?.login || ''} disabled /></div>
                <div className="form-group"><label>Email</label><input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="form-group"><label>Téléphone</label><input className="form-input" value={mobile} onChange={e => setMobile(e.target.value)} /></div>
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
