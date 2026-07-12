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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3>{bulletin.eleve.nom} {bulletin.eleve.prenom}</h3>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Matricule {bulletin.eleve.matriculeCode || bulletin.eleve.matricule}</div>
            </div>
            <a href={bulletinApi.exportUrl(matricule) + '?format=pdf'} target="_blank" rel="noreferrer"><Button variant="secondary">Télécharger le bulletin (PDF)</Button></a>
          </div>
          {bulletin.sessions.map((s, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{s.session} — Moyenne {s.moyenne}/20</div>
              {s.lignes.map((l, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13.5 }}>
                  <span>{l.cours}</span>
                  <Badge tone={l.note >= 10 ? 'success' : 'danger'}>{l.note}/20</Badge>
                </div>
              ))}
            </div>
          ))}
          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16 }}>Moyenne générale : {bulletin.moyenneGenerale}/20</div>
        </Card>
      )}
    </div>
  )
}
