import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Spinner from '../../components/ui/Spinner'
import { useResource } from '../../hooks/useResource'
import { scolariteApi, scolariteClassesApi, tranchesApi, cyclesApi } from '../../api/scolarite.api'
import { useAuth } from '../../hooks/useAuth'
import { isDirecteur, isSecretaire } from '../../config/navigation'

const TABS = [
  { key: 'pensions', label: 'Pensions' },
  { key: 'cycles', label: 'Cycles' },
]

const MOIS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function Scolarite() {
  const { data, loading, error, reload } = useResource(scolariteApi)
  const cyclesResource = useResource(cyclesApi)
  const [tranches, setTranches] = useState([])
  const [modal, setModal] = useState(null)
  const [echeanceModal, setEcheanceModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const { user } = useAuth()
  const canWrite = isDirecteur(user) || isSecretaire(user)
  const [tab, setTab] = useState('pensions')

  useEffect(() => {
    tranchesApi.list().then(setTranches).catch(() => {})
  }, [])

  async function handleDeleteCycle(idCycle) {
    if (!confirm('Supprimer ce cycle ?')) return
    try {
      await cyclesApi.remove(idCycle)
      cyclesResource.reload()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  function trancheCount(idScolarite) {
    return tranches.filter((t) => t.idScolarite === idScolarite).length
  }

  function getTranches(idScolarite) {
    return tranches.filter((t) => t.idScolarite === idScolarite).sort((a, b) => a.idTranche - b.idTranche)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      if (modal.kind === 'pension') {
        const payload = { description: modal.values.description, pension: Number(modal.values.pension || 0), inscription: Number(modal.values.inscription || 0), nbreTranche: Number(modal.values.nbreTranche || 3), idCycle: Number(modal.values.idCycle) }
        if (modal.mode === 'create') await scolariteApi.create(payload)
        else await scolariteApi.update(modal.values.idScolarite, payload)
        reload()
      } else if (modal.kind === 'cycle') {
        const payload = { libelle: modal.values.libelle, description: modal.values.description || '' }
        if (modal.mode === 'create') await cyclesApi.create(payload)
        else await cyclesApi.update(modal.values.idCycle, payload)
        cyclesResource.reload()
      }
      setModal(null)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    }
  }

  async function handleEcheanceSave() {
    setSaving(true)
    setFormError('')
    try {
      for (const t of echeanceModal.tranches) {
        await tranchesApi.update(t.idTranche, { delai_mois: Number(t.delai_mois), delai_jour: Number(t.delai_jour) })
      }
      const updated = await tranchesApi.list()
      setTranches(updated)
      setEcheanceModal(null)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader
        title="Scolarité"
        subtitle="Frais de scolarité et cycles"
        actions={canWrite ? (
          tab === 'pensions'
            ? <Button onClick={() => setModal({ mode: 'create', kind: 'pension', values: { description: '', pension: '', inscription: '', nbreTranche: 3, idCycle: '' } })}>＋ Pension</Button>
            : <Button onClick={() => setModal({ mode: 'create', kind: 'cycle', values: { libelle: '', description: '' } })}>＋ Cycle</Button>
        ) : null}
      />
      <Alert tone="error">{error}</Alert>
      {!canWrite && <Alert tone="info">Lecture seule — la création et la modification sont réservées au directeur.</Alert>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            background: tab === t.key ? 'var(--accent)' : 'var(--border-light)',
            color: tab === t.key ? '#fff' : 'var(--text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'pensions' && (
        <Card style={{ padding: 0 }}>
          <Table
            columns={[
              { key: 'description', label: 'Description' },
              { key: 'idCycle', label: 'Cycle', render: (r) => cyclesResource.data.find((c) => c.idCycle === r.idCycle)?.libelle || `#${r.idCycle}` },
              { key: 'inscription', label: 'Inscription' },
              { key: 'pension', label: 'Pension' },
              { key: 'nbreTranche', label: 'Tranches', render: (r) => <Badge tone="info">{trancheCount(r.idScolarite)} / {r.nbreTranche}</Badge> },
            ]}
            rows={data}
            loading={loading}
            keyField="idScolarite"
            emptyLabel="Aucune pension configurée"
            actions={canWrite ? (row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal({ mode: 'edit', kind: 'pension', values: row })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                <button onClick={async () => { if (confirm('Supprimer cette pension ?')) { await scolariteApi.remove(row.idScolarite); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
              </div>
            ) : null}
          />
        </Card>
      )}

      {tab === 'cycles' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{cyclesResource.error}</Alert>
          <Table
            columns={[
              { key: 'libelle', label: 'Libellé' },
              { key: 'description', label: 'Description' },
            ]}
            rows={cyclesResource.data}
            loading={cyclesResource.loading}
            keyField="idCycle"
            emptyLabel="Aucun cycle configuré"
            actions={canWrite ? (row) => (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal({ mode: 'edit', kind: 'cycle', values: row })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                <button onClick={() => handleDeleteCycle(row.idCycle)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
              </div>
            ) : null}
          />
        </Card>
      )}

      <Modal open={!!modal} title={
        modal?.kind === 'pension'
          ? (modal?.mode === 'create' ? 'Ajouter une pension' : 'Modifier la pension')
          : (modal?.mode === 'create' ? 'Ajouter un cycle' : 'Modifier le cycle')
      } onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            {modal.kind === 'pension' && (
              <>
                <InputField label="Description" required value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
                <SelectField label="Cycle" required value={modal.values.idCycle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idCycle: e.target.value } }))}
                  options={cyclesResource.data.map((c) => ({ value: c.idCycle, label: c.libelle }))} />
                <InputField label="Frais d'inscription" type="number" value={modal.values.inscription} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, inscription: e.target.value } }))} />
                <InputField label="Pension" type="number" value={modal.values.pension} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, pension: e.target.value } }))} />
                <InputField label="Nombre de tranches" type="number" value={modal.values.nbreTranche} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, nbreTranche: e.target.value } }))} />
              </>
            )}
            {modal.kind === 'cycle' && (
              <>
                <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
                <InputField label="Description" value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
              </>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!echeanceModal} title={`Échéances — ${echeanceModal?.scolarite?.description || ''}`} onClose={() => setEcheanceModal(null)} width={520}>
        {echeanceModal && (
          <div>
            <Alert tone="error">{formError}</Alert>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Définissez le mois et le jour d'échéance pour chaque tranche de cette scolarité.
            </p>
            {echeanceModal.tranches.map((t, idx) => (
              <div key={t.idTranche} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: 8, alignItems: 'end', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, paddingBottom: 6 }}>
                  {t.libelle}
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 6 }}>
                    ({Number(t.montant).toLocaleString('fr-FR')} F)
                  </span>
                </div>
                <SelectField
                  label="Mois"
                  value={t.delai_mois}
                  onChange={(e) => {
                    const ts = [...echeanceModal.tranches]
                    ts[idx] = { ...ts[idx], delai_mois: Number(e.target.value) }
                    setEcheanceModal((m) => ({ ...m, tranches: ts }))
                  }}
                  options={MOIS.map((m, i) => i > 0 ? { value: i, label: m } : null).filter(Boolean)}
                />
                <InputField
                  label="Jour"
                  type="number"
                  min={1}
                  max={31}
                  value={t.delai_jour}
                  onChange={(e) => {
                    const ts = [...echeanceModal.tranches]
                    ts[idx] = { ...ts[idx], delai_jour: Number(e.target.value) }
                    setEcheanceModal((m) => ({ ...m, tranches: ts }))
                  }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <Button type="button" variant="secondary" onClick={() => setEcheanceModal(null)}>Annuler</Button>
              <Button onClick={handleEcheanceSave} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
