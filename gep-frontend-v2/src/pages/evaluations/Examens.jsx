import { useEffect, useState, useMemo } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { sessionsApi, epreuvesApi, naturesApi, epreuveValidationApi } from '../../api/evaluations.api'
import { trimestresApi } from '../../api/annees.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const TABS = [
  { key: 'sessions', label: 'Sessions d\'examen', icon: '📋' },
  { key: 'epreuves', label: 'Épreuves', icon: '📝' },
  { key: 'natures', label: 'Natures d\'épreuve', icon: '🏷️' },
]

const NATURE_COLORS = ['#4C1D95', '#0369a1', '#047857', '#b45309', '#be123c']

export default function Examens() {
  const [tab, setTab] = useState('sessions')
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isAdmin = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE

  const sessions = useResource(sessionsApi)
  const epreuves = useResource(epreuvesApi)
  const natures = useResource(naturesApi)
  const [trimestres, setTrimestres] = useState([])
  const [annees, setAnnees] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { trimestresApi.list().then(setTrimestres).catch(() => {}); anneesApi.list().then(setAnnees).catch(() => {}) }, [])

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions.data
    return sessions.data.filter((s) =>
      `${s.libelle} ${s.responsable?.nom || ''} ${s.responsable?.prenom || ''} ${s.trimestre?.libelle || ''}`.toLowerCase().includes(q)
    )
  }, [sessions.data, search])

  const filteredEpreuves = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return epreuves.data
    return epreuves.data.filter((e) =>
      `${e.libelle} ${e.nature?.libelle || ''} ${e.auteur || ''}`.toLowerCase().includes(q)
    )
  }, [epreuves.data, search])

  const filteredNatures = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return natures.data
    return natures.data.filter((n) =>
      `${n.libelle} ${n.description || ''}`.toLowerCase().includes(q)
    )
  }, [natures.data, search])

  const stats = useMemo(() => ({
    sessions: sessions.data.length,
    epreuves: epreuves.data.length,
    natures: natures.data.length,
  }), [sessions.data, epreuves.data, natures.data])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      if (modal.kind === 'session') {
        const p = { libelle: modal.values.libelle, description: modal.values.description, idTrimestre: Number(modal.values.idTrimestre), idPers: user.id, date_passage: modal.values.date_passage || undefined }
        if (modal.mode === 'edit') await sessionsApi.update(modal.values.idSession, p); else await sessionsApi.create(p)
        sessions.reload()
      } else if (modal.kind === 'epreuve') {
        const p = { libelle: modal.values.libelle, idNature: Number(modal.values.idNature), urlDoc: modal.values.urlDoc, auteur: modal.values.auteur }
        if (modal.mode === 'edit') await epreuvesApi.update(modal.values.idEpreuve, p); else await epreuvesApi.create(p)
        epreuves.reload()
      } else {
        const p = { libelle: modal.values.libelle, description: modal.values.description, idAnnee: modal.values.idAnnee ? Number(modal.values.idAnnee) : null }
        await naturesApi.create(p)
        natures.reload()
      }
      setModal(null)
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur lors de l\'enregistrement') }
  }

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 4000) }

  async function handleValiderEpreuve(id) {
    try {
      await epreuveValidationApi.valider(id)
      flash('Épreuve validée avec succès')
      epreuves.reload()
    } catch (err) { flash(err.response?.data?.error || 'Erreur lors de la validation') }
  }

  async function handleRejeterEpreuve(id) {
    try {
      await epreuveValidationApi.rejeter(id)
      flash('Épreuve rejetée')
      epreuves.reload()
    } catch (err) { flash(err.response?.data?.error || 'Erreur lors du rejet') }
  }
  const loading = sessions.loading || epreuves.loading || natures.loading

  return (
    <div>
      <PageHeader
        title="Examens"
        subtitle="Sessions, épreuves et natures d'épreuve"
        actions={
          tab === 'sessions' && isAdmin ? <Button onClick={() => setModal({ mode: 'create', kind: 'session', values: { libelle: '', description: '', idTrimestre: '', date_passage: '' } })}>＋ Session</Button> :
          tab === 'epreuves' ? <Button onClick={() => setModal({ mode: 'create', kind: 'epreuve', values: { libelle: '', idNature: '', urlDoc: '', auteur: '' } })}>＋ Épreuve</Button> :
          tab === 'natures' && isAdmin ? <Button onClick={() => setModal({ mode: 'create', kind: 'nature', values: { libelle: '', description: '', idAnnee: '' } })}>＋ Nature</Button> : null
        }
      />

      {message && <Alert tone="info">{message}</Alert>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="📋" label="Sessions" value={stats.sessions} tone="info" />
        <StatCard icon="📝" label="Épreuves" value={stats.epreuves} tone="warning" />
        <StatCard icon="🏷️" label="Natures" value={stats.natures} tone="success" />
      </div>

      {/* ── Tabs ── */}
      <Card style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch('') }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all .15s ease',
              border: tab === t.key ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative', width: 260 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-alt, #f9fafb)',
              transition: 'border-color .15s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </Card>

      {/* ── Sessions ── */}
      {tab === 'sessions' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Alert tone="error">{sessions.error}</Alert>
          <Table columns={[
            { key: 'libelle', label: 'Libellé' },
            { key: 'trimestre', label: 'Trimestre', render: (r) => r.trimestre?.libelle || '—' },
            { key: 'responsable', label: 'Responsable', render: (r) => r.responsable ? `${r.responsable.nom} ${r.responsable.prenom}` : '—' },
            { key: 'date_passage', label: 'Date', render: (r) => r.date_passage?.slice(0, 10) || '—' },
          ]} rows={sessions.data} loading={sessions.loading} keyField="idSession"
            actions={isAdmin ? (row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal({ mode: 'edit', kind: 'session', values: row })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                <button onClick={async () => { if (confirm('Supprimer cette session ?')) { await sessionsApi.remove(row.idSession); sessions.reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
              </div>
            ) : null} />
        </Card>
      )}

      {/* ── Épreuves ── */}
      {tab === 'epreuves' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Alert tone="error">{epreuves.error}</Alert>
          <Table columns={[
            { key: 'libelle', label: 'Libellé' },
            { key: 'nature', label: 'Nature', render: (r) => r.nature?.libelle || '—' },
            { key: 'auteur', label: 'Auteur' },
            { key: 'valider', label: 'Statut', render: (r) => <Badge tone={r.valider ? 'success' : 'warning'}>{r.valider ? 'Validée' : 'En attente'}</Badge> },
          ]} rows={epreuves.data} loading={epreuves.loading} keyField="idEpreuve"
            actions={(row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {isAdmin && !row.valider && <button onClick={() => handleValiderEpreuve(row.idEpreuve)} style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>Valider</button>}
                {isAdmin && row.valider && <button onClick={() => handleRejeterEpreuve(row.idEpreuve)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Rejeter</button>}
                <button onClick={() => setModal({ mode: 'edit', kind: 'epreuve', values: row })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                {isAdmin && <button onClick={async () => { if (confirm('Supprimer cette épreuve ?')) { await epreuvesApi.remove(row.idEpreuve); epreuves.reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>}
              </div>
            )} />
        </Card>
      )}

      {/* ── Natures ── */}
      {tab === 'natures' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Alert tone="error">{natures.error}</Alert>
          {natures.loading ? <Spinner /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Libellé</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Année Acad.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNatures.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 48, textAlign: 'center' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                        <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15 }}>Aucune nature trouvée</div>
                      </td>
                    </tr>
                  )}
                  {filteredNatures.map((n, i) => (
                    <tr
                      key={n.idNature}
                      style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s ease' }}
                      onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-alt, #f9fafb)'}
                      onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tdStyle}>
                        <span style={{
                          width: 26, height: 26, borderRadius: 7, display: 'inline-flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 11, fontWeight: 700,
                          background: NATURE_COLORS[i % NATURE_COLORS.length] + '18',
                          color: NATURE_COLORS[i % NATURE_COLORS.length],
                        }}>{i + 1}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                          background: NATURE_COLORS[i % NATURE_COLORS.length] + '18',
                          color: NATURE_COLORS[i % NATURE_COLORS.length],
                          border: `1px solid ${NATURE_COLORS[i % NATURE_COLORS.length]}30`,
                          fontSize: 13,
                        }}>{n.libelle}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, color: n.description ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {n.description || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'var(--info-light)', color: 'var(--info)' }}>
                          {n.annee?.libelle || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ padding: '8px 14px', fontSize: 12.5, color: 'var(--text-secondary)' }}>
            {filteredNatures.length} nature{filteredNatures.length > 1 ? 's' : ''}{search ? ` sur ${natures.data.length}` : ''}
          </div>
        </Card>
      )}

      {/* ── Modal ── */}
      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter' : 'Modifier'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
            {modal.kind === 'session' && (
              <>
                <SelectField label="Trimestre" required value={modal.values.idTrimestre} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idTrimestre: e.target.value } }))}
                  options={trimestres.map((t) => ({ value: t.idTrimes, label: t.libelle }))} />
                <InputField label="Date de passage" type="date" value={modal.values.date_passage} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, date_passage: e.target.value } }))} />
              </>
            )}
            {modal.kind === 'epreuve' && (
              <>
                <SelectField label="Nature" required value={modal.values.idNature} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idNature: e.target.value } }))}
                  options={natures.data.map((n) => ({ value: n.idNature, label: n.libelle }))} />
                <InputField label="Auteur" value={modal.values.auteur} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, auteur: e.target.value } }))} />
              </>
            )}
            {modal.kind !== 'epreuve' && (
              <>
                <InputField label="Description" value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
                <SelectField label="Année académique" value={modal.values.idAnnee || ''} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idAnnee: e.target.value } }))}
                  options={annees.map((a) => ({ value: a.idAnnee, label: a.libelle }))} placeholder="Facultatif" />
              </>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">{modal.mode === 'create' ? 'Créer' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

const thStyle = { padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' }
