import { useEffect, useMemo, useState } from 'react'
import { salleApi, extractList } from '../../api'

const EMPTY_FORM = { libelle: '', position: '', surface: '', capacite: '', actif: true }

export default function Salles() {
  const [salles, setSalles] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] = useState(null)
  const [releasingId, setReleasingId] = useState(null)

  function load() {
    setLoading(true)
    return salleApi.list()
      .then(response => setSalles(extractList(response)))
      .catch(() => setFeedback('Impossible de charger les salles depuis le backend.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return salles
    return salles.filter(s =>
      `${s.libelle} ${s.classe?.libelle ?? ''} ${s.position}`.toLowerCase().includes(query),
    )
  }, [salles, search])

  function openCreateForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFeedback('')
    setShowForm(true)
  }

  function openEditForm(salle) {
    setEditingId(salle.idSalle)
    setForm({
      libelle: salle.libelle || '',
      position: salle.position || '',
      surface: salle.surface || '',
      capacite: salle.capacite != null ? String(salle.capacite) : '',
      actif: !!salle.actif,
    })
    setFeedback('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.libelle.trim()) {
      setFeedback('Le libellé est obligatoire.')
      return
    }
    setSaving(true)
    setFeedback('')
    const payload = {
      libelle: form.libelle.trim(),
      position: form.position.trim(),
      surface: form.surface.trim(),
      capacite: form.capacite ? Number(form.capacite) : null,
      actif: form.actif ? 1 : 0,
    }
    try {
      if (editingId) {
        await salleApi.update(editingId, payload)
        setFeedback('Salle mise à jour avec succès.')
      } else {
        await salleApi.create(payload)
        setFeedback('Salle créée avec succès. Elle est libre : affectez-la à une classe depuis la page Classes.')
      }
      await load()
      closeForm()
    } catch (error) {
      setFeedback(error?.response?.data?.error || "Erreur lors de l'enregistrement de la salle.")
    } finally {
      setSaving(false)
    }
  }

  async function handleRelease(salle) {
    if (!window.confirm(`Libérer la salle « ${salle.libelle} » de la classe « ${salle.classe?.libelle} » ?`)) return
    setReleasingId(salle.idSalle)
    setFeedback('')
    try {
      await salleApi.update(salle.idSalle, { idClasse: null })
      await load()
      setFeedback('Salle libérée. Elle peut maintenant être affectée à une autre classe.')
    } catch (error) {
      setFeedback(error?.response?.data?.error || 'Impossible de libérer cette salle.')
    } finally {
      setReleasingId(null)
    }
  }

  async function handleDelete(salle) {
    if (!window.confirm(`Supprimer définitivement la salle « ${salle.libelle} » ?`)) return
    setDeletingId(salle.idSalle)
    setFeedback('')
    try {
      await salleApi.remove(salle.idSalle)
      await load()
      setFeedback('Salle supprimée.')
    } catch (error) {
      setFeedback(error?.response?.data?.error || 'Impossible de supprimer cette salle.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Salles</h1>
          <p className="page-sub">Gérez les salles de classe. Une salle est créée libre : son affectation à une classe se fait depuis la page Classes.</p>
        </div>
        <button className="btn-outline" onClick={openCreateForm}>+ Nouvelle salle</button>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      {showForm && (
        <form className="card mb-18" onSubmit={handleSubmit}>
          <div className="filters-row">
            <div className="filter-group"><label>Libellé</label>
              <input className="finput" value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex : Salle 101" />
            </div>
            <div className="filter-group"><label>Capacité</label>
              <input className="finput" type="number" min="0" value={form.capacite} onChange={e => setForm(f => ({ ...f, capacite: e.target.value }))} placeholder="Ex : 45" />
            </div>
            <div className="filter-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
                <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} /> Active
              </label>
            </div>
          </div>
          <div className="filters-row">
            <div className="filter-group"><label>Position</label>
              <input className="finput" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Ex : Bâtiment A - RDC" />
            </div>
            <div className="filter-group"><label>Surface</label>
              <input className="finput" value={form.surface} onChange={e => setForm(f => ({ ...f, surface: e.target.value }))} placeholder="Ex : 50m²" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Créer la salle'}</button>
            <button className="btn-outline" type="button" onClick={closeForm}>Annuler</button>
          </div>
        </form>
      )}

      <div className="card mb-18">
        <div className="filters-row">
          <div className="filter-group fg-2"><label>Recherche</label>
            <input className="finput" placeholder="Libellé, classe, position..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}>Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Libellé</th><th>Classe occupante</th><th>Position</th><th>Surface</th><th>Capacité</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Aucune salle enregistrée.</td></tr>}
                {filtered.map(salle => (
                  <tr key={salle.idSalle}>
                    <td>{salle.libelle}</td>
                    <td>{salle.classe?.libelle ?? <span style={{ color: '#059669' }}>Libre</span>}</td>
                    <td>{salle.position || '—'}</td>
                    <td>{salle.surface || '—'}</td>
                    <td>{salle.capacite ?? '—'}</td>
                    <td>{salle.actif ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn-outline" onClick={() => openEditForm(salle)}>Modifier</button>
                        {salle.classe && (
                          <button className="btn-outline" onClick={() => handleRelease(salle)} disabled={releasingId === salle.idSalle}>
                            {releasingId === salle.idSalle ? 'Libération…' : 'Libérer'}
                          </button>
                        )}
                        <button
                          className="btn-outline"
                          onClick={() => handleDelete(salle)}
                          disabled={deletingId === salle.idSalle || !!salle.classe}
                          title={salle.classe ? 'Libérez la salle avant de la supprimer' : undefined}
                        >
                          {deletingId === salle.idSalle ? 'Suppression…' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
