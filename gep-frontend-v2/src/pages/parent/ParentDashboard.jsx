import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { elevesApi } from '../../api/eleves.api'
import { paiementsExtra } from '../../api/paiements.api'
import { bulletinApi } from '../../api/evaluations.api'
import { absencesApi } from '../../api/absences.api'
import { messagesApi } from '../../api/messages.api'

const iconCircle = (color) => ({
  width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 24, flexShrink: 0,
  background: `linear-gradient(135deg, ${color}22, ${color}11)`,
  border: `2px solid ${color}33`,
})

export default function ParentDashboard() {
  const { user } = useAuth()
  const [enfants, setEnfants] = useState(null)
  const [stats, setStats] = useState({ frais: 0, absences: 0, annonces: 0, notes: [], depenses: [], messages: [] })
  const [sliceIdx, setSliceIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const children = await elevesApi.list()
        if (cancelled) return
        setEnfants(children)

        const matricules = (children || []).map((e) => e.matriculeCode || e.matricule)

        const [absencesRaw, messagesRaw] = await Promise.allSettled([
          absencesApi.list(),
          messagesApi.list(),
        ])

        const absencesCount = absencesRaw.status === 'fulfilled' ? (absencesRaw.value || []).length : 0
        const messagesList = messagesRaw.status === 'fulfilled' ? (messagesRaw.value || []) : []
        const sortedMessages = messagesList.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5)

        const notesResults = await Promise.allSettled(
          (children || []).map((e) => bulletinApi.get(e.matricule))
        )
        const notesData = notesResults
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value)

        let fraisTotal = 0
        const allPaiements = []
        for (const child of children || []) {
          try {
            const [statut, paiementsData] = await Promise.allSettled([
              paiementsExtra.statut(child.matricule),
              paiementsExtra.parEleve(child.matricule),
            ])
            if (statut.status === 'fulfilled' && statut.value?.tranches) {
              for (const t of statut.value.tranches) {
                fraisTotal += Math.max(0, (t.montant || 0) - (t.paye || 0))
              }
            }
            if (paiementsData.status === 'fulfilled') {
              for (const p of (paiementsData.value?.paiements || [])) {
                allPaiements.push({ ...p, eleveNom: `${child.nom} ${child.prenom}` })
              }
            }
          } catch {}
        }
        allPaiements.sort((a, b) => (b.datePaie || '').localeCompare(a.datePaie || ''))

        if (!cancelled) setStats({ frais: fraisTotal, absences: absencesCount, annonces: messagesList.length, notes: notesData, depenses: allPaiements, messages: sortedMessages })
      } catch {
        if (!cancelled) setEnfants([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!enfants || enfants.length <= 2) return
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setSliceIdx((prev) => (prev + 1) % Math.ceil(enfants.length / 2))
        setFade(true)
      }, 400)
    }, 600000)
    return () => clearInterval(timer)
  }, [enfants])

  const displayedChildren = useMemo(() => {
    if (!enfants) return []
    if (enfants.length <= 2) return enfants
    const start = (sliceIdx * 2) % enfants.length
    return [enfants[start], enfants[(start + 1) % enfants.length]]
  }, [enfants, sliceIdx])

  if (enfants === null) return <div><PageHeader title={`Bienvenue, ${user?.nom || ''}`} subtitle="Suivi de la scolarité" /><Spinner label="Chargement de votre espace…" /></div>

  const cardHover = (ev, enter) => {
    ev.currentTarget.style.transform = enter ? 'translateY(-3px)' : 'translateY(0)'
    ev.currentTarget.style.boxShadow = enter ? '0 12px 32px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.06)'
  }

  const formatMontant = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA'

  const moyenneGen = stats.notes.length > 0
    ? (stats.notes.reduce((s, b) => s + (b.moyenneGenerale || 0), 0) / stats.notes.length).toFixed(1)
    : null

  const cards = [
    {
      to: '/parent/paiements',
      color: '#e74c3c',
      icon: '💰',
      label: 'Frais dus',
      value: formatMontant(stats.frais),
      hint: stats.frais === 0 ? 'Aucun solde impayé' : 'Montant restant à payer',
    },
    {
      to: '/annonces',
      color: '#3498db',
      icon: '📢',
      label: 'Annonces',
      value: stats.annonces,
      hint: stats.annonces === 0 ? 'Aucune annonce' : 'Message(s) reçu(s)',
    },
    {
      to: '/parent/notes',
      color: '#2ecc71',
      icon: '📊',
      label: 'Résultats',
      value: moyenneGen !== null ? `${moyenneGen}/20` : '—',
      hint: moyenneGen !== null ? 'Moyenne générale' : 'Aucune note disponible',
    },
    {
      to: '/parent/absences',
      color: '#9b59b6',
      icon: '📅',
      label: 'Absences',
      value: stats.absences,
      hint: stats.absences === 0 ? 'Aucune absence' : 'Absence(s) enregistrée(s)',
    },
  ]

  return (
    <div>
      <PageHeader title={`Bienvenue, ${user?.nom || ''}`} subtitle="Suivi de la scolarité de votre/vos enfant(s)" />

      {enfants.length === 0 ? (
        <Card>Aucun enfant lié à votre compte pour le moment.</Card>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
            {cards.map((c) => (
              <Link key={c.label} to={c.to}
                style={{ textDecoration: 'none', color: 'inherit', borderRadius: 'var(--radius)', transition: 'transform .12s, box-shadow .12s' }}
                onMouseEnter={(ev) => { ev.currentTarget.style.transform = 'translateY(-3px)'; ev.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.10)' }}
                onMouseLeave={(ev) => { ev.currentTarget.style.transform = 'translateY(0)'; ev.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Card style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 20 }}>
                  <div style={iconCircle(c.color)}>{c.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 4 }}>
                      {c.value}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.hint}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card style={{ padding: '20px 22px', minHeight: 340, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Vos enfants</div>
                {enfants.length > 2 && (
                  <Link to="/parent/enfants" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                    Voir tous ({enfants.length})
                  </Link>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, transition: 'opacity 0.4s ease, transform 0.4s ease', opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(8px)' }}>
                {displayedChildren.map((e) => {
                  const initials = `${(e.nom || '')[0] || ''}${(e.prenom || '')[0] || ''}`.toUpperCase()
                  const hasPhoto = !!e.photoURL
                  const sexeLabel = e.sexe === 1 ? 'Masculin' : e.sexe === 0 ? 'Féminin' : '—'
                  return (
                    <div key={e.matricule} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                    }}>
                      {hasPhoto ? (
                        <img src={e.photoURL} alt={e.nom}
                          style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--accent), #0f766e)',
                          color: '#fff', fontSize: 18, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{initials}</div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>
                          {e.nom} {e.prenom}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Classe : <strong>{e.inscriptions?.[0]?.classe?.libelle || 'Non inscrit'}</strong></span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Matricule : <strong style={{ fontFamily: 'monospace' }}>{e.matriculeCode || e.matricule}</strong></span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Né(e) le : {e.dateNaissance?.slice(0, 10) || '—'}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Lieu : {e.lieuNaissance || '—'}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sexe : {e.sexe === 1 ? 'Masculin' : e.sexe === 0 ? 'Féminin' : '—'}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Langue : {e.langue || '—'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

              <Card style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3498db' }} />
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Derniers messages</div>
                    {stats.messages.length > 0 && <span style={{ fontSize: 11, color: '#3498db', background: '#3498db22', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>{stats.messages.length}</span>}
                  </div>
                  <Link to="/annonces" style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#3498db', padding: '6px 14px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Voir tous
                  </Link>
                </div>
                {stats.messages.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Aucun message reçu</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1, paddingRight: 4, justifyContent: 'space-between' }}>
                    {stats.messages.map((m, i) => (
                      <div key={m.idMessages} style={{
                        padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)', background: i === 0 ? '#3498db08' : 'var(--bg-secondary)',
                        borderLeft: i === 0 ? '3px solid #3498db' : '1px solid var(--border)',
                        transition: 'background 0.2s', flex: 1,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: i === 0 ? '#2980b9' : 'var(--text-primary)' }}>{m.objet || m.subject || 'Sans objet'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{m.created_at?.slice(0, 10) || ''}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.information || m.content || ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card style={{ padding: '18px 20px', minHeight: 340, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Derniers paiements</div>
                  <Link to="/parent/paiements" style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: 'var(--accent)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Voir tous les paiements
                  </Link>
                </div>
                {stats.depenses.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 24, flex: 1 }}>Aucun paiement enregistré</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>Élève</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>Motif</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>Montant</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.depenses.slice(0, 4).map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.eleveNom}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontSize: 12 }}>{p.comentaire || '—'}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--danger)', fontWeight: 700 }}>{Number(p.montant).toLocaleString('fr-FR')} FCFA</td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{p.datePaie?.slice(0, 10) || '—'}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{p.mode?.libelle || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>

              <Card style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ecc71' }} />
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Résultats des examens</div>
                  </div>
                  <Link to="/parent/notes" style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#2ecc71', padding: '6px 14px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Voir le bulletin complet
                  </Link>
                </div>
                {stats.notes.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 24, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Aucun résultat disponible</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                    {stats.notes.map((bulletin, idx) => (
                      <div key={idx} style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: 14 }}>{bulletin.eleve?.nom} {bulletin.eleve?.prenom}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{bulletin.eleve?.matriculeCode || bulletin.eleve?.matricule}</span>
                          </div>
                          <div style={{
                            padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 800,
                            background: (bulletin.moyenneGenerale || 0) >= 10 ? '#2ecc7122' : '#e74c3c22',
                            color: (bulletin.moyenneGenerale || 0) >= 10 ? '#27ae60' : '#c0392b',
                          }}>
                            {bulletin.moyenneGenerale?.toFixed(1) || '—'}/20
                          </div>
                        </div>
                        {bulletin.appreciationGenerale && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{bulletin.appreciationGenerale}</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {(bulletin.sessions || []).map((s, si) => (
                            <div key={si} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-light)' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{s.session}</span>
                              <span style={{ fontWeight: 700 }}>{s.moyenne?.toFixed(1) || '—'}/20</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
