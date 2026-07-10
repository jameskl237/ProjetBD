import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eleveApi, modePaiementApi, paiementApi, trancheApi, anneeAcademiqueApi, extractList } from '../../api'
import Module36Layout from './Module36Layout'

const INITIAL_FORM = {
  matricule: '',
  idAca: '',
  trancheLibelle: '',
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
  const [tranches, setTranches] = useState([])
  const [modes, setModes] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const selectedMode = modes.find(item => String(item.idMode) === String(form.idMode))
  const selectedEleve = eleves.find(e => String(e.matricule) === String(form.matricule))
  const total = form.montant ? `${Number(form.montant).toLocaleString('fr-FR')} FCFA` : '0 FCFA'

  useEffect(() => {
    async function loadOptions() {
      try {
        const [elevesResponse, tranchesResponse, modesResponse, anneesResponse] = await Promise.all([
          eleveApi.list(),
          trancheApi.list(),
          modePaiementApi.list(),
          anneeAcademiqueApi.list(),
        ])
        const eleveData = extractList(elevesResponse)
        const trancheData = extractList(tranchesResponse)
        const modeData = extractList(modesResponse)
        const anneeData = extractList(anneesResponse)
        setEleves(eleveData)
        setTranches(trancheData)
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

  function updateField(field, value) {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.matricule || !form.idAca || !form.idMode || !form.montant || !form.date) {
      setFeedback({
        type: 'warning',
        message: 'Veuillez remplir tous les champs obligatoires.',
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
        comentaire: form.trancheLibelle || '',
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
            <label className="module36-label" htmlFor="tranche">Description / Tranche</label>
            <div className="module36-select-wrap">
              <select id="tranche" className="module36-select" value={form.trancheLibelle} onChange={event => updateField('trancheLibelle', event.target.value)}>
                <option value="">Aucune</option>
                {tranches.map(tranche => <option key={tranche.idTranche} value={tranche.libelle}>{tranche.libelle}</option>)}
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>
        </div>

        <div className="module36-summary-card">
          <h2 className="module36-form-title">Récapitulatif</h2>

          <div className="module36-summary-rows">
            {[
              { label: 'Élève', value: selectedEleve ? `${selectedEleve.prenom} ${selectedEleve.nom}` : '—' },
              { label: 'Description', value: form.trancheLibelle || '—' },
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
