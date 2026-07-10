import { useEffect, useState } from 'react'
import Module35Layout from './Module35Layout'
import { module35Levels, module35Sections } from './module35Data'
import { classeApi, extractList } from '../../api'
import { mapClasseToCard } from '../../utils/apiMappers'

export default function Classes() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    async function loadClasses() {
      setLoading(true)
      setFetchError('')
      try {
        const response = await classeApi.list()
        setClasses(extractList(response).map(mapClasseToCard))
      } catch (error) {
        console.error('Failed to load classes', error)
        setClasses([])
        setFetchError('Impossible de charger les classes depuis le backend.')
      } finally {
        setLoading(false)
      }
    }
    loadClasses()
  }, [])

  return (
    <Module35Layout breadcrumb={["Modules", "Classes"]}>
      <div className="module35-page-header">
        <div>
          <h1>Liste des classes</h1>
          <p className="module35-page-sub">Consultez et gérez les classes par niveau et section.</p>
        </div>
        <div className="module35-header-actions">
          <a href="/classes/create" className="module35-btn-prim">Nouvelle classe</a>
        </div>
      </div>

      <div className="module35-stat-strip">
        <div className="module35-scard">
          <div className="module35-sc-icon">🏫</div>
          <div>
            <div className="module35-sc-val">{classes.length}</div>
            <div className="module35-sc-lbl">Total des classes</div>
          </div>
        </div>
        <div className="module35-scard">
          <div className="module35-sc-icon">📚</div>
          <div>
            <div className="module35-sc-val">{module35Levels.length}</div>
            <div className="module35-sc-lbl">Niveaux</div>
          </div>
        </div>
        <div className="module35-scard">
          <div className="module35-sc-icon">🧑‍🏫</div>
          <div>
            <div className="module35-sc-val">{module35Sections.length - 1}</div>
            <div className="module35-sc-lbl">Sections</div>
          </div>
        </div>
        <div className="module35-scard">
          <div className="module35-sc-icon">👥</div>
          <div>
            <div className="module35-sc-val">{classes.reduce((s, c) => s + (c.effectif || 0), 0)}</div>
            <div className="module35-sc-lbl">Total élèves</div>
          </div>
        </div>
      </div>

      <div className="module35-section-tabs">
        {module35Sections.map((s) => (
          <button key={s} className={`module35-stab ${s === 'Tous' ? 'all active' : ''}`}>{s} <span className="module35-stab-count">{classes.filter(c => s === 'Tous' || c.section === s).length}</span></button>
        ))}
      </div>

      {loading && <div className="module35-card" style={{ marginBottom: 16, padding: 16 }}>Chargement des classes…</div>}
      {fetchError && <div className="module35-card" style={{ marginBottom: 16, padding: 16, color: '#b91c1c' }}>{fetchError}</div>}

      <div className="module35-class-grid">
        {classes.map(cls => (
          <div key={cls.id} className="module35-ccard">
            <div className="module35-ccard-top">
              <div className="module35-ccard-head">
                <div className="module35-ccard-ico" style={{ background: cls.accent }}>{cls.sectionIcon}</div>
                <div style={{ flex: 1 }}>
                  <div className="module35-ccard-title">{cls.name}</div>
                  <div className="module35-ccard-sub">{cls.room} • {cls.teacher}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`/classes/show/${cls.id}`} className="module35-ca-btn">Voir</a>
                  <a href={`/classes/edit/${cls.id}`} className="module35-ca-btn">Modifier</a>
                </div>
              </div>
              <div className="module35-ccard-accent" style={{ background: cls.fill }} />
            </div>
            <div className="module35-card-body">
              <div className="module35-ccard-stats">
                <div className="module35-cs-item">
                  <div className="module35-cs-val">{cls.effectif}</div>
                  <div className="module35-cs-lbl">Effectif</div>
                </div>
                <div className="module35-cs-item">
                  <div className="module35-cs-val">{cls.average}</div>
                  <div className="module35-cs-lbl">Moyenne</div>
                </div>
                <div className="module35-cs-item">
                  <div className="module35-cs-val">{cls.incidents}</div>
                  <div className="module35-cs-lbl">Incidents</div>
                </div>
                <div className="module35-cs-item">
                  <div className="module35-cs-val">{cls.cycleLabel}</div>
                  <div className="module35-cs-lbl">Cycle</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Module35Layout>
  )
}
