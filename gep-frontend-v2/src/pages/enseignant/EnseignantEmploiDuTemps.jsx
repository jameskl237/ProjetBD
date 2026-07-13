import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { emploiDuTempsApi, enseignantsApi } from '../../api/cours.api'
import { classesApi, sallesApi } from '../../api/classes.api'
import { useAuth } from '../../hooks/useAuth'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const CRENEAUX = [
  { value: '07:30', label: '07h30 – 08h00' },
  { value: '08:00', label: '08h00 – 08h30' },
  { value: '08:30', label: '08h30 – 09h00' },
  { value: '09:00', label: '09h00 – 09h30' },
  { value: '10:00', label: '10h00 – 10h30 (après pause)' },
  { value: '10:30', label: '10h30 – 11h00' },
  { value: '11:00', label: '11h00 – 11h30' },
  { value: '11:30', label: '11h30 – 12h00' },
  { value: '12:30', label: '12h30 – 13h00 (après pause)' },
  { value: '13:00', label: '13h00 – 13h30' },
  { value: '13:30', label: '13h30 – 14h00' },
  { value: '14:00', label: '14h00 – 14h30' },
  { value: '14:30', label: '14h30 – 15h00' },
  { value: '15:00', label: '15h00 – 15h30' },
  { value: '15:30', label: '15h30 – 16h00' },
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
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.18)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 700,
  backdropFilter: 'blur(6px)',
}

export default function EnseignantEmploiDuTemps() {
  const { user } = useAuth()
  const [emploiDuTemps, setEmploiDuTemps] = useState([])
  const [mesCours, setMesCours] = useState([])
  const [classes, setClasses] = useState([])
  const [toutesLesClasses, setToutesLesClasses] = useState([])
  const [salles, setSalles] = useState([])
  const [sallesMap, setSallesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [idClasse, setIdClasse] = useState('')
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    try {
      const [edtRes, ensRes, allClassesRes, sallesRes] = await Promise.allSettled([
        emploiDuTempsApi.list(),
        enseignantsApi.list(),
        classesApi.list(),
        sallesApi.list(),
      ])
      const edt = edtRes.status === 'fulfilled' ? edtRes.value : []
      const ens = (ensRes.status === 'fulfilled' ? ensRes.value : []).filter((e) => e.idPers === user.id)
      const allClasses = allClassesRes.status === 'fulfilled' ? allClassesRes.value : []
      setEmploiDuTemps(edt)
      setMesCours(ens)
      setToutesLesClasses(allClasses)
      const sm = {}
      if (sallesRes.status === 'fulfilled') {
        const sallesData = sallesRes.value || []
        sallesData.forEach((s) => { sm[s.idSalle] = s.libelle })
        setSalles(sallesData)
      } else {
        setSalles([])
      }
      setSallesMap(sm)
      const clsIds = new Set()
      ens.forEach((e) => { if (e.cours?.classe?.idClasse) clsIds.add(e.cours.classe.idClasse) })
      setClasses(allClasses.filter((c) => clsIds.has(c.idClasse)))
    } catch {
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const coursMap = useMemo(() => {
    const m = {}
    mesCours.forEach((e) => { if (e.cours?.idCours) m[e.cours.idCours] = e.cours })
    return m
  }, [mesCours])

  const coursDisponibles = useMemo(() => {
    return (mesCours || []).map((e) => e.cours).filter(Boolean)
  }, [mesCours])

  const classeMap = useMemo(() => {
    const m = {}
    toutesLesClasses.forEach((c) => { m[c.idClasse] = c.libelle })
    return m
  }, [toutesLesClasses])

  const filtered = useMemo(() => {
    if (!idClasse) return emploiDuTemps
    return emploiDuTemps.filter((e) => e.idClasse === Number(idClasse))
  }, [emploiDuTemps, idClasse])

  const coursCouleurs = useMemo(() => {
    const m = {}
    let i = 0
    filtered.forEach((e) => {
      if (!m[e.idCours]) { m[e.idCours] = COULEURS[i % COULEURS.length]; i++ }
    })
    return m
  }, [filtered])

  const slots = useMemo(() => {
    const set = new Set()
    filtered.forEach((e) => { if (e.heure) set.add(e.heure) })
    return [...set].sort()
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

  const statsJours = useMemo(() => {
    const actifs = JOURS.filter((j) => jourCounts[j] > 0).length
    return { total: filtered.length, actifs }
  }, [filtered, jourCounts])

  function openCreateModal() {
    setModal({ mode: 'create', values: { jour: 'Lundi', heure: '08:00', idCours: '', idSalle: '' } })
    setFormError('')
  }

  function openEditModal(item) {
    setModal({
      mode: 'edit',
      values: {
        idTemps: item.idTemps,
        jour: item.jour,
        heure: item.heure,
        idCours: String(item.idCours),
        idSalle: item.idSalle ? String(item.idSalle) : '',
      },
    })
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const selectedCourse = coursDisponibles.find((c) => String(c.idCours) === String(modal.values.idCours))
      if (!selectedCourse) {
        throw new Error('Sélectionnez un cours valide')
      }

      const payload = {
        jour: modal.values.jour,
        heure: modal.values.heure,
        idClasse: Number(selectedCourse.idClasse),
        idCours: Number(selectedCourse.idCours),
        idSalle: modal.values.idSalle ? Number(modal.values.idSalle) : undefined,
      }

      if (modal.mode === 'edit') {
        await emploiDuTempsApi.update(modal.values.idTemps, payload)
      } else {
        await emploiDuTempsApi.create(payload)
      }

      setModal(null)
      await loadData()
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Impossible d’enregistrer ce créneau')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Supprimer ce créneau ?')) return
    try {
      await emploiDuTempsApi.remove(item.idTemps)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Suppression impossible')
    }
  }

  if (loading) return <div><PageHeader title="Emploi du temps" subtitle="Mon planning hebdomadaire" /><Spinner label="Chargement de l'emploi du temps…" /></div>

  return (
    <div>
      <PageHeader
        title="Emploi du temps"
        subtitle="Mon planning hebdomadaire"
        actions={<Button onClick={openCreateModal}>＋ Nouveau créneau</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}

      <Card style={{
        marginBottom: 18,
        padding: '24px 24px',
        background: 'linear-gradient(135deg, var(--accent) 0%, #0f766e 100%)',
        border: 'none',
        color: '#fff',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Planning enseignant
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Votre semaine de cours, claire et élégante
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Consultez vos séances par jour, par heure et par classe avec une vue plus moderne et professionnelle.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={pillStyle}>🗓️ Hebdomadaire</span>
            <span style={pillStyle}>🎓 {statsJours.total} créneaux</span>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, padding: '18px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Filtrer votre planning</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
              Sélectionnez une classe pour focaliser l’affichage.
            </div>
          </div>
          <div style={{ minWidth: 240, width: '100%', maxWidth: 280 }}>
            <SelectField
              label="Classe"
              placeholder="Toutes mes classes"
              value={idClasse}
              onChange={(e) => setIdClasse(e.target.value)}
              options={classes.map((c) => ({ value: c.idClasse, label: c.libelle }))}
            />
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="📅" label="Créneaux" value={statsJours.total} hint="Total de séances" tone="info" />
        <StatCard icon="📆" label="Jours actifs" value={statsJours.actifs} hint="Jours programmés" tone="warning" />
        <StatCard icon="📖" label="Cours" value={Object.keys(coursCouleurs).length} hint="Disciplines visibles" tone="success" />
        <StatCard icon="🏫" label="Classes" value={new Set(filtered.map((e) => e.idClasse)).size} hint="Classes concernées" tone="danger" />
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 64, textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)' }}>
          <div style={{ fontSize: 54, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Aucun créneau disponible</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {idClasse ? 'Aucun cours programmé pour cette classe pour le moment.' : 'Votre emploi du temps est encore vide. Il apparaîtra ici dès qu’un cours sera programmé.'}
          </div>
          <Button onClick={openCreateModal} style={{ marginTop: 18 }}>＋ Ajouter un créneau</Button>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em' }}>Légende</span>
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
                {slots.map((heure) => (
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: c.text, marginBottom: 2, lineHeight: 1.2 }}>
                                      {cours?.libelle || `Cours #${item.idCours}`}
                                    </div>
                                    <div style={{ fontSize: 11, color: c.text, opacity: 0.8, fontWeight: 700 }}>
                                      {classeMap[item.idClasse] || `Classe #${item.idClasse}`}
                                    </div>
                                    {item.idSalle && (
                                      <div style={{ fontSize: 10, color: c.text, opacity: 0.6, marginTop: 2 }}>
                                        {sallesMap[item.idSalle] || `Salle #${item.idSalle}`}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); openEditModal(item) }} style={{ fontSize: 12, color: c.text, background: 'rgba(255,255,255,0.65)', borderRadius: 6, padding: '3px 6px' }}>✏️</button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(item) }} style={{ fontSize: 12, color: c.text, background: 'rgba(255,255,255,0.65)', borderRadius: 6, padding: '3px 6px' }}>🗑️</button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </td>
                      )
                    })}
                  </tr>
                ))}
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
                  justifyContent: 'center', fontSize: 11, fontWeight: 800, background: jourCounts[j] >= 3 ? 'var(--accent)' : 'var(--text-muted)', color: '#fff',
                }}>{jourCounts[j]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter un créneau' : 'Modifier le créneau'} onClose={() => setModal(null)} width={560}>
        {modal && (
          <form onSubmit={handleSubmit}>
            {formError && <Alert tone="error">{formError}</Alert>}
            <SelectField
              label="Jour"
              required
              value={modal.values.jour}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, jour: e.target.value } }))}
              options={JOURS.map((j) => ({ value: j, label: j }))}
            />
            <SelectField
              label="Créneau horaire"
              required
              value={modal.values.heure}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, heure: e.target.value } }))}
              options={CRENEAUX}
            />
            <SelectField
              label="Cours"
              required
              value={modal.values.idCours}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idCours: e.target.value } }))}
              options={coursDisponibles.map((c) => ({ value: c.idCours, label: `${c.libelle} — ${c.classe?.libelle || 'Classe ?'}` }))}
              placeholder="Sélectionner un cours"
            />
            {modal.values.idCours && (() => {
              const selectedCourse = coursDisponibles.find((c) => String(c.idCours) === String(modal.values.idCours))
              return selectedCourse ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 14,
                  borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', fontSize: 13, color: 'var(--accent)',
                  fontWeight: 600,
                }}>
                  <span>&#9989;</span>
                  Classe associée : <strong>{selectedCourse.classe?.libelle || '—'}</strong>
                </div>
              ) : null
            })()}
            <SelectField
              label="Classe"
              value={modal.values.idCours ? (() => {
                const sc = coursDisponibles.find((c) => String(c.idCours) === String(modal.values.idCours))
                return sc?.classe?.idClasse ? String(sc.classe.idClasse) : ''
              })() : ''}
              disabled
              options={classes.map((c) => ({ value: c.idClasse, label: c.libelle }))}
              placeholder="Sélectionnez d'abord un cours"
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

const thStyle = { padding: '12px 14px', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' }
