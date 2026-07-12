import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import { appreciationsApi } from '../../api/appreciations.api'

const gradeColors = {
  'A+': { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
  'A': { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
  'B+': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  'B': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  'B-': { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  'C+': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  'C': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  'D': { bg: '#ffedd5', text: '#9a3412', border: '#fb923c' },
  'E': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  'I': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  'TB': { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
  'B': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  'AB': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  'P': { bg: '#ffedd5', text: '#9a3412', border: '#fb923c' },
  'I': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
}

function getGradeColor(grade) {
  return gradeColors[grade] || { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' }
}

export default function ParentAppreciations() {
  const [appreciations, setAppreciations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    appreciationsApi.list()
      .then(setAppreciations)
      .catch((e) => setError(e.response?.data?.error || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...appreciations].sort((a, b) => (a.ordre || 0) - (b.ordre || 0))

  return (
    <div>
      <PageHeader
        title="Barème des appréciations"
        subtitle="Tableau officiel des notes et appréciations — Français / Anglais"
      />

      <Alert tone="error">{error}</Alert>

      {loading ? (
        <Spinner label="Chargement du barème..." />
      ) : sorted.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Aucune appréciation définie</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>L'administrateur n'a pas encore configuré le barème.</div>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 20, padding: '16px 20px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd' }}>
            <div style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.6 }}>
              <strong>Barème officiel</strong> — Ce tableau présente l'échelle d'appréciations utilisée pour l'évaluation des élèves.
              Chaque note est associée à une appréciation en français et en anglais.
            </div>
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border)' }}>Grade</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border)' }}>Plage de notes</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border)' }}>Appréciation (FR)</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border)' }}>Appréciation (EN)</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border)' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((a) => {
                    const gc = getGradeColor(a.grade)
                    return (
                      <tr key={a.idAppreciation} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block', padding: '4px 14px', borderRadius: 999,
                            background: gc.bg, color: gc.text, fontWeight: 800, fontSize: 14,
                            border: `1px solid ${gc.border}`,
                          }}>{a.grade}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontFamily: 'monospace' }}>
                          {a.noteMin} — {a.noteMax - 1}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{a.libelleFr || '—'}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{a.libelleEn || '—'}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12, maxWidth: 250 }}>
                          {a.descriptionFr || a.descriptionEn || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {sorted.slice(0, 5).map((a) => {
              const gc = getGradeColor(a.grade)
              return (
                <div key={a.idAppreciation} style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                  background: gc.bg, border: `1px solid ${gc.border}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: gc.text, marginBottom: 4 }}>{a.grade}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: gc.text }}>{a.libelleFr}</div>
                  <div style={{ fontSize: 11, color: gc.text, opacity: 0.8 }}>{a.libelleEn}</div>
                  <div style={{ fontSize: 11, color: gc.text, opacity: 0.7, marginTop: 2, fontFamily: 'monospace' }}>{a.noteMin}—{a.noteMax - 1}/20</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
