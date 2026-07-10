import { useEffect, useMemo, useState } from 'react'
import { enseignantApi, extractList } from '../../api'
import './Enseignants.css'

const AV_CLASSES = ['av1', 'av2', 'av3', 'av4', 'av5', 'av6', 'av7', 'av8']
const BG_GRADIENTS = [
  'linear-gradient(135deg,#4C1D95,#6D28D9)',
  'linear-gradient(135deg,#06B6D4,#6D28D9)',
  'linear-gradient(135deg,#7C3AED,#06B6D4)',
  'linear-gradient(135deg,#1E0B3B,#4C1D95)',
  'linear-gradient(135deg,#DB2777,#4C1D95)',
  'linear-gradient(135deg,#059669,#06B6D4)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#0EA5E9,#06B6D4)',
]

function groupByTeacher(rows) {
  const byPers = new Map()
  rows.forEach((row, index) => {
    const idPers = row.personne?.idPers ?? row.idPers
    if (!byPers.has(idPers)) {
      const avatarIndex = byPers.size % AV_CLASSES.length
      byPers.set(idPers, {
        idPers,
        personne: row.personne,
        actif: !!row.Actif,
        courses: [],
        avCls: AV_CLASSES[avatarIndex],
        bg: BG_GRADIENTS[avatarIndex],
      })
    }
    const teacher = byPers.get(idPers)
    if (row.Actif) teacher.actif = true
    if (row.cours) teacher.courses.push(row.cours)
  })
  return [...byPers.values()]
}

export default function Enseignants() {
  const [rawRows, setRawRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [sortCol, setSortCol] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [perPage, setPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState(() => new Set())
  const [modalTeacherId, setModalTeacherId] = useState(null)

  useEffect(() => {
    let cancelled = false
    enseignantApi.list()
      .then(response => { if (!cancelled) setRawRows(extractList(response)) })
      .catch(() => { if (!cancelled) setFetchError('Impossible de charger les enseignants depuis le backend.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const teachers = useMemo(() => groupByTeacher(rawRows).map(teacher => ({
    ...teacher,
    name: `${teacher.personne?.prenom || ''} ${teacher.personne?.nom || ''}`.trim() || teacher.personne?.login || `Enseignant #${teacher.idPers}`,
    initials: `${(teacher.personne?.prenom?.[0] || '?').toUpperCase()}${(teacher.personne?.nom?.[0] || '').toUpperCase()}`,
    classes: [...new Set(teacher.courses.map(c => c.classe?.libelle).filter(Boolean))],
    subjects: [...new Set(teacher.courses.map(c => c.libelle))],
  })), [rawRows])

  const filteredTeachers = useMemo(() => {
    const query = searchQ.trim().toLowerCase()
    const rows = teachers.filter(teacher => {
      if (!query) return true
      return (
        teacher.name.toLowerCase().includes(query) ||
        teacher.subjects.join(' ').toLowerCase().includes(query) ||
        teacher.classes.join(' ').toLowerCase().includes(query) ||
        (teacher.personne?.email || '').toLowerCase().includes(query)
      )
    })

    return [...rows].sort((left, right) => {
      let leftValue
      let rightValue
      if (sortCol === 'classes') {
        leftValue = left.classes.length
        rightValue = right.classes.length
      } else if (sortCol === 'subjects') {
        leftValue = left.subjects.length
        rightValue = right.subjects.length
      } else if (sortCol === 'status') {
        leftValue = left.actif ? 1 : 0
        rightValue = right.actif ? 1 : 0
      } else {
        leftValue = left.name.toLowerCase()
        rightValue = right.name.toLowerCase()
      }
      if (leftValue < rightValue) return sortDir === 'asc' ? -1 : 1
      if (leftValue > rightValue) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [teachers, searchQ, sortCol, sortDir])

  const total = filteredTeachers.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * perPage
  const pageTeachers = filteredTeachers.slice(start, start + perPage)
  const modalTeacher = teachers.find(teacher => teacher.idPers === modalTeacherId) ?? null

  const totalTeachers = teachers.length
  const activeTeachers = teachers.filter(teacher => teacher.actif).length
  const subjectsCount = [...new Set(teachers.flatMap(teacher => teacher.subjects))].length

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  function handleSortColumn(column) {
    if (sortCol === column) setSortDir(current => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setSortCol(column)
      setSortDir('asc')
    }
  }

  function toggleRow(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      const allSelected = pageTeachers.length > 0 && pageTeachers.every(teacher => next.has(teacher.idPers))
      if (allSelected) pageTeachers.forEach(teacher => next.delete(teacher.idPers))
      else pageTeachers.forEach(teacher => next.add(teacher.idPers))
      return next
    })
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const selectedCurrentPage = pageTeachers.length > 0 && pageTeachers.every(teacher => selected.has(teacher.idPers))

  const paginationItems = []
  paginationItems.push({ type: 'prev', label: '‹', page: safePage - 1, disabled: safePage === 1 })
  for (let page = 1; page <= totalPages; page += 1) {
    if (page === 1 || page === totalPages || Math.abs(page - safePage) <= 2) paginationItems.push({ type: 'page', label: page, page, active: page === safePage })
    else if (Math.abs(page - safePage) === 3) paginationItems.push({ type: 'ellipsis', label: '…' })
  }
  paginationItems.push({ type: 'next', label: '›', page: safePage + 1, disabled: safePage === totalPages })

  return (
    <div className="enseignants-page">
      <div className="page-header enseignants-page-header">
        <div>
          <h1 className="page-title">🎓 Enseignants</h1>
          <p className="page-subtitle">Gérez le corps enseignant, leurs matières et leurs classes.</p>
        </div>
      </div>

      <div className="enseignants-stat-strip">
        <div className="enseignants-scard"><div className="enseignants-sc-icon ic-v">🎓</div><div><div className="enseignants-sc-val">{loading ? '…' : totalTeachers}</div><div className="enseignants-sc-lbl">Total enseignants</div></div></div>
        <div className="enseignants-scard"><div className="enseignants-sc-icon ic-c">🟢</div><div><div className="enseignants-sc-val">{loading ? '…' : activeTeachers}</div><div className="enseignants-sc-lbl">Actifs</div></div></div>
        <div className="enseignants-scard"><div className="enseignants-sc-icon ic-a">📚</div><div><div className="enseignants-sc-val">{loading ? '…' : subjectsCount}</div><div className="enseignants-sc-lbl">Matières enseignées</div></div></div>
      </div>

      {fetchError && <div className="card" style={{ padding: 16, marginBottom: 16, color: '#b91c1c' }}>{fetchError}</div>}

      <div className="enseignants-toolbar">
        <div className="enseignants-toolbar-right">
          <select className="enseignants-sel" value={`${sortCol}-${sortDir}`} onChange={event => {
            const [column, direction] = event.target.value.split('-')
            setSortCol(column)
            setSortDir(direction)
          }}>
            <option value="name-asc">Nom A → Z</option>
            <option value="name-desc">Nom Z → A</option>
            <option value="classes-desc">Plus de classes</option>
            <option value="subjects-desc">Plus de matières</option>
          </select>
          <select className="enseignants-sel" value={perPage} onChange={event => setPerPage(Number(event.target.value))}>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
      </div>

      <div className="enseignants-table-card card">
        <div className="enseignants-table-search-row">
          <div className="enseignants-tsearch">
            <span className="enseignants-tsi">🔍</span>
            <input type="text" value={searchQ} onChange={event => setSearchQ(event.target.value)} placeholder="Rechercher nom, matière, email..." />
          </div>
          <div className="enseignants-table-info"><strong>{total.toLocaleString('fr')}</strong> enseignants trouvés</div>
        </div>

        <div className="enseignants-table-scroll">
          <table className="enseignants-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <button type="button" className={`enseignants-cb ${selectedCurrentPage ? 'chk' : ''}`} onClick={toggleAll} aria-label="Tout sélectionner">{selectedCurrentPage ? '✓' : ''}</button>
                </th>
                {[
                  ['name', 'Enseignant'],
                  ['subjects', 'Matières'],
                  ['classes', 'Classes'],
                  ['status', 'Statut'],
                ].map(([column, label]) => (
                  <th key={column} onClick={() => handleSortColumn(column)} className={sortCol === column ? 'sorted' : ''}>
                    {label} <span className="sort-ico">{sortCol === column ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </th>
                ))}
                <th style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pageTeachers.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Aucun enseignant enregistré.</td></tr>
              )}
              {pageTeachers.map(teacher => {
                const isSelected = selected.has(teacher.idPers)
                return (
                  <tr key={teacher.idPers} className={isSelected ? 'selected' : ''} onClick={() => setModalTeacherId(teacher.idPers)}>
                    <td onClick={event => event.stopPropagation()}>
                      <button type="button" className={`enseignants-cb ${isSelected ? 'chk' : ''}`} onClick={() => toggleRow(teacher.idPers)}>{isSelected ? '✓' : ''}</button>
                    </td>
                    <td>
                      <div className="teach-cell">
                        <div className={`teach-av ${teacher.avCls}`}>
                          {teacher.initials}
                          <div className={`online-dot ${teacher.actif ? 'dot-online' : 'dot-off'}`} />
                        </div>
                        <div>
                          <div className="tname">{teacher.name}</div>
                          <div className="tid">{teacher.personne?.email || teacher.personne?.login || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="chips">
                        {teacher.subjects.slice(0, 2).map(subject => (
                          <span key={subject} className="chip chip-v">{subject}</span>
                        ))}
                        {teacher.subjects.length > 2 && <span className="chip chip-v">+{teacher.subjects.length - 2}</span>}
                        {teacher.subjects.length === 0 && <span className="chip chip-v">Aucune</span>}
                      </div>
                    </td>
                    <td>
                      <div className="classes-cell">{teacher.classes.slice(0, 2).join(', ') || '—'}{teacher.classes.length > 2 ? ` +${teacher.classes.length - 2}` : ''}</div>
                      <div className="classes-sub">{teacher.classes.length} classe{teacher.classes.length > 1 ? 's' : ''}</div>
                    </td>
                    <td><span className={`badge ${teacher.actif ? 'b-active' : 'b-off'}`}><span className="bdot" />{teacher.actif ? 'Actif' : 'Inactif'}</span></td>
                    <td onClick={event => event.stopPropagation()}>
                      <div className="action-cell">
                        <button type="button" className="act-btn" title="Voir" onClick={() => setModalTeacherId(teacher.idPers)}>👁</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="enseignants-pag-row">
          <div className="enseignants-pag-info">Page <strong>{safePage}</strong>/<strong>{totalPages}</strong> · <strong>{total === 0 ? 0 : start + 1}–{Math.min(start + perPage, total)}</strong> sur <strong>{total.toLocaleString('fr')}</strong></div>
          <div className="enseignants-pag-controls">
            {paginationItems.map((item, index) => {
              if (item.type === 'ellipsis') return <div key={`ellipsis-${index}`} className="pag-btn" style={{ pointerEvents: 'none' }}>…</div>
              return (
                <button key={`${item.type}-${item.label}`} type="button" className={`pag-btn${item.active ? ' active' : ''}`} disabled={item.disabled} onClick={() => goToPage(item.page)}>
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {modalTeacher && (
        <div className="overlay open" onClick={event => {
          if (event.target === event.currentTarget) setModalTeacherId(null)
        }}>
          <div className="modal">
            <div className="modal-hero">
              <div className="mh-bg" style={{ background: modalTeacher.bg }} />
              <div className="mh-pat" />
              <div className="m-av" style={{ background: modalTeacher.bg }}>{modalTeacher.initials}</div>
              <button className="m-close" type="button" onClick={() => setModalTeacherId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="m-name">{modalTeacher.name}</div>
              <div className="m-sub">{modalTeacher.personne?.email || modalTeacher.personne?.login || '—'}</div>
              <div className="m-tags">
                {modalTeacher.subjects.map(subject => <span key={subject} className="tag tv">{subject}</span>)}
                <span className="tag tg">{modalTeacher.actif ? 'Actif' : 'Inactif'}</span>
              </div>

              <div className="m-sec">
                <div className="m-sec-title">Informations personnelles</div>
                <div className="info-grid">
                  <div className="info-item"><div className="info-lbl">TÉLÉPHONE</div><div className="info-val">{modalTeacher.personne?.mobile || modalTeacher.personne?.phone || '—'}</div></div>
                  <div className="info-item"><div className="info-lbl">EMAIL</div><div className="info-val" style={{ fontSize: 11 }}>{modalTeacher.personne?.email || '—'}</div></div>
                  <div className="info-item"><div className="info-lbl">CLASSES</div><div className="info-val">{modalTeacher.classes.join(', ') || '—'}</div></div>
                  <div className="info-item"><div className="info-lbl">MATIÈRES</div><div className="info-val">{modalTeacher.subjects.join(', ') || '—'}</div></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="mf-out" type="button" onClick={() => setModalTeacherId(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
