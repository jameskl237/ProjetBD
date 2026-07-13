import { useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { adminsApi } from '../../api/admin.api'
import { useAuth } from '../../hooks/useAuth'
import { isDirecteur } from '../../config/navigation'

const TYPES = [
  { value: '1', label: 'Directeur' },
  { value: '2', label: 'Secrétaire' },
  { value: '3', label: 'Comptable' },
]

const ROLE_TABS = [
  { key: 'all', label: 'Tous les comptes' },
  { key: '1', label: 'Directeurs' },
  { key: '2', label: 'Secrétaires' },
  { key: '3', label: 'Comptables' },
]

const ROLE_COLORS = {
  '1': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', spine: '#f59e0b' },
  '2': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6', spine: '#3b82f6' },
  '3': { bg: '#d1fae5', text: '#065f46', border: '#10b981', spine: '#10b981' },
}

const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 999,
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)',
}

const TAB_BASE = {
  fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13.5, padding: '11px 20px 10px',
  cursor: 'pointer', userSelect: 'none', borderRadius: '10px 10px 0 0',
  color: 'var(--text-muted)', background: 'var(--border-light)',
  position: 'relative', top: 6, transition: 'top .16s, background .16s, color .16s',
  display: 'flex', alignItems: 'center', gap: 8, border: 'none', outline: 'none',
}

export default function Comptes() {
  const { data, loading, error, reload } = useResource(adminsApi)
  const { user } = useAuth()
  const canWrite = isDirecteur(user)
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [fRole, setFRole] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => {
    const total = data.length
    const actifs = data.filter((d) => d.actif === 1).length
    const directeurs = data.filter((d) => d.typeAdmin === 1).length
    const inactifs = total - actifs
    return { total, actifs, directeurs, inactifs }
  }, [data])

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchTab = activeTab === 'all' || d.typeAdmin === Number(activeTab)
      const matchRole = !fRole || d.typeAdmin === Number(fRole)
      const matchStatus = fStatus === '' || (fStatus === 'active' && d.actif === 1) || (fStatus === 'inactive' && d.actif === 0)
      const term = search.trim().toLowerCase()
      const matchSearch = !term || (d.username?.toLowerCase().includes(term)) || (d.login?.toLowerCase().includes(term))
      return matchTab && matchRole && matchStatus && matchSearch
    })
  }, [data, activeTab, fRole, fStatus, search])

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  function openCreate() {
    setModal({ mode: 'create', values: { login: '', username: '', typeAdmin: '2', password: '' } })
    setFormError('')
  }

  function openEdit(row) {
    setModal({ mode: 'edit', values: { ...row, password: '' } })
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      const v = modal.values
      const payload = { login: v.login, username: v.username, typeAdmin: Number(v.typeAdmin) }
      if (modal.mode === 'create') await adminsApi.create({ ...payload, password: v.password })
      else await adminsApi.update(v.ID, { ...payload, ...(v.password ? { password: v.password } : {}) })
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  async function handleToggle(row) {
    await adminsApi.toggleActif(row.ID, row.actif ? 0 : 1)
    reload()
  }

  if (loading) return <div style={{ padding: 40 }}><Spinner label="Chargement des comptes…" /></div>

  return (
    <div>
      {/* ── Gradient Hero ── */}
      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, var(--accent) 0%, #0f766e 100%)',
        border: 'none', color: '#fff',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Système · Utilisateurs
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Gestion des comptes
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Créez et administrez les accès du personnel : activation, rôle et sécurité.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={pillStyle}>🔑 {stats.total} comptes</span>
            <span style={pillStyle}>✅ {stats.actifs} actifs</span>
            <span style={pillStyle}>👑 {stats.directeurs} directeur{stats.directeurs > 1 ? 's' : ''}</span>
          </div>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {!canWrite && <Alert tone="info">Réservé au directeur.</Alert>}

      {/* ── Binder Tabs ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 0, paddingLeft: 4, flexWrap: 'wrap' }}>
        {ROLE_TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const tabColor = ROLE_COLORS[tab.key] || { bg: 'var(--accent-light)', text: 'var(--accent)' }
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...TAB_BASE,
                top: isActive ? 0 : 6,
                background: isActive
                  ? (tab.key === 'all' ? 'var(--card-bg)' : tabColor.bg)
                  : 'var(--border-light)',
                color: isActive
                  ? (tab.key === 'all' ? 'var(--text-primary)' : tabColor.text)
                  : 'var(--text-muted)',
                boxShadow: isActive ? '0 -4px 10px rgba(15, 23, 42, 0.07)' : 'none',
                zIndex: isActive ? 2 : 1,
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: isActive
                  ? (tab.key === 'all' ? 'var(--text-primary)' : tabColor.border)
                  : 'currentColor',
                opacity: isActive ? 1 : 0.45,
              }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Folder Card ── */}
      <Card style={{
        padding: 0, borderTopLeftRadius: 0, boxShadow: 'var(--shadow-md)',
        borderTop: `3px solid ${
          activeTab === '1' ? ROLE_COLORS['1'].border
            : activeTab === '2' ? ROLE_COLORS['2'].border
            : activeTab === '3' ? ROLE_COLORS['3'].border
            : 'var(--text-primary)'
        }`,
      }}>
        <div style={{ padding: '28px 30px 32px' }}>
          {/* ── Stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 26 }}>
            {[
              { label: 'Comptes au total', value: stats.total, note: `${stats.actifs} actifs`, accent: 'var(--text-primary)', key: 'all' },
              { label: 'Directeurs', value: data.filter((d) => d.typeAdmin === 1).length, note: `${data.filter((d) => d.typeAdmin === 1 && d.actif).length} actif(s)`, accent: ROLE_COLORS['1'].spine, key: '1' },
              { label: 'Secrétaires', value: data.filter((d) => d.typeAdmin === 2).length, note: `${data.filter((d) => d.typeAdmin === 2 && d.actif).length} actif(s)`, accent: ROLE_COLORS['2'].spine, key: '2' },
              { label: 'Comptables', value: data.filter((d) => d.typeAdmin === 3).length, note: `${data.filter((d) => d.typeAdmin === 3 && d.actif).length} actif(s)`, accent: ROLE_COLORS['3'].spine, key: '3' },
            ].map((s) => (
              <div key={s.key} style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: '15px 16px',
                position: 'relative', overflow: 'hidden', cursor: 'pointer',
                transition: 'box-shadow .15s, border-color .15s',
              }}
                onClick={() => setActiveTab(s.key)}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.accent }} />
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.2px', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 25, color: 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>{s.note}</div>
              </div>
            ))}
          </div>

          {/* ── Filter Bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            paddingBottom: 22, marginBottom: 22, borderBottom: '1px dashed var(--border-strong)',
          }}>
            <div style={{ minWidth: 160 }}>
              <SelectField
                value={fRole}
                onChange={(e) => setFRole(e.target.value)}
                options={[{ value: '', label: 'Tous les rôles' }, ...TYPES]}
                style={{ marginBottom: 0, padding: '9px 12px', fontSize: 13.5 }}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <SelectField
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value)}
                options={[
                  { value: '', label: 'Tous les statuts' },
                  { value: 'active', label: 'Actif' },
                  { value: 'inactive', label: 'Inactif' },
                ]}
                style={{ marginBottom: 0, padding: '9px 12px', fontSize: 13.5 }}
              />
            </div>
            <span style={{
              fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)',
              background: 'var(--border-light)', padding: '5px 10px', borderRadius: 20,
            }}>
              {filtered.length} compte{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            </span>
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
              <input
                type="search"
                placeholder="Rechercher un nom ou un login…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  fontFamily: 'var(--font)', fontSize: 13.5, color: 'var(--text-primary)',
                  border: '1px solid var(--border-strong)', background: 'var(--card-bg)',
                  borderRadius: 8, padding: '9px 12px 9px 32px', outline: 'none', width: 260,
                  transition: 'border-color .15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--text-primary)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)' }}
              />
            </div>
          </div>

          {/* ── Action Button ── */}
          {canWrite && (
            <div style={{ marginBottom: 20 }}>
              <Button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                ＋ Créer un compte
              </Button>
            </div>
          )}

          {/* ── Account Cards ── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
              <div style={{ fontSize: 14 }}>Aucun compte ne correspond à ces critères. Essayez d'ajuster les filtres.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((row) => {
                const rc = ROLE_COLORS[row.typeAdmin] || ROLE_COLORS['2']
                const typeName = TYPES.find((t) => Number(t.value) === row.typeAdmin)?.label || 'Inconnu'
                return (
                  <div
                    key={row.ID}
                    style={{
                      border: '1px solid var(--border)', borderRadius: 11, background: 'var(--card-bg)',
                      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
                      transition: 'box-shadow .18s, border-color .18s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    {/* Spine */}
                    <div style={{ width: 6, flexShrink: 0, background: rc.spine }} />

                    {/* Identity */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                      flex: '1 1 340px', minWidth: 260,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 11, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 15,
                        background: rc.bg, color: rc.text, flexShrink: 0,
                      }}>
                        {getInitials(row.username)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font)', fontWeight: 600, fontSize: 15.5,
                          color: 'var(--text-primary)', marginBottom: 3,
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          {row.username || row.login}
                          <span style={{
                            fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            textTransform: 'uppercase', letterSpacing: '0.4px',
                            background: rc.bg, color: rc.text,
                          }}>
                            {typeName}
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          📧 {row.login}
                        </div>
                      </div>
                    </div>

                    {/* Middle: role + status */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 26, padding: '16px 20px',
                      flex: '1 1 280px', borderLeft: '1px dashed var(--border-strong)',
                    }}>
                      <div>
                        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Rôle</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{typeName}</div>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600,
                        color: row.actif ? 'var(--success-text, #065f46)' : 'var(--text-muted)',
                      }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          background: row.actif ? 'var(--success, #10b981)' : 'var(--text-muted)',
                        }} />
                        {row.actif ? 'Actif' : 'Inactif'}
                      </div>
                    </div>

                    {/* Actions */}
                    {canWrite && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '16px 18px',
                        borderLeft: '1px dashed var(--border-strong)', flexShrink: 0,
                        position: 'relative',
                      }}>
                        {/* Perforation circles */}
                        <div style={{
                          position: 'absolute', left: -6, top: -6, width: 11, height: 11,
                          borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--border)',
                        }} />
                        <div style={{
                          position: 'absolute', left: -6, bottom: -6, width: 11, height: 11,
                          borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--border)',
                        }} />
                        <button
                          onClick={() => openEdit(row)}
                          title="Modifier"
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-strong)',
                            background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all .15s', fontSize: 14,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = '#fff' }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--card-bg)' }}
                        >✏️</button>
                        <button
                          onClick={() => handleToggle(row)}
                          title={row.actif ? 'Désactiver' : 'Activer'}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-strong)',
                            background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all .15s', fontSize: 14,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--warning, #f59e0b)'; e.currentTarget.style.color = 'var(--warning, #f59e0b)'; e.currentTarget.style.background = '#fff' }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--card-bg)' }}
                        >{row.actif ? '🔒' : '🔓'}</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* ── Modal ── */}
      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Nouveau compte admin' : 'Modifier le compte'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Nom d'utilisateur" value={modal.values.username}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, username: e.target.value } }))} />
            <InputField label="Identifiant de connexion" required value={modal.values.login}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, login: e.target.value } }))} />
            <SelectField label="Rôle" required value={String(modal.values.typeAdmin)}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, typeAdmin: e.target.value } }))} options={TYPES} />
            <InputField
              label={modal.mode === 'create' ? 'Mot de passe' : 'Nouveau mot de passe (optionnel)'}
              type="password" required={modal.mode === 'create'}
              value={modal.values.password}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, password: e.target.value } }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
