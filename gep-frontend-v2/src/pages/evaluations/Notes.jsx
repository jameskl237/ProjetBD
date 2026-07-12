import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import SelectField from '../../components/forms/SelectField'
import Spinner from '../../components/ui/Spinner'
import { useResource } from '../../hooks/useResource'
import { evaluationsApi, bulletinApi, evaluationValidationApi } from '../../api/evaluations.api'
import { coursApi } from '../../api/cours.api'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const TABS = [
  { key: 'consulter', label: 'Notes', roles: [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.ENSEIGNANT] },
  { key: 'valider', label: 'Valider les notes', roles: [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE] },
  { key: 'bulletins', label: 'Bulletins', roles: [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.ENSEIGNANT, ROLES.PARENT] },
]

export default function Notes() {
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const [tab, setTab] = useState('consulter')
  const visibleTabs = TABS.filter((t) => t.roles.includes(roleKey))

  return (
    <div>
      <PageHeader title="Notes" subtitle="Consultation, validation et bulletins" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {visibleTabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            background: tab === t.key ? 'var(--accent)' : 'var(--border-light)',
            color: tab === t.key ? '#fff' : 'var(--text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>
      {tab === 'consulter' && <ConsulterTab />}
      {tab === 'valider' && <ValiderTab />}
      {tab === 'bulletins' && <BulletinsTab />}
    </div>
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
          { key: 'valider', label: 'Statut', render: (r) => <Badge tone={r.valider ? 'success' : 'warning'}>{r.valider ? 'Validée' : 'En attente'}</Badge> },
        ]}
        rows={data}
        loading={loading}
        keyField="idEval"
        emptyLabel="Aucune évaluation enregistrée"
      />
    </Card>
  )
}

function ValiderTab() {
  const { data, loading, error, reload } = useResource(evaluationsApi)
  const [cours, setCours] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => { coursApi.list().then(setCours).catch(() => {}) }, [])

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 4000) }

  async function handleValider(id) {
    try {
      await evaluationValidationApi.valider(id)
      flash('Note validée avec succès')
      reload()
    } catch (err) { flash(err.response?.data?.error || 'Erreur lors de la validation') }
  }

  async function handleRejeter(id) {
    try {
      await evaluationValidationApi.rejeter(id)
      flash('Note rejetée')
      reload()
    } catch (err) { flash(err.response?.data?.error || 'Erreur lors du rejet') }
  }

  return (
    <div>
      <Alert tone="info">{message}</Alert>
      <Card style={{ padding: 0 }}>
        <Alert tone="error">{error}</Alert>
        <Table
          columns={[
            { key: 'matricule', label: 'Matricule élève' },
            { key: 'idCours', label: 'Cours', render: (r) => cours.find((c) => c.idCours === r.idCours)?.libelle || `#${r.idCours}` },
            { key: 'note', label: 'Note', render: (r) => <Badge tone={r.note >= 10 ? 'success' : 'danger'}>{r.note}/20</Badge> },
            { key: 'appreciation', label: 'Appréciation' },
            { key: 'valider', label: 'Statut', render: (r) => <Badge tone={r.valider ? 'success' : 'warning'}>{r.valider ? 'Validée' : 'En attente'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idEval"
          emptyLabel="Aucune note à valider"
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {!row.valider && <button onClick={() => handleValider(row.idEval)} style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>Valider</button>}
              {row.valider && <button onClick={() => handleRejeter(row.idEval)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Rejeter</button>}
            </div>
          )}
        />
      </Card>
    </div>
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
              <a href={bulletinApi.exportUrl(matricule) + '?format=pdf'} target="_blank" rel="noreferrer"><Button variant="secondary">Exporter PDF</Button></a>
              <a href={bulletinApi.exportUrl(matricule) + '?format=csv'} target="_blank" rel="noreferrer"><Button variant="secondary">Exporter CSV</Button></a>
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
