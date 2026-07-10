import { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import { matiereApi, extractData, extractList } from '../../api'
import './Matieres.css'

const bgColors = ['var(--accent)','var(--success)','var(--info)','var(--warning)','var(--danger)','var(--cyan)','var(--accent-hover)','var(--warning)']

export default function Matieres() {
  const [matieres, setMatieres] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nom: '', code: '', coef: 1 })
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    async function loadMatieres() {
      try {
        const response = await matiereApi.list()
          setMatieres(extractList(response).map((matiere, index) => ({
            id: matiere.id,
            nom: matiere.libelle,
            code: matiere.description || `MAT-${matiere.id}`,
            coef: matiere.coefficient,
            color: bgColors[index % bgColors.length],
          })))
      } catch (error) {
        console.error('Failed to load matieres', error)
        setMatieres([])
        setFeedback('Impossible de charger les matières depuis le backend.')
      }
    }
    loadMatieres()
  }, [])

  const handleAdd = async () => {
    const color = bgColors[matieres.length % bgColors.length]
    try {
      const response = await matiereApi.create({
        libelle: form.nom,
        coefficient: Number(form.coef),
        description: form.code || null,
      })
      const created = extractData(response)
      setMatieres(prev => [...prev, { id: created?.id || Date.now(), ...form, coef: Number(form.coef), color }])
      setForm({ nom: '', code: '', coef: 1 })
      setShowModal(false)
    } catch (error) {
      console.error('Create matiere failed', error)
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la création de la matière.')
    }
  }

  const handleDelete = async id => {
    if (!confirm('Supprimer cette matière ?')) return
    try {
      await matiereApi.remove(id)
      setMatieres(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Delete matiere failed', error)
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de la suppression de la matière.')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des matières</h1>
          <p className="page-subtitle">Gérer les matières enseignées dans l'école</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Nouvelle matière
        </button>
      </div>

      <div className="card">
        {feedback && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{feedback}</div>}
        <div className="matieres-grid">
          {matieres.map(m => (
            <div key={m.id} className="matiere-row">
              <div className="matiere-icon" style={{ background: m.color }}>
                📖
              </div>
              <div className="matiere-info">
                <p className="matiere-nom">{m.nom}</p>
                <p className="matiere-meta">Code: {m.code} &nbsp;&nbsp; Coef: {m.coef}</p>
              </div>
              <div className="matiere-actions">
                <button className="action-btn">✏️</button>
                <button className="action-btn danger" onClick={() => handleDelete(m.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <Modal
          title="Nouvelle matière"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleAdd}>Créer</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Nom de la matière</label>
            <input className="form-input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Mathématiques" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="MATH" />
            </div>
            <div className="form-group">
              <label className="form-label">Coefficient</label>
              <input className="form-input" type="number" min="1" max="10" value={form.coef} onChange={e => setForm({ ...form, coef: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
