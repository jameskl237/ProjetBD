import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import { messagesApi } from '../../api/messages.api'
import { parentsApi } from '../../api/parents.api'
import { coursApi, enseignantsApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'
import { useAuth } from '../../hooks/useAuth'

const fieldStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box',
  background: '#fff', color: 'var(--text-primary)',
}

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)',
}

const tabBtn = (active) => ({
  flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
  border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
  background: active ? 'var(--accent-light)' : '#fff',
  color: active ? 'var(--accent)' : 'var(--text-secondary)',
  fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
})

export default function EnseignantNouvelleAnnonce() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [parents, setParents] = useState([])
  const [allEnseignants, setAllEnseignants] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const [destTab, setDestTab] = useState('parents')
  const [destMode, setDestMode] = useState('all')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [objet, setObjet] = useState('')
  const [information, setInformation] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [parRes, ensRes, clsRes] = await Promise.allSettled([
          parentsApi.list(),
          enseignantsApi.list(),
          classesApi.list(),
        ])
        setParents(parRes.status === 'fulfilled' ? parRes.value : [])
        setAllEnseignants(ensRes.status === 'fulfilled' ? ensRes.value : [])
        setClasses(clsRes.status === 'fulfilled' ? clsRes.value : [])
      } catch { setError('Erreur lors du chargement') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const parentsWithEleve = useMemo(() => parents.filter((p) => p.matricule), [parents])

  const classesSorted = useMemo(() => [...classes].sort((a, b) => (a.libelle || '').localeCompare(b.libelle || '')), [classes])

  const filteredParents = useMemo(() => {
    let list = parentsWithEleve
    if (selectedClasse) {
      const matIds = new Set()
      list.forEach((p) => { if (p.matricule) matIds.add(p.matricule) })
    }
    return list
  }, [parentsWithEleve, selectedClasse])

  const filteredEnseignants = useMemo(() => {
    let list = allEnseignants
    if (selectedClasse) list = list.filter((e) => e.cours?.classe?.idClasse === Number(selectedClasse))
    return list
  }, [allEnseignants, selectedClasse])

  const currentList = destTab === 'parents' ? filteredParents : filteredEnseignants
  const currentLabel = destTab === 'parents' ? 'parent' : 'enseignant'

  const selectedObj = useMemo(() => {
    if (!selectedId || destTab === 'tout') return null
    if (destTab === 'parents') return parents.find((p) => p.idParent === Number(selectedId))
    return allEnseignants.find((e) => e.idPers === Number(selectedId))
  }, [selectedId, destTab, parents, allEnseignants])

  function getRecipientSummary() {
    if (destTab === 'tout') return { label: 'Tout le monde', sub: 'Personnel, parents, enseignants' }
    if (destMode === 'all') {
      const count = destTab === 'parents' ? parentsWithEleve.length : allEnseignants.length
      return { label: `Tous les ${currentLabel}s`, sub: `${count} destinataire(s)` }
    }
    if (destMode === 'classe' && selectedClasse) {
      const cls = classes.find((c) => c.idClasse === Number(selectedClasse))
      return { label: cls?.libelle || 'Classe', sub: `${currentLabel}s de cette classe` }
    }
    if (destMode === 'single' && selectedObj) {
      const name = selectedObj.personne ? `${selectedObj.personne.nom} ${selectedObj.personne.prenom}` : ''
      const sub = destTab === 'parents' && selectedObj.eleve ? `Parent de ${selectedObj.eleve.nom} ${selectedObj.eleve.prenom}` : selectedObj.cours?.matiere || null
      return { label: name, sub }
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!objet.trim()) { setError("Veuillez saisir un objet."); return }
    if (!information.trim()) { setError("Veuillez saisir le contenu du message."); return }

    try {
      if (destTab === 'tout') {
        const res = await messagesApi.broadcast({ target: 'all', objet: objet.trim(), information: information.trim() })
        setSuccess(res.message || 'Annonce(s) envoyée(s) !')
      } else if (destMode === 'single' && selectedId) {
        if (destTab === 'parents') {
          await messagesApi.create({ idParent: Number(selectedId), objet: objet.trim(), information: information.trim() })
        } else {
          await messagesApi.broadcast({ target: 'enseignants', ids: [Number(selectedId)], objet: objet.trim(), information: information.trim() })
        }
        setSuccess('Annonce envoyée !')
      } else {
        const target = destTab === 'parents' ? 'parents' : 'enseignants'
        const payload = { target, objet: objet.trim(), information: information.trim() }
        if (destMode === 'classe' && selectedClasse) payload.idClasse = Number(selectedClasse)
        const res = await messagesApi.broadcast(payload)
        setSuccess(res.message || 'Annonce(s) envoyée(s) !')
      }
      setTimeout(() => navigate('/enseignant/annonces'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi")
    } finally { setSubmitting(false) }
  }

  if (loading) return <div><PageHeader title="Nouvelle annonce" subtitle="Rédiger et envoyer un message" /><Spinner label="Chargement…" /></div>

  const summary = getRecipientSummary()

  return (
    <div>
      <PageHeader
        title="Nouvelle annonce"
        subtitle="Rédiger et envoyer un message aux familles"
        actions={<Button variant="secondary" onClick={() => navigate('/enseignant/annonces')}>&larr; Retour aux annonces</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        border: 'none', color: '#fff', boxShadow: '0 16px 40px rgba(109, 40, 217, 0.20)',
      }}>
        <div style={{ maxWidth: 620 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>Rédaction d'annonce</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Envoyez un message personnalisé</div>
          <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>Choisissez le destinataire, rédigez votre message et envoyez-le en quelques clics.</div>
        </div>
      </Card>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* --- Colonne gauche : Destinataire --- */}
          <Card>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: 'var(--accent-light)', color: 'var(--accent)' }}>👤</span>
              Destinataire
            </div>

            {/* 3 tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <button type="button" onClick={() => { setDestTab('parents'); setDestMode('all'); setSelectedId(''); setSelectedClasse('') }} style={tabBtn(destTab === 'parents')}>
                👨‍👩‍👧 Parents
              </button>
              <button type="button" onClick={() => { setDestTab('enseignants'); setDestMode('all'); setSelectedId(''); setSelectedClasse('') }} style={tabBtn(destTab === 'enseignants')}>
                👨‍🏫 Enseignants
              </button>
              <button type="button" onClick={() => { setDestTab('tout'); setSelectedId(''); setSelectedClasse('') }} style={tabBtn(destTab === 'tout')}>
                🌍 Tout
              </button>
            </div>

            {/* Sub-modes (pas pour "tout") */}
            {destTab !== 'tout' && (
              <>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  <button type="button" onClick={() => { setDestMode('all'); setSelectedId('') }} style={{ ...tabBtn(destMode === 'all'), fontSize: 12, padding: '7px 10px' }}>
                    Tous
                  </button>
                  <button type="button" onClick={() => { setDestMode('classe'); setSelectedId('') }} style={{ ...tabBtn(destMode === 'classe'), fontSize: 12, padding: '7px 10px' }}>
                    Par classe
                  </button>
                  <button type="button" onClick={() => { setDestMode('single') }} style={{ ...tabBtn(destMode === 'single'), fontSize: 12, padding: '7px 10px' }}>
                    Individuel
                  </button>
                </div>

                {/* Classe selector */}
                {destMode !== 'single' && (
                  <div style={{ marginBottom: 14 }}>
                    <select value={selectedClasse} onChange={(e) => setSelectedClasse(e.target.value)} style={fieldStyle}>
                      <option value="">Toutes les classes</option>
                      {classesSorted.map((c) => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
                    </select>
                  </div>
                )}

                {/* Individuel : select dropdown */}
                {destMode === 'single' && (
                  <div>
                    <label style={labelStyle}>{currentLabel === 'parent' ? 'Parent' : 'Enseignant'}</label>
                    <select
                      required style={fieldStyle} value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                    >
                      <option value="">{`Sélectionner un ${currentLabel}…`}</option>
                      {currentList.map((item) => {
                        const id = destTab === 'parents' ? item.idParent : item.idPers
                        const label = item.personne ? `${item.personne.nom} ${item.personne.prenom}` : `#${id}`
                        const extra = destTab === 'parents' && item.eleve ? ` (${item.eleve.nom} ${item.eleve.prenom})` : destTab === 'enseignants' && item.cours ? ` (${item.cours.matiere})` : ''
                        return <option key={id} value={id}>{label}{extra}</option>
                      })}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Résumé */}
            {summary && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, color: '#065f46',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                <span><strong>{summary.label}</strong>{summary.sub && <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: 4 }}>— {summary.sub}</span>}</span>
              </div>
            )}

            {selectedObj && destMode === 'single' && destTab === 'parents' && (
              <div style={{
                marginTop: 14, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46', marginBottom: 4 }}>Parent sélectionné</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>
                  {selectedObj.personne?.nom} {selectedObj.personne?.prenom}
                </div>
                {selectedObj.eleve && (
                  <div style={{ fontSize: 12, color: '#065f46', opacity: 0.8, marginTop: 2 }}>
                    Parent de {selectedObj.eleve.nom} {selectedObj.eleve.prenom}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* --- Colonne droite : Message --- */}
          <Card>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: 'var(--accent-light)', color: 'var(--accent)' }}>✉️</span>
              Message
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Objet</label>
              <input required style={fieldStyle} placeholder="Ex: Absence de votre enfant" value={objet} onChange={(e) => setObjet(e.target.value)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Message</label>
              <textarea
                required rows={10} placeholder="Rédigez votre message ici…"
                value={information} onChange={(e) => setInformation(e.target.value)}
                style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>

            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              background: '#f8fafc', border: '1px solid var(--border)',
              fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16,
            }}>
              <strong>De :</strong> {user?.login || 'Enseignant'} — {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => navigate('/enseignant/annonces')}>Annuler</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Envoi…' : destTab === 'tout' || destMode === 'all' || destMode === 'classe' ? 'Envoyer à tous' : 'Envoyer l\'annonce'}
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
