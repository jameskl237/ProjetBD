import { useEffect, useMemo, useState } from 'react'
import { quartierApi, api, extractList } from '../../api'
import './Transport.css'

export default function Transport() {
  const [quartiers, setQuartiers] = useState([])
  const [residents, setResidents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ libelle: '', description: '' })

  async function loadAll() {
    setLoading(true)
    try {
      const [quartiersRes, residentsRes] = await Promise.all([quartierApi.list(), api.get('/quartiers/residents')])
      setQuartiers(extractList(quartiersRes))
      setResidents(extractList(residentsRes))
    } catch (error) {
      console.error('Failed to load quartiers', error)
      setFeedback('Impossible de charger les quartiers depuis le backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const residentsByQuartier = useMemo(() => {
    const map = new Map()
    residents.forEach(r => {
      if (!map.has(r.idQuartier)) map.set(r.idQuartier, [])
      map.get(r.idQuartier).push(r)
    })
    return map
  }, [residents])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return quartiers.filter(q => !query || q.libelle.toLowerCase().includes(query))
  }, [quartiers, search])

  async function handleCreate() {
    if (!form.libelle.trim()) {
      setFeedback('Le libellé du quartier est obligatoire.')
      return
    }
    setFeedback('')
    try {
      await quartierApi.create({ libelle: form.libelle.trim(), description: form.description || '' })
      setCreateOpen(false)
      setForm({ libelle: '', description: '' })
      loadAll()
    } catch (error) {
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la création du quartier.')
    }
  }

  const totalResidents = residents.length

  return (
    <div className="transport-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🗺️ Quartiers & zones de résidence</h1>
          <p className="page-subtitle">Gérez les quartiers desservis et les personnes qui y résident, pour organiser le transport scolaire.</p>
        </div>
        <div className="header-actions">
          <button className="btn-prim" type="button" onClick={() => setCreateOpen(true)}>＋ Nouveau quartier</button>
        </div>
      </div>

      {feedback && <div className="card" style={{ padding: 16, marginBottom: 16, color: '#b91c1c' }}>{feedback}</div>}

      <div className="stat-strip">
        <div className="scard"><div className="sc-icon ic-v">🗺️</div><div><div className="sc-val">{loading ? '…' : quartiers.length}</div><div className="sc-lbl">Quartiers</div></div></div>
        <div className="scard"><div className="sc-icon ic-c">👥</div><div><div className="sc-val">{loading ? '…' : totalResidents}</div><div className="sc-lbl">Résidents enregistrés</div></div></div>
      </div>

      <div className="transport-area">
        <div className="area-toolbar">
          <span className="area-title">Quartiers</span>
          <span className="area-count">{filtered.length} quartier{filtered.length > 1 ? 's' : ''}</span>
          <input className="search-input" type="text" placeholder="Rechercher un quartier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="cards-grid" style={{ display: 'grid' }}>
          {!loading && filtered.length === 0 && <p style={{ padding: 16 }}>Aucun quartier enregistré.</p>}
          {filtered.map(quartier => {
            const list = residentsByQuartier.get(quartier.idQuartier) || []
            return (
              <div key={quartier.idQuartier} className="bus-card">
                <div className="bc-top" style={{ background: 'linear-gradient(135deg,#4C1D95,#6D28D9)' }}>
                  <div className="bc-bus-icon">🏘️</div>
                  <div className="bc-top-right">
                    <div className="bc-num">{quartier.libelle}</div>
                    <div className="bc-status">{list.length} résident(s)</div>
                  </div>
                </div>
                <div className="bc-body">
                  <div className="bc-route">{quartier.description || 'Aucune description.'}</div>
                  {list.length > 0 && (
                    <div className="bc-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                      {list.slice(0, 5).map(r => (
                        <span key={r.idResi} className="bc-tag">👤 {r.personne ? `${r.personne.prenom || ''} ${r.personne.nom || ''}`.trim() : `Personne #${r.idPers}`}</span>
                      ))}
                      {list.length > 5 && <span className="bc-tag">+{list.length - 5} autre(s)</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {createOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setCreateOpen(false) }}>
          <div className="modal">
            <div className="modal-head"><div><div className="modal-title">＋ Nouveau quartier</div></div><button className="modal-close" onClick={() => setCreateOpen(false)}>✕</button></div>
            <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Libellé</label>
                <input className="search-input" style={{ width: '100%' }} value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex: Bastos" />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Description</label>
                <textarea className="search-input" style={{ width: '100%', minHeight: 80 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="modal-foot"><button className="mf-out" onClick={() => setCreateOpen(false)}>Annuler</button><button className="mf-sol" onClick={handleCreate}>Enregistrer</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
