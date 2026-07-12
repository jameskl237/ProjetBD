import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import SelectField from '../../components/forms/SelectField'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import { abonnementsApi } from '../../api/transport.api'
import { elevesApi } from '../../api/eleves.api'

const TYPES = {
  0: { label: 'Aller-retour', icon: '🚌', color: '#6366f1' },
  1: { label: 'Aller simple', icon: '➡️', color: '#f59e0b' },
  2: { label: 'Retour simple', icon: '⬅️', color: '#10b981' },
}

const STATUT_FILTRES = [
  { value: 'actif', label: 'Actifs' },
  { value: 'expire', label: 'Expirés' },
  { value: 'venir', label: 'À venir' },
]

function getStatutInfo(abo) {
  const now = new Date()
  const debut = new Date(abo.dateDebut)
  const fin = abo.dateFin ? new Date(abo.dateFin) : null
  if (!abo.actif) return { label: 'Inactif', tone: 'neutral', color: '#94a3b8', bgColor: '#f1f5f9' }
  if (debut > now) return { label: 'À venir', tone: 'info', color: '#2563eb', bgColor: '#eff6ff' }
  if (fin && fin < now) return { label: 'Expiré', tone: 'danger', color: '#dc2626', bgColor: '#fef2f2' }
  return { label: 'Actif', tone: 'success', color: '#16a34a', bgColor: '#f0fdf4' }
}

function getJoursRestants(abo) {
  const now = new Date()
  const debut = new Date(abo.dateDebut)
  const fin = abo.dateFin ? new Date(abo.dateFin) : null
  if (!abo.actif) return null
  if (debut > now) {
    const jours = Math.ceil((debut - now) / (1000 * 60 * 60 * 24))
    return { value: jours, label: `Commence dans ${jours} jour${jours > 1 ? 's' : ''}`, type: 'debut' }
  }
  if (!fin) return { value: null, label: 'Pas de date de fin', type: 'illimite' }
  const diff = Math.ceil((fin - now) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { value: 0, label: 'Expiré', type: 'expire' }
  if (diff <= 7) return { value: diff, label: `Expire dans ${diff} jour${diff > 1 ? 's' : ''} !`, type: 'urgent' }
  if (diff <= 30) return { value: diff, label: `${diff} jours restants`, type: 'bientot' }
  return { value: diff, label: `${diff} jours restants`, type: 'ok' }
}

function getDuree(abo) {
  if (!abo.dateFin) return 'Illimité'
  const debut = new Date(abo.dateDebut)
  const fin = new Date(abo.dateFin)
  const jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24))
  if (jours < 30) return `${jours} jour${jours > 1 ? 's' : ''}`
  const mois = Math.floor(jours / 30)
  const reste = jours % 30
  if (reste === 0) return `${mois} mois`
  return `${mois} mois et ${reste} jour${reste > 1 ? 's' : ''}`
}

const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 999,
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)',
}

export default function ParentTransport() {
  const [abonnements, setAbonnements] = useState([])
  const [enfants, setEnfants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMatricule, setSelectedMatricule] = useState('')
  const [statutFilter, setStatutFilter] = useState('')

  async function loadData() {
    try {
      const [aboRes, elevesRes] = await Promise.allSettled([
        abonnementsApi.list(),
        elevesApi.list(),
      ])
      const abos = aboRes.status === 'fulfilled' ? aboRes.value : []
      const eleves = elevesRes.status === 'fulfilled' ? elevesRes.value : []
      setAbonnements(abos)
      setEnfants(eleves)
      if (eleves.length === 1) setSelectedMatricule(String(eleves[0].matricule))
    } catch {
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    let result = abonnements
    if (selectedMatricule) result = result.filter((a) => String(a.matricule) === selectedMatricule)
    if (statutFilter) {
      result = result.filter((a) => {
        const info = getStatutInfo(a)
        if (statutFilter === 'actif') return info.label === 'Actif'
        if (statutFilter === 'expire') return info.label === 'Expiré' || info.label === 'Inactif'
        if (statutFilter === 'venir') return info.label === 'À venir'
        return true
      })
    }
    return result
  }, [abonnements, selectedMatricule, statutFilter])

  const stats = useMemo(() => {
    let actifs = 0, expires = 0, aVenir = 0
    const base = selectedMatricule ? abonnements.filter((a) => String(a.matricule) === selectedMatricule) : abonnements
    base.forEach((a) => {
      const info = getStatutInfo(a)
      if (info.label === 'Actif') actifs++
      else if (info.label === 'Expiré' || info.label === 'Inactif') expires++
      else if (info.label === 'À venir') aVenir++
    })
    return { total: base.length, actifs, expires, aVenir }
  }, [abonnements, selectedMatricule])

  if (loading) return (
    <div>
      <PageHeader title="Transport scolaire" subtitle="Suivi des abonnements de transport de vos enfants" />
      <Spinner label="Chargement des abonnements…" />
    </div>
  )

  return (
    <div>
      <PageHeader title="Transport scolaire" subtitle="Suivi des abonnements de transport de vos enfants" />

      {error && <Alert tone="error">{error}</Alert>}

      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #134e4a 100%)',
        border: 'none', color: '#fff', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Transport scolaire
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Abonnements de transport
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Consultez les abonnements de transport de vos enfants. Suivez les dates, le type de trajet et les statuts en temps réel.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={pillStyle}>🚌 {stats.total} abonnement{stats.total > 1 ? 's' : ''}</span>
            <span style={pillStyle}>✅ {stats.actifs} actif{stats.actifs > 1 ? 's' : ''}</span>
          </div>
        </div>
      </Card>

      {enfants.length > 1 && (
        <Card style={{ marginBottom: 16, padding: '18px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Filtrer par enfant</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                Sélectionnez un enfant pour voir ses abonnements.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 220, maxWidth: 280 }}>
                <SelectField
                  label="Enfant"
                  value={selectedMatricule}
                  onChange={(e) => setSelectedMatricule(e.target.value)}
                  options={enfants.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))}
                  placeholder="Tous les enfants"
                />
              </div>
              <div style={{ minWidth: 160, maxWidth: 200 }}>
                <SelectField
                  label="Statut"
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value)}
                  options={STATUT_FILTRES}
                  placeholder="Tous les statuts"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {enfants.length <= 1 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 180, maxWidth: 220 }}>
            <SelectField
              label="Statut"
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              options={STATUT_FILTRES}
              placeholder="Tous les statuts"
            />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="📋" label="Total" value={stats.total} hint="Abonnements" tone="info" />
        <StatCard icon="✅" label="Actifs" value={stats.actifs} hint="En service" tone="success" />
        <StatCard icon="⏰" label="À venir" value={stats.aVenir} hint="Pas encore débutés" tone="warning" />
        <StatCard icon="❌" label="Expirés" value={stats.expires} hint="Terminés / Inactifs" tone="danger" />
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 64, textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)' }}>
          <div style={{ fontSize: 54, marginBottom: 12 }}>🚌</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            {abonnements.length === 0 ? 'Aucun abonnement transport' : 'Aucun résultat pour ce filtre'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
            {abonnements.length === 0
              ? "Aucun abonnement de transport n'a encore été créé pour vos enfants. Contactez l'administration pour souscrire."
              : "Modifiez les filtres pour voir d'autres abonnements."}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {enfants
            .filter((e) => !selectedMatricule || String(e.matricule) === selectedMatricule)
            .map((enfant) => {
              const abosEnfant = filtered.filter((a) => String(a.matricule) === String(enfant.matricule))
              if (abosEnfant.length === 0) return null
              return (
                <Card key={enfant.matricule} style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 999,
                      background: 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800,
                    }}>
                      {enfant.nom?.[0]}{enfant.prenom?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {enfant.nom} {enfant.prenom}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {abosEnfant.length} abonnement{abosEnfant.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {abosEnfant.map((abo) => {
                        const type = TYPES[abo.type] || TYPES[0]
                        const statut = getStatutInfo(abo)
                        const jours = getJoursRestants(abo)
                        const duree = getDuree(abo)

                        return (
                          <div key={abo.idAbonnement} style={{
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            overflow: 'hidden',
                            transition: 'box-shadow .15s ease',
                          }}
                            onMouseEnter={(ev) => { ev.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)' }}
                            onMouseLeave={(ev) => { ev.currentTarget.style.boxShadow = 'none' }}
                          >
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                              <div style={{
                                width: 6, flexShrink: 0, background: statut.color,
                              }} />

                              <div style={{ flex: 1, padding: '16px 18px', minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                      width: 42, height: 42, borderRadius: 10,
                                      background: statut.bgColor,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 20, flexShrink: 0,
                                    }}>
                                      {type.icon}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {type.label}
                                      </div>
                                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        Durée : {duree}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge tone={statut.tone}>{statut.label}</Badge>
                                </div>

                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                  gap: 12,
                                }}>
                                  <div style={{
                                    padding: '10px 14px', borderRadius: 8,
                                    background: 'var(--border-light)',
                                  }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                      Date de début
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {abo.dateDebut ? new Date(abo.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                    </div>
                                  </div>
                                  <div style={{
                                    padding: '10px 14px', borderRadius: 8,
                                    background: 'var(--border-light)',
                                  }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                      Date de fin
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {abo.dateFin ? new Date(abo.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pas de fin'}
                                    </div>
                                  </div>
                                  {jours && (
                                    <div style={{
                                      padding: '10px 14px', borderRadius: 8,
                                      background: jours.type === 'urgent' ? '#fef2f2' : jours.type === 'ok' || jours.type === 'bientot' ? '#f0fdf4' : jours.type === 'debut' ? '#eff6ff' : 'var(--border-light)',
                                    }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                        {jours.type === 'expire' ? 'Statut' : 'Jours restants'}
                                      </div>
                                      <div style={{
                                        fontSize: 14, fontWeight: 700,
                                        color: jours.type === 'urgent' ? '#dc2626' : jours.type === 'ok' || jours.type === 'bientot' ? '#16a34a' : jours.type === 'debut' ? '#2563eb' : 'var(--text-primary)',
                                      }}>
                                        {jours.label}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
