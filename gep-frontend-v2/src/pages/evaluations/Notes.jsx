import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import SelectField from '../../components/forms/SelectField'
import Spinner from '../../components/ui/Spinner'
import { evaluationsApi, sessionsApi, epreuvesApi, bulletinApi } from '../../api/evaluations.api'
import { coursApi, enseignantsApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'
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
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all .15s ease',
              border: tab === t.key ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
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
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mesCours, setMesCours] = useState([])
  const [idClasse, setIdClasse] = useState(() => searchParams.get('bclasse') || '')
  const [eleves, setEleves] = useState([])
  const [loadingEleves, setLoadingEleves] = useState(false)
  const [search, setSearch] = useState(() => searchParams.get('bsearch') || '')
  const [matricule, setMatricule] = useState('')
  const [bulletin, setBulletin] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateParams = useCallback((updates) => {
    setSearchParams((prev) => {
      Object.entries(updates).forEach(([k, v]) => { v ? prev.set(k, v) : prev.delete(k) })
      return prev
    })
  }, [setSearchParams])

  useEffect(() => {
    enseignantsApi.list().then((rows) => setMesCours(rows.filter((r) => r.idPers === user.id))).catch(() => {})
  }, [user])

  const classes = useMemo(() => {
    const map = new Map()
    mesCours.forEach((c) => {
      const cl = c.cours?.classe
      if (cl?.idClasse) map.set(cl.idClasse, cl.libelle)
    })
    return [...map.entries()].map(([id, libelle]) => ({ id, libelle }))
  }, [mesCours])

  useEffect(() => {
    if (!idClasse) { setEleves([]); setMatricule(''); setBulletin(null); return }
    setLoadingEleves(true)
    classesApi.eleves(Number(idClasse))
      .then(setEleves)
      .catch(() => setEleves([]))
      .finally(() => setLoadingEleves(false))
  }, [idClasse])

  const filteredEleves = useMemo(() => {
    if (!search.trim()) return eleves
    const q = search.toLowerCase()
    return eleves.filter((e) => `${e.nom || ''} ${e.prenom || ''}`.toLowerCase().includes(q) || String(e.matricule).includes(q))
  }, [eleves, search])

  async function handleLoadBulletin(el) {
    setMatricule(el.matricule)
    setLoading(true); setError(''); setBulletin(null)
    try {
      setBulletin(await bulletinApi.get(el.matricule))
    } catch (err) { setError(err.response?.data?.error || 'Élève introuvable') } finally { setLoading(false) }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <SelectField
            label="Classe"
            placeholder="Choisir une classe…"
            value={idClasse}
            onChange={(e) => { setIdClasse(e.target.value); setMatricule(''); setBulletin(null); setSearch(''); updateParams({ bclasse: e.target.value, bsearch: '' }) }}
            options={classes.map((c) => ({ value: c.id, label: c.libelle }))}
          />
          <div style={{ flex: '1 1 280px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Rechercher un élève</label>
            <input
              type="text"
              placeholder={idClasse ? 'Nom, prénom ou matricule…' : 'Sélectionnez d\'abord une classe'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setBulletin(null); setMatricule(''); updateParams({ bsearch: e.target.value }) }}
              disabled={!idClasse}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box',
                opacity: idClasse ? 1 : 0.5,
              }}
            />
          </div>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && <Spinner label="Chargement du bulletin…" />}

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
          </Card>

          {bulletin.sessions.map((s, i) => (
            <Card key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 16, background: 'var(--accent-light)',
                  }}>&#128203;</span>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.session}</div>
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 700, padding: '4px 14px', borderRadius: 999,
                  background: s.moyenne >= 10 ? 'var(--success-light)' : s.moyenne >= 8 ? 'var(--warning-light)' : 'var(--danger-light)',
                  color: s.moyenne >= 10 ? 'var(--success)' : s.moyenne >= 8 ? 'var(--warning)' : 'var(--danger)',
                }}>
                  Moy. {s.moyenne}/20
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Cours</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Coeff.</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.lignes.map((l, j) => (
                      <tr key={j} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={tdStyle}>{l.cours}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{l.coef}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontWeight: 700, fontSize: 12,
                            background: l.note >= 10 ? 'var(--success-light)' : l.note >= 8 ? 'var(--warning-light)' : 'var(--danger-light)',
                            color: l.note >= 10 ? 'var(--success)' : l.note >= 8 ? 'var(--warning)' : 'var(--danger)',
                          }}>{l.note}/20</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}

          <Card style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: bulletin.moyenneGenerale >= 10 ? 'var(--success-light)' : 'var(--danger-light)',
            border: `1.5px solid ${bulletin.moyenneGenerale >= 10 ? 'var(--success)' : 'var(--danger)'}30`,
          }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Moyenne générale</span>
            <span style={{
              fontWeight: 800, fontSize: 20,
              color: bulletin.moyenneGenerale >= 10 ? 'var(--success)' : 'var(--danger)',
            }}>
              {bulletin.moyenneGenerale}/20
            </span>
          </Card>
        </div>
      )}

      {idClasse && !bulletin && !loading && !error && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18, background: 'var(--accent-light)', flexShrink: 0,
            }}>&#128221;</span>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              Bulletins — {classes.find((c) => c.id === Number(idClasse))?.libelle || ''}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                {filteredEleves.length} élève{filteredEleves.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {loadingEleves ? <Spinner label="Chargement des élèves…" /> : filteredEleves.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Élève</th>
                    <th style={thStyle}>Matricule</th>
                    <th style={{ ...thStyle, textAlign: 'right', paddingRight: 16 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEleves.map((el, i) => (
                    <tr
                      key={el.matricule}
                      style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s ease', cursor: 'pointer' }}
                      onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-alt, #f9fafb)'}
                      onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                      onClick={() => handleLoadBulletin(el)}
                    >
                      <td style={tdStyle}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 6, display: 'inline-flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 11, fontWeight: 700,
                          background: 'var(--accent-light)', color: 'var(--accent)',
                        }}>{i + 1}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                            background: el.sexe === 2
                              ? 'linear-gradient(135deg, #fce7f3, #fbcfe8)'
                              : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                            color: el.sexe === 2 ? '#be185d' : '#1d4ed8',
                          }}>{(el.nom || '?')[0]}{(el.prenom || '?')[0]}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{el.nom || '—'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{el.prenom || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 6, background: 'var(--border-light)',
                        }}>{el.matricule}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 16 }}>
                        <Button
                          variant="secondary"
                          style={{ padding: '5px 12px', fontSize: 12 }}
                          onClick={(e) => { e.stopPropagation(); handleLoadBulletin(el) }}
                        >
                          Voir bulletin
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>&#128269;</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15 }}>
                {search ? 'Aucun élève ne correspond à la recherche' : 'Aucun élève dans cette classe'}
              </div>
            </div>
          )}
        </Card>
      )}

      {!idClasse && !bulletin && !loading && !error && (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>&#127979;</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
            Sélectionnez une classe
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Choisissez une classe pour afficher la liste des élèves et leurs bulletins
          </div>
        </Card>
      )}
    </div>
  )
}

const thStyle = { padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' }
