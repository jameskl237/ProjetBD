import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useResource } from '../../hooks/useResource'
import { enseignantsApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'

const ACCENT = 'var(--accent)'

const SECTION_COLORS = {
  Anglophone: { bg: 'rgba(225,29,72,0.08)', text: 'var(--danger)' },
  Francophone: { bg: 'rgba(6,182,212,0.08)', text: 'var(--info)' },
  Bilingue: { bg: 'rgba(5,150,105,0.08)', text: 'var(--success)' },
  Bilingual: { bg: 'rgba(5,150,105,0.08)', text: 'var(--success)' },
}

const AVATAR_HUES = [210, 260, 330, 170, 30, 350, 190, 280]

function getInitials(p) {
  if (!p) return '?'
  return (p.nom || '').charAt(0).toUpperCase() + (p.prenom || '').charAt(0).toUpperCase()
}

export default function EnseignantShow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useResource(enseignantsApi)
  const { data: classes } = useResource(classesApi)

  const idPers = Number(id)

  const assignments = useMemo(() => {
    if (!data) return []
    return data.filter((e) => e.idPers === idPers)
  }, [data, idPers])

  const personne = assignments[0]?.personne || null
  const actif = assignments[0]?.Actif ?? true

  const cours = useMemo(() => {
    return assignments.filter((e) => e.cours).map((e) => ({
      ...e.cours,
      idEnseignant: e.idEnseignant,
      salle: e.salle,
    }))
  }, [assignments])

  const sections = useMemo(() => {
    const set = new Set(cours.map((c) => c.section).filter(Boolean))
    return [...set].sort()
  }, [cours])

  const titulaireClasse = useMemo(() => {
    if (!classes) return null
    return classes.find((cl) => cl.titulaire?.idPers === idPers) || null
  }, [classes, idPers])

  const salles = useMemo(() => {
    const map = new Map()
    assignments.filter((e) => e.salle).forEach((e) => {
      if (!map.has(e.salle.idSalle)) map.set(e.salle.idSalle, e.salle)
    })
    return [...map.values()]
  }, [assignments])

  if (loading) return <Spinner label="Chargement de la fiche enseignant…" />
  if (error) return <Alert tone="error">{error}</Alert>
  if (!personne) return <Alert tone="error">Enseignant introuvable.</Alert>

  const hue = AVATAR_HUES[(idPers || 0) % AVATAR_HUES.length]

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: ACCENT, marginBottom: 6 }}>
            Fiche enseignant
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `hsl(${hue}, 55%, 42%)`,
              color: '#fff', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font)',
            }}>
              {getInitials(personne)}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {personne.nom} {personne.prenom}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--border-light)', padding: '3px 10px', borderRadius: 6 }}>
                  ENS-{String(idPers).padStart(3, '0')}
                </span>
                <Badge tone={actif ? 'success' : 'neutral'}>{actif ? 'Actif' : 'Inactif'}</Badge>
              </div>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/enseignants')}>
          ← Retour
        </Button>
      </div>

      {/* ── Info cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 22 }}>
        <InfoCard icon="📧" label="Email" value={personne.email || '—'} />
        <InfoCard icon="📱" label="Mobile" value={personne.mobile || '—'} />
        <InfoCard icon="📞" label="Téléphone" value={personne.phone || '—'} />
        <InfoCard icon="🔑" label="Identifiant" value={personne.login || '—'} />
        <InfoCard icon="🌐" label="Langue" value={personne.langue || 'fr'} />
        {titulaireClasse && (
          <InfoCard icon="🏫" label="Classe titulaire" value={titulaireClasse.libelle} accent />
        )}
      </div>

      {/* ── Sections enseignées ── */}
      {sections.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <h3 style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
            Section(s) enseignée(s)
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {sections.map((s) => (
              <span key={s} style={{
                fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20,
                background: SECTION_COLORS[s]?.bg || 'var(--border-light)',
                color: SECTION_COLORS[s]?.text || 'var(--text-secondary)',
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Cours assignés ── */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '0 var(--radius, 12px) var(--radius, 12px) var(--radius, 12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '26px 28px 30px',
        borderTop: `3px solid ${ACCENT}`,
        marginTop: 22,
        minHeight: 120,
      }}>
        <h3 style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
          Cours assignés ({cours.length})
        </h3>
        {cours.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 24 }}>
            Aucun cours assigné.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Cours', 'Classe', 'Section', 'Coefficient', 'Heures', 'Salle'].map((label, i) => (
                    <th key={i} style={{
                      textAlign: 'left', padding: '10px 14px', borderBottom: '2px solid var(--border)',
                      color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: 0.5, whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cours.map((c) => (
                  <tr key={c.idEnseignant} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{c.libelle || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.classe?.libelle ? (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent)' }}>
                          {c.classe.libelle}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.section ? (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: SECTION_COLORS[c.section]?.bg || 'var(--border-light)',
                          color: SECTION_COLORS[c.section]?.text || 'var(--text-secondary)',
                        }}>
                          {c.section}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'monospace' }}>{c.coefficient || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{c.heures ? `${c.heures}h` : '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{c.salle?.libelle || '—'}</td>
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

function InfoCard({ icon, label, value, accent }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 10,
      padding: '16px 18px', position: 'relative', overflow: 'hidden',
      background: 'var(--card-bg)',
    }}>
      {accent && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ACCENT }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: 0.2 }}>{label}</span>
      </div>
      <div style={{ fontFamily: accent ? 'var(--font)' : 'inherit', fontWeight: accent ? 700 : 400, fontSize: 15, color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}
