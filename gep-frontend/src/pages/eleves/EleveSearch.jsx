import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Module33Layout from '../inscriptions/Module33Layout'
import {
  formatSearchDate,
  getStudentStatusClass,
  getStudentStatusLabel,
  module33SearchModes,
  module33Sections,
} from '../inscriptions/module33Data'
import { eleveApi, classeApi, extractList } from '../../api'
import { mapEleveToStudent } from '../../utils/apiMappers'

export default function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('cards')
  const [className, setClassName] = useState('Tous')
  const [section, setSection] = useState('Tous')
  const [onlyActive, setOnlyActive] = useState(true)
  const [searchType, setSearchType] = useState('Nom')
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([eleveApi.list(), classeApi.list()])
      .then(([elevesRes, classesRes]) => {
        if (cancelled) return
        setStudents(extractList(elevesRes).map(mapEleveToStudent))
        setClasses(extractList(classesRes))
      })
      .catch(() => { if (!cancelled) setFetchError('Impossible de charger les élèves depuis le backend.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const classFilters = useMemo(() => ['Tous', ...classes.map(classe => classe.libelle)], [classes])

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return students.filter(student => {
      const classOk = className === 'Tous' || student.className === className
      const sectionOk = section === 'Tous' || student.section === section
      const activeOk = !onlyActive || student.status !== 'inactive'
      const haystack = searchType === 'Matricule' ? student.studentId
        : searchType === 'Classe' ? student.className
        : searchType === 'Tuteur' ? student.tutor
        : student.fullName
      const searchOk = !normalized || (haystack || '').toLowerCase().includes(normalized)

      return classOk && sectionOk && activeOk && searchOk
    })
  }, [className, onlyActive, query, section, searchType, students])

  return (
    <Module33Layout breadcrumb={['Élèves', 'Recherche avancée']} backTo="/eleves">
      <div className="module33-page-header">
        <div>
          <h1 className="module33-page-title">Recherche avancée</h1>
          <p className="module33-page-subtitle">Un écran autonome pour retrouver un élève par nom, matricule, classe ou tuteur.</p>
        </div>
      </div>

      <div className="module33-search-layout">
        <aside className="module33-filters-panel">
          <div className="module33-filters-header">
            <div className="module33-filters-title">Filtres</div>
            <div className="module33-filters-subtitle">Affinez la recherche avant d’afficher les résultats.</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button className="module33-button" type="button" onClick={() => navigate('/eleves/create')}>＋ Nouvel élève</button>
              <button className="module33-button-secondary" type="button" onClick={() => setQuery('')}>Réinitialiser</button>
            </div>
          </div>

          <div className="module33-filters-body">
            <div className="module33-filter-section">
              <div className="module33-filter-label">
                <span>Type de recherche</span>
              </div>
              <div className="module33-chip-tabs">
                {['Nom', 'Matricule', 'Classe', 'Tuteur'].map(type => (
                  <button key={type} type="button" className={`module33-chip${searchType === type ? ' active' : ''}`} onClick={() => setSearchType(type)}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="module33-filter-section">
              <div className="module33-filter-label">
                <span>Recherche principale</span>
              </div>
              <div className="module33-search" style={{ minWidth: 'auto' }}>
                <span className="module33-search-icon">🔍</span>
                <input className="module33-input" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Rechercher par ${searchType.toLowerCase()}...`} />
              </div>
            </div>

            <div className="module33-filter-section">
              <div className="module33-filter-label">
                <span>Classe</span>
              </div>
              <select className="module33-select" value={className} onChange={event => setClassName(event.target.value)}>
                {classFilters.map(item => (
                  <option key={item} value={item}>{item === 'Tous' ? 'Toutes les classes' : item}</option>
                ))}
              </select>
            </div>

            <div className="module33-filter-section">
              <div className="module33-filter-label">
                <span>Section</span>
              </div>
              <select className="module33-select" value={section} onChange={event => setSection(event.target.value)}>
                {module33Sections.map(item => (
                  <option key={item} value={item}>{item === 'Tous' ? 'Toutes sections' : item}</option>
                ))}
              </select>
            </div>

            <div className="module33-filter-section">
              <div className="module33-filter-label">
                <span>Visibilité</span>
              </div>
              <div className="module33-toggle-row">
                <div className="module33-toggle-label">Seulement les actifs</div>
                <div className={`module33-toggle${onlyActive ? ' on' : ''}`} onClick={() => setOnlyActive(current => !current)}>
                  <div className="module33-toggle-knob" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="module33-results-panel">
          <div className="module33-results-header">
            <div>
              <div className="module33-results-count">{results.length.toLocaleString('fr-FR')}</div>
              <div className="module33-results-subtitle">Résultat(s) pour {searchType.toLowerCase()}</div>
            </div>
            <div className="module33-results-right">
              <div className="module33-view-toggle">
                {module33SearchModes.map(item => (
                  <button key={item.value} type="button" className={mode === item.value ? 'active' : ''} onClick={() => setMode(item.value)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="module33-results-body">
            {fetchError ? (
              <div className="module33-error-banner" style={{ color: '#b91c1c' }}>{fetchError}</div>
            ) : loading ? (
              <div className="module33-empty-state">
                <div className="module33-empty-title">Chargement des élèves…</div>
              </div>
            ) : results.length === 0 ? (
              <div className="module33-empty-state">
                <div className="module33-empty-icon">🔎</div>
                <div className="module33-empty-title">Aucun élève trouvé</div>
                <div className="module33-empty-subtitle">Ajustez les filtres ou lancez une recherche plus large pour afficher les dossiers correspondants.</div>
                <button className="module33-button" type="button" onClick={() => setQuery('')}>Effacer la recherche</button>
              </div>
            ) : mode === 'cards' ? (
              <div className="module33-result-grid">
                {results.map(student => (
                  <div key={student.id} className="module33-result-card" onClick={() => navigate(`/eleves/show/${student.id}`)}>
                    <div className="module33-result-top">
                      <div className="module33-result-avatar" style={{ background: `linear-gradient(135deg, ${student.color}, #6d28d9)` }}>{student.initials}</div>
                      <div>
                        <div className="module33-result-name">{student.fullName}</div>
                        <div className="module33-result-matricule">{student.studentId || student.id}</div>
                      </div>
                    </div>
                    <div className="module33-result-meta">
                      <div className="module33-result-row">
                        <span className="module33-result-label">Classe</span>
                        <span className="module33-result-value">{student.className}</span>
                      </div>
                      <div className="module33-result-row">
                        <span className="module33-result-label">Section</span>
                        <span className="module33-result-value">{student.section}</span>
                      </div>
                      <div className="module33-result-row">
                        <span className="module33-result-label">Tuteur</span>
                        <span className="module33-result-value">{student.tutor}</span>
                      </div>
                      <div className="module33-result-row">
                        <span className="module33-result-label">Naissance</span>
                        <span className="module33-result-value">{student.birthDateLabel || formatSearchDate(student.birthDate)}</span>
                      </div>
                    </div>
                    <div className="module33-result-footer">
                      <span className={`module33-row-tag ${getStudentStatusClass(student.status)}`}>
                        <span className="bdot" />
                        {getStudentStatusLabel(student.status)}
                      </span>
                      <div className="module33-row-actions">
                        <button className="module33-icon-button" type="button" onClick={event => { event.stopPropagation(); navigate(`/eleves/show/${student.id}`) }}>👁</button>
                        <button className="module33-icon-button" type="button" onClick={event => { event.stopPropagation(); navigate(`/eleves/edit/${student.id}`) }}>✏️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="module33-table-wrap" style={{ border: '1.5px solid rgba(109, 40, 217, 0.12)', borderRadius: 14 }}>
                <table className="module33-table">
                  <thead>
                    <tr>
                      <th>Élève</th>
                      <th>Classe</th>
                      <th>Section</th>
                      <th>Tuteur</th>
                      <th>Naissance</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(student => (
                      <tr key={student.id} onClick={() => navigate(`/eleves/show/${student.id}`)}>
                        <td>
                          <div className="module33-row-cell">
                            <div className="module33-row-avatar" style={{ background: `linear-gradient(135deg, ${student.color}, #6d28d9)` }}>{student.initials}</div>
                            <div>
                              <div className="module33-row-title">{student.fullName}</div>
                              <div className="module33-row-subtitle">{student.studentId || student.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>{student.className}</td>
                        <td>{student.section}</td>
                        <td>{student.tutor}</td>
                        <td>{student.birthDateLabel || formatSearchDate(student.birthDate)}</td>
                        <td><span className={`module33-row-tag ${getStudentStatusClass(student.status)}`}><span className="bdot" />{getStudentStatusLabel(student.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </Module33Layout>
  )
}
