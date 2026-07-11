import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { livresApi, specialitesApi } from '../../api/livres.api'

export default function Livres() {
  const { data, loading, error, reload } = useResource(livresApi)
  const specialites = useResource(specialitesApi)
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      const p = {
        titre: modal.values.titre, auteurs: modal.values.auteurs,
        idSpecialite: Number(modal.values.idSpecialite), edition: modal.values.edition,
        totalCopie: Number(modal.values.totalCopie || 1),
      }
      if (modal.mode === 'edit') await livresApi.update(modal.values.idLivre, p); else await livresApi.create(p)
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  async function handleAddSpecialite() {
    const libelle = prompt('Nom de la nouvelle spécialité :')
    if (!libelle) return
    await specialitesApi.create({ libelle })
    specialites.reload()
  }

  return (
    <div>
      <PageHeader
        title="Bibliothèque"
        subtitle="Fonds documentaire de l'établissement"
        actions={<>
          <Button variant="secondary" onClick={handleAddSpecialite}>＋ Spécialité</Button>
          <Button onClick={() => { setModal({ mode: 'create', values: { titre: '', auteurs: '', idSpecialite: '', edition: '', totalCopie: 1 } }); setFormError('') }}>＋ Livre</Button>
        </>}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'titre', label: 'Titre' },
            { key: 'auteurs', label: 'Auteur(s)' },
            { key: 'idSpecialite', label: 'Spécialité', render: (r) => specialites.data.find((s) => s.idSpecialite === r.idSpecialite)?.libelle || '—' },
            { key: 'totalCopie', label: 'Copies' },
          ]}
          rows={data}
          loading={loading}
          keyField="idLivre"
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal({ mode: 'edit', values: row }); setFormError('') }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
              <button onClick={async () => { if (confirm('Supprimer ?')) { await livresApi.remove(row.idLivre); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
            </div>
          )}
        />
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter un livre' : 'Modifier'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Titre" required value={modal.values.titre} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, titre: e.target.value } }))} />
            <InputField label="Auteur(s)" value={modal.values.auteurs} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, auteurs: e.target.value } }))} />
            <SelectField label="Spécialité" required value={modal.values.idSpecialite} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idSpecialite: e.target.value } }))}
              options={specialites.data.map((s) => ({ value: s.idSpecialite, label: s.libelle }))} />
            <InputField label="Édition" value={modal.values.edition} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, edition: e.target.value } }))} />
            <InputField label="Nombre de copies" type="number" value={modal.values.totalCopie} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, totalCopie: e.target.value } }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
