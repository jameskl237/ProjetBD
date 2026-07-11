import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, getDashboardPath } from '../../config/navigation'
import BrandLogo from '../../components/ui/BrandLogo'
import Alert from '../../components/ui/Alert'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [identifiant, setIdentifiant] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!identifiant.trim() || !password.trim()) {
      setError('Veuillez renseigner votre identifiant et votre mot de passe.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const user = await login(identifiant.trim(), password)
      navigate(getDashboardPath(getRoleKey(user)), { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 1fr',
      background: 'var(--bg)',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 72px',
        background: 'radial-gradient(circle at 20% 20%, #2E1065, var(--sidebar-bg) 60%)', color: '#fff',
      }} className="hidden md:flex">
        <BrandLogo size={54} />
        <h1 style={{ fontFamily: 'var(--font)', fontSize: 34, fontWeight: 800, marginTop: 28, lineHeight: 1.2 }}>
          GEP <span style={{ color: 'var(--cyan)' }}>Nebular</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, maxWidth: 380, fontSize: 15, lineHeight: 1.6 }}>
          La plateforme unifiée de gestion scolaire : élèves, classes, notes, paiements,
          transport et communication — dans un seul espace, pour chaque acteur de l'établissement.
        </p>
        <div style={{ display: 'flex', gap: 28, marginTop: 40 }}>
          {[['Administration', '⊞'], ['Enseignants', '🎓'], ['Parents', '👨‍👩‍👧']].map(([label, icon]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Connexion</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 6, marginBottom: 24 }}>
            Accédez à votre espace avec votre identifiant.
          </p>

          <Alert tone="error">{error}</Alert>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Identifiant</label>
          <input
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            placeholder="ex: directeur"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 16, fontSize: 14 }}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 24, fontSize: 14 }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 'var(--radius-sm)', background: 'var(--accent)',
              color: '#fff', fontWeight: 700, fontSize: 14.5, opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
