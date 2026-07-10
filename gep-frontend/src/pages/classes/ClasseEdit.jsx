import Module35Layout from './Module35Layout'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { classeApi, cycleApi, salleApi, extractData, extractList } from '../../api'
import { mapClasseToCard } from '../../utils/apiMappers'

export default function Edit() {
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const [searchParams] = useSearchParams()
  const id = routeId || searchParams.get('id')
  const [cls, setCls] = useState(null)
  const [cycles, setCycles] = useState([])
  const [salles, setSalles] = useState([])
  const [name, setName] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [salleId, setSalleId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!id) {
      setFeedback('Aucune classe sélectionnée.')
      return
    }
    let cancelled = false
    async function loadData() {
      try {
        const [classeRes, cyclesRes, sallesRes] = await Promise.all([classeApi.get(id), cycleApi.list(), salleApi.list()])
        if (cancelled) return
        const rawClasse = extractData(classeRes)
        const mapped = mapClasseToCard(rawClasse)
        setCls(mapped)
        setName(mapped.name)
        setCycleId(rawClasse.idCycle != null ? String(rawClasse.idCycle) : '')
        setCycles(extractList(cyclesRes))
        setSalles(extractList(sallesRes))
        const currentSalle = Array.isArray(rawClasse.salles) ? rawClasse.salles[0] : null
        setSalleId(currentSalle ? String(currentSalle.idSalle) : '')
      } catch (error) {
        console.error('Failed to load class', error)
        setFeedback(error?.response?.data?.error || error?.response?.data?.message || 'Impossible de charger cette classe depuis le backend.')
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [id])

  // Une salle libre, ou celle déjà occupée par cette classe, peut être choisie ici.
  const availableSalles = useMemo(
    () => salles.filter(s => s.idClasse == null || String(s.idClasse) === String(id)),
    [salles, id],
  )

  async function handleSubmit() {
    if (!id || !name.trim() || !cycleId) {
      setFeedback('Le nom et le cycle de la classe sont obligatoires.')
      return
    }
    if (!salleId) {
      setFeedback('Veuillez sélectionner une salle pour cette classe.')
      return
    }

    setIsSubmitting(true)
    setFeedback('')
    try {
      await classeApi.update(id, {
        libelle: name.trim(),
        idCycle: Number(cycleId),
        idSalle: Number(salleId),
      })
      setFeedback('Classe mise à jour avec succès.')
      setTimeout(() => navigate(`/classes/show/${id}`), 900)
    } catch (error) {
      console.error('Update class failed', error)
      setFeedback(error?.response?.data?.error || error?.response?.data?.message || 'Erreur lors de la mise à jour de la classe.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!cls) {
    return (
      <Module35Layout breadcrumb={["Modules", 'Modifier la classe']} backTo={'/classes'}>
        <div className="module35-card" style={{ padding: 16 }}>{feedback || 'Chargement de la classe…'}</div>
      </Module35Layout>
    )
  }

  return (
    <Module35Layout breadcrumb={["Modules", 'Modifier la classe']} backTo={'/classes'}>
      <div className="module35-page-header">
        <div>
          <h1>Modifier la classe</h1>
          <p className="module35-page-sub">Apportez des modifications à la classe sélectionnée, y compris sa salle.</p>
        </div>
      </div>

      <div className="module35-form-layout">
        <div>
          <div className="module35-card">
            <div className="module35-card-header">
              <div>
                <div className="module35-card-title">Éditer</div>
                <div className="module35-card-sub">Mettez à jour les informations de la classe.</div>
              </div>
            </div>
            <div className="module35-card-body">
              <div className="module35-form-group">
                <label>Nom</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} />
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
                  {availableSalles.length === 0 && <option value="">Aucune salle disponible</option>}
                  {availableSalles.map(salle => <option key={salle.idSalle} value={salle.idSalle}>{salle.libelle}</option>)}
                </select>
              </div>

              <div className="module35-form-actions">
                <button className="module35-btn-submit" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Enregistrer'}</button>
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
              <div className="module35-preview-name">{name}</div>
              <div className="module35-preview-code">{cls.code}</div>
            </div>
          </div>

          <div className="module35-recap-card">
            <div className="module35-recap-body">
              <div className="module35-recap-title">Salles affectées</div>
              <div className="module35-recap-desc">{cls.room}</div>
              <div className="module35-recap-title" style={{ marginTop: 12 }}>Effectif actuel</div>
              <div className="module35-recap-desc">{cls.effectif} élève(s)</div>
            </div>
          </div>
        </aside>
      </div>
    </Module35Layout>
  )
}
