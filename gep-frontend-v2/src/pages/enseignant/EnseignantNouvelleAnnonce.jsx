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
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'

const fieldStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box',
  background: '#fff', color: 'var(--text-primary)',
}

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)',
}

export default function EnseignantNouvelleAnnonce() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [parents, setParents] = useState([])
  const [mesCours, setMesCours] = useState([])
  const [classes, setClasses] = useState([])
  const [eleves, setEleves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const [destMode, setDestMode] = useState('parent')
  const [selectedParent, setSelectedParent] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedEleve, setSelectedEleve] = useState('')
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
        const ens = (ensRes.status === 'fulfilled' ? ensRes.value : []).filter((e) => e.idPers === user.id)
        setMesCours(ens)
        const clsIds = new Set()
        ens.forEach((e) => { if (e.cours?.classe?.idClasse) clsIds.add(e.cours.classe.idClasse) })
        setClasses((clsRes.status === 'fulfilled' ? clsRes.value : []).filter((c) => clsIds.has(c.idClasse)))
      } catch { setError('Erreur lors du chargement') }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  useEffect(() => {
    if (!selectedClasse) { setEleves([]); setSelectedEleve(''); return }
    classesApi.eleves(Number(selectedClasse)).then(setEleves).catch(() => setEleves([]))
  }, [selectedClasse])

  const parentsWithEleve = useMemo(() => {
    return parents.filter((p) => p.matricule)
  }, [parents])

  const parentInfo = useMemo(() => {
    if (!selectedParent) return null
    return parents.find((p) => p.idParent === Number(selectedParent))
  }, [parents, selectedParent])

  const filteredParents = useMemo(() => {
    if (!selectedEleve) return parentsWithEleve
    return parentsWithEleve.filter((p) => p.matricule === Number(selectedEleve))
  }, [parentsWithEleve, selectedEleve])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    let idParent = null
    if (destMode === 'parent') {
      if (!selectedParent) { setError('Veuillez sélectionner un parent.'); return }
      idParent = Number(selectedParent)
    } else {
      if (!selectedEleve) { setError('Veuillez sélectionner un élève.'); return }
      const parentOfEleve = parentsWithEleve.find((p) => p.matricule === Number(selectedEleve))
      if (!parentOfEleve) { setError("Aucun parent lié à cet élève."); return }
      idParent = parentOfEleve.idParent
    }

    if (!objet.trim()) { setError("Veuillez saisir un objet."); return }
    if (!information.trim()) { setError("Veuillez saisir le contenu du message."); return }

    setSubmitting(true)
    try {
      await messagesApi.create({ idParent, objet: objet.trim(), information: information.trim() })
      setSuccess('Annonce envoyée avec succès !')
      setTimeout(() => navigate('/enseignant/annonces'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi")
    } finally { setSubmitting(false) }
  }

  if (loading) return <div><PageHeader title="Nouvelle annonce" subtitle="Rédiger et envoyer un message" /><Spinner label="Chargement…" /></div>

  return (
    <div>
      <PageHeader
        title="Nouvelle annonce"
        subtitle="Rédiger et envoyer un message à un parent"
        actions={<Button variant="secondary" onClick={() => navigate('/enseignant/annonces')}>&larr; Retour aux annonces</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        border: 'none', color: '#fff', boxShadow: '0 16px 40px rgba(109, 40, 217, 0.20)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Rédaction d'annonce
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Envoyez un message personnalisé
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Choisissez le destinataire, rédigez votre message et envoyez-le en quelques clics.
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, background: 'var(--accent-light)', color: 'var(--accent)',
              }}>👤</span>
              Destinataire
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => { setDestMode('parent'); setSelectedEleve('') }}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  border: destMode === 'parent' ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: destMode === 'parent' ? 'var(--accent-light)' : '#fff',
                  color: destMode === 'parent' ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >Choisir un parent</button>
              <button
                type="button"
                onClick={() => { setDestMode('eleve'); setSelectedParent('') }}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  border: destMode === 'eleve' ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: destMode === 'eleve' ? 'var(--accent-light)' : '#fff',
                  color: destMode === 'eleve' ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >Choisir via un élève</button>
            </div>

            {destMode === 'parent' ? (
              <div>
                <label style={labelStyle}>Parent</label>
                <select
                  required
                  style={fieldStyle}
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                >
                  <option value="">Sélectionner un parent…</option>
                  {parentsWithEleve.map((p) => (
                    <option key={p.idParent} value={p.idParent}>
                      {p.personne ? `${p.personne.nom} ${p.personne.prenom}` : `Parent #${p.idParent}`}
                      {p.eleve ? ` (${p.eleve.nom} ${p.eleve.prenom})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Classe</label>
                  <select
                    style={fieldStyle}
                    value={selectedClasse}
                    onChange={(e) => { setSelectedClasse(e.target.value); setSelectedEleve('') }}
                  >
                    <option value="">Sélectionner une classe…</option>
                    {classes.map((c) => (
                      <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Élève</label>
                  <select
                    required
                    style={fieldStyle}
                    value={selectedEleve}
                    onChange={(e) => setSelectedEleve(e.target.value)}
                    disabled={!selectedClasse}
                  >
                    <option value="">{selectedClasse ? "Sélectionner un élève…" : "Choisissez d'abord une classe"}</option>
                    {eleves.map((el) => (
                      <option key={el.matricule} value={el.matricule}>{el.nom} {el.prenom}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {parentInfo && (
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46', marginBottom: 4 }}>Parent sélectionné</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>
                  {parentInfo.personne?.nom} {parentInfo.personne?.prenom}
                </div>
                {parentInfo.eleve && (
                  <div style={{ fontSize: 12, color: '#065f46', opacity: 0.8, marginTop: 2 }}>
                    Parent de {parentInfo.eleve.nom} {parentInfo.eleve.prenom}
                  </div>
                )}
                {parentInfo.personne?.email && (
                  <div style={{ fontSize: 12, color: '#065f46', opacity: 0.7, marginTop: 2 }}>
                    {parentInfo.personne.email}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, background: 'var(--accent-light)', color: 'var(--accent)',
              }}>✉️</span>
              Message
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Objet</label>
              <input
                required
                style={fieldStyle}
                placeholder="Ex: Absence de votre enfant"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Message</label>
              <textarea
                required
                rows={10}
                placeholder="Rédigez votre message ici…"
                value={information}
                onChange={(e) => setInformation(e.target.value)}
                style={{
                  ...fieldStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
                }}
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
                {submitting ? 'Envoi…' : 'Envoyer l\'annonce'}
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
