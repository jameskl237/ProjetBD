import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import { personnesApi } from '../../api/personnes.api'
import { useAuth } from '../../hooks/useAuth'

const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 999,
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)',
}

const fieldStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box',
  background: '#fff', color: 'var(--text-primary)',
}

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)',
}

export default function EnseignantCompte() {
  const { user } = useAuth()
  const [values, setValues] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    personnesApi.me().then(setValues).catch((e) => setError(e.response?.data?.error || 'Impossible de charger le profil'))
  }, [])

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      const payload = { nom: values.nom, prenom: values.prenom, email: values.email, mobile: values.mobile, phone: values.phone }
      const updated = await personnesApi.updateMe(payload)
      setValues(updated)
      setSuccess('Profil mis à jour avec succès.')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally { setSaving(false) }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const updated = await personnesApi.updateMe({ password })
      setValues(updated)
      setPassword(''); setConfirmPassword('')
      setSuccess('Mot de passe modifié avec succès.')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement de mot de passe')
    } finally { setSaving(false) }
  }

  if (!values) return <div><PageHeader title="Mon compte" subtitle="Gestion de votre profil enseignant" /><Spinner label="Chargement du profil…" /></div>

  const TABS = [
    { key: 'profile', label: 'Profil', icon: '👤' },
    { key: 'password', label: 'Mot de passe', icon: '🔒' },
  ]

  return (
    <div>
      <PageHeader
        title="Mon compte"
        subtitle="Gestion de votre profil enseignant"
      />

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
        border: 'none', color: '#fff', boxShadow: '0 16px 40px rgba(14, 116, 144, 0.20)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 26, fontWeight: 800, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
              border: '2px solid rgba(255,255,255,0.4)',
            }}>
              {(values.nom || '?')[0]}{(values.prenom || '?')[0]}
            </span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{values.nom} {values.prenom}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Enseignant — {user?.login || '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={pillStyle}>🎓 Enseignant</span>
            <span style={pillStyle}>📧 {values.email || '—'}</span>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'all .15s ease',
              border: activeTab === t.key ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              background: activeTab === t.key ? 'var(--accent)' : 'transparent',
              color: activeTab === t.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit}>
          <Card style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, background: 'var(--accent-light)', color: 'var(--accent)',
              }}>👤</span>
              Informations personnelles
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nom</label>
                <input style={fieldStyle} value={values.nom || ''} onChange={(e) => setValues((v) => ({ ...v, nom: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Prénom</label>
                <input style={fieldStyle} value={values.prenom || ''} onChange={(e) => setValues((v) => ({ ...v, prenom: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={fieldStyle} type="email" value={values.email || ''} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Mobile</label>
                <input style={fieldStyle} value={values.mobile || ''} onChange={(e) => setValues((v) => ({ ...v, mobile: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Téléphone fixe</label>
              <input style={{ ...fieldStyle, maxWidth: 310 }} value={values.phone || ''} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} />
            </div>

            <div style={{
              marginTop: 20, padding: '14px 16px', borderRadius: 'var(--radius-sm)',
              background: 'var(--border-light)', display: 'flex', gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Login</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{values.login || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sexe</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{values.sexe === 2 ? 'Féminin' : values.sexe === 1 ? 'Masculin' : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date de naissance</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {values.dateNaissance ? new Date(values.dateNaissance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lieu de naissance</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{values.lieuNaissance || '—'}</div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Button>
            </div>
          </Card>
        </form>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit}>
          <Card style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, background: 'var(--accent-light)', color: 'var(--accent)',
              }}>🔒</span>
              Changer le mot de passe
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nouveau mot de passe</label>
              <input style={fieldStyle} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 caractères" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <input style={fieldStyle} type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Retapez le mot de passe" />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>Les mots de passe ne correspondent pas.</div>
            )}
            {password && password.length < 8 && (
              <div style={{ fontSize: 12, color: 'var(--warning)', marginBottom: 12 }}>Le mot de passe doit contenir au moins 8 caractères.</div>
            )}

            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              background: '#fef3c7', border: '1px solid #fde68a', fontSize: 13, color: '#92400e', marginBottom: 16,
            }}>
              Assurez-vous d'utiliser un mot de passe fort contenant des lettres, des chiffres et des caractères spéciaux.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" disabled={saving || !password || !confirmPassword || password !== confirmPassword || password.length < 8}>
                {saving ? 'Modification…' : 'Modifier le mot de passe'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  )
}
