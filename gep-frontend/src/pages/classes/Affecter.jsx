import Module35Layout from './Module35Layout'
import { useEffect, useMemo, useState } from 'react'
import { classeApi, eleveApi, anneeAcademiqueApi, inscriptionApi, extractList } from '../../api'
import { mapEleveToStudent } from '../../utils/apiMappers'

export default function Affecter() {
  const [classes, setClasses] = useState([])
  const [classeId, setClasseId] = useState('')
  const [salleId, setSalleId] = useState('')
  const [annee, setAnnee] = useState(null)
  const [students, setStudents] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setLoading(true)
      try {
        const [classesRes, elevesRes, anneesRes] = await Promise.all([classeApi.list(), eleveApi.list(), anneeAcademiqueApi.list()])
        if (cancelled) return
        const classesList = extractList(classesRes)
        setClasses(classesList)
        if (classesList.length > 0) setClasseId(String(classesList[0].idClasse))
        setStudents(extractList(elevesRes).map(mapEleveToStudent))
        const annees = extractList(anneesRes)
        const latest = annees.reduce((best, current) => (!best || current.idAnnee > best.idAnnee ? current : best), null)
        setAnnee(latest)
      } catch (error) {
        console.error('Failed to load affectation data', error)
        setFeedback('Impossible de charger les données depuis le backend.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  const selectedClasse = classes.find(c => String(c.idClasse) === classeId)
  const salles = selectedClasse?.salles ?? []

  useEffect(() => {
    if (salles.length > 0) setSalleId(String(salles[0].idSalle))
    else setSalleId('')
  }, [classeId, salles.length])

  const candidates = useMemo(() => students.map(student => ({
    ...student,
    alreadyEnrolled: student.className !== 'Non inscrit',
  })), [students])

  function toggle(id) {
    const candidate = candidates.find(c => c.id === id)
    if (candidate?.alreadyEnrolled) return
    setSelected(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]))
  }

  async function handleConfirm() {
    if (!salleId || !annee || selected.length === 0) {
      setFeedback('Sélectionnez une classe, une salle et au moins un élève.')
      return
    }
    setIsSubmitting(true)
    setFeedback('')
    try {
      await Promise.all(selected.map(matricule => inscriptionApi.create({
        matricule: Number(matricule),
        idAnnee: annee.idAnnee,
        idSalle: Number(salleId),
      })))
      setFeedback(`${selected.length} élève(s) affecté(s) avec succès.`)
      setSelected([])
      const response = await eleveApi.list()
      setStudents(extractList(response).map(mapEleveToStudent))
    } catch (error) {
      console.error('Affectation failed', error)
      setFeedback(error?.response?.data?.error || error?.message || "Erreur lors de l'affectation.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Module35Layout breadcrumb={["Modules", "Affectation"]} backTo={'/classes'}>
      <div className="module35-page-header">
        <div>
          <h1>Affecter des élèves</h1>
          <p className="module35-page-sub">Sélectionnez une classe, une salle, puis les élèves à y inscrire pour l'année active.</p>
        </div>
        <div className="module35-header-actions">
          <a href="/classes/affecter-enseignant" className="module35-btn-prim">Affecter un enseignant</a>
        </div>
      </div>

      <div className="module35-card" style={{ marginBottom: 16 }}>
        <div className="module35-card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="module35-form-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Classe</label>
            <select value={classeId} onChange={e => setClasseId(e.target.value)}>
              {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
            </select>
          </div>
          <div className="module35-form-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Salle</label>
            <select value={salleId} onChange={e => setSalleId(e.target.value)}>
              {salles.length === 0 && <option value="">Aucune salle pour cette classe</option>}
              {salles.map(s => <option key={s.idSalle} value={s.idSalle}>{s.libelle}</option>)}
            </select>
          </div>
          <div className="module35-form-group" style={{ minWidth: 160 }}>
            <label>Année active</label>
            <div style={{ padding: '10px 0', fontWeight: 600 }}>{annee?.libelle || '—'}</div>
          </div>
        </div>
      </div>

      <div className="module35-main-layout">
        <div>
          <div className="module35-card">
            <div className="module35-card-header">
              <div>
                <div className="module35-card-title">Élèves</div>
                <div className="module35-card-sub">{loading ? 'Chargement…' : `${candidates.length} élève(s) au total`}</div>
              </div>
            </div>
            <div className="module35-card-body">
              <div className="module35-eleve-list">
                {candidates.map(c => (
                  <div key={c.id} className={`module35-eleve-row ${selected.includes(c.id) ? 'selected' : ''} ${c.alreadyEnrolled ? 'already-in' : ''}`} onClick={() => toggle(c.id)}>
                    <div className="module35-elv-av" style={{ background: c.color }}>{c.initials}</div>
                    <div className="module35-ev-info">
                      <div className="module35-ev-name">{c.fullName}</div>
                      <div className="module35-ev-meta"><div className="module35-ev-id">{c.studentId}</div><div className={`module35-preview-section-badge ${c.alreadyEnrolled ? 'module35-b-inactif' : 'module35-b-active'}`}>{c.alreadyEnrolled ? c.className : 'Non inscrit'}</div></div>
                    </div>
                    <div className="module35-ev-right">
                      <div className="module35-ev-select-btn">{selected.includes(c.id) ? '✓' : '+'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside>
          <div className="module35-recap-card">
            <div className="module35-recap-body">
              <div className="module35-recap-title">Sélection</div>
              <div className="module35-recap-desc">{selected.length} candidats sélectionnés</div>
              <div style={{ marginTop: 12 }}>
                {selected.map(id => {
                  const student = candidates.find(c => c.id === id)
                  return <div key={id} className="module35-sel-item"><div className="module35-si-name">{student?.fullName || id}</div><div className="module35-si-remove" onClick={() => toggle(id)}>✕</div></div>
                })}
              </div>

              {feedback && <div className="module35-hint" style={{ marginTop: 10 }}>{feedback}</div>}

              <div style={{ marginTop: 14 }}>
                <button className="module35-btn-prim" onClick={handleConfirm} disabled={isSubmitting}>{isSubmitting ? 'Affectation…' : "Confirmer l'affectation"}</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Module35Layout>
  )
}
