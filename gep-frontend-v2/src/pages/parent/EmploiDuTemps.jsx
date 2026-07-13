import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import SelectField from '../../components/forms/SelectField'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import { emploiDuTempsApi, coursApi } from '../../api/cours.api'
import { sallesApi } from '../../api/classes.api'
import { elevesApi } from '../../api/eleves.api'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const ALL_SLOTS = [
  '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
]

const PAUSES = [
  { label: 'Pause / Break', from: '09:30', to: '10:00', icon: '☕' },
  { label: 'Pause / Break', from: '12:00', to: '12:30', icon: '🍽️' },
]

const COULEURS = [
  { bg: '#eef2ff', border: '#818cf8', text: '#3730a3' },
  { bg: '#ecfdf5', border: '#34d399', text: '#065f46' },
  { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
  { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  { bg: '#f3e8ff', border: '#a78bfa', text: '#5b21b6' },
  { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  { bg: '#e0e7ff', border: '#818cf8', text: '#3730a3' },
  { bg: '#fdf2f8', border: '#f9a8d4', text: '#9d174d' },
]

const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 999,
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)',
}

const thStyle = {
  padding: '12px 14px', fontSize: 12, fontWeight: 800,
  color: 'var(--text-secondary)', textTransform: 'uppercase',
  letterSpacing: '0.24em', textAlign: 'left',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
}

const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' }

export default function ParentEmploiDuTemps() {
  const [emploiDuTemps, setEmploiDuTemps] = useState([])
  const [enfants, setEnfants] = useState([])
  const [coursList, setCoursList] = useState([])
  const [sallesMap, setSallesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMatricule, setSelectedMatricule] = useState('')

  async function loadData() {
    try {
      const [edtRes, elevesRes, coursRes, sallesRes] = await Promise.allSettled([
        emploiDuTempsApi.list(),
        elevesApi.list(),
        coursApi.list(),
        sallesApi.list(),
      ])
      const edt = edtRes.status === 'fulfilled' ? edtRes.value : []
      const eleves = elevesRes.status === 'fulfilled' ? elevesRes.value : []
      const cours = coursRes.status === 'fulfilled' ? coursRes.value : []
      const sm = {}
      if (sallesRes.status === 'fulfilled') {
        (sallesRes.value || []).forEach((s) => { sm[s.idSalle] = s.libelle })
      }
      setEmploiDuTemps(edt)
      setEnfants(eleves)
      setCoursList(cours)
      setSallesMap(sm)
      if (eleves.length === 1) setSelectedMatricule(String(eleves[0].matricule))
    } catch {
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const coursMap = useMemo(() => {
    const m = {}
    coursList.forEach((c) => { m[c.idCours] = c })
    return m
  }, [coursList])

  const enfantClasseMap = useMemo(() => {
    const m = {}
    enfants.forEach((e) => {
      const insc = e.inscriptions?.[0]
      if (insc?.classe?.idClasse) {
        m[e.matricule] = { idClasse: insc.classe.idClasse, classe: insc.classe.libelle || `Classe #${insc.classe.idClasse}` }
      }
    })
    return m
  }, [enfants])

  const selectedEnfant = useMemo(() => {
    if (!selectedMatricule) return null
    return enfants.find((e) => String(e.matricule) === selectedMatricule) || null
  }, [enfants, selectedMatricule])

  const selectedClasseId = selectedEnfant ? enfantClasseMap[selectedEnfant.matricule]?.idClasse : null

  const filtered = useMemo(() => {
    if (!selectedClasseId) return emploiDuTemps
    return emploiDuTemps.filter((e) => e.idClasse === selectedClasseId)
  }, [emploiDuTemps, selectedClasseId])

  const coursCouleurs = useMemo(() => {
    const m = {}
    let i = 0
    filtered.forEach((e) => {
      if (!m[e.idCours]) { m[e.idCours] = COULEURS[i % COULEURS.length]; i++ }
    })
    return m
  }, [filtered])

  const slots = useMemo(() => {
    const used = new Set()
    filtered.forEach((e) => { if (e.heure) used.add(e.heure) })
    const result = ALL_SLOTS.filter((s) => used.has(s) || ALL_SLOTS.indexOf(s) < ALL_SLOTS.length)
    return [...new Set([...result, ...ALL_SLOTS])].sort()
  }, [filtered])

  const grid = useMemo(() => {
    const g = {}
    filtered.forEach((e) => {
      if (!e.heure) return
      const key = `${e.jour}|${e.heure}`
      if (!g[key]) g[key] = []
      g[key].push(e)
    })
    return g
  }, [filtered])

  const jourCounts = useMemo(() => {
    const c = {}
    JOURS.forEach((j) => { c[j] = filtered.filter((e) => e.jour === j).length })
    return c
  }, [filtered])

  const stats = useMemo(() => {
    const actifs = JOURS.filter((j) => jourCounts[j] > 0).length
    return { total: filtered.length, actifs, cours: Object.keys(coursCouleurs).length }
  }, [filtered, jourCounts, coursCouleurs])

  const classeLabel = selectedClasseId
    ? (enfantClasseMap[selectedMatricule]?.classe || `Classe #${selectedClasseId}`)
    : null

  if (loading) return (
    <div>
      <PageHeader title="Emploi du temps" subtitle="Planning de la classe de votre enfant" />
      <Spinner label="Chargement de l'emploi du temps…" />
    </div>
  )

  return (
    <div>
      <PageHeader title="Emploi du temps" subtitle="Planning de la classe de votre enfant" />

      {error && <Alert tone="error">{error}</Alert>}

      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, var(--accent) 0%, #0f766e 100%)',
        border: 'none', color: '#fff', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Emploi du temps
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Planning de la classe de votre enfant
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Consultez l'emploi du temps hebdomadaire de la classe. Sélectionnez un enfant pour voir le planning correspondant.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={pillStyle}>🗓️ Hebdomadaire</span>
            <span style={pillStyle}>🎓 {stats.total} créneaux</span>
          </div>
        </div>
      </Card>

      {enfants.length > 1 && (
        <Card style={{ marginBottom: 16, padding: '18px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Sélectionner un enfant</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                Choisissez l'enfant pour afficher l'emploi du temps de sa classe.
              </div>
            </div>
            <div style={{ minWidth: 240, width: '100%', maxWidth: 300 }}>
              <SelectField
                label="Enfant"
                value={selectedMatricule}
                onChange={(e) => setSelectedMatricule(e.target.value)}
                options={enfants.map((e) => ({
                  value: e.matricule,
                  label: `${e.nom} ${e.prenom}${enfantClasseMap[e.matricule] ? ` — ${enfantClasseMap[e.matricule].classe}` : ''}`,
                }))}
                placeholder="Choisir un enfant"
              />
            </div>
          </div>
        </Card>
      )}

      {enfants.length === 1 && !selectedMatricule && (
        <Alert tone="warning">Aucun enfant trouvé lié à votre compte. Contactez l'administration.</Alert>
      )}

      {selectedMatricule && !selectedClasseId && (
        <Alert tone="warning">L'enfant sélectionné n'est inscrit dans aucune classe pour le moment.</Alert>
      )}

      {selectedClasseId && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
            <StatCard icon="📅" label="Créneaux" value={stats.total} hint={`Classe : ${classeLabel}`} tone="info" />
            <StatCard icon="📆" label="Jours actifs" value={stats.actifs} hint="Jours programmés" tone="warning" />
            <StatCard icon="📖" label="Cours" value={stats.cours} hint="Disciplines" tone="success" />
            <StatCard icon="👤" label="Enfant" value={`${selectedEnfant?.nom || ''}`} hint={selectedEnfant?.prenom || ''} tone="danger" />
          </div>

          {filtered.length === 0 ? (
            <Card style={{ padding: 64, textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)' }}>
              <div style={{ fontSize: 54, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Aucun créneau disponible</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Aucun cours programmé pour la classe <strong>{classeLabel}</strong> pour le moment.
              </div>
            </Card>
          ) : (
            <Card style={{ padding: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)' }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border)',
                display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em' }}>
                  Légende — {classeLabel}
                </span>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(coursCouleurs).map(([idCours, c]) => (
                    <div key={idCours} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: c.border, flexShrink: 0, boxShadow: '0 0 0 2px rgba(255,255,255,0.8)' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{coursMap[idCours]?.libelle || `Cours #${idCours}`}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760, background: '#fff' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 94, background: '#f8fafc' }}>Heure</th>
                      {JOURS.map((j) => (
                        <th key={j} style={{ ...thStyle, textAlign: 'center', position: 'relative', background: '#f8fafc' }}>
                          <span>{j}</span>
                          {jourCounts[j] > 0 && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              marginLeft: 6, minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999,
                              fontSize: 10, fontWeight: 800, background: 'var(--accent-light)', color: 'var(--accent)',
                            }}>{jourCounts[j]}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((heure) => {
                      const pause = PAUSES.find((p) => heure >= p.from && heure < p.to)
                      if (pause && heure !== pause.from) return null
                      if (pause) {
                        return (
                          <tr key={heure}>
                            <td style={{
                              ...tdStyle, fontWeight: 700, fontSize: 11, color: '#9a3412',
                              background: '#fef3c7', textAlign: 'center', whiteSpace: 'nowrap',
                              borderRight: '1px solid var(--border)',
                            }}>
                              {pause.from}—{pause.to}
                            </td>
                            {JOURS.map((jour) => (
                              <td key={jour} colSpan={jour === JOURS[JOURS.length - 1] ? undefined : 1} style={{
                                background: '#fef3c7', padding: 6,
                                borderBottom: '1px solid var(--border-light)',
                                textAlign: 'center', fontSize: 11, color: '#92400e', fontWeight: 600,
                                borderBottom: '1px solid var(--border-light)',
                              }}>
                                {pause.icon} {pause.label}
                              </td>
                            ))}
                          </tr>
                        )
                      }
                      return (
                        <tr key={heure}>
                          <td style={{
                            ...tdStyle, fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)',
                            background: '#f8fafc', textAlign: 'center', whiteSpace: 'nowrap',
                            borderRight: '1px solid var(--border)',
                          }}>
                            {heure}
                          </td>
                        {JOURS.map((jour) => {
                          const key = `${jour}|${heure}`
                          const cellItems = grid[key] || []
                          return (
                            <td key={jour} style={{
                              ...tdStyle, verticalAlign: 'top', padding: 6,
                              borderRight: '1px solid var(--border-light)',
                              borderBottom: '1px solid var(--border-light)',
                              minWidth: 124, height: 92,
                            }}>
                              {cellItems.map((item, idx) => {
                                const c = coursCouleurs[item.idCours] || COULEURS[0]
                                const cours = coursMap[item.idCours]
                                return (
                                  <div key={idx} style={{
                                    background: c.bg, borderLeft: `3px solid ${c.border}`,
                                    borderRadius: 10, padding: '8px 10px', marginBottom: 6,
                                    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)',
                                    transition: 'transform .12s ease, box-shadow .12s ease',
                                    cursor: 'default',
                                  }}
                                    onMouseEnter={(ev) => { ev.currentTarget.style.transform = 'translateY(-1px)'; ev.currentTarget.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.10)' }}
                                    onMouseLeave={(ev) => { ev.currentTarget.style.transform = 'translateY(0)'; ev.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.06)' }}
                                  >
                                    <div style={{ fontSize: 13, fontWeight: 800, color: c.text, marginBottom: 2, lineHeight: 1.2 }}>
                                      {cours?.libelle || `Cours #${item.idCours}`}
                                    </div>
                                    {item.idSalle && (
                                      <div style={{ fontSize: 10, color: c.text, opacity: 0.6, marginTop: 2 }}>
                                        🏫 {sallesMap[item.idSalle] || `Salle #${item.idSalle}`}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </td>
                          )
                        })}
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              <div style={{
                padding: '14px 20px', borderTop: '1px solid var(--border)',
                display: 'flex', gap: 10, flexWrap: 'wrap',
              }}>
                {JOURS.filter((j) => jourCounts[j] > 0).map((j) => (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                    background: jourCounts[j] >= 3 ? 'var(--accent-light)' : 'var(--border-light)',
                    color: jourCounts[j] >= 3 ? 'var(--accent)' : 'var(--text-secondary)',
                  }}>
                    <span>{j}</span>
                    <span style={{
                      width: 20, height: 20, borderRadius: 999, display: 'inline-flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 11, fontWeight: 800,
                      background: jourCounts[j] >= 3 ? 'var(--accent)' : 'var(--text-muted)', color: '#fff',
                    }}>{jourCounts[j]}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
