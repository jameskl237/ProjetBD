import { useEffect, useMemo, useState } from 'react'
import { examenApi, trimestreApi, api, extractList } from '../../api'
import './Examens.css'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Examens() {
  const [sessions, setSessions] = useState([])
  const [epreuves, setEpreuves] = useState([])
  const [natures, setNatures] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [trimestres, setTrimestres] = useState([])
  const [enseignants, setEnseignants] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [view, setView] = useState('sessions')
  const [search, setSearch] = useState('')

  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [sessionForm, setSessionForm] = useState({ libelle: '', description: '', idTrimestre: '', idPers: '', date_passage: '' })
  const [sessionFeedback, setSessionFeedback] = useState('')

  const [epreuveModalOpen, setEpreuveModalOpen] = useState(false)
  const [epreuveForm, setEpreuveForm] = useState({ libelle: '', idNature: '', auteur: '', urlDoc: '' })
  const [epreuveFeedback, setEpreuveFeedback] = useState('')

  async function loadAll() {
    setLoading(true)
    try {
      const [sessionsRes, epreuvesRes, naturesRes, evaluationsRes, trimestresRes, personnesRes] = await Promise.all([
        examenApi.list(),
        api.get('/evaluations/epreuves'),
        api.get('/evaluations/natures'),
        api.get('/evaluations'),
        trimestreApi.list(),
        api.get('/personnes'),
      ])
      setSessions(extractList(sessionsRes))
      setEpreuves(extractList(epreuvesRes))
      setNatures(extractList(naturesRes))
      setEvaluations(extractList(evaluationsRes))
      setTrimestres(extractList(trimestresRes))
      setEnseignants(extractList(personnesRes).filter(p => p.typePersonne === 1))
    } catch (error) {
      console.error('Failed to load examens data', error)
      setFetchError('Impossible de charger les données depuis le backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const evalsBySession = useMemo(() => {
    const map = new Map()
    evaluations.forEach(ev => {
      if (!map.has(ev.idSession)) map.set(ev.idSession, [])
      map.get(ev.idSession).push(ev)
    })
    return map
  }, [evaluations])

  const evalsByEpreuve = useMemo(() => {
    const map = new Map()
    evaluations.forEach(ev => {
      if (!map.has(ev.idEpreuve)) map.set(ev.idEpreuve, [])
      map.get(ev.idEpreuve).push(ev)
    })
    return map
  }, [evaluations])

  const stats = useMemo(() => {
    const notes = evaluations.map(e => Number(e.note)).filter(n => !Number.isNaN(n))
    const avg = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null
    return {
      totalSessions: sessions.length,
      totalEpreuves: epreuves.length,
      totalEvaluations: evaluations.length,
      moyenneGenerale: avg,
    }
  }, [sessions, epreuves, evaluations])

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sessions.filter(s => !query || [s.libelle, s.description, s.trimestre?.libelle].join(' ').toLowerCase().includes(query))
      .sort((a, b) => new Date(b.date_passage || 0) - new Date(a.date_passage || 0))
  }, [sessions, search])

  const filteredEpreuves = useMemo(() => {
    const query = search.trim().toLowerCase()
    return epreuves.filter(e => !query || [e.libelle, e.nature?.libelle, e.auteur].join(' ').toLowerCase().includes(query))
  }, [epreuves, search])

  async function handleCreateSession() {
    if (!sessionForm.libelle || !sessionForm.idTrimestre || !sessionForm.idPers) {
      setSessionFeedback('Libellé, trimestre et responsable sont obligatoires.')
      return
    }
    setSessionFeedback('')
    try {
      await examenApi.create({
        libelle: sessionForm.libelle,
        description: sessionForm.description || '',
        idTrimestre: Number(sessionForm.idTrimestre),
        idPers: Number(sessionForm.idPers),
        date_passage: sessionForm.date_passage || null,
      })
      setSessionModalOpen(false)
      setSessionForm({ libelle: '', description: '', idTrimestre: '', idPers: '', date_passage: '' })
      loadAll()
    } catch (error) {
      setSessionFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la création.')
    }
  }

  async function handleCreateEpreuve() {
    if (!epreuveForm.libelle || !epreuveForm.idNature) {
      setEpreuveFeedback('Libellé et nature sont obligatoires.')
      return
    }
    setEpreuveFeedback('')
    try {
      await api.post('/evaluations/epreuves', {
        libelle: epreuveForm.libelle,
        idNature: Number(epreuveForm.idNature),
        auteur: epreuveForm.auteur || '',
        urlDoc: epreuveForm.urlDoc || '',
      })
      setEpreuveModalOpen(false)
      setEpreuveForm({ libelle: '', idNature: '', auteur: '', urlDoc: '' })
      loadAll()
    } catch (error) {
      setEpreuveFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la création.')
    }
  }

  return (
    <div className="exams-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Examens</h1>
          <p className="page-subtitle">Sessions d'examens et bibliothèque d'épreuves de l'établissement.</p>
        </div>
        <div className="header-actions">
          <button className="btn-prim" type="button" onClick={() => setSessionModalOpen(true)}>＋ Nouvelle session</button>
          <button className="btn-sec" type="button" onClick={() => setEpreuveModalOpen(true)}>＋ Nouvelle épreuve</button>
        </div>
      </div>

      {fetchError && <div className="card" style={{ padding: 16, marginBottom: 16, color: '#b91c1c' }}>{fetchError}</div>}

      <div className="stat-strip">
        <div className="scard"><div className="sc-icon ic-v">📅</div><div><div className="sc-val">{loading ? '…' : stats.totalSessions}</div><div className="sc-lbl">Sessions</div></div></div>
        <div className="scard"><div className="sc-icon ic-c">📄</div><div><div className="sc-val">{loading ? '…' : stats.totalEpreuves}</div><div className="sc-lbl">Épreuves</div></div></div>
        <div className="scard"><div className="sc-icon ic-g">✅</div><div><div className="sc-val">{loading ? '…' : stats.totalEvaluations}</div><div className="sc-lbl">Notes enregistrées</div></div></div>
        <div className="scard"><div className="sc-icon ic-a">⭐</div><div><div className="sc-val">{stats.moyenneGenerale != null ? `${stats.moyenneGenerale.toFixed(1)}/20` : '—'}</div><div className="sc-lbl">Moyenne générale</div></div></div>
      </div>

      <div className="tabs-row">
        <button type="button" className={`tab ${view === 'sessions' ? 'active' : ''}`} onClick={() => setView('sessions')}>Sessions</button>
        <button type="button" className={`tab ${view === 'epreuves' ? 'active' : ''}`} onClick={() => setView('epreuves')}>Bibliothèque d'épreuves</button>
      </div>

      <div className="exams-area" style={{ marginTop: 12 }}>
        <div className="area-toolbar">
          <span className="area-title">{view === 'sessions' ? 'Sessions d\'examens' : 'Épreuves'}</span>
          <span className="area-count">{view === 'sessions' ? filteredSessions.length : filteredEpreuves.length} résultat(s)</span>
          <input className="search-input" type="text" placeholder="Rechercher..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>

        {view === 'sessions' ? (
          <div className="exams-list" style={{ display: 'flex' }}>
            {!loading && filteredSessions.length === 0 && <p className="hint" style={{ padding: 16 }}>Aucune session enregistrée.</p>}
            {filteredSessions.map(session => {
              const sessionEvals = evalsBySession.get(session.idSession) || []
              const notes = sessionEvals.map(e => Number(e.note)).filter(n => !Number.isNaN(n))
              const avg = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null
              return (
                <div key={session.idSession} className="el-item">
                  <div className="el-icon" style={{ background: 'linear-gradient(135deg,#4C1D95,#6D28D9)' }}>📅</div>
                  <div className="el-info">
                    <div className="el-title">{session.libelle}</div>
                    <div className="el-sub">{session.trimestre?.libelle || 'Trimestre inconnu'} · {session.responsable ? `${session.responsable.prenom || ''} ${session.responsable.nom || ''}`.trim() : 'Responsable inconnu'}</div>
                    <div className="el-badges">
                      <span className="el-badge" style={{ background: 'rgba(76,29,149,.08)', color: 'var(--violet-profond)' }}>📅 {formatDate(session.date_passage)}</span>
                      <span className="el-badge" style={{ background: 'rgba(6,182,212,.08)', color: '#0891B2' }}>📝 {sessionEvals.length} note(s)</span>
                    </div>
                  </div>
                  <div className="el-stat">
                    <div className="el-pct">{avg != null ? `${avg.toFixed(1)}/20` : '—'}</div>
                    <div className="el-lbl">Moyenne</div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="exams-list" style={{ display: 'flex' }}>
            {!loading && filteredEpreuves.length === 0 && <p className="hint" style={{ padding: 16 }}>Aucune épreuve enregistrée.</p>}
            {filteredEpreuves.map(epreuve => {
              const epreuveEvals = evalsByEpreuve.get(epreuve.idEpreuve) || []
              const notes = epreuveEvals.map(e => Number(e.note)).filter(n => !Number.isNaN(n))
              const avg = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null
              return (
                <div key={epreuve.idEpreuve} className="el-item">
                  <div className="el-icon" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>📄</div>
                  <div className="el-info">
                    <div className="el-title">{epreuve.libelle}</div>
                    <div className="el-sub">{epreuve.nature?.libelle || 'Nature inconnue'}{epreuve.auteur ? ` · ${epreuve.auteur}` : ''}</div>
                    <div className="el-badges">
                      <span className="el-badge" style={{ background: 'rgba(76,29,149,.08)', color: 'var(--violet-profond)' }}>📝 {epreuveEvals.length} note(s)</span>
                      {epreuve.urlDoc && <a className="el-badge" href={epreuve.urlDoc} target="_blank" rel="noreferrer" style={{ background: 'rgba(6,182,212,.08)', color: '#0891B2' }}>📎 Document</a>}
                    </div>
                  </div>
                  <div className="el-stat">
                    <div className="el-pct">{avg != null ? `${avg.toFixed(1)}/20` : '—'}</div>
                    <div className="el-lbl">Moyenne</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {sessionModalOpen && (
        <div className="modal-overlay open" onClick={event => { if (event.target === event.currentTarget) setSessionModalOpen(false) }}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="modal-title">➕ Nouvelle session d'examen</div>
              </div>
              <button type="button" className="modal-close" onClick={() => setSessionModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group full"><div className="form-label">Libellé</div><input className="form-input" value={sessionForm.libelle} onChange={e => setSessionForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex: Examens du 2e trimestre" /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <div className="form-label">Trimestre</div>
                  <select className="form-select" value={sessionForm.idTrimestre} onChange={e => setSessionForm(f => ({ ...f, idTrimestre: e.target.value }))}>
                    <option value="">Choisir…</option>
                    {trimestres.map(t => <option key={t.idTrimes} value={t.idTrimes}>{t.libelle}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <div className="form-label">Responsable</div>
                  <select className="form-select" value={sessionForm.idPers} onChange={e => setSessionForm(f => ({ ...f, idPers: e.target.value }))}>
                    <option value="">Choisir…</option>
                    {enseignants.map(p => <option key={p.idPers} value={p.idPers}>{p.prenom} {p.nom}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><div className="form-label">Date de passage</div><input type="date" className="form-input" value={sessionForm.date_passage} onChange={e => setSessionForm(f => ({ ...f, date_passage: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group full"><div className="form-label">Description</div><textarea className="form-textarea" value={sessionForm.description} onChange={e => setSessionForm(f => ({ ...f, description: e.target.value }))} /></div>
              </div>
              {sessionFeedback && <p className="hint">{sessionFeedback}</p>}
            </div>
            <div className="modal-foot">
              <button type="button" className="mf-out" onClick={() => setSessionModalOpen(false)}>Annuler</button>
              <button type="button" className="mf-sol" onClick={handleCreateSession}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {epreuveModalOpen && (
        <div className="modal-overlay open" onClick={event => { if (event.target === event.currentTarget) setEpreuveModalOpen(false) }}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="modal-title">➕ Nouvelle épreuve</div>
              </div>
              <button type="button" className="modal-close" onClick={() => setEpreuveModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group full"><div className="form-label">Libellé</div><input className="form-input" value={epreuveForm.libelle} onChange={e => setEpreuveForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex: Contrôle Algèbre chapitre 3" /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <div className="form-label">Nature</div>
                  <select className="form-select" value={epreuveForm.idNature} onChange={e => setEpreuveForm(f => ({ ...f, idNature: e.target.value }))}>
                    <option value="">Choisir…</option>
                    {natures.map(n => <option key={n.idNature} value={n.idNature}>{n.libelle}</option>)}
                  </select>
                </div>
                <div className="form-group"><div className="form-label">Auteur</div><input className="form-input" value={epreuveForm.auteur} onChange={e => setEpreuveForm(f => ({ ...f, auteur: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group full"><div className="form-label">Lien du document</div><input className="form-input" value={epreuveForm.urlDoc} onChange={e => setEpreuveForm(f => ({ ...f, urlDoc: e.target.value }))} placeholder="https://…" /></div>
              </div>
              {epreuveFeedback && <p className="hint">{epreuveFeedback}</p>}
            </div>
            <div className="modal-foot">
              <button type="button" className="mf-out" onClick={() => setEpreuveModalOpen(false)}>Annuler</button>
              <button type="button" className="mf-sol" onClick={handleCreateEpreuve}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
