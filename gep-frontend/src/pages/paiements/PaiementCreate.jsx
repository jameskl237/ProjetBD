import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eleveApi, modePaiementApi, paiementApi, anneeAcademiqueApi, api, extractList } from '../../api'
import Module36Layout from './Module36Layout'

const INITIAL_FORM = {
  matricule: '',
  idAca: '',
  montant: '',
  date: new Date().toISOString().slice(0, 10),
  reference: '',
  idMode: '',
}

export default function Create() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [eleves, setEleves] = useState([])
  const [annees, setAnnees] = useState([])
  const [modes, setModes] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const [tranches, setTranches] = useState([])
  const [selectedTrancheId, setSelectedTrancheId] = useState('')
  const [trancheLoading, setTrancheLoading] = useState(false)
  const [trancheError, setTrancheError] = useState('')

  const selectedMode = modes.find(item => String(item.idMode) === String(form.idMode))
  const selectedEleve = eleves.find(e => String(e.matricule) === String(form.matricule))
  const selectedTranche = tranches.find(t => String(t.idTranche) === String(selectedTrancheId))
  const total = form.montant ? `${Number(form.montant).toLocaleString('fr-FR')} FCFA` : '0 FCFA'

  useEffect(() => {
    async function loadOptions() {
      try {
        const [elevesResponse, modesResponse, anneesResponse] = await Promise.all([
          eleveApi.list(),
          modePaiementApi.list(),
          anneeAcademiqueApi.list(),
        ])
        const eleveData = extractList(elevesResponse)
        const modeData = extractList(modesResponse)
        const anneeData = extractList(anneesResponse)
        setEleves(eleveData)
        setModes(modeData)
        setAnnees(anneeData)
        const latestAnnee = anneeData.reduce((best, current) => (!best || current.idAnnee > best.idAnnee ? current : best), null)
        setForm(previous => ({
          ...previous,
          idAca: previous.idAca || String(latestAnnee?.idAnnee || ''),
          idMode: previous.idMode || String(modeData[0]?.idMode || ''),
        }))
      } catch (error) {
        console.error('Failed to load payment options', error)
        setFeedback({ type: 'warning', message: 'Impossible de charger les listes backend pour les paiements.' })
      }
    }
    loadOptions()
  }, [])

  useEffect(() => {
    setTranches([])
    setSelectedTrancheId('')
    setTrancheError('')
    if (!form.matricule || !form.idAca) return
    let cancelled = false
    async function loadTranches() {
      setTrancheLoading(true)
      try {
        const response = await api.get(`/paiements/statut/${form.matricule}`, { params: { idAca: form.idAca } })
        if (cancelled) return
        const list = response?.data?.tranches ?? []
        setTranches(list)
      } catch (error) {
        if (cancelled) return
        setTrancheError(error?.response?.data?.error || 'Aucune pension configurée pour la classe de cet élève.')
      } finally {
        if (!cancelled) setTrancheLoading(false)
      }
    }
    loadTranches()
    return () => { cancelled = true }
  }, [form.matricule, form.idAca])

  function updateField(field, value) {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  function selectTranche(tranche) {
    setSelectedTrancheId(tranche.idTranche)
    setForm(previous => ({ ...previous, montant: String(tranche.montantRestant) }))
  }

  async function handleSubmit() {
    if (!form.matricule || !form.idAca || !form.idMode || !form.montant || !form.date || !selectedTrancheId) {
      setFeedback({
        type: 'warning',
        message: 'Veuillez sélectionner un élève, une tranche et remplir tous les champs obligatoires.',
      })
      return
    }

    setIsSubmitting(true)
    setFeedback({ type: '', message: '' })

    try {
      const payload = {
        matricule: Number(form.matricule),
        idAca: Number(form.idAca),
        montant: parseFloat(form.montant) || 0,
        idMode: Number(form.idMode),
        datePaie: form.date,
        operation_ID: form.reference || '',
        idTranche: Number(selectedTrancheId),
      }

      await paiementApi.create(payload)
      setFeedback({
        type: 'success',
        message: 'Paiement enregistré avec succès!',
      })
      setTimeout(() => navigate('/paiements'), 1500)
    } catch (error) {
      console.error('Create payment failed', error)
      setFeedback({
        type: 'error',
        message: error?.response?.data?.error || error?.message || 'Erreur lors de l\'enregistrement.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Module36Layout>
      <div className="module36-greeting">
        <h1>Enregistrer un paiement</h1>
        <p>Renseignez les informations du paiement à enregistrer.</p>
      </div>

      <div className="module36-form-grid">
        <div className="module36-form-card">
          <h2 className="module36-form-title">Informations du paiement</h2>

          <div className="module36-form-group">
            <label className="module36-label" htmlFor="eleve">Élève</label>
            <div className="module36-select-wrap">
              <select
                id="eleve"
                className="module36-select"
                value={form.matricule}
                onChange={event => updateField('matricule', event.target.value)}
              >
                <option value="">Sélectionner un élève...</option>
                {eleves.map(eleve => (
                  <option key={eleve.matricule} value={eleve.matricule}>{eleve.prenom} {eleve.nom} — {eleve.matricule}</option>
                ))}
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>

          <div className="module36-form-row">
            <div>
              <label className="module36-label" htmlFor="annee">Année académique</label>
              <div className="module36-select-wrap">
                <select id="annee" className="module36-select" value={form.idAca} onChange={event => updateField('idAca', event.target.value)}>
                  <option value="">Sélectionner...</option>
                  {annees.map(annee => <option key={annee.idAnnee} value={annee.idAnnee}>{annee.libelle}</option>)}
                </select>
                <span className="module36-select-arrow">▾</span>
              </div>
            </div>
            <div>
              <label className="module36-label" htmlFor="montant">Montant (FCFA)</label>
              <input
                id="montant"
                type="number"
                className="module36-input"
                value={form.montant}
                max={selectedTranche?.montantRestant}
                onChange={event => updateField('montant', event.target.value)}
              />
            </div>
          </div>

          <div className="module36-form-row tight">
            <div>
              <label className="module36-label" htmlFor="date">Date de paiement</label>
              <input
                id="date"
                type="date"
                className="module36-input"
                value={form.date}
                onChange={event => updateField('date', event.target.value)}
              />
            </div>
            <div>
              <label className="module36-label" htmlFor="reference">Référence (optionnel)</label>
              <input
                id="reference"
                type="text"
                className="module36-input"
                value={form.reference}
                onChange={event => updateField('reference', event.target.value)}
                placeholder="REF-XXXX"
              />
            </div>
          </div>

          <div>
            <span className="module36-label">Mode de paiement</span>
            <div className="module36-mode-grid">
              {modes.map(mode => (
                <button
                  key={mode.idMode}
                  type="button"
                  className={`module36-mode-btn${String(form.idMode) === String(mode.idMode) ? ' active' : ''}`}
                  onClick={() => updateField('idMode', mode.idMode)}
                >
                  <span className="module36-mode-icon">💳</span>
                  {mode.libelle}
                </button>
              ))}
            </div>
          </div>

          <div className="module36-form-group">
            <span className="module36-label">Tranche à payer (1/3 de la pension par trimestre)</span>
            {!form.matricule || !form.idAca ? (
              <p style={{ fontSize: 13, color: '#6b7280' }}>Sélectionnez un élève et une année pour voir ses tranches.</p>
            ) : trancheLoading ? (
              <p style={{ fontSize: 13, color: '#6b7280' }}>Chargement des tranches…</p>
            ) : trancheError ? (
              <p style={{ fontSize: 13, color: '#b91c1c' }}>{trancheError}</p>
            ) : (
              <div className="module36-mode-grid">
                {tranches.map(tranche => (
                  <button
                    key={tranche.idTranche}
                    type="button"
                    disabled={tranche.montantRestant <= 0}
                    className={`module36-mode-btn${String(selectedTrancheId) === String(tranche.idTranche) ? ' active' : ''}`}
                    onClick={() => selectTranche(tranche)}
                    style={{ opacity: tranche.montantRestant <= 0 ? 0.55 : 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                  >
                    <span>{tranche.libelle}</span>
                    <span style={{ fontSize: 12, fontWeight: 400 }}>
                      {tranche.statut === 'payé' ? '✅ Payé' : `${tranche.montantRestant.toLocaleString('fr-FR')} FCFA restant / ${tranche.montant.toLocaleString('fr-FR')} FCFA`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="module36-summary-card">
          <h2 className="module36-form-title">Récapitulatif</h2>

          <div className="module36-summary-rows">
            {[
              { label: 'Élève', value: selectedEleve ? `${selectedEleve.prenom} ${selectedEleve.nom}` : '—' },
              { label: 'Tranche', value: selectedTranche?.libelle || '—' },
              { label: 'Mode', value: selectedMode?.libelle || '—' },
            ].map(row => (
              <div key={row.label} className="module36-summary-row">
                <span className="module36-summary-label">{row.label}</span>
                <span className="module36-summary-value">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="module36-summary-total">
            <span className="module36-summary-total-label">Total</span>
            <span className="module36-summary-total-value">{total}</span>
          </div>

          {feedback.message && (
            <div style={{ padding: 12, marginBottom: 12, borderRadius: 8, background: feedback.type === 'error' ? '#fee2e2' : feedback.type === 'warning' ? '#fef3c7' : '#dcfce7', color: feedback.type === 'error' ? '#991b1b' : feedback.type === 'warning' ? '#92400e' : '#166534', fontSize: 14 }}>
              {feedback.message}
            </div>
          )}
          <button type="button" className="module36-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '⏳ Validation...' : 'Valider le paiement'}
          </button>
          <button type="button" className="module36-btn-secondary" onClick={() => navigate('/paiements')} disabled={isSubmitting}>
            Annuler
          </button>
        </div>
      </div>
    </Module36Layout>
  )
}
