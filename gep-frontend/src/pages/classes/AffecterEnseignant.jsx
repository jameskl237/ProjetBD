import Module35Layout from './Module35Layout'
import { useEffect, useState } from 'react'
import { classeApi, api, extractList } from '../../api'

export default function AffecterEnseignant() {
  const [classes, setClasses] = useState([])
  const [classeId, setClasseId] = useState('')
  const [enseignants, setEnseignants] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setLoading(true)
      try {
        const [classesRes, personnesRes] = await Promise.all([classeApi.list(), api.get('/personnes')])
        if (cancelled) return
        const classesList = extractList(classesRes)
        setClasses(classesList)
        if (classesList.length > 0) setClasseId(String(classesList[0].idClasse))
        const personnes = extractList(personnesRes)
        setEnseignants(personnes.filter(p => p.typePersonne === 1))
      } catch (error) {
        console.error('Failed to load data', error)
        setFeedback('Impossible de charger les données depuis le backend.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  const selectedClasse = classes.find(c => String(c.idClasse) === classeId)

  async function handleAssign(idPers) {
    if (!classeId) return
    setAssigningId(idPers)
    setFeedback('')
    try {
      await classeApi.update(classeId, { titulaire: idPers })
      setFeedback('Enseignant affecté avec succès.')
      const response = await classeApi.list()
      setClasses(extractList(response))
    } catch (error) {
      console.error('Assign failed', error)
      setFeedback(error?.response?.data?.error || error?.message || "Erreur lors de l'affectation.")
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <Module35Layout breadcrumb={["Modules", "Affecter un enseignant"]} backTo={'/classes'}>
      <div className="module35-page-header">
        <div>
          <h1>Affecter un enseignant</h1>
          <p className="module35-page-sub">Choisissez une classe puis désignez son enseignant responsable (titulaire).</p>
        </div>
      </div>

      <div className="module35-card" style={{ marginBottom: 16 }}>
        <div className="module35-card-body">
          <div className="module35-form-group" style={{ maxWidth: 320 }}>
            <label>Classe</label>
            <select value={classeId} onChange={e => setClasseId(e.target.value)}>
              {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
            </select>
          </div>
          {selectedClasse?.titulaire && (
            <p className="module35-hint">Titulaire actuel : Personne #{selectedClasse.titulaire}</p>
          )}
          {feedback && <p className="module35-hint">{feedback}</p>}
        </div>
      </div>

      {loading ? (
        <div className="module35-card" style={{ padding: 16 }}>Chargement des enseignants…</div>
      ) : enseignants.length === 0 ? (
        <div className="module35-card" style={{ padding: 16 }}>Aucun enseignant enregistré.</div>
      ) : (
        <div className="module35-ens-grid">
          {enseignants.map(t => (
            <div key={t.idPers} className="module35-ens-card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="module35-te-av" style={{ background: 'linear-gradient(135deg,#7C3AED,#A78BFA)' }}>{(t.prenom?.[0] || '?').toUpperCase()}{(t.nom?.[0] || '').toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>{`${t.prenom || ''} ${t.nom || ''}`.trim() || t.login}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{t.email || t.mobile || t.login}</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="module35-btn-prim" onClick={() => handleAssign(t.idPers)} disabled={assigningId === t.idPers || !classeId}>
                  {assigningId === t.idPers ? 'Affectation…' : 'Affecter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Module35Layout>
  )
}
