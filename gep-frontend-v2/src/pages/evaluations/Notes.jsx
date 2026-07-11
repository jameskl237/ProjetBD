import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import SelectField from '../../components/forms/SelectField'
import Spinner from '../../components/ui/Spinner'
import { evaluationsApi, sessionsApi, epreuvesApi, bulletinApi } from '../../api/evaluations.api'
import { coursApi, enseignantsApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const TABS = [
  { key: 'notes', label: 'Saisie & Consultation', icon: '📝' },
  { key: 'bulletins', label: 'Bulletins', icon: '📄' },
]

export default function Notes() {
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'notes'

  const visibleTabs = TABS.filter((t) => {
    if (t.key === 'bulletins') return [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT].includes(roleKey)
    return true
  })

  const setTab = (key) => setSearchParams((prev) => { prev.set('tab', key); return prev })

  return (
    <div>
      <PageHeader title="Notes" subtitle="Saisie et consultation des évaluations" />

      <Card style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
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
      </Card>

      {tab === 'notes' && <NotesTab />}
      {tab === 'bulletins' && <BulletinsTab />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   NotesTab — unified saisie + consultation
   ═══════════════════════════════════════════════════════════ */
function NotesTab() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [mesCours, setMesCours] = useState([])
  const [sessions, setSessions] = useState([])
  const [epreuves, setEpreuves] = useState([])
  const [evaluations, setEvaluations] = useState([])

  const [idClasse, setIdClasse] = useState(() => searchParams.get('classe') || '')
  const [idCours, setIdCours] = useState(() => searchParams.get('cours') || '')
  const [idSession, setIdSession] = useState(() => searchParams.get('session') || '')

  const [eleves, setEleves] = useState([])
  const [loadingEleves, setLoadingEleves] = useState(false)

  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    enseignantsApi.list().then((rows) => setMesCours(rows.filter((r) => r.idPers === user.id))).catch(() => {})
    sessionsApi.list().then(setSessions).catch(() => {})
    epreuvesApi.list().then(setEpreuves).catch(() => {})
    evaluationsApi.list().then(setEvaluations).catch(() => {})
  }, [user])

  const classes = useMemo(() => {
    const map = new Map()
    mesCours.forEach((c) => {
      const cl = c.cours?.classe
      if (cl?.idClasse) map.set(cl.idClasse, cl.libelle)
    })
    return [...map.entries()].map(([id, libelle]) => ({ id, libelle }))
  }, [mesCours])

  const coursForClasse = useMemo(() => {
    if (!idClasse) return []
    return mesCours
      .filter((c) => c.cours?.classe?.idClasse === Number(idClasse))
      .map((c) => ({ idCours: c.cours?.idCours, libelle: c.cours?.libelle, coefficient: c.cours?.coefficient }))
      .filter((c) => c.idCours)
  }, [mesCours, idClasse])

  useEffect(() => {
    if (!idClasse) { setEleves([]); return }
    setLoadingEleves(true)
    classesApi.eleves(Number(idClasse))
      .then(setEleves)
      .catch(() => setEleves([]))
      .finally(() => setLoadingEleves(false))
  }, [idClasse])

  useEffect(() => {
    if (!idClasse || !idCours || !idSession) { setNotes({}); return }
    const evMap = {}
    evaluations.forEach((ev) => {
      if (ev.idCours === Number(idCours) && ev.idSession === Number(idSession)) {
        evMap[ev.matricule] = { idEval: ev.idEval, note: ev.note != null ? String(ev.note) : '', appreciation: ev.appreciation || '' }
      }
    })
    setNotes(evMap)
  }, [idClasse, idCours, idSession, evaluations])

  const filledCount = useMemo(() => Object.keys(notes).filter((k) => notes[k]?.note !== '' && notes[k]?.note != null).length, [notes])

  const average = useMemo(() => {
    const vals = Object.values(notes).filter((e) => e?.note !== '' && e?.note != null).map((e) => Number(e.note)).filter((n) => !isNaN(n))
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
  }, [notes])

  const selectedCours = coursForClasse.find((c) => c.idCours === Number(idCours))
  const selectedSession = sessions.find((s) => s.idSession === Number(idSession))

  const handleNoteChange = useCallback((matricule, value) => {
    setNotes((prev) => {
      const existing = prev[matricule] || { idEval: null, note: '', appreciation: '' }
      return { ...prev, [matricule]: { ...existing, note: value } }
    })
  }, [])

  async function handleSave(matricule) {
    const entry = notes[matricule]
    if (!entry || entry.note === '' || entry.note == null) return
    setSaving(matricule)
    setMessage('')
    try {
      if (entry.idEval) {
        await evaluationsApi.update(entry.idEval, { note: Number(entry.note) })
      } else {
        const defaultEpreuve = epreuves.length > 0 ? epreuves[0].idEpreuve : null
        if (!defaultEpreuve) { setMessage("Aucune épreuve disponible"); setSaving(null); return }
        const res = await evaluationsApi.create({
          matricule, idEpreuve: defaultEpreuve, idCours: Number(idCours),
          idSession: Number(idSession), note: Number(entry.note),
        })
        if (res?.idEval) {
          setNotes((prev) => ({ ...prev, [matricule]: { ...prev[matricule], idEval: res.idEval } }))
        }
      }
      setMessage(`Note enregistrée pour #${matricule}`)
      evaluationsApi.list().then(setEvaluations).catch(() => {})
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    } finally { setSaving(null) }
  }

  async function handleSaveAll() {
    setMessage('')
    const defaultEpreuve = epreuves.length > 0 ? epreuves[0].idEpreuve : null
    if (!defaultEpreuve) { setMessage("Aucune épreuve disponible"); return }
    let count = 0
    for (const matricule of eleves.map((e) => e.matricule)) {
      const entry = notes[matricule]
      if (!entry || entry.note === '' || entry.note == null) continue
      if (entry.idEval) {
        await evaluationsApi.update(entry.idEval, { note: Number(entry.note) })
      } else {
        await evaluationsApi.create({
          matricule, idEpreuve: defaultEpreuve, idCours: Number(idCours),
          idSession: Number(idSession), note: Number(entry.note),
        })
        count++
      }
    }
    setMessage(`${count > 0 ? count + ' nouvelle(s) note(s) enregistrée(s)' : 'Notes mises à jour'}`)
    evaluationsApi.list().then(setEvaluations).catch(() => {})
  }

  const updateParams = useCallback((updates) => {
    setSearchParams((prev) => {
      Object.entries(updates).forEach(([k, v]) => { v ? prev.set(k, v) : prev.delete(k) })
      return prev
    })
  }, [setSearchParams])

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <SelectField
            label="Classe"
            placeholder="Choisir une classe…"
            value={idClasse}
            onChange={(e) => { setIdClasse(e.target.value); setIdCours(''); setIdSession(''); updateParams({ classe: e.target.value, cours: '', session: '' }) }}
            options={classes.map((c) => ({ value: c.id, label: c.libelle }))}
          />
          <SelectField
            label="Matière"
            placeholder={idClasse ? 'Choisir une matière…' : 'Sélectionnez d\'abord une classe'}
            value={idCours}
            onChange={(e) => { setIdCours(e.target.value); setIdSession(''); updateParams({ cours: e.target.value, session: '' }) }}
            options={coursForClasse.map((c) => ({ value: c.idCours, label: `${c.libelle} (coef. ${c.coefficient || '—'})` }))}
            disabled={!idClasse}
          />
          <SelectField
            label="Évaluation / Séquence"
            placeholder={idCours ? 'Choisir une évaluation…' : 'Sélectionnez une matière'}
            value={idSession}
            onChange={(e) => { setIdSession(e.target.value); updateParams({ session: e.target.value }) }}
            options={sessions.map((s) => ({ value: s.idSession, label: s.libelle }))}
            disabled={!idCours}
          />
        </div>
      </Card>

      {idClasse && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 16 }}>
          <StatCard icon="👨‍🎓" label="Élèves" value={eleves.length} tone="info" />
          <StatCard icon="✏️" label="Notes saisies" value={filledCount} tone="warning" />
          <StatCard icon="📊" label="Moyenne" value={average} tone={average !== '—' && Number(average) >= 10 ? 'success' : 'danger'} />
        </div>
      )}

      {message && (
        <Alert tone={message.includes('Erreur') ? 'error' : 'success'}>{message}</Alert>
      )}

      {idClasse && idCours && idSession ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 18, background: 'var(--accent-light)', flexShrink: 0,
              }}>📖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {selectedCours?.libelle || '—'}
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                    {classes.find((c) => c.id === Number(idClasse))?.libelle || ''}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {selectedSession?.libelle || ''}
                </div>
              </div>
            </div>
            <Button onClick={handleSaveAll} disabled={filledCount === 0} style={{ fontSize: 12, padding: '6px 14px' }}>
              Enregistrer tout ({filledCount})
            </Button>
          </div>

          {loadingEleves ? <Spinner label="Chargement des élèves…" /> : eleves.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Élève</th>
                    <th style={thStyle}>Matricule</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Note /20</th>
                    <th style={{ ...thStyle, textAlign: 'right', paddingRight: 16 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map((el, i) => {
                    const entry = notes[el.matricule]
                    const hasExisting = entry?.idEval != null
                    const hasNote = entry?.note !== '' && entry?.note != null
                    return (
                      <tr
                        key={el.matricule}
                        style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s ease' }}
                        onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-alt, #f9fafb)'}
                        onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                      >
                        <td style={tdStyle}>
                          <span style={{
                            width: 24, height: 24, borderRadius: 6, display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 11, fontWeight: 700,
                            background: 'var(--accent-light)', color: 'var(--accent)',
                          }}>{i + 1}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                              background: el.sexe === 2
                                ? 'linear-gradient(135deg, #fce7f3, #fbcfe8)'
                                : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                              color: el.sexe === 2 ? '#be185d' : '#1d4ed8',
                            }}>{(el.nom || '?')[0]}{(el.prenom || '?')[0]}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{el.nom || '—'}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{el.prenom || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                            padding: '2px 8px', borderRadius: 6, background: 'var(--border-light)',
                          }}>{el.matricule}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <input
                            type="number" min="0" max="20" step="0.25" placeholder="—"
                            value={entry?.note ?? ''}
                            onChange={(ev) => handleNoteChange(el.matricule, ev.target.value)}
                            style={{
                              width: 72, padding: '7px 10px', borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${hasNote ? 'var(--accent)' : 'var(--border)'}`,
                              fontSize: 13, textAlign: 'center', fontWeight: 700,
                              background: hasNote ? 'var(--accent-light)' : '#fff',
                              color: hasNote ? 'var(--accent)' : 'var(--text-primary)',
                              transition: 'all .15s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                            onBlur={(e) => e.target.style.borderColor = hasNote ? 'var(--accent)' : 'var(--border)'}
                          />
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 16 }}>
                          <Button
                            variant="secondary"
                            disabled={!hasNote || saving === el.matricule}
                            onClick={() => handleSave(el.matricule)}
                            style={{ padding: '5px 12px', fontSize: 12 }}
                          >
                            {saving === el.matricule ? '…' : hasExisting ? 'Modifier' : 'Enregistrer'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>&#128466;</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15 }}>Aucun élève dans cette classe</div>
            </div>
          )}
        </Card>
      ) : idClasse ? (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>&#128221;</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
            Sélectionnez une matière et une évaluation
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            pour afficher la liste des élèves et saisir les notes
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>&#127979;</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
            Sélectionnez une classe
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Commencez par choisir une classe pour afficher les matières que vous y enseignez
          </div>
        </Card>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   BulletinsTab — consultation de bulletins
   ═══════════════════════════════════════════════════════════ */
function BulletinsTab() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mesCours, setMesCours] = useState([])
  const [idClasse, setIdClasse] = useState(() => searchParams.get('bclasse') || '')
  const [eleves, setEleves] = useState([])
  const [loadingEleves, setLoadingEleves] = useState(false)
  const [search, setSearch] = useState(() => searchParams.get('bsearch') || '')
  const [matricule, setMatricule] = useState('')
  const [bulletin, setBulletin] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateParams = useCallback((updates) => {
    setSearchParams((prev) => {
      Object.entries(updates).forEach(([k, v]) => { v ? prev.set(k, v) : prev.delete(k) })
      return prev
    })
  }, [setSearchParams])

  useEffect(() => {
    enseignantsApi.list().then((rows) => setMesCours(rows.filter((r) => r.idPers === user.id))).catch(() => {})
  }, [user])

  const classes = useMemo(() => {
    const map = new Map()
    mesCours.forEach((c) => {
      const cl = c.cours?.classe
      if (cl?.idClasse) map.set(cl.idClasse, cl.libelle)
    })
    return [...map.entries()].map(([id, libelle]) => ({ id, libelle }))
  }, [mesCours])

  useEffect(() => {
    if (!idClasse) { setEleves([]); setMatricule(''); setBulletin(null); return }
    setLoadingEleves(true)
    classesApi.eleves(Number(idClasse))
      .then(setEleves)
      .catch(() => setEleves([]))
      .finally(() => setLoadingEleves(false))
  }, [idClasse])

  const filteredEleves = useMemo(() => {
    if (!search.trim()) return eleves
    const q = search.toLowerCase()
    return eleves.filter((e) => `${e.nom || ''} ${e.prenom || ''}`.toLowerCase().includes(q) || String(e.matricule).includes(q))
  }, [eleves, search])

  async function handleLoadBulletin(el) {
    setMatricule(el.matricule)
    setLoading(true); setError(''); setBulletin(null)
    try {
      setBulletin(await bulletinApi.get(el.matricule))
    } catch (err) { setError(err.response?.data?.error || 'Élève introuvable') } finally { setLoading(false) }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <SelectField
            label="Classe"
            placeholder="Choisir une classe…"
            value={idClasse}
            onChange={(e) => { setIdClasse(e.target.value); setMatricule(''); setBulletin(null); setSearch(''); updateParams({ bclasse: e.target.value, bsearch: '' }) }}
            options={classes.map((c) => ({ value: c.id, label: c.libelle }))}
          />
          <div style={{ flex: '1 1 280px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Rechercher un élève</label>
            <input
              type="text"
              placeholder={idClasse ? 'Nom, prénom ou matricule…' : 'Sélectionnez d\'abord une classe'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setBulletin(null); setMatricule(''); updateParams({ bsearch: e.target.value }) }}
              disabled={!idClasse}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box',
                opacity: idClasse ? 1 : 0.5,
              }}
            />
          </div>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && <Spinner label="Chargement du bulletin…" />}

      {bulletin && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{
                width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0,
                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8',
              }}>
                {filteredEleves.find((e) => String(e.matricule) === String(matricule))
                  ? `${(filteredEleves.find((e) => String(e.matricule) === String(matricule)).nom || '?')[0]}${(filteredEleves.find((e) => String(e.matricule) === String(matricule)).prenom || '?')[0]}`
                  : '—'}
              </span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                  {bulletin.eleve.nom} {bulletin.eleve.prenom}
                </h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Matricule {bulletin.eleve.matricule}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={bulletinApi.exportUrl(matricule) + '?format=pdf'} target="_blank" rel="noreferrer">
                  <Button variant="secondary" style={{ fontSize: 12 }}>PDF</Button>
                </a>
                <a href={bulletinApi.exportUrl(matricule) + '?format=csv'} target="_blank" rel="noreferrer">
                  <Button variant="secondary" style={{ fontSize: 12 }}>CSV</Button>
                </a>
              </div>
            </div>
          </Card>

          {bulletin.sessions.map((s, i) => (
            <Card key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 16, background: 'var(--accent-light)',
                  }}>&#128203;</span>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.session}</div>
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 700, padding: '4px 14px', borderRadius: 999,
                  background: s.moyenne >= 10 ? 'var(--success-light)' : s.moyenne >= 8 ? 'var(--warning-light)' : 'var(--danger-light)',
                  color: s.moyenne >= 10 ? 'var(--success)' : s.moyenne >= 8 ? 'var(--warning)' : 'var(--danger)',
                }}>
                  Moy. {s.moyenne}/20
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Cours</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Coeff.</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.lignes.map((l, j) => (
                      <tr key={j} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={tdStyle}>{l.cours}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{l.coef}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontWeight: 700, fontSize: 12,
                            background: l.note >= 10 ? 'var(--success-light)' : l.note >= 8 ? 'var(--warning-light)' : 'var(--danger-light)',
                            color: l.note >= 10 ? 'var(--success)' : l.note >= 8 ? 'var(--warning)' : 'var(--danger)',
                          }}>{l.note}/20</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}

          <Card style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: bulletin.moyenneGenerale >= 10 ? 'var(--success-light)' : 'var(--danger-light)',
            border: `1.5px solid ${bulletin.moyenneGenerale >= 10 ? 'var(--success)' : 'var(--danger)'}30`,
          }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Moyenne générale</span>
            <span style={{
              fontWeight: 800, fontSize: 20,
              color: bulletin.moyenneGenerale >= 10 ? 'var(--success)' : 'var(--danger)',
            }}>
              {bulletin.moyenneGenerale}/20
            </span>
          </Card>
        </div>
      )}

      {idClasse && !bulletin && !loading && !error && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18, background: 'var(--accent-light)', flexShrink: 0,
            }}>&#128221;</span>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              Bulletins — {classes.find((c) => c.id === Number(idClasse))?.libelle || ''}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                {filteredEleves.length} élève{filteredEleves.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {loadingEleves ? <Spinner label="Chargement des élèves…" /> : filteredEleves.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Élève</th>
                    <th style={thStyle}>Matricule</th>
                    <th style={{ ...thStyle, textAlign: 'right', paddingRight: 16 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEleves.map((el, i) => (
                    <tr
                      key={el.matricule}
                      style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s ease', cursor: 'pointer' }}
                      onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-alt, #f9fafb)'}
                      onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                      onClick={() => handleLoadBulletin(el)}
                    >
                      <td style={tdStyle}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 6, display: 'inline-flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 11, fontWeight: 700,
                          background: 'var(--accent-light)', color: 'var(--accent)',
                        }}>{i + 1}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                            background: el.sexe === 2
                              ? 'linear-gradient(135deg, #fce7f3, #fbcfe8)'
                              : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                            color: el.sexe === 2 ? '#be185d' : '#1d4ed8',
                          }}>{(el.nom || '?')[0]}{(el.prenom || '?')[0]}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{el.nom || '—'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{el.prenom || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 6, background: 'var(--border-light)',
                        }}>{el.matricule}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 16 }}>
                        <Button
                          variant="secondary"
                          style={{ padding: '5px 12px', fontSize: 12 }}
                          onClick={(e) => { e.stopPropagation(); handleLoadBulletin(el) }}
                        >
                          Voir bulletin
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>&#128269;</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15 }}>
                {search ? 'Aucun élève ne correspond à la recherche' : 'Aucun élève dans cette classe'}
              </div>
            </div>
          )}
        </Card>
      )}

      {!idClasse && !bulletin && !loading && !error && (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>&#127979;</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
            Sélectionnez une classe
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Choisissez une classe pour afficher la liste des élèves et leurs bulletins
          </div>
        </Card>
      )}
    </div>
  )
}

const thStyle = { padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' }
