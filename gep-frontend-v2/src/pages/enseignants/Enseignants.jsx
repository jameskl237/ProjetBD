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
import { enseignantsApi, coursApi, titulairesApi } from '../../api/cours.api'
import { personnesApi } from '../../api/personnes.api'
import { sallesApi, classesApi } from '../../api/classes.api'

const ACCENT = 'var(--accent)'

const SECTION_COLORS = {
  Anglophone: { bg: 'rgba(225,29,72,0.08)', text: 'var(--danger)' },
  Francophone: { bg: 'rgba(6,182,212,0.08)', text: 'var(--info)' },
  Bilingue: { bg: 'rgba(5,150,105,0.08)', text: 'var(--success)' },
  Bilingual: { bg: 'rgba(5,150,105,0.08)', text: 'var(--success)' },
}

function getInitials(p) {
  if (!p) return '?'
  return (p.nom || '').charAt(0).toUpperCase() + (p.prenom || '').charAt(0).toUpperCase()
}

const AVATAR_HUES = [210, 260, 330, 170, 30, 350, 190, 280]

export default function Enseignants() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useResource(enseignantsApi)
  const [personnes, setPersonnes] = useState([])
  const [cours, setCours] = useState([])
  const [salles, setSalles] = useState([])
  const [classes, setClasses] = useState([])
  const [modal, setModal] = useState(null)
  const [compteModal, setCompteModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  function loadPersonnes() {
    personnesApi.list().then((rows) => setPersonnes(rows.filter((p) => p.typePersonne === 1))).catch(() => {})
  }

  useEffect(() => {
    loadPersonnes()
    coursApi.list().then(setCours).catch(() => {})
    sallesApi.list().then(setSalles).catch(() => {})
    classesApi.list().then(setClasses).catch(() => {})
  }, [])

  const sections = useMemo(() => {
    const set = new Set(cours.map((c) => c.section).filter(Boolean))
    return [...set].sort()
  }, [cours])

  const uniqueEnseignants = useMemo(() => {
    if (!data) return []
    const map = new Map()
    data.forEach((e) => {
      const id = e.idPers
      if (!id || !e.personne) return
      if (!map.has(id)) {
        const titulaireClasse = classes.find((cl) => cl.titulaire?.idPers === id)
        map.set(id, {
          idPers: id,
          personne: e.personne,
          actif: e.Actif,
          cours: [],
          sections: new Set(),
          titulaireClasse: titulaireClasse || null,
          salles: [],
        })
      }
      const ens = map.get(id)
      if (e.cours) {
        ens.cours.push(e.cours)
        if (e.cours.section) ens.sections.add(e.cours.section)
      }
      if (e.salle && !ens.salles.some((s) => s.idSalle === e.salle.idSalle)) {
        ens.salles.push(e.salle)
      }
    })
    return [...map.values()].map((e) => ({ ...e, sections: [...e.sections] }))
  }, [data, classes])

  const stats = useMemo(() => {
    const total = uniqueEnseignants.length
    const actifs = uniqueEnseignants.filter((e) => e.actif).length
    return { total, actifs, inactifs: total - actifs }
  }, [uniqueEnseignants])

  const filtered = useMemo(() => {
    let list = uniqueEnseignants
    if (filterSection) list = list.filter((e) => e.sections.includes(filterSection))
    if (filterStatut === 'actif') list = list.filter((e) => e.actif)
    if (filterStatut === 'inactif') list = list.filter((e) => !e.actif)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((e) =>
        e.personne?.nom?.toLowerCase().includes(q) ||
        e.personne?.prenom?.toLowerCase().includes(q) ||
        e.personne?.email?.toLowerCase().includes(q) ||
        e.personne?.mobile?.toLowerCase().includes(q) ||
        e.titulaireClasse?.libelle?.toLowerCase().includes(q) ||
        e.sections.some((s) => s.toLowerCase().includes(q))
      )
    }
    return list
  }, [uniqueEnseignants, filterSection, filterStatut, search])

  function openCreate() {
    setModal({
      mode: 'create',
      isNew: false,
      values: {
        idPers: '', idCours: '', idSalle: '',
        login: '', password: '', nom: '', prenom: '', email: '', mobile: '',
      },
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      let idPers = Number(modal.values.idPers)

      if (modal.isNew) {
        const v = modal.values
        if (!v.nom || !v.login || !v.password) {
          setFormError('Nom, identifiant et mot de passe sont requis pour un nouvel enseignant')
          return
        }
        await personnesApi.create({
          login: v.login,
          password: v.password,
          typePersonne: 1,
          nom: v.nom,
          prenom: v.prenom || undefined,
          email: v.email || undefined,
          mobile: v.mobile || undefined,
        })
        const newPersonnes = await personnesApi.list()
        const filteredP = newPersonnes.filter((p) => p.typePersonne === 1)
        setPersonnes(filteredP)
        const latest = filteredP[filteredP.length - 1]
        idPers = latest.idPers
      }

      await enseignantsApi.create({ idPers, idCours: Number(modal.values.idCours) })

      if (modal.values.idSalle) {
        await titulairesApi.create({ idPers, idSalle: Number(modal.values.idSalle) })
      }

      setModal(null)
      reload()
    } catch (err) {
      setFormError(err.response?.data?.error || "Erreur lors de l'inscription")
    }
  }

  async function handleCompteSubmit(e) {
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
      setFormError(err.response?.data?.error || 'Erreur lors de la modification du compte')
    }
  }

  if (loading) return <Spinner label="Chargement des enseignants…" />

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: ACCENT, marginBottom: 6 }}>
            Personnel
          </div>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Enseignants
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 480 }}>
            Liste des enseignants et leurs affectations.
          </p>
        </div>
        <Button onClick={openCreate}>
          <span style={{ marginRight: 6 }}>＋</span> Inscrire un enseignant
        </Button>
      </div>

      <Alert tone="error">{error}</Alert>

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
          <StatBlock accent="var(--text-primary)" label="Total enseignants" value={stats.total} />
          <StatBlock accent="var(--success)" label="Actifs" value={stats.actifs} />
          <StatBlock accent="var(--danger)" label="Inactifs" value={stats.inactifs} />
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingBottom: 20, marginBottom: 22, borderBottom: '2px dashed var(--border)' }}>
          <SelectField
            placeholder="Toutes les sections"
            options={sections.map((s) => ({ value: s, label: s }))}
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            style={{ width: 180, marginBottom: 0 }}
          />
          <SelectField
            placeholder="Tous les statuts"
            options={[
              { value: 'actif', label: 'Actif' },
              { value: 'inactif', label: 'Inactif' },
            ]}
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            style={{ width: 170, marginBottom: 0 }}
          />
          <span style={{
            fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)',
            background: 'var(--border-light)', padding: '5px 12px', borderRadius: 20,
          }}>
            {filtered.length} enseignant{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={{ position: 'relative', marginLeft: 'auto', flex: '1 1 220px' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="search"
              placeholder="Rechercher par nom, email, section…"
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
                  { label: 'Classe (titulaire)', width: '14%' },
                  { label: 'Section(s)', width: '10%' },
                  { label: 'Statut', width: '7%' },
                  { label: '', width: '7%' },
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
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👩‍🏫</div>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      {search || filterSection || filterStatut ? 'Aucun enseignant ne correspond à ces critères.' : 'Aucun enseignant enregistré.'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map((e) => {
                const p = e.personne
                const hue = AVATAR_HUES[(p?.idPers || 0) % AVATAR_HUES.length]
                return (
                  <tr
                    key={e.idPers}
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s', cursor: 'pointer' }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/enseignants/${e.idPers}`)}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--border-light)', padding: '3px 8px', borderRadius: 6 }}>
                        ENS-{String(e.idPers).padStart(3, '0')}
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
                          {getInitials(p)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{p ? `${p.nom} ${p.prenom}` : '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {p?.email || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {p?.mobile || p?.phone || '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {e.titulaireClasse ? (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent)' }}>
                          {e.titulaireClasse.libelle}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {e.sections.length > 0 ? e.sections.map((s) => (
                          <span key={s} style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap',
                            background: SECTION_COLORS[s]?.bg || 'var(--border-light)',
                            color: SECTION_COLORS[s]?.text || 'var(--text-secondary)',
                          }}>
                            {s}
                          </span>
                        )) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge tone={e.actif ? 'success' : 'neutral'}>{e.actif ? 'Actif' : 'Inactif'}</Badge>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setCompteModal({ values: { idPers: e.idPers, nom: p?.nom || '', prenom: p?.prenom || '', email: p?.email || '', mobile: p?.mobile || '', password: '' } }); setFormError('') }}
                        style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', padding: '4px 10px', borderRadius: 6, background: 'var(--accent-light)' }}
                      >Compte</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      <Modal open={!!modal} title="Inscrire un enseignant" onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button type="button" onClick={() => setModal((m) => ({ ...m, isNew: false }))} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: !modal.isNew ? 'var(--accent)' : 'var(--border-light)',
                color: !modal.isNew ? '#fff' : 'var(--text-secondary)',
              }}>Enseignant existant</button>
              <button type="button" onClick={() => setModal((m) => ({ ...m, isNew: true }))} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: modal.isNew ? 'var(--accent)' : 'var(--border-light)',
                color: modal.isNew ? '#fff' : 'var(--text-secondary)',
              }}>Nouvel enseignant</button>
            </div>

            {!modal.isNew ? (
              <SelectField label="Enseignant" required value={modal.values.idPers}
                onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idPers: e.target.value } }))}
                options={personnes.map((p) => ({ value: p.idPers, label: `${p.nom} ${p.prenom}` }))} />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InputField label="Nom" required value={modal.values.nom}
                    onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, nom: e.target.value } }))} />
                  <InputField label="Prénom" value={modal.values.prenom}
                    onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, prenom: e.target.value } }))} />
                </div>
                <InputField label="Identifiant de connexion" required value={modal.values.login}
                  onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, login: e.target.value } }))} />
                <InputField label="Mot de passe" type="password" required value={modal.values.password}
                  onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, password: e.target.value } }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InputField label="Email" type="email" value={modal.values.email}
                    onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, email: e.target.value } }))} />
                  <InputField label="Mobile" value={modal.values.mobile}
                    onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, mobile: e.target.value } }))} />
                </div>
              </>
            )}

            <SelectField label="Cours" required value={modal.values.idCours}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idCours: e.target.value } }))}
              options={cours.map((c) => ({ value: c.idCours, label: c.libelle }))} />

            <SelectField label="Salle de cours" value={modal.values.idSalle}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idSalle: e.target.value } }))}
              options={salles.map((s) => ({ value: s.idSalle, label: s.libelle }))} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Inscrire</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Compte modal ── */}
      <Modal open={!!compteModal} title="Modifier le compte" onClose={() => setCompteModal(null)}>
        {compteModal && (
          <form onSubmit={handleCompteSubmit}>
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
