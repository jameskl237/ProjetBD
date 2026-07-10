import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Module33Layout from '../inscriptions/Module33Layout'
import {
  formatSearchDate,
  getStudentStatusClass,
  getStudentStatusLabel,
  module33Sections,
} from '../inscriptions/module33Data'
import { eleveApi, classeApi, anneeAcademiqueApi, extractList } from '../../api'
import { mapEleveToStudent } from '../../utils/apiMappers'

function getStats(rows) {
  const total = rows.length
  const active = rows.filter(row => row.status === 'active').length
  const newOnes = rows.filter(row => row.status === 'warning').length
  const inactive = rows.filter(row => row.status === 'inactive').length

  return { total, active, newOnes, inactive }
}

export default function Eleves() {
  const navigate = useNavigate()
  const [activeClass, setActiveClass] = useState('Tous')
  const [activeSection, setActiveSection] = useState('Tous')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState('name-asc')
  const [year, setYear] = useState('Tous')
  const [selected, setSelected] = useState(() => new Set())
  const [page, setPage] = useState(1)
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [annees, setAnnees] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const perPage = 10

  useEffect(() => {
    async function loadStudents() {
      setLoading(true)
      setFetchError('')

      try {
        const [elevesRes, classesRes, anneesRes] = await Promise.all([eleveApi.list(), classeApi.list(), anneeAcademiqueApi.list()])
        setStudents(extractList(elevesRes).map(mapEleveToStudent))
        setClasses(extractList(classesRes))
        setAnnees(extractList(anneesRes))
      } catch (error) {
        console.error('Failed to load eleves', error)
        setStudents([])
        setFetchError('Impossible de charger les élèves depuis le backend.')
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [])

  const classFilters = useMemo(() => ['Tous', ...classes.map(classe => classe.libelle)], [classes])

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return [...students]
      .filter(student => {
        const classOk = activeClass === 'Tous' || student.className === activeClass
        const sectionOk = activeSection === 'Tous' || student.section === activeSection
        const yearOk = year === 'Tous' || student.year === year
        const searchOk =
          !query ||
          student.fullName.toLowerCase().includes(query) ||
          student.id.toLowerCase().includes(query) ||
          student.studentId?.toLowerCase().includes(query) ||
          student.tutor.toLowerCase().includes(query) ||
          student.className.toLowerCase().includes(query)

        return classOk && sectionOk && yearOk && searchOk
      })
      .sort((left, right) => {
        if (sortMode === 'name-desc') return right.fullName.localeCompare(left.fullName)
        if (sortMode === 'section-asc') return left.section.localeCompare(right.section) || left.className.localeCompare(right.className)
        if (sortMode === 'section-desc') return right.section.localeCompare(left.section) || left.className.localeCompare(right.className)
        if (sortMode === 'class-asc') return left.className.localeCompare(right.className)
        if (sortMode === 'recent-desc') return right.id.localeCompare(left.id)
        return left.fullName.localeCompare(right.fullName)
      })
  }, [activeClass, activeSection, searchQuery, sortMode, students, year])

  const stats = getStats(filteredRows)
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage
  const pageRows = filteredRows.slice(start, start + perPage)
  const allSelected = pageRows.length > 0 && pageRows.every(student => selected.has(student.id))

  function toggleSelection(id) {
    setSelected(previous => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function togglePageSelection() {
    setSelected(previous => {
      const next = new Set(previous)
      if (allSelected) pageRows.forEach(student => next.delete(student.id))
      else pageRows.forEach(student => next.add(student.id))
      return next
    })
  }

  return (
    <Module33Layout breadcrumb={['Élèves']}>
      <div className="module33-page-header">
        <div>
          <h1 className="module33-page-title">Gestion des élèves</h1>
          <p className="module33-page-subtitle">Consultez, ajoutez et gérez les dossiers du module 3.3, séparément du module admin.</p>
        </div>
        <div className="module33-top-actions" style={{ marginLeft: 0 }}>
          <button className="module33-button-secondary" type="button" onClick={() => navigate('/eleves/search')}>🔍 Recherche avancée</button>
          <button className="module33-button" type="button" onClick={() => navigate('/eleves/create')}>＋ Nouvel élève</button>
        </div>
      </div>

      <div className="module33-stat-strip">
        <div className="module33-stat-card">
          <div className="module33-stat-icon primary">👦</div>
          <div>
            <div className="module33-stat-value">{stats.total.toLocaleString('fr-FR')}</div>
            <div className="module33-stat-label">Élèves filtrés</div>
            <div className="module33-stat-change up">▲ correspondants actifs dans le module</div>
          </div>
        </div>
        <div className="module33-stat-card">
          <div className="module33-stat-icon cyan">✅</div>
          <div>
            <div className="module33-stat-value">{stats.active.toLocaleString('fr-FR')}</div>
            <div className="module33-stat-label">Actifs</div>
            <div className="module33-stat-change up">▲ présence stable</div>
          </div>
        </div>
        <div className="module33-stat-card">
          <div className="module33-stat-icon green">🆕</div>
          <div>
            <div className="module33-stat-value">{stats.newOnes.toLocaleString('fr-FR')}</div>
            <div className="module33-stat-label">À surveiller</div>
            <div className="module33-stat-change up">▲ nouveaux ou en suivi</div>
          </div>
        </div>
        <div className="module33-stat-card">
          <div className="module33-stat-icon amber">⚠️</div>
          <div>
            <div className="module33-stat-value">{stats.inactive.toLocaleString('fr-FR')}</div>
            <div className="module33-stat-label">Désactivés</div>
            <div className="module33-stat-change down">▼ archivés</div>
          </div>
        </div>
      </div>

      <div className="module33-toolbar">
        <div className="module33-chip-tabs">
          {classFilters.map(className => (
            <button
              key={className}
              type="button"
              className={`module33-chip${activeClass === className ? ' active' : ''}`}
              onClick={() => {
                setActiveClass(className)
                setPage(1)
              }}
            >
              {className}
            </button>
          ))}
        </div>

        <div className="module33-toolbar-right">
          <select className="module33-select" value={activeSection} onChange={event => { setActiveSection(event.target.value); setPage(1) }}>
            {module33Sections.map(section => (
              <option key={section} value={section}>{section === 'Tous' ? 'Toutes sections' : section}</option>
            ))}
          </select>
          <select className="module33-select" value={year} onChange={event => { setYear(event.target.value); setPage(1) }}>
            <option value="Tous">Toutes années</option>
            {annees.map(annee => (
              <option key={annee.idAnnee} value={annee.libelle}>{annee.libelle}</option>
            ))}
          </select>
          <select className="module33-select" value={sortMode} onChange={event => setSortMode(event.target.value)}>
            <option value="name-asc">Nom A → Z</option>
            <option value="name-desc">Nom Z → A</option>
            <option value="section-asc">Section croissante</option>
            <option value="section-desc">Section décroissante</option>
            <option value="class-asc">Classe</option>
            <option value="recent-desc">Plus récents</option>
          </select>
        </div>
      </div>

      <div className="module33-table-card">
        <div className="module33-card-header">
          <div className="module33-search">
            <span className="module33-search-icon">🔍</span>
            <input
              className="module33-input"
              type="text"
              value={searchQuery}
              onChange={event => { setSearchQuery(event.target.value); setPage(1) }}
              placeholder="Rechercher par nom, matricule, tuteur ou classe..."
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--texte-sec)' }}>
            <strong style={{ color: 'var(--texte-principal)' }}>{filteredRows.length.toLocaleString('fr-FR')}</strong> élève(s) trouvé(s)
          </div>
          <div className="module33-row-actions" style={{ marginLeft: 'auto' }}>
            {loading && <span style={{ marginRight: 12, color: 'var(--texte-sec)' }}>Chargement des élèves…</span>}
            <button className="module33-button-secondary" type="button">📥 Exporter</button>
            <button className="module33-button-danger" type="button">🗑 Désactiver</button>
          </div>
        </div>

        {fetchError ? (
          <div className="module33-error-banner" style={{ marginBottom: 16, color: '#b91c1c' }}>
            {fetchError}
          </div>
        ) : null}

        <div className="module33-table-wrap">
          <table className="module33-table">
            <thead>
              <tr>
                <th style={{ width: 42 }}>
                  <input type="checkbox" checked={allSelected} onChange={togglePageSelection} aria-label="Sélectionner la page" />
                </th>
                <th>Élève</th>
                <th>Classe</th>
                <th>Section</th>
                <th>Sexe</th>
                <th>Date de naissance</th>
                <th>Tuteur</th>
                <th>Statut</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(student => (
                <tr key={student.id} className={selected.has(student.id) ? 'selected' : ''} onClick={() => navigate(`/eleves/show/${student.id}`)}>
                  <td onClick={event => event.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(student.id)} onChange={() => toggleSelection(student.id)} aria-label={`Sélectionner ${student.fullName}`} />
                  </td>
                  <td>
                    <div className="module33-row-cell">
                      <div className="module33-row-avatar" style={{ background: `linear-gradient(135deg, ${student.color}, #6d28d9)` }}>{student.initials}</div>
                      <div>
                        <div className="module33-row-title">{student.fullName}</div>
                        <div className="module33-row-subtitle">{student.studentId || student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="module33-row-tag info">{student.className}</span></td>
                  <td><span className="module33-row-tag primary">{student.section}</span></td>
                  <td>{student.gender === 'M' ? '♂ Garçon' : '♀ Fille'}</td>
                  <td>{student.birthDateLabel || formatSearchDate(student.birthDate)}</td>
                  <td>{student.tutor}</td>
                  <td>
                    <span className={`module33-row-tag ${getStudentStatusClass(student.status)}`}>
                      <span className="bdot" />
                      {getStudentStatusLabel(student.status)}
                    </span>
                  </td>
                  <td onClick={event => event.stopPropagation()}>
                    <div className="module33-row-actions">
                      <button className="module33-icon-button" type="button" title="Voir la fiche" onClick={() => navigate(`/eleves/show/${student.id}`)}>👁</button>
                      <button className="module33-icon-button" type="button" title="Modifier" onClick={() => navigate(`/eleves/edit/${student.id}`)}>✏️</button>
                      <button className="module33-icon-button danger" type="button" title="Désactiver" onClick={() => navigate(`/eleves/delete/${student.id}`)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="module33-pagination">
          <div className="module33-pagination-info">
            Page <strong>{safePage}</strong> / <strong>{totalPages}</strong> ·{' '}
            <strong>{filteredRows.length === 0 ? 0 : start + 1}</strong> – <strong>{Math.min(start + perPage, filteredRows.length)}</strong> sur <strong>{filteredRows.length}</strong>
          </div>
          <div className="module33-pagination-controls">
            <button className={`module33-page-btn${safePage === 1 ? ' disabled' : ''}`} type="button" onClick={() => setPage(current => Math.max(1, current - 1))}>‹</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter(currentPage => currentPage === 1 || currentPage === totalPages || Math.abs(currentPage - safePage) <= 1)
              .map(currentPage => (
                <button
                  key={currentPage}
                  className={`module33-page-btn${currentPage === safePage ? ' active' : ''}`}
                  type="button"
                  onClick={() => setPage(currentPage)}
                >
                  {currentPage}
                </button>
              ))}
            <button className={`module33-page-btn${safePage === totalPages ? ' disabled' : ''}`} type="button" onClick={() => setPage(current => Math.min(totalPages, current + 1))}>›</button>
          </div>
        </div>
      </div>
    </Module33Layout>
  )
}
