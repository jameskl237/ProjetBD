import { useEffect, useMemo, useState } from 'react'
import { parentApi, annonceApi, extractList } from '../../api'
import './Parents.css'

function statusClass(actif) {
  return actif ? 'status-actif' : 'status-inactif'
}

function familyAvatar(nom, prenom) {
  return `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}` || 'PF'
}

function groupByParent(rows) {
  const byPers = new Map()
  rows.forEach(row => {
    const idPers = row.personne?.idPers ?? row.idPers
    if (!byPers.has(idPers)) {
      byPers.set(idPers, { idPers, personne: row.personne, children: [] })
    }
    if (row.eleve) byPers.get(idPers).children.push(row.eleve)
  })
  return [...byPers.values()]
}

export default function Parents() {
  const [rawRows, setRawRows] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous les statuts')

  useEffect(() => {
    let cancelled = false
    Promise.all([parentApi.list(), annonceApi.list()])
      .then(([parentsRes, messagesRes]) => {
        if (cancelled) return
        setRawRows(extractList(parentsRes))
        const msgs = extractList(messagesRes)
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 5)
        setMessages(msgs)
      })
      .catch(() => { if (!cancelled) setFetchError('Impossible de charger les parents depuis le backend.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const families = useMemo(() => groupByParent(rawRows).map(family => ({
    ...family,
    name: `${family.personne?.prenom || ''} ${family.personne?.nom || ''}`.trim() || family.personne?.login || `Parent #${family.idPers}`,
    actif: !!family.personne?.actif,
  })), [rawRows])

  const stats = useMemo(() => ({
    total: families.length,
    active: families.filter(f => f.actif).length,
    childrenLinked: families.reduce((sum, f) => sum + f.children.length, 0),
  }), [families])

  const filteredParents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return families.filter(family => {
      if (statusFilter === 'Actifs' && !family.actif) return false
      if (statusFilter === 'Inactifs' && family.actif) return false
      if (!query) return true
      const haystack = [family.name, family.personne?.email, family.personne?.mobile, ...family.children.map(c => `${c.prenom} ${c.nom}`)].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [families, search, statusFilter])

  return (
    <div className="parents-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍👩‍👧 Gestion des Parents</h1>
          <p className="page-subtitle">Répertoire des familles et de leurs enfants inscrits</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="stat-label">Total Parents</div><div className="stat-value">{loading ? '…' : stats.total}</div></div>
        <div className="stat-card"><div className="stat-label">Comptes Actifs</div><div className="stat-value">{loading ? '…' : stats.active}</div></div>
        <div className="stat-card"><div className="stat-label">Enfants liés</div><div className="stat-value">{loading ? '…' : stats.childrenLinked}</div></div>
      </div>

      {fetchError && <div className="card" style={{ padding: 16, marginBottom: 16, color: '#b91c1c' }}>{fetchError}</div>}

      <div className="grid-2col">
        <div>
          <div className="toolbar">
            <select className="filter-select" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option>Tous les statuts</option>
              <option>Actifs</option>
              <option>Inactifs</option>
            </select>
            <input className="search-inline ml-auto" type="text" placeholder="🔍 Rechercher un parent..." value={search} onChange={event => setSearch(event.target.value)} />
          </div>

          <div className="card parents-table-card">
            <div className="card-header">
              <span className="card-title">📋 Liste des Parents</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Parent</th>
                    <th>Téléphone</th>
                    <th>Enfants inscrits</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredParents.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}>Aucun parent enregistré.</td></tr>
                  )}
                  {filteredParents.map(parent => (
                    <tr key={parent.idPers}>
                      <td>
                        <div className="parent-cell">
                          <div className="par-avatar">{familyAvatar(parent.personne?.nom, parent.personne?.prenom)}</div>
                          <div>
                            <div className="par-name">{parent.name}</div>
                            <div className="par-email">{parent.personne?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>{parent.personne?.mobile || parent.personne?.phone || '—'}</td>
                      <td>
                        <div className="enfants-cell">
                          {parent.children.length === 0
                            ? <span className="enfant-tag">Aucun</span>
                            : parent.children.map(child => <span key={child.matricule} className="enfant-tag">{child.prenom} {child.nom}</span>)}
                        </div>
                      </td>
                      <td><span className={`status-badge ${statusClass(parent.actif)}`}>{parent.actif ? 'Actif' : 'Inactif'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="right-col">
          <div className="panel-card">
            <div className="panel-title">Messages récents</div>
            {messages.length === 0 ? (
              <p className="hint">Aucun message enregistré.</p>
            ) : messages.map(message => (
              <div key={message.idMessages} className="msg-item">
                <div className="msg-avatar">{(message.expediteur?.prenom?.[0] || '?').toUpperCase()}{(message.expediteur?.nom?.[0] || '').toUpperCase()}</div>
                <div className="msg-body">
                  <div className="msg-name">{message.expediteur ? `${message.expediteur.prenom || ''} ${message.expediteur.nom || ''}`.trim() : 'Expéditeur inconnu'}</div>
                  <div className="msg-text">{message.objet || message.content || message.information}</div>
                  <div className="msg-time">{message.created_at ? new Date(message.created_at).toLocaleString('fr-FR') : ''}</div>
                </div>
                {!message.isRead && <div className="msg-unread" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
