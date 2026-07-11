import { useEffect, useMemo, useState, useCallback } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { absencesApi } from '../../api/absences.api'
import { coursApi, enseignantsApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'
import { useAuth } from '../../hooks/useAuth'

const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 999,
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)',
}

export default function EnseignantAbsences() {
  const { user } = useAuth()
  const [absences, setAbsences] = useState([])
  const [mesCours, setMesCours] = useState([])
  const [toutesLesClasses, setToutesLesClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [idClasse, setIdClasse] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [eleves, setEleves] = useState([])
  const [coursList, setCoursList] = useState([])

  const loadData = useCallback(async () => {
    try {
      const [absRes, ensRes, allClassesRes, coursRes] = await Promise.allSettled([
        absencesApi.list(),
        enseignantsApi.list(),
        classesApi.list(),
        coursApi.list(),
      ])
      setAbsences(absRes.status === 'fulfilled' ? absRes.value : [])
      const ens = (ensRes.status === 'fulfilled' ? ensRes.value : []).filter((e) => e.idPers === user.id)
      setMesCours(ens)
      setToutesLesClasses(allClassesRes.status === 'fulfilled' ? allClassesRes.value : [])
      setCoursList(coursRes.status === 'fulfilled' ? coursRes.value : [])
    } catch { setError('Erreur lors du chargement') }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const coursMap = useMemo(() => {
    const m = {}
    mesCours.forEach((e) => { if (e.cours?.idCours) m[e.cours.idCours] = e.cours })
    return m
  }, [mesCours])

  const classeMap = useMemo(() => {
    const m = {}
    toutesLesClasses.forEach((c) => { m[c.idClasse] = c.libelle })
    return m
  }, [toutesLesClasses])

  const classes = useMemo(() => {
    const map = new Map()
    mesCours.forEach((e) => {
      const cl = e.cours?.classe
      if (cl?.idClasse) map.set(cl.idClasse, cl.libelle)
    })
    return [...map.entries()].map(([id, libelle]) => ({ id, libelle }))
  }, [mesCours])

  const filtered = useMemo(() => {
    let list = absences
    if (idClasse) {
      const coursIdsForClass = new Set()
      mesCours.forEach((e) => { if (e.cours?.classe?.idClasse === Number(idClasse) && e.cours?.idCours) coursIdsForClass.add(e.cours.idCours) })
      list = list.filter((a) => coursIdsForClass.has(a.idCours))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) => `${a.eleve?.nom || ''} ${a.eleve?.prenom || ''}`.toLowerCase().includes(q) || String(a.matricule).includes(q))
    }
    return list
  }, [absences, idClasse, search, mesCours])

  const stats = useMemo(() => {
    const total = filtered.length
    const justifiees = filtered.filter((a) => a.justifiee).length
    const nonJustifiees = total - justifiees
    const today = new Date().toISOString().slice(0, 10)
    const todayCount = filtered.filter((a) => a.date?.slice(0, 10) === today).length
    return { total, justifiees, nonJustifiees, todayCount }
  }, [filtered])

  const coursDisponibles = useMemo(() => {
    return mesCours.map((e) => e.cours).filter(Boolean)
  }, [mesCours])

  useEffect(() => {
    if (!modal?.values.idCours) { setEleves([]); return }
    const c = coursList.find((c) => c.idCours === Number(modal.values.idCours))
    if (!c) return
    classesApi.eleves(c.idClasse).then(setEleves).catch(() => setEleves([]))
  }, [modal?.values.idCours, coursList])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await absencesApi.create({
        matricule: Number(modal.values.matricule), idCours: Number(modal.values.idCours),
        date: modal.values.date, commentaire: modal.values.commentaire, justifiee: false,
      })
      setModal(null)
      await loadData()
    } catch (err) { setFormError(err.response?.data?.error || "Erreur lors de l'enregistrement") }
    finally { setSubmitting(false) }
  }

  function openCreateModal() {
    setModal({ values: { idCours: '', matricule: '', date: new Date().toISOString().slice(0, 10), commentaire: '' } })
    setFormError('')
  }

  if (loading) return <div><PageHeader title="Absences" subtitle="Suivi des absences de mes classes" /><Spinner label="Chargement des absences…" /></div>

  return (
    <div>
      <PageHeader
        title="Absences"
        subtitle="Suivi des absences de mes classes"
        actions={<Button onClick={openCreateModal}>+ Signaler une absence</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}

      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        border: 'none', color: '#fff', boxShadow: '0 16px 40px rgba(185, 28, 28, 0.20)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Gestion des absences
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Suivez les absences de vos élèves
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Consultez, filtrez et signalez les absences par classe, par élève ou par date.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={pillStyle}>📋 {stats.total} absence{stats.total > 1 ? 's' : ''}</span>
            <span style={pillStyle}>⚠️ {stats.nonJustifiees} non justifiée{stats.nonJustifiees > 1 ? 's' : ''}</span>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, padding: '18px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
          <SelectField
            label="Filtrer par classe"
            placeholder="Toutes mes classes"
            value={idClasse}
            onChange={(e) => setIdClasse(e.target.value)}
            options={classes.map((c) => ({ value: c.id, label: c.libelle }))}
          />
          <div style={{ flex: '1 1 280px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Rechercher un élève</label>
            <input
              type="text"
              placeholder="Nom, prénom ou matricule…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="📋" label="Total" value={stats.total} tone="info" />
        <StatCard icon="✅" label="Justifiées" value={stats.justifiees} tone="success" />
        <StatCard icon="⚠️" label="Non justifiées" value={stats.nonJustifiees} tone="danger" />
        <StatCard icon="📅" label="Aujourd'hui" value={stats.todayCount} tone="warning" />
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 64, textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)' }}>
          <div style={{ fontSize: 54, marginBottom: 12 }}>&#128221;</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Aucune absence</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {idClasse || search ? 'Aucune absence ne correspond à votre recherche.' : "Aucune absence enregistrée pour vos cours pour le moment."}
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em' }}>
              {filtered.length} absence{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Élève</th>
                  <th style={thStyle}>Matricule</th>
                  <th style={thStyle}>Cours</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Statut</th>
                  <th style={thStyle}>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr
                    key={a.idAbsence}
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
                          background: (a.eleve?.sexe || 1) === 2
                            ? 'linear-gradient(135deg, #fce7f3, #fbcfe8)'
                            : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                          color: (a.eleve?.sexe || 1) === 2 ? '#be185d' : '#1d4ed8',
                        }}>{(a.eleve?.nom || '?')[0]}{(a.eleve?.prenom || '?')[0]}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{a.eleve?.nom || '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.eleve?.prenom || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                        padding: '2px 8px', borderRadius: 6, background: 'var(--border-light)',
                      }}>{a.matricule}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.cours?.libelle || '—'}</span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {classeMap[a.cours?.idClasse] || (a.cours?.idClasse ? `Classe #${a.cours.idClasse}` : '')}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {a.date ? new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {a.justifiee ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999,
                          fontSize: 12, fontWeight: 700,
                          background: '#d1fae5', color: '#065f46',
                        }}>✓ Justifiée</span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999,
                          fontSize: 12, fontWeight: 700,
                          background: '#fef3c7', color: '#92400e',
                        }}>● Non justifiée</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 180 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: a.commentaire ? 'normal' : 'italic' }}>
                        {a.commentaire || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={!!modal} title="Signaler une absence" onClose={() => setModal(null)} width={520}>
        {modal && (
          <form onSubmit={handleSubmit}>
            {formError && <Alert tone="error">{formError}</Alert>}
            <SelectField
              label="Cours"
              required
              value={modal.values.idCours}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idCours: e.target.value, matricule: '' } }))}
              options={coursDisponibles.map((c) => ({ value: c.idCours, label: `${c.libelle} — ${c.classe?.libelle || 'Classe ?'}` }))}
              placeholder="Sélectionner un cours"
            />
            <SelectField
              label="Élève"
              required
              value={modal.values.matricule}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, matricule: e.target.value } }))}
              options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))}
              placeholder={!modal.values.idCours ? "Choisissez d'abord un cours" : "Sélectionner un élève"}
              disabled={!modal.values.idCours}
            />
            <InputField
              label="Date"
              type="date"
              required
              value={modal.values.date}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, date: e.target.value } }))}
            />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Commentaire</label>
              <textarea
                placeholder="Motif de l'absence (optionnel)"
                value={modal.values.commentaire}
                onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, commentaire: e.target.value } }))}
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box',
                  resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
