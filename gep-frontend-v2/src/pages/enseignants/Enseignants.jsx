import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { enseignantsApi, coursApi, titulairesApi } from '../../api/cours.api'
import { personnesApi } from '../../api/personnes.api'
import { sallesApi } from '../../api/classes.api'

export default function Enseignants() {
  const { data, loading, error, reload } = useResource(enseignantsApi)
  const [personnes, setPersonnes] = useState([])
  const [cours, setCours] = useState([])
  const [salles, setSalles] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  function loadPersonnes() {
    personnesApi.list().then((rows) => setPersonnes(rows.filter((p) => p.typePersonne === 1))).catch(() => {})
  }

  useEffect(() => {
    loadPersonnes()
    coursApi.list().then(setCours).catch(() => {})
    sallesApi.list().then(setSalles).catch(() => {})
  }, [])

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
        const res = await personnesApi.create({
          login: v.login,
          password: v.password,
          typePersonne: 1,
          nom: v.nom,
          prenom: v.prenom || undefined,
          email: v.email || undefined,
          mobile: v.mobile || undefined,
        })
        const newPersonnes = await personnesApi.list()
        const filtered = newPersonnes.filter((p) => p.typePersonne === 1)
        setPersonnes(filtered)
        const latest = filtered[filtered.length - 1]
        idPers = latest.idPers
      }

      await enseignantsApi.create({ idPers, idCours: Number(modal.values.idCours) })

      if (modal.values.idSalle) {
        await titulairesApi.create({ idPers, idSalle: Number(modal.values.idSalle) })
      }

      setModal(null)
      reload()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de l\'inscription')
    }
  }

  return (
    <div>
      <PageHeader
        title="Enseignants"
        subtitle="Inscription et affectation des enseignants aux cours et salles"
        actions={<Button onClick={openCreate}>＋ Inscrire un enseignant</Button>}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'personne', label: 'Enseignant', render: (r) => r.personne ? `${r.personne.nom} ${r.personne.prenom}` : '—' },
            { key: 'cours', label: 'Cours', render: (r) => r.cours?.libelle || '—' },
            { key: 'classe', label: 'Classe', render: (r) => r.cours?.classe?.libelle || '—' },
            { key: 'salle', label: 'Salle', render: (r) => r.salle?.libelle || '—' },
            { key: 'Actif', label: 'Statut', render: (r) => <Badge tone={r.Actif ? 'success' : 'neutral'}>{r.Actif ? 'Actif' : 'Inactif'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idEnseignant"
          actions={(row) => (
            <button onClick={async () => { if (confirm('Retirer cette affectation ?')) { await enseignantsApi.remove(row.idEnseignant); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
              Retirer
            </button>
          )}
        />
      </Card>

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
    </div>
  )
}
