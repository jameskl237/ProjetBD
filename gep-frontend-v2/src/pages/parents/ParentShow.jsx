import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useResource } from '../../hooks/useResource'
import { parentsApi } from '../../api/parents.api'

const ACCENT = 'var(--accent)'

const AVATAR_HUES = [30, 170, 210, 330, 260, 350, 190, 280]

function getInitials(p) {
  if (!p) return '?'
  return (p.nom || '').charAt(0).toUpperCase() + (p.prenom || '').charAt(0).toUpperCase()
}

export default function ParentShow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useResource(parentsApi)

  const idPers = Number(id)

  const links = useMemo(() => {
    if (!data) return []
    return data.filter((r) => r.idPers === idPers)
  }, [data, idPers])

  const personne = links[0]?.personne || null

  const enfants = useMemo(() => {
    const map = new Map()
    links.forEach((r) => {
      if (r.eleve && !map.has(r.eleve.matricule)) {
        map.set(r.eleve.matricule, r.eleve)
      }
    })
    return [...map.values()]
  }, [links])

  if (loading) return <Spinner label="Chargement de la fiche parent…" />
  if (error) return <Alert tone="error">{error}</Alert>
  if (!personne) return <Alert tone="error">Parent introuvable.</Alert>

  const hue = AVATAR_HUES[(idPers || 0) % AVATAR_HUES.length]

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: ACCENT, marginBottom: 6 }}>
            Fiche parent
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
                  PAR-{String(idPers).padStart(3, '0')}
                </span>
                <Badge tone={personne.actif ? 'success' : 'neutral'}>{personne.actif ? 'Actif' : 'Inactif'}</Badge>
              </div>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/parents')}>
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
        <InfoCard icon="🎂" label="Date de naissance" value={personne.dateNaissance || '—'} />
        <InfoCard icon="📍" label="Lieu de naissance" value={personne.lieuNaissance || '—'} />
        <InfoCard icon="👧" label="Enfants rattachés" value={enfants.length} accent />
      </div>

      {/* ── Liste des enfants ── */}
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
          Enfants rattachés ({enfants.length})
        </h3>
        {enfants.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 24 }}>
            Aucun enfant rattaché à ce parent.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Matricule', 'Nom & Prénom', 'Date de naissance', 'Lieu', 'Sexe', 'Langue'].map((label, i) => (
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
                {enfants.map((e) => (
                  <tr key={e.matricule} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--border-light)', padding: '3px 8px', borderRadius: 6 }}>
                        {e.matriculeCode || `E-${String(e.matricule).padStart(4, '0')}`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{e.nom} {e.prenom}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>{e.dateNaissance || '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>{e.lieuNaissance || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 13 }}>{e.sexe === 1 ? 'M' : e.sexe === 2 ? 'F' : '—'}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>{e.langue || '—'}</td>
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
