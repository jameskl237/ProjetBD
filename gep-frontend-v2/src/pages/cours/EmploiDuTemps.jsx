import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import SelectField from '../../components/forms/SelectField'
import { emploiDuTempsApi, coursApi, enseignantsApi } from '../../api/cours.api'
import { classesApi, sallesApi } from '../../api/classes.api'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

const CRENEAUX = [
  { value: '07:30', label: '07h30 – 08h00' },
  { value: '08:00', label: '08h00 – 08h30' },
  { value: '08:30', label: '08h30 – 09h00' },
  { value: '09:00', label: '09h00 – 09h30' },
  { value: '09:30', label: '09h30 – 10h00' },
  { value: '10:00', label: '10h00 – 10h30' },
  { value: '10:30', label: '10h30 – 11h00' },
  { value: '11:00', label: '11h00 – 11h30' },
  { value: '11:30', label: '11h30 – 12h00' },
  { value: '12:30', label: '12h30 – 13h00' },
  { value: '13:00', label: '13h00 – 13h30' },
  { value: '13:30', label: '13h30 – 14h00' },
  { value: '14:00', label: '14h00 – 14h30' },
  { value: '14:30', label: '14h30 – 15h00' },
  { value: '15:00', label: '15h00 – 15h30' },
  { value: '15:30', label: '15h30 – 16h00' },
]

const FAMILLES = {
  lang: { label: 'Langues', bg: '#E6ECF4', border: '#2B4C7E', text: '#1D3A63' },
  math: { label: 'Mathématiques', bg: '#F7EFD6', border: '#C9A227', text: '#7A5A10' },
  sci: { label: 'Sciences', bg: '#E4F1EC', border: '#3E8E7E', text: '#296155' },
  art: { label: 'Arts & Sport', bg: '#F5E7E6', border: '#A63D40', text: '#7C2C2E' },
  gen: { label: 'Général / Autre', bg: '#EDEAE0', border: '#8B8E80', text: '#54574B' },
}

function getCourseFamily(libelle) {
  if (!libelle) return 'gen'
  const s = libelle.toLowerCase()
  if (s.includes('math') || s.includes('alg') || s.includes('géo') || s.includes('arith')) return 'math'
  if (
    s.includes('français') || s.includes('francais') || s.includes('english') || s.includes('anglais') ||
    s.includes('lang') || s.includes('dict') || s.includes('gramm') || s.includes('ortho') ||
    s.includes('lect') || s.includes('voc') || s.includes('expr') || s.includes('lv') ||
    s.includes('espagnol') || s.includes('allemand') || s.includes('littér') || s.includes('litter')
  ) return 'lang'
  if (
    s.includes('sci') || s.includes('phys') || s.includes('chim') || s.includes('biol') ||
    s.includes('observ') || s.includes('tech') || s.includes('info')
  ) return 'sci'
  if (
    s.includes('art') || s.includes('dessin') || s.includes('musique') || s.includes('chant') ||
    s.includes('poés') || s.includes('poes') || s.includes('sport') || s.includes('eps') ||
    s.includes('gym') || s.includes('physique et')
  ) return 'art'
  return 'gen'
}

const SECTION_STYLE = {
  Francophone: { bg: '#E6ECF4', color: '#1D3A63' },
  Anglophone: { bg: '#F5E7E6', color: '#7C2C2E' },
  Bilingue: { bg: '#E4F1EC', color: '#296155' },
  Bilingual: { bg: '#E4F1EC', color: '#296155' },
}

const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 999,
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)',
}

const thStyle = {
  fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13.5,
  color: 'var(--text-primary)', padding: '13px 8px', textAlign: 'center',
  borderBottom: '2px solid var(--border)', background: '#F8FAFF',
}
const tdBase = { padding: 0, verticalAlign: 'top' }

export default function EmploiDuTemps() {
  const [emploiDuTemps, setEmploiDuTemps] = useState([])
  const [cours, setCours] = useState([])
  const [classes, setClasses] = useState([])
  const [salles, setSalles] = useState([])
  const [enseignants, setEnseignants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [idClasse, setIdClasse] = useState('')
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    try {
      const [edtRes, coursRes, classesRes, sallesRes, ensRes] = await Promise.allSettled([
        emploiDuTempsApi.list(),
        coursApi.list(),
        classesApi.list(),
        sallesApi.list(),
        enseignantsApi.list(),
      ])
      setEmploiDuTemps(edtRes.status === 'fulfilled' ? edtRes.value : [])
      setCours(coursRes.status === 'fulfilled' ? coursRes.value : [])
      setClasses(classesRes.status === 'fulfilled' ? classesRes.value : [])
      setSalles(sallesRes.status === 'fulfilled' ? sallesRes.value : [])
      setEnseignants(ensRes.status === 'fulfilled' ? ensRes.value : [])
    } catch {
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const classeMap = useMemo(() => {
    const m = {}
    classes.forEach((c) => { m[c.idClasse] = c })
    return m
  }, [classes])

  const coursMap = useMemo(() => {
    const m = {}
    cours.forEach((c) => { m[c.idCours] = c })
    return m
  }, [cours])

  const sallesMap = useMemo(() => {
    const m = {}
    salles.forEach((s) => { m[s.idSalle] = s.libelle })
    return m
  }, [salles])

  const ensByCours = useMemo(() => {
    const m = {}
    enseignants.forEach((e) => {
      if (e.cours?.idCours && e.personne) {
        if (!m[e.cours.idCours]) m[e.cours.idCours] = []
        m[e.cours.idCours].push(e.personne)
      }
    })
    return m
  }, [enseignants])

  const filtered = useMemo(() => {
    if (!idClasse) return emploiDuTemps
    return emploiDuTemps.filter((e) => e.idClasse === Number(idClasse))
  }, [emploiDuTemps, idClasse])

  const currentClasse = idClasse ? classeMap[Number(idClasse)] : null

  const slots = useMemo(() => {
    if (!idClasse) {
      const set = new Set()
      filtered.forEach((e) => { if (e.heure) set.add(e.heure) })
      return [...set].sort()
    }
    const set = new Set(CRENEAUX.map((c) => c.value))
    filtered.forEach((e) => { if (e.heure) set.add(e.heure) })
    return [...set].sort()
  }, [filtered, idClasse])

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
    const coursUniques = new Set(filtered.map((e) => e.idCours)).size
    const classesUniques = new Set(filtered.map((e) => e.idClasse)).size
    return { total: filtered.length, actifs, cours: coursUniques, classes: classesUniques }
  }, [filtered, jourCounts])

  function openCreate(jour, heure) {
    setModal({
      mode: 'create',
      values: { jour: jour || 'Lundi', heure: heure || '08:00', idClasse: idClasse || '', idCours: '', idSalle: '' },
    })
    setFormError('')
  }

  function openEdit(item) {
    setModal({
      mode: 'edit',
      values: {
        idTemps: item.idTemps, jour: item.jour, heure: item.heure,
        idClasse: String(item.idClasse), idCours: String(item.idCours),
        idSalle: item.idSalle ? String(item.idSalle) : '',
      },
    })
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        jour: modal.values.jour, heure: modal.values.heure,
        idClasse: Number(modal.values.idClasse), idCours: Number(modal.values.idCours),
        idSalle: modal.values.idSalle ? Number(modal.values.idSalle) : undefined,
      }
      if (modal.mode === 'edit') await emploiDuTempsApi.update(modal.values.idTemps, payload)
      else await emploiDuTempsApi.create(payload)
      setModal(null)
      loadData()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Conflit ou données invalides')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Supprimer ce créneau ?')) return
    try {
      await emploiDuTempsApi.remove(item.idTemps)
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Suppression impossible')
    }
  }

  if (loading) return <div style={{ padding: 40 }}><Spinner label="Chargement de l'emploi du temps…" /></div>

  const sectionName = currentClasse?.cycle?.libelle || currentClasse?.section || ''
  const sectionStyle = SECTION_STYLE[sectionName] || null

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
              Pédagogie
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Emploi du temps
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Construisez l'emploi du temps de chaque classe, créneau par créneau.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={pillStyle}>🗓️ Hebdomadaire</span>
            {idClasse && (
              <>
                <span style={pillStyle}>🎓 {stats.total} créneaux</span>
                <span style={pillStyle}>📖 {stats.cours} cours</span>
              </>
            )}
          </div>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      {/* ── Class selector bar ── */}
      <Card style={{
        marginBottom: 16, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 220 }}>
          <SelectField
            label="Classe"
            placeholder="Toutes les classes"
            value={idClasse}
            onChange={(e) => setIdClasse(e.target.value)}
            options={classes.map((c) => ({ value: c.idClasse, label: c.libelle }))}
            style={{ marginBottom: 0 }}
          />
        </div>
        {sectionStyle && (
          <span style={{
            fontSize: 11.5, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
            background: sectionStyle.bg, color: sectionStyle.color,
          }}>
            {sectionName}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {idClasse && currentClasse?.titulaire && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              👤 Titulaire : <strong>{currentClasse.titulaire.nom} {currentClasse.titulaire.prenom}</strong>
            </span>
          )}
          {idClasse && currentClasse?.effectif != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              👥 {currentClasse.effectif} élèves
            </span>
          )}
          {idClasse && (
            <Button onClick={() => openCreate()}>
              <span style={{ marginRight: 6 }}>＋</span> Nouveau créneau
            </Button>
          )}
        </div>
      </Card>

      {/* ── Stats ── */}
      {idClasse && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
          <StatCard icon="📅" label="Créneaux" value={stats.total} hint="Total de séances" tone="info" />
          <StatCard icon="📆" label="Jours actifs" value={stats.actifs} hint="Jours programmés" tone="warning" />
          <StatCard icon="📖" label="Cours" value={stats.cours} hint="Disciplines" tone="success" />
          <StatCard icon="🏫" label="Salle" value={stats.classes} hint="Salles utilisées" tone="danger" />
        </div>
      )}

      {/* ── Legend ── */}
      {idClasse && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '4px 2px 16px', flexWrap: 'wrap' }}>
          {Object.entries(FAMILLES).map(([key, f]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: f.border, flexShrink: 0 }} />
              {f.label}
            </div>
          ))}
        </div>
      )}

      {/* ── No class selected ── */}
      {!idClasse ? (
        <Card style={{ padding: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 54, marginBottom: 12 }}>🗓️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Sélectionnez une classe
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Choisissez une classe dans le menu ci-dessus pour afficher et gérer son emploi du temps.
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card style={{ padding: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 54, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Aucun créneau programmé
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Aucun cours programmé pour cette classe.
          </div>
          <Button onClick={() => openCreate()} style={{ marginTop: 18 }}>＋ Ajouter un créneau</Button>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 118, textAlign: 'right', paddingRight: 14 }}></th>
                  {JOURS.map((j) => (
                    <th key={j} style={thStyle}>
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
                      fontFamily: 'monospace', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)',
                      padding: '10px 10px', textAlign: 'right', borderRight: '1px solid var(--border)',
                      verticalAlign: 'middle', whiteSpace: 'nowrap', background: '#F8FAFF',
                    }}>
                      {heure}
                    </td>
                    {JOURS.map((jour) => {
                      const key = `${jour}|${heure}`
                      const cellItems = grid[key] || []
                      return (
                        <td key={jour} style={{
                          ...tdBase, padding: 5, borderRight: '1px solid var(--border-light)',
                          borderBottom: '1px solid var(--border-light)', minWidth: 124, height: 80,
                        }}>
                          {cellItems.map((item, idx) => {
                            const crs = coursMap[item.idCours]
                            const famKey = getCourseFamily(crs?.libelle)
                            const c = FAMILLES[famKey]
                            const teachers = ensByCours[item.idCours] || []
                            const teacherNames = teachers.map(t => `${t.prenom || ''} ${t.nom || ''}`.trim()).join(', ')
                            return (
                              <div key={idx} style={{
                                background: c.bg, borderLeft: `3px solid ${c.border}`,
                                borderRadius: 10, padding: '8px 10px', marginBottom: 4,
                                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                                transition: 'transform .12s ease, box-shadow .12s ease',
                              }}
                                onMouseEnter={(ev) => { ev.currentTarget.style.transform = 'translateY(-1px)'; ev.currentTarget.style.boxShadow = '0 8px 18px rgba(15, 23, 42, 0.10)' }}
                                onMouseLeave={(ev) => { ev.currentTarget.style.transform = 'translateY(0)'; ev.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.06)' }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: c.text, lineHeight: 1.2, minWidth: 0 }}>
                                    {crs?.libelle || `Cours #${item.idCours}`}
                                  </div>
                                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                    <button
                                      onClick={(ev) => { ev.stopPropagation(); openEdit(item) }}
                                      style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: c.text, background: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                                      title="Modifier"
                                    >✎</button>
                                    <button
                                      onClick={(ev) => { ev.stopPropagation(); handleDelete(item) }}
                                      style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#E11D48', background: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                                      title="Supprimer"
                                    >✕</button>
                                  </div>
                                </div>
                                <div style={{ fontSize: 11, color: c.text, opacity: 0.8, fontWeight: 600, marginTop: 2 }}>
                                  {idClasse ? (teacherNames || 'Sans enseignant') : (classeMap[item.idClasse]?.libelle || `Classe #${item.idClasse}`)}
                                </div>
                                {item.idSalle && (
                                  <div style={{ fontSize: 10, color: c.text, opacity: 0.6, marginTop: 2, fontFamily: 'monospace' }}>
                                    {sallesMap[item.idSalle] || `Salle #${item.idSalle}`}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          {cellItems.length === 0 && (
                            <div
                              onClick={() => openCreate(jour, heure)}
                              style={{
                                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 8, cursor: 'pointer', transition: 'background .12s ease',
                                color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
                              }}
                              onMouseEnter={(ev) => { ev.currentTarget.style.background = 'var(--border-light)' }}
                              onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent' }}
                            >
                              + Ajouter
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Day count footer ── */}
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

      {/* ── Modal ── */}
      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter un créneau' : 'Modifier le créneau'} onClose={() => setModal(null)} width={560}>
        {modal && (
          <form onSubmit={handleSubmit}>
            {formError && <Alert tone="error">{formError}</Alert>}
            <SelectField
              label="Jour" required
              value={modal.values.jour}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, jour: e.target.value } }))}
              options={JOURS.map((j) => ({ value: j, label: j }))}
            />
            <SelectField
              label="Créneau horaire" required
              value={modal.values.heure}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, heure: e.target.value } }))}
              options={CRENEAUX}
            />
            <SelectField
              label="Classe" required
              value={modal.values.idClasse}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idClasse: e.target.value } }))}
              options={classes.map((c) => ({ value: c.idClasse, label: c.libelle }))}
            />
            <SelectField
              label="Cours" required
              value={modal.values.idCours}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idCours: e.target.value } }))}
              options={cours.map((c) => ({ value: c.idCours, label: `${c.libelle} — ${c.classe?.libelle || classeMap[c.idClasse]?.libelle || ''}` }))}
              placeholder="Sélectionner un cours"
            />
            <SelectField
              label="Salle"
              value={modal.values.idSalle}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idSalle: e.target.value } }))}
              options={salles.map((s) => ({ value: s.idSalle, label: s.libelle }))}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              {modal.mode === 'edit' && (
                <Button
                  type="button" variant="danger"
                  onClick={async () => { await handleDelete({ idTemps: modal.values.idTemps }); setModal(null) }}
                >
                  Supprimer
                </Button>
              )}
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
