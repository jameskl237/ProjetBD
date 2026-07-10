import { useEffect, useMemo, useState } from 'react'
import { enseignantApi, absenceApi, api, extractList } from '../../api'
import useAuth from '../../hooks/useAuth'

export default function AbsencesSaisie() {
  const { user } = useAuth()
  const [affectations, setAffectations] = useState([])
  const [idCours, setIdCours] = useState('')
  const [eleves, setEleves] = useState([])
  const [matricule, setMatricule] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [commentaire, setCommentaire] = useState('')
  const [justifiee, setJustifiee] = useState(false)
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([enseignantApi.list(), absenceApi.list()])
      .then(([ensRes, absRes]) => {
        if (cancelled) return
        const mine = extractList(ensRes).filter(e => e.idPers === user?.id && e.cours)
        setAffectations(mine)
        if (mine.length > 0) setIdCours(String(mine[0].cours.idCours))
        setAbsences(extractList(absRes))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger vos données.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  const classeIdForCours = useMemo(() => {
    const found = affectations.find(a => String(a.cours?.idCours) === String(idCours))
    return found?.cours?.classe?.idClasse ?? null
  }, [affectations, idCours])

  useEffect(() => {
    if (!classeIdForCours) { setEleves([]); return }
    let cancelled = false
    api.get(`/classes/${classeIdForCours}/eleves`)
      .then(res => { if (!cancelled) { const list = res?.data?.data ?? res?.data ?? []; setEleves(list); setMatricule(list[0]?.matricule ? String(list[0].matricule) : '') } })
      .catch(() => { if (!cancelled) setFeedback("Impossible de charger les élèves de cette classe.") })
    return () => { cancelled = true }
  }, [classeIdForCours])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!matricule || !idCours || !date) return
    setSaving(true)
    setFeedback('')
    try {
      await absenceApi.create({ matricule: Number(matricule), idCours: Number(idCours), date, commentaire, justifiee })
      const refreshed = await absenceApi.list()
      setAbsences(extractList(refreshed))
      setCommentaire('')
      setJustifiee(false)
      setFeedback('Absence enregistrée avec succès.')
    } catch (error) {
      setFeedback(error?.response?.data?.error || "Impossible d'enregistrer l'absence.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Saisie des absences</h1>
          <p className="page-sub">Enregistrez une absence pour un élève de vos cours.</p>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      <form className="card mb-18" onSubmit={handleSubmit}>
        <div className="filters-row">
          <div className="filter-group"><label>Cours</label>
            <select className="fselect" value={idCours} onChange={e => setIdCours(e.target.value)}>
              {affectations.map(a => <option key={a.cours.idCours} value={a.cours.idCours}>{a.cours.libelle} — {a.cours.classe?.libelle}</option>)}
            </select>
          </div>
          <div className="filter-group"><label>Élève</label>
            <select className="fselect" value={matricule} onChange={e => setMatricule(e.target.value)}>
              {eleves.map(e => <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom} — {e.matricule}</option>)}
            </select>
          </div>
          <div className="filter-group"><label>Date</label>
            <input className="finput" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="filters-row">
          <div className="filter-group fg-2"><label>Commentaire</label>
            <input className="finput" value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Motif éventuel..." />
          </div>
          <div className="filter-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
              <input type="checkbox" checked={justifiee} onChange={e => setJustifiee(e.target.checked)} /> Justifiée
            </label>
          </div>
        </div>
        <button className="btn-outline" type="submit" disabled={saving || !matricule}>{saving ? 'Enregistrement…' : "Enregistrer l'absence"}</button>
      </form>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 8 }}><h3 style={{ margin: 0 }}>Absences déjà enregistrées</h3></div>
        {loading ? (
          <div style={{ padding: 16 }}>Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Élève</th><th>Cours</th><th>Date</th><th>Justifiée</th><th>Commentaire</th></tr></thead>
              <tbody>
                {absences.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Aucune absence enregistrée.</td></tr>}
                {absences.map(a => (
                  <tr key={a.idAbsence}>
                    <td>{a.eleve?.prenom} {a.eleve?.nom}</td>
                    <td>{a.cours?.libelle}</td>
                    <td>{a.date}</td>
                    <td>{a.justifiee ? 'Oui' : 'Non'}</td>
                    <td>{a.commentaire}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
