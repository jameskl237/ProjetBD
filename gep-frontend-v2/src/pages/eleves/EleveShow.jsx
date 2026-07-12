import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const TABS = [
  { key: 'infos', label: 'Informations' },
  { key: 'notes', label: 'Notes' },
  { key: 'paiements', label: 'Paiements' },
]

export default function EleveShow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const [eleve, setEleve] = useState(null)
  const [tab, setTab] = useState('infos')
  const [tabData, setTabData] = useState({ notes: null, paiements: null })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    elevesApi.get(id).then(setEleve).catch((e) => setError(e.response?.data?.error || 'Élève introuvable')).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (tab === 'notes' && !tabData.notes) {
      elevesApi.notes(id).then((notes) => setTabData((d) => ({ ...d, notes }))).catch(() => {})
    }
    if (tab === 'paiements' && !tabData.paiements) {
      elevesApi.paiements(id).then((res) => setTabData((d) => ({ ...d, paiements: res }))).catch(() => {})
    }
  }, [tab, id, tabData])

  async function handleDelete() {
    if (!confirm('Confirmer la suppression de cet élève ?')) return
    await elevesApi.remove(id)
    navigate('/eleves')
  }

  if (loading) return <Spinner label="Chargement de la fiche élève…" />
  if (error) return <Alert tone="error">{error}</Alert>
  if (!eleve) return null

  const inscription = eleve.inscriptions?.[0]

  return (
    <div>
      <PageHeader
        title={`${eleve.nom} ${eleve.prenom}`}
        subtitle={`Matricule ${eleve.matricule} · ${inscription?.classe?.libelle || 'Non inscrit'}`}
        actions={roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE ? (
          <>
            <Link to={`/eleves/${id}/modifier`}><Button variant="secondary">Modifier</Button></Link>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </>
        ) : null}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
              background: tab === t.key ? 'var(--accent)' : 'var(--border-light)',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'infos' && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <Field label="Date de naissance" value={eleve.dateNaissance?.slice(0, 10)} />
            <Field label="Lieu de naissance" value={eleve.lieuNaissance} />
            <Field label="Ville de naissance" value={eleve.ville?.libelle} />
            <Field label="Sexe" value={eleve.sexe === 1 ? 'Masculin' : 'Féminin'} />
            <Field label="Langue" value={eleve.langue} />
            <Field label="Statut" value={<Badge tone={eleve.actif ? 'success' : 'neutral'}>{eleve.actif ? 'Actif' : 'Inactif'}</Badge>} />
            <Field label="Classe" value={inscription?.classe?.libelle} />
            <Field label="Année académique" value={inscription?.annee?.libelle} />
          </div>
          {eleve.tuteurs?.length > 0 && (
            <>
              <h3 style={{ marginTop: 24, marginBottom: 10 }}>Tuteur(s)</h3>
              {eleve.tuteurs.map((t, i) => (
                <div key={i} style={{ fontSize: 14, padding: '6px 0' }}>{t.tuteur?.nom} {t.tuteur?.prenom} — {t.tuteur?.mobile || t.tuteur?.email || '—'}</div>
              ))}
            </>
          )}
        </Card>
      )}

      {tab === 'notes' && (
        <Card>
          {!tabData.notes && <Spinner />}
          {tabData.notes?.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Aucune note enregistrée.</p>}
          {tabData.notes?.map((n) => (
            <div key={n.idEval} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
              <span>{n.cours?.libelle}</span>
              <Badge tone={n.note >= 10 ? 'success' : 'danger'}>{n.note}/20</Badge>
            </div>
          ))}
        </Card>
      )}

      {tab === 'paiements' && (
        <Card>
          {!tabData.paiements && <Spinner />}
          {tabData.paiements && (
            <>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Total versé : {Number(tabData.paiements.total).toLocaleString('fr-FR')} FCFA</div>
              {tabData.paiements.paiements.map((p) => (
                <div key={p.idPaiement} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span>{p.mode?.libelle || 'Paiement'} — {p.annee?.libelle || ''}</span>
                  <span style={{ fontWeight: 600 }}>{Number(p.montant).toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
            </>
          )}
        </Card>
      )}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14.5, marginTop: 3 }}>{value || '—'}</div>
    </div>
  )
}
