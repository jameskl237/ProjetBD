import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import SelectField from '../../components/forms/SelectField'
import { elevesApi } from '../../api/eleves.api'
import { bulletinApi } from '../../api/evaluations.api'

const gradeBadgeStyle = (grade) => {
  if (!grade) return {}
  const g = grade.toUpperCase()
  if (g === 'A+' || g === 'TB') return { bg: '#dcfce7', color: '#166534', border: '#22c55e' }
  if (g === 'A' || g === 'B') return { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' }
  if (g === 'B+' || g === 'AB') return { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' }
  if (g === 'C+' || g === 'C') return { bg: '#fef3c7', color: '#92400e', border: '#f59e0b' }
  if (g === 'D') return { bg: '#ffedd5', color: '#9a3412', border: '#fb923c' }
  if (g === 'E' || g === 'P' || g === 'I') return { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' }
  return {}
}

export default function ParentNotes() {
  const [enfants, setEnfants] = useState([])
  const [matricule, setMatricule] = useState('')
  const [bulletin, setBulletin] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    elevesApi.list().then((rows) => {
      setEnfants(rows)
      if (rows.length === 1) setMatricule(String(rows[0].matricule))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!matricule) return
    setLoading(true); setError('')
    bulletinApi.get(matricule).then(setBulletin).catch((e) => setError(e.response?.data?.error || 'Erreur')).finally(() => setLoading(false))
  }, [matricule])

  const selectedEnfant = enfants.find((e) => String(e.matricule) === String(matricule))
  const isEnglish = selectedEnfant?.langue?.toUpperCase().includes('ANG') || selectedEnfant?.langue?.toUpperCase().includes('ENG')

  return (
    <div>
      <PageHeader title="Notes / Bulletins" subtitle="Résultats scolaires de votre enfant" />
      {enfants.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <SelectField label="Enfant" value={matricule} onChange={(e) => setMatricule(e.target.value)} options={enfants.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))} />
        </Card>
      )}
      <Alert tone="error">{error}</Alert>
      {loading && <Spinner />}
      {bulletin && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3>{bulletin.eleve.nom} {bulletin.eleve.prenom}</h3>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Matricule {bulletin.eleve.matriculeCode || bulletin.eleve.matricule}
                {selectedEnfant?.langue && <span style={{ marginLeft: 8 }}><Badge tone="info">{selectedEnfant.langue}</Badge></span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={bulletinApi.exportUrl(matricule) + '?format=pdf'} target="_blank" rel="noreferrer">
                <Button variant="secondary">📄 Télécharger (FR)</Button>
              </a>
              <a href={bulletinApi.exportUrl(matricule) + '?format=pdf&lang=en'} target="_blank" rel="noreferrer">
                <Button variant="secondary">🇬🇧 Download (EN)</Button>
              </a>
            </div>
          </div>

          {bulletin.appreciationGenerale && (
            <div style={{
              marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              background: bulletin.moyenneGenerale >= 10 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${bulletin.moyenneGenerale >= 10 ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <span style={{ fontWeight: 800, fontSize: 20, color: bulletin.moyenneGenerale >= 10 ? '#166534' : '#991b1b' }}>
                {bulletin.moyenneGenerale}/20
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: bulletin.moyenneGenerale >= 10 ? '#166534' : '#991b1b' }}>
                  {isEnglish ? 'General Average' : 'Moyenne générale'}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                  {(() => {
                    const gc = gradeBadgeStyle(bulletin.appreciationGenerale)
                    return gc.color ? (
                      <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: gc.bg, color: gc.color, border: `1px solid ${gc.border}` }}>
                        {bulletin.appreciationGenerale}
                      </span>
                    ) : (
                      <Badge tone="info">{bulletin.appreciationGenerale}</Badge>
                    )
                  })()}
                  {bulletin.appreciationGeneraleFr && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bulletin.appreciationGeneraleFr}</span>}
                  {bulletin.appreciationGeneraleEn && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {bulletin.appreciationGeneraleEn}</span>}
                </div>
              </div>
            </div>
          )}

          {bulletin.sessions.map((s, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{s.session} — Moyenne {s.moyenne}/20</div>
              {s.lignes.map((l, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13.5, gap: 8 }}>
                  <span style={{ flex: 1 }}>{l.cours}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {l.appreciationFr && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.appreciationFr}</span>}
                    <Badge tone={l.note >= 10 ? 'success' : 'danger'}>{l.note}/20</Badge>
                    {l.appreciation && (() => {
                      const gc = gradeBadgeStyle(l.appreciation)
                      return gc.color ? (
                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: gc.bg, color: gc.color, border: `1px solid ${gc.border}` }}>
                          {l.appreciation}
                        </span>
                      ) : null
                    })()}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
