import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { parentsApi } from '../../api/parents.api'
import { personnesApi } from '../../api/personnes.api'
import { elevesApi } from '../../api/eleves.api'

import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const ACCENT = 'var(--accent)'

const AVATAR_HUES = [30, 170, 210, 330, 260, 350, 190, 280]

function getInitials(p) {
  if (!p) return '?'
  return (p.nom || '').charAt(0).toUpperCase() + (p.prenom || '').charAt(0).toUpperCase()
}

export default function Parents() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useResource(parentsApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const canWrite = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE
  const [personnes, setPersonnes] = useState([])
  const [eleves, setEleves] = useState([])
  const [modal, setModal] = useState(null)
  const [compteModal, setCompteModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  function loadPersonnes() {
    personnesApi.list().then((rows) => setPersonnes(rows.filter((p) => p.typePersonne === 2))).catch(() => {})
  }

  useEffect(() => {
    loadPersonnes()
    elevesApi.list().then(setEleves).catch(() => {})
  }, [])

  const uniqueParents = useMemo(() => {
    if (!data) return []
    const map = new Map()
    data.forEach((row) => {
      const id = row.idPers
      if (!id || !row.personne) return
      if (!map.has(id)) {
        map.set(id, {
          idPers: id,
          personne: row.personne,
          enfants: [],
        })
      }
      if (row.eleve) {
        map.get(id).enfants.push(row.eleve)
      }
    })
    return [...map.values()]
  }, [data])

  const stats = useMemo(() => {
    const total = uniqueParents.length
    const totalEnfants = uniqueParents.reduce((s, p) => s + p.enfants.length, 0)
    const sansEnfant = uniqueParents.filter((p) => p.enfants.length === 0).length
    return { total, totalEnfants, sansEnfant }
  }, [uniqueParents])

  const filtered = useMemo(() => {
    let list = uniqueParents
    if (filterStatut === 'avec') list = list.filter((p) => p.enfants.length > 0)
    if (filterStatut === 'sans') list = list.filter((p) => p.enfants.length === 0)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) =>
        p.personne?.nom?.toLowerCase().includes(q) ||
        p.personne?.prenom?.toLowerCase().includes(q) ||
        p.personne?.email?.toLowerCase().includes(q) ||
        p.personne?.mobile?.toLowerCase().includes(q) ||
        p.personne?.phone?.toLowerCase().includes(q) ||
        p.enfants.some((e) => `${e.nom} ${e.prenom}`.toLowerCase().includes(q))
      )
    }
    return list
  }, [uniqueParents, filterStatut, search])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      await parentsApi.create({ idPers: Number(modal.values.idPers), matricule: Number(modal.values.matricule) })
      setModal(null)
      reload()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de la liaison')
    }
  }

  async function handleCreateCompte(e) {
    e.preventDefault()
    setFormError('')
    try {
      const v = compteModal.values
      await personnesApi.create({
        login: v.login, password: v.password, typePersonne: 2,
        nom: v.nom, prenom: v.prenom || undefined,
        email: v.email || undefined, mobile: v.mobile || undefined,
      })
      setCompteModal(null)
      loadPersonnes()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de la création du compte')
    }
  }

  async function handleEditCompte(e) {
    e.preventDefault()
    setFormError('')
    try {
      const v = compteModal.values
      const payload = { nom: v.nom, prenom: v.prenom || undefined, email: v.email || undefined, mobile: v.mobile || undefined }
      if (v.password) payload.password = v.password
      await personnesApi.update(v.idPers, payload)
      setCompteModal(null)
      loadPersonnes()
      reload()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de la modification')
    }
  }

  if (loading) return <Spinner label="Chargement des parents…" />

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: ACCENT, marginBottom: 6 }}>
            Communauté
          </div>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Parents
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 480 }}>
            Liste des parents et leurs enfants rattachés à l'école.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canWrite && (
            <Button onClick={() => { setCompteModal({ mode: 'create', values: { login: '', password: '', nom: '', prenom: '', email: '', mobile: '' } }); setFormError('') }}>
              <span style={{ marginRight: 6 }}>＋</span> Nouveau compte parent
            </Button>
          )}
          <Button onClick={() => { setModal({ values: { idPers: '', matricule: '' } }); setFormError('') }}>
            <span style={{ marginRight: 6 }}>＋</span> Lier un parent
          </Button>
        </div>
      </div>

      <Alert tone="error">{error}</Alert>

      {personnes.length === 0 && (
        <Alert tone="info">Aucun compte parent disponible — créez-en un avec le bouton "Nouveau compte parent" ci-dessus.</Alert>
      )}

      {/* ── Folder panel ── */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '0 var(--radius, 12px) var(--radius, 12px) var(--radius, 12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '26px 28px 30px',
        borderTop: `3px solid ${ACCENT}`,
        minHeight: 300,
      }}>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
          <StatBlock accent="var(--text-primary)" label="Total parents" value={stats.total} />
          <StatBlock accent="var(--info)" label="Total enfants rattachés" value={stats.totalEnfants} />
          {stats.sansEnfant > 0 && (
            <StatBlock accent="#f59e0b" label="Sans enfant rattaché" value={stats.sansEnfant} />
          )}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingBottom: 20, marginBottom: 22, borderBottom: '2px dashed var(--border)' }}>
          <SelectField
            placeholder="Tous les statuts"
            options={[
              { value: 'avec', label: 'Avec enfants' },
              { value: 'sans', label: 'Sans enfant' },
            ]}
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            style={{ width: 170, marginBottom: 0 }}
          />
          <span style={{
            fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)',
            background: 'var(--border-light)', padding: '5px 12px', borderRadius: 20,
          }}>
            {filtered.length} parent{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={{ position: 'relative', marginLeft: 'auto', flex: '1 1 220px' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="search"
              placeholder="Rechercher par nom, email, enfant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                border: '1px solid var(--border)', background: 'var(--card-bg)',
                borderRadius: 8, fontSize: 13.5, color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {[
                  { label: 'Matricule', width: '10%' },
                  { label: 'Nom & Prénom', width: '22%' },
                  { label: 'Email', width: '18%' },
                  { label: 'Téléphone', width: '12%' },
                  { label: 'Adresse', width: '14%' },
                  { label: 'Enfants', width: '8%' },
                  { label: 'Statut', width: '7%' },
                  { label: '', width: '9%' },
                ].map((col, i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid var(--border)',
                    color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: 0.5, width: col.width, whiteSpace: 'nowrap',
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👪</div>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      {search || filterStatut ? 'Aucun parent ne correspond à ces critères.' : 'Aucun parent enregistré.'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map((p) => {
                const pers = p.personne
                const hue = AVATAR_HUES[(p.idPers || 0) % AVATAR_HUES.length]
                return (
                  <tr
                    key={p.idPers}
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s', cursor: 'pointer' }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/parents/${p.idPers}`)}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--border-light)', padding: '3px 8px', borderRadius: 6 }}>
                        PAR-{String(p.idPers).padStart(3, '0')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: `hsl(${hue}, 55%, 42%)`,
                          color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font)',
                        }}>
                          {getInitials(pers)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{pers ? `${pers.nom} ${pers.prenom}` : '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {pers?.email || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {pers?.mobile || pers?.phone || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {pers?.lieuNaissance || '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                        background: p.enfants.length > 0 ? 'rgba(37,99,235,0.1)' : 'var(--border-light)',
                        color: p.enfants.length > 0 ? '#2563eb' : 'var(--text-muted)',
                      }}>
                        {p.enfants.length}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge tone={pers?.actif ? 'success' : 'neutral'}>{pers?.actif ? 'Actif' : 'Inactif'}</Badge>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {canWrite && (
                        <button
                          onClick={(ev) => { ev.stopPropagation(); setCompteModal({ mode: 'edit', values: { idPers: p.idPers, nom: pers?.nom || '', prenom: pers?.prenom || '', email: pers?.email || '', mobile: pers?.mobile || '', password: '' } }); setFormError('') }}
                          style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', padding: '4px 10px', borderRadius: 6, background: 'var(--accent-light)' }}
                        >Compte</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      <Modal open={!!modal} title="Lier un parent à un élève" onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Compte parent" required value={modal.values.idPers}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idPers: e.target.value } }))}
              options={personnes.map((p) => ({ value: p.idPers, label: `${p.nom} ${p.prenom}` }))} />
            <SelectField label="Élève" required value={modal.values.matricule}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, matricule: e.target.value } }))}
              options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Lier</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Create compte parent modal ── */}
      <Modal open={!!compteModal?.mode === 'create'} title="Nouveau compte parent" onClose={() => setCompteModal(null)}>
        {compteModal?.mode === 'create' && (
          <form onSubmit={handleCreateCompte}>
            <Alert tone="error">{formError}</Alert>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Nom" required value={compteModal.values.nom}
                onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, nom: e.target.value } }))} />
              <InputField label="Prénom" value={compteModal.values.prenom}
                onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, prenom: e.target.value } }))} />
            </div>
            <InputField label="Identifiant de connexion" required value={compteModal.values.login}
              onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, login: e.target.value } }))} />
            <InputField label="Mot de passe" type="password" required value={compteModal.values.password}
              onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, password: e.target.value } }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Email" type="email" value={compteModal.values.email}
                onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, email: e.target.value } }))} />
              <InputField label="Mobile" value={compteModal.values.mobile}
                onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, mobile: e.target.value } }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setCompteModal(null)}>Annuler</Button>
              <Button type="submit">Créer le compte</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Edit compte modal ── */}
      <Modal open={!!compteModal?.mode === 'edit'} title="Modifier le compte" onClose={() => setCompteModal(null)}>
        {compteModal?.mode === 'edit' && (
          <form onSubmit={handleEditCompte}>
            <Alert tone="error">{formError}</Alert>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Nom" required value={compteModal.values.nom}
                onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, nom: e.target.value } }))} />
              <InputField label="Prénom" value={compteModal.values.prenom}
                onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, prenom: e.target.value } }))} />
            </div>
            <InputField label="Nouveau mot de passe (optionnel)" type="password" value={compteModal.values.password}
              onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, password: e.target.value } }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Email" type="email" value={compteModal.values.email}
                onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, email: e.target.value } }))} />
              <InputField label="Mobile" value={compteModal.values.mobile}
                onChange={(e) => setCompteModal((m) => ({ ...m, values: { ...m.values, mobile: e.target.value } }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setCompteModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function StatBlock({ accent, label, value }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 10,
      padding: '15px 16px', position: 'relative', overflow: 'hidden',
      background: 'var(--card-bg)',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 6px', letterSpacing: 0.2 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 25, margin: 0 }}>{value}</p>
    </div>
  )
}
