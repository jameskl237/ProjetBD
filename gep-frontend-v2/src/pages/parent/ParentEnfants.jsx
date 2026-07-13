import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { elevesApi } from '../../api/eleves.api'
import { bulletinApi } from '../../api/evaluations.api'
import { paiementsExtra } from '../../api/paiements.api'
import client from '../../api/client'

export default function ParentEnfants() {
  const [enfants, setEnfants] = useState(null)
  const [details, setDetails] = useState({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const children = await elevesApi.list()
        if (cancelled) return
        setEnfants(children)

        const detailMap = {}
        await Promise.allSettled(
          (children || []).map(async (e) => {
            const [bulletin, paiements] = await Promise.allSettled([
              bulletinApi.get(e.matricule),
              paiementsExtra.parEleve(e.matricule),
            ])
            detailMap[e.matricule] = {
              bulletin: bulletin.status === 'fulfilled' ? bulletin.value : null,
              paiements: paiements.status === 'fulfilled' ? (paiements.value?.paiements || []) : [],
              totalPaye: paiements.status === 'fulfilled' ? (paiements.value?.total || 0) : 0,
            }
          })
        )
        if (!cancelled) setDetails(detailMap)
      } catch {
        if (!cancelled) setEnfants([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (enfants === null) return <div><PageHeader title="Mes enfants" subtitle="Toutes les informations" /><Spinner label="Chargement…" /></div>

  return (
    <div>
      <PageHeader
        title="Mes enfants"
        subtitle={`${enfants.length} enfant(s) lié(s) à votre compte`}
        actions={<Link to="/parent" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>&larr; Retour au tableau de bord</Link>}
      />

      {enfants.length === 0 && <Card>Aucun enfant lié à votre compte.</Card>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {enfants.map((e) => {
          const initials = `${(e.nom || '')[0] || ''}${(e.prenom || '')[0] || ''}`.toUpperCase()
          const hasPhoto = !!e.photoURL
          const sexeLabel = e.sexe === 1 ? 'Masculin' : e.sexe === 0 ? 'Féminin' : '—'
          const insc = e.inscriptions?.[0]
          const det = details[e.matricule]
          const bulletin = det?.bulletin

          return (
            <Card key={e.matricule} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 24, padding: '24px 28px', flexWrap: 'wrap' }}>
                {/* Avatar + infos principales */}
                <div style={{ display: 'flex', gap: 18, minWidth: 300, flex: 1 }}>
                  {hasPhoto ? (
                    <img src={e.photoURL} alt={e.nom}
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--accent), #0f766e)',
                      color: '#fff', fontSize: 22, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{initials}</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{e.nom} {e.prenom}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Badge tone={e.actif ? 'success' : 'neutral'}>{e.actif ? 'Actif' : 'Inactif'}</Badge>
                      <Badge tone="info">{insc?.classe?.libelle || 'Non inscrit'}</Badge>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13 }}>
                      <span>Matricule : <strong style={{ fontFamily: 'monospace' }}>{e.matriculeCode || e.matricule}</strong></span>
                      <span>Né(e) le : {e.dateNaissance?.slice(0, 10) || '—'}</span>
                      <span>Lieu de naissance : {e.lieuNaissance || '—'}</span>
                      <span>Sexe : {sexeLabel}</span>
                      <span>Langue : {e.langue || '—'}</span>
                      <span>Ville : {e.ville?.nom || '—'}</span>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <a
                        href={`${client.defaults.baseURL}/eleves/${e.matricule}/badge`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 16px', borderRadius: 'var(--radius-sm)',
                          background: 'var(--accent)', color: '#fff',
                          fontSize: 12, fontWeight: 700, textDecoration: 'none',
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={(ev) => ev.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={(ev) => ev.currentTarget.style.opacity = '1'}
                      >
                        🪪 Générer le badge
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bulletin / Résultats */}
                <div style={{ minWidth: 240, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--accent)' }}>Résultats scolaires</div>
                  {bulletin ? (
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
                        Moyenne générale : {bulletin.moyenneGenerale?.toFixed(1) || '—'}/20
                      </div>
                      {bulletin.appreciationGenerale && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                          Appréciation : {bulletin.appreciationGenerale}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(bulletin.sessions || []).map((s, i) => (
                          <div key={i} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{s.session}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Moyenne : {s.moyenne?.toFixed(1) || '—'}/20</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                              {(s.lignes || []).map((l, j) => (
                                <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                                  {l.cours} : {l.note}/20
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun bulletin disponible</div>
                  )}
                </div>

                {/* Paiements */}
                <div style={{ minWidth: 220, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--danger)' }}>Paiements</div>
                  {det?.paiements?.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>
                        Total payé : {Number(det.totalPaye).toLocaleString('fr-FR')} FCFA
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {det.paiements.slice(0, 5).map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                            <span>{p.datePaie?.slice(0, 10) || '—'}</span>
                            <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{Number(p.montant).toLocaleString('fr-FR')} F</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun paiement enregistré</div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
