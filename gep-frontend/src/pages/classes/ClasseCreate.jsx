import Module35Layout from './Module35Layout'
import { module35Levels, module35Sections } from './module35Data'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { classeApi, cycleApi, salleApi, extractList } from '../../api'

export default function Create() {
  const navigate = useNavigate()
  const [niveau, setNiveau] = useState(module35Levels[0])
  const [section, setSection] = useState('Francophone')
  const [code, setCode] = useState('')
  const [cycles, setCycles] = useState([])
  const [cycleId, setCycleId] = useState('')
  const [salles, setSalles] = useState([])
  const [salleId, setSalleId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([cycleApi.list(), salleApi.list()])
      .then(([cyclesRes, sallesRes]) => {
        if (cancelled) return
        const cycleList = extractList(cyclesRes)
        setCycles(cycleList)
        if (cycleList.length > 0) setCycleId(String(cycleList[0].idCycle))
        setSalles(extractList(sallesRes))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les cycles et les salles.') })
    return () => { cancelled = true }
  }, [])

  // Seules les salles pas encore affectées à une classe peuvent être choisies ici :
  // une classe se crée en réclamant une salle libre, jamais l'inverse.
  const availableSalles = useMemo(() => salles.filter(s => s.idClasse == null), [salles])

  useEffect(() => {
    if (!salleId && availableSalles.length > 0) setSalleId(String(availableSalles[0].idSalle))
  }, [availableSalles, salleId])

  function updateCode(niv, sec) {
    const key = sec === 'Francophone' ? 'FR' : sec === 'Anglophone' ? 'EN' : 'BI'
    setCode(`${niv}/${key}`)
  }

  async function handleSubmit() {
    if (!cycleId) {
      setFeedback('Veuillez sélectionner un cycle.')
      return
    }
    if (!salleId) {
      setFeedback('Veuillez sélectionner une salle libre pour cette classe.')
      return
    }
    setIsSubmitting(true)
    setFeedback('')
    try {
      await classeApi.create({
        libelle: code || `${niveau}/${section === 'Francophone' ? 'FR' : section === 'Anglophone' ? 'EN' : 'BI'}`,
        idCycle: Number(cycleId),
        idSalle: Number(salleId),
      })
      setFeedback('Classe créée avec succès.')
      setTimeout(() => navigate('/classes'), 900)
    } catch (error) {
      console.error('Create class failed', error)
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la création de la classe.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Module35Layout breadcrumb={["Modules", "Nouvelle classe"]} backTo={'/classes'}>
      <div className="module35-page-header">
        <div>
          <h1>Créer une classe</h1>
          <p className="module35-page-sub">Créez une nouvelle classe et affectez ses paramètres.</p>
        </div>
      </div>

      <div className="module35-form-layout">
        <div>
          <div className="module35-card">
            <div className="module35-card-header">
              <div>
                <div className="module35-card-title">Paramètres de la classe</div>
                <div className="module35-card-sub">Choisissez le niveau et la section.</div>
              </div>
            </div>
            <div className="module35-card-body">
              <div className="module35-form-group">
                <label>Niveau</label>
                <select value={niveau} onChange={e => { setNiveau(e.target.value); updateCode(e.target.value, section); }}>
                  {module35Levels.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="module35-form-group">
                <label>Section</label>
                <div className="module35-section-picker">
                  {module35Sections.filter(s => s !== 'Tous').map(s => (
                    <div key={s} className={`module35-sec-opt ${s === section ? `sel-${s === 'Francophone' ? 'fr' : s === 'Anglophone' ? 'en' : 'bi'}` : ''}`} onClick={() => { setSection(s); updateCode(niveau, s); }}>
                      <div className="module35-sec-icon">{s === 'Francophone' ? '🇫🇷' : s === 'Anglophone' ? '🇬🇧' : '🌐'}</div>
                      <div className="module35-sec-name">{s}</div>
                      <div className="module35-sec-lang">Section</div>
                      <div className="module35-sec-check">{s === section ? '✓' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="module35-form-group">
                <label>Cycle</label>
                <select value={cycleId} onChange={e => setCycleId(e.target.value)}>
                  {cycles.length === 0 && <option value="">Aucun cycle disponible</option>}
                  {cycles.map(cycle => <option key={cycle.idCycle} value={cycle.idCycle}>{cycle.libelle}</option>)}
                </select>
              </div>

              <div className="module35-form-group">
                <label>Salle</label>
                <select value={salleId} onChange={e => setSalleId(e.target.value)}>
                  {availableSalles.length === 0 && <option value="">Aucune salle libre disponible</option>}
                  {availableSalles.map(salle => <option key={salle.idSalle} value={salle.idSalle}>{salle.libelle}</option>)}
                </select>
                {availableSalles.length === 0 && (
                  <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 6 }}>
                    Toutes les salles sont déjà occupées. Créez une nouvelle salle ou libérez-en une avant de créer cette classe.
                  </p>
                )}
              </div>

              <div className="module35-form-group">
                <label>Code</label>
                <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Ex: CP/FR" />
              </div>

              <div className="module35-form-actions">
                <button className="module35-btn-submit" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Création…' : 'Créer la classe'}</button>
              </div>
              {feedback && <div className="module35-card" style={{ marginTop: 12, padding: 12 }}>{feedback}</div>}
            </div>
          </div>
        </div>

        <aside>
          <div className="module35-preview-card">
            <div className="module35-preview-head">
              <div className="module35-preview-head-title">Aperçu</div>
            </div>
            <div className="module35-preview-body">
              <div className="module35-preview-badge">🏫</div>
              <div className="module35-preview-name">{niveau} — {section}</div>
              <div className="module35-preview-code">{code || '—'}</div>
            </div>
          </div>

          <div className="module35-recap-card">
            <div className="module35-recap-body">
              <div className="module35-recap-title">Récapitulatif</div>
              <div className="module35-recap-desc">La classe sera créée via l’endpoint backend /classes.</div>
            </div>
          </div>
        </aside>
      </div>
    </Module35Layout>
  )
}
