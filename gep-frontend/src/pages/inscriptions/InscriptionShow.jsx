import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Module34Layout from './Module34Layout'
import { inscriptionApi, eleveApi, api, extractData } from '../../api'
import { mapInscriptionToRow } from '../../utils/apiMappers'

export default function Show() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [inscription, setInscription] = useState(null)
  const [tuteur, setTuteur] = useState(null)
  const [totalPaye, setTotalPaye] = useState(0)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function loadInscription() {
      setLoading(true)
      try {
        const response = await inscriptionApi.get(id)
        const raw = extractData(response)
        const mapped = mapInscriptionToRow(raw)
        if (cancelled) return
        setInscription(mapped)
        if (raw?.matricule) {
          const [paiementsRes, eleveRes] = await Promise.all([
            api.get(`/paiements/eleve/${raw.matricule}`),
            eleveApi.get(raw.matricule),
          ])
          if (cancelled) return
          setTotalPaye(extractData(paiementsRes)?.total ?? 0)
          setTuteur(extractData(eleveRes)?.tuteurs?.[0]?.tuteur ?? null)
        }
      } catch (error) {
        console.error('Failed to load inscription', error)
        if (!cancelled) setFeedback("Impossible de charger cette inscription.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadInscription()
    return () => { cancelled = true }
  }, [id])

  if (loading || !inscription) {
    return (
      <Module34Layout breadcrumb={['Inscriptions', 'Chargement']} backTo="/inscriptions">
        <div className="module34-panel"><div className="module34-panel-body">{feedback || 'Chargement de l’inscription…'}</div></div>
      </Module34Layout>
    )
  }

  const raw = inscription.raw
  const salle = raw?.salle

  return (
    <Module34Layout breadcrumb={['Inscriptions', inscription.id]} backTo="/inscriptions">
      <div className="module34-hero">
        <div className="module34-hero-top">
          <div className="module34-hero-avatar">{inscription.initials}</div>
          <div className="module34-hero-info">
            <div className="module34-hero-name">{inscription.fullName}</div>
            <div className="module34-hero-sub">{inscription.studentId} · {inscription.id}</div>
            <div className="module34-hero-tags">
              <span className={`module34-htag ${inscription.status === 'active' ? 'active' : ''}`}>{inscription.status === 'active' ? '📋 Active' : '🏁 Clôturée'}</span>
              <span className="module34-htag section">{inscription.section}</span>
              <span className="module34-htag class">{inscription.className}</span>
              <span className="module34-htag year">{inscription.year}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="module34-panels">
        <div className="module34-grid-2">
          <div>
            <div className="module34-panel">
              <div className="module34-panel-header"><div className="module34-card-icon ci-v">📋</div><div><div className="module34-panel-title">Détails de l'inscription</div><div className="module34-panel-subtitle">Informations principales</div></div></div>
              <div className="module34-panel-body">
                <div className="module34-info-grid">
                  <div className="module34-info-item"><div className="module34-info-label">N° inscription</div><div className="module34-info-value mono">{inscription.id}</div></div>
                  <div className="module34-info-item"><div className="module34-info-label">Matricule élève</div><div className="module34-info-value mono">{inscription.studentId}</div></div>
                  <div className="module34-info-item"><div className="module34-info-label">Année scolaire</div><div className="module34-info-value">{inscription.year}</div></div>
                  <div className="module34-info-item"><div className="module34-info-label">Date d'inscription</div><div className="module34-info-value">{inscription.dateLabel}</div></div>
                  <div className="module34-info-item"><div className="module34-info-label">Section</div><div className="module34-info-value"><span className="module34-section-tag sec-fr">{inscription.section}</span></div></div>
                  <div className="module34-info-item"><div className="module34-info-label">Classe</div><div className="module34-info-value">{inscription.className}</div></div>
                  <div className="module34-info-item"><div className="module34-info-label">Statut</div><div className="module34-info-value"><span className={`module34-badge ${inscription.status === 'active' ? 'b-active' : 'b-warning'}`}><span className="bdot" />{inscription.status === 'active' ? 'Active' : 'Clôturée'}</span></div></div>
                </div>
              </div>
            </div>

            <div className="module34-panel">
              <div className="module34-panel-header"><div className="module34-card-icon ci-a">📝</div><div><div className="module34-panel-title">Observations</div></div></div>
              <div className="module34-panel-body"><p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{raw?.commentaire || 'Aucune observation.'}</p></div>
            </div>
          </div>

          <div>
            <div className="module34-panel">
              <div className="module34-panel-header"><div className="module34-card-icon ci-c">🏫</div><div><div className="module34-panel-title">Classe affectée</div></div></div>
              <div className="module34-panel-body">
                <div style={{ background: 'linear-gradient(135deg, rgba(76,29,149,.07), rgba(6,182,212,.05))', border: '1.5px solid #ede9fe', borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 32, fontWeight: 800, color: '#4c1d95' }}>{inscription.className}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Section {inscription.section}</div>
                </div>
                <div className="module34-info-grid">
                  <div className="module34-info-item"><div className="module34-info-label">Salle</div><div className="module34-info-value">{salle?.libelle || '—'}</div></div>
                  <div className="module34-info-item"><div className="module34-info-label">Tuteur</div><div className="module34-info-value">{tuteur ? `${tuteur.prenom || ''} ${tuteur.nom || ''}`.trim() : 'Aucun'}</div></div>
                  <div className="module34-info-item"><div className="module34-info-label">Téléphone</div><div className="module34-info-value">{tuteur?.mobile || tuteur?.phone || '—'}</div></div>
                </div>
              </div>
            </div>

            <div className="module34-panel">
              <div className="module34-panel-header"><div className="module34-card-icon ci-g">💳</div><div><div className="module34-panel-title">Situation paiements</div></div></div>
              <div className="module34-panel-body">
                <div style={{ textAlign: 'center', padding: 12, background: 'rgba(5,150,105,.05)', border: '1px solid rgba(5,150,105,.15)', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 800, color: '#059669' }}>{totalPaye.toLocaleString('fr-FR')}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>FCFA payés au total</div>
                </div>
              </div>
            </div>

            <div className="module34-footer">
              <button className="module34-button-secondary" type="button" onClick={() => navigate('/inscriptions')}>Retour</button>
              {inscription.status === 'active' && (
                <button className="module34-button" type="button" onClick={() => navigate(`/inscriptions/cloturer/${inscription.id}`)}>Clôturer</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Module34Layout>
  )
}
