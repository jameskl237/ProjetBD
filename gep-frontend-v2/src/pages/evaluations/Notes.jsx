import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import Spinner from '../../components/ui/Spinner'
import { useResource } from '../../hooks/useResource'
import { evaluationsApi, sessionsApi, epreuvesApi, bulletinApi } from '../../api/evaluations.api'
import { coursApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const TABS = [
  { key: 'saisie', label: 'Saisie', roles: [ROLES.ENSEIGNANT] },
  { key: 'consulter', label: 'Consulter', roles: [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT] },
  { key: 'bulletins', label: 'Bulletins', roles: [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT] },
]

export default function Notes() {
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const [tab, setTab] = useState(roleKey === ROLES.ENSEIGNANT ? 'saisie' : 'consulter')
  const visibleTabs = TABS.filter((t) => t.roles.includes(roleKey))

  return (
    <div>
      <PageHeader title="Notes" subtitle="Saisie et consultation des évaluations" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {visibleTabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            background: tab === t.key ? 'var(--accent)' : 'var(--border-light)',
            color: tab === t.key ? '#fff' : 'var(--text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>
      {tab === 'saisie' && <SaisieTab />}
      {tab === 'consulter' && <ConsulterTab />}
      {tab === 'bulletins' && <BulletinsTab />}
    </div>
  )
}

function SaisieTab() {
  const { user } = useAuth()
  const [cours, setCours] = useState([])
  const [sessions, setSessions] = useState([])
  const [epreuves, setEpreuves] = useState([])
  const [idCours, setIdCours] = useState('')
  const [idSession, setIdSession] = useState('')
  const [idEpreuve, setIdEpreuve] = useState('')
  const [eleves, setEleves] = useState([])
  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    coursApi.list().then(setCours).catch(() => {})
    sessionsApi.list().then(setSessions).catch(() => {})
    epreuvesApi.list().then(setEpreuves).catch(() => {})
  }, [])

  useEffect(() => {
    if (!idCours) { setEleves([]); return }
    const cr = cours.find((c) => c.idCours === Number(idCours))
    if (!cr) return
    classesApi.eleves(cr.idClasse).then(setEleves).catch(() => setEleves([]))
  }, [idCours, cours])

  async function handleSave(matricule) {
    const note = notes[matricule]
    if (note == null || note === '') return
    try {
      await evaluationsApi.create({ matricule, idEpreuve: Number(idEpreuve), idCours: Number(idCours), idSession: Number(idSession), note: Number(note) })
      setMessage(`Note enregistrée pour l'élève #${matricule}`)
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    }
  }

  return (
    <Card>
      <Alert tone="info">{message}</Alert>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <SelectField label="Cours" value={idCours} onChange={(e) => setIdCours(e.target.value)} options={cours.map((c) => ({ value: c.idCours, label: c.libelle }))} />
        <SelectField label="Session" value={idSession} onChange={(e) => setIdSession(e.target.value)} options={sessions.map((s) => ({ value: s.idSession, label: s.libelle }))} />
        <SelectField label="Épreuve" value={idEpreuve} onChange={(e) => setIdEpreuve(e.target.value)} options={epreuves.map((e) => ({ value: e.idEpreuve, label: e.libelle }))} />
      </div>
      {!idCours && <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Sélectionnez un cours pour afficher la liste des élèves.</p>}
      {idCours && eleves.length === 0 && <Spinner label="Chargement des élèves…" />}
      {eleves.map((e) => (
        <div key={e.matricule} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border-light)' }}>
          <span style={{ flex: 1, fontSize: 14 }}>{e.nom} {e.prenom}</span>
          <input
            type="number" min="0" max="20" step="0.25" placeholder="/20"
            value={notes[e.matricule] ?? ''}
            onChange={(ev) => setNotes((n) => ({ ...n, [e.matricule]: ev.target.value }))}
            style={{ width: 80, padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 13.5 }}
          />
          <Button
            variant="secondary"
            disabled={!idSession || !idEpreuve}
            onClick={() => handleSave(e.matricule)}
          >
            Enregistrer
          </Button>
        </div>
      ))}
    </Card>
  )
}

function ConsulterTab() {
  const { data, loading, error } = useResource(evaluationsApi)
  const [cours, setCours] = useState([])
  useEffect(() => { coursApi.list().then(setCours).catch(() => {}) }, [])

  return (
    <Card style={{ padding: 0 }}>
      <Alert tone="error">{error}</Alert>
      <Table
        columns={[
          { key: 'matricule', label: 'Matricule élève' },
          { key: 'idCours', label: 'Cours', render: (r) => cours.find((c) => c.idCours === r.idCours)?.libelle || `#${r.idCours}` },
          { key: 'note', label: 'Note', render: (r) => <Badge tone={r.note >= 10 ? 'success' : 'danger'}>{r.note}/20</Badge> },
          { key: 'appreciation', label: 'Appréciation' },
        ]}
        rows={data}
        loading={loading}
        keyField="idEval"
        emptyLabel="Aucune évaluation enregistrée"
      />
    </Card>
  )
}

function BulletinsTab() {
  const [matricule, setMatricule] = useState('')
  const [eleves, setEleves] = useState([])
  const [bulletin, setBulletin] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { elevesApi.list().then(setEleves).catch(() => {}) }, [])

  async function handleLoad() {
    if (!matricule) return
    setLoading(true); setError(''); setBulletin(null)
    try {
      setBulletin(await bulletinApi.get(matricule))
    } catch (err) { setError(err.response?.data?.error || 'Élève introuvable') } finally { setLoading(false) }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <SelectField label="Élève" value={matricule} onChange={(e) => setMatricule(e.target.value)} className="grow" style={{ flex: 1 }}
            options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom} (#${e.matricule})` }))} />
          <Button onClick={handleLoad}>Afficher le bulletin</Button>
        </div>
        <Alert tone="error">{error}</Alert>
      </Card>

      {loading && <Spinner label="Génération du bulletin…" />}

      {bulletin && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3>{bulletin.eleve.nom} {bulletin.eleve.prenom}</h3>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Matricule {bulletin.eleve.matricule}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={bulletinApi.exportUrl(matricule) + '?format=pdf'} target="_blank" rel="noreferrer"><Button variant="secondary">Export PDF</Button></a>
              <a href={bulletinApi.exportUrl(matricule) + '?format=csv'} target="_blank" rel="noreferrer"><Button variant="secondary">Export CSV</Button></a>
            </div>
          </div>

          {bulletin.sessions.map((s, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{s.session} — Moyenne {s.moyenne}/20</div>
              {s.lignes.map((l, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13.5 }}>
                  <span>{l.cours} (coef. {l.coef})</span>
                  <Badge tone={l.note >= 10 ? 'success' : 'danger'}>{l.note}/20</Badge>
                </div>
              ))}
            </div>
          ))}

          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, marginTop: 8 }}>
            Moyenne générale : {bulletin.moyenneGenerale}/20
          </div>
        </Card>
      )}
    </div>
  )
}
