import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import Spinner from '../../components/ui/Spinner'
import { useResource } from '../../hooks/useResource'
import { paiementsApi, modesApi, paiementsExtra } from '../../api/paiements.api'
import { elevesApi } from '../../api/eleves.api'
import { anneesApi } from '../../api/annees.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const TABS = [
  { key: 'liste', label: 'Paiements' },
  { key: 'impayes', label: 'Impayés' },
]

export default function Paiements() {
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isComptable = roleKey === ROLES.COMPTABLE || roleKey === ROLES.SECRETAIRE
  const [tab, setTab] = useState('liste')

  const { data, loading, error, reload } = useResource(paiementsApi)
  const [modes, setModes] = useState([])
  const [eleves, setEleves] = useState([])
  const [annees, setAnnees] = useState([])
  const [modal, setModal] = useState(null)
  const [statut, setStatut] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [impayesData, setImpayesData] = useState([])
  const [impayesLoading, setImpayesLoading] = useState(false)

  useEffect(() => {
    modesApi.list().then(setModes).catch(() => {})
    elevesApi.list().then(setEleves).catch(() => {})
    anneesApi.list().then(setAnnees).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab !== 'impayes') return
    setImpayesLoading(true)
    paiementsExtra.impayes().then(setImpayesData).catch(() => setImpayesData([])).finally(() => setImpayesLoading(false))
  }, [tab])

  async function openCreate() {
    setModal({ values: { matricule: '', idAca: '', idTranche: '', idMode: '', montant: '', datePaie: new Date().toISOString().slice(0, 10) } })
    setFormError(''); setStatut(null)
  }

  async function loadStatut(matricule, idAca) {
    if (!matricule || !idAca) { setStatut(null); return }
    try {
      const res = await paiementsExtra.statut(matricule, idAca)
      setStatut(res)
    } catch { setStatut(null) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      await paiementsApi.create({
        matricule: Number(modal.values.matricule),
        idAca: Number(modal.values.idAca),
        idTranche: Number(modal.values.idTranche),
        idMode: Number(modal.values.idMode),
        montant: Number(modal.values.montant),
        datePaie: modal.values.datePaie,
      })
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur lors de l\'enregistrement') } finally { setSaving(false) }
  }

  const totalPeriode = data.reduce((s, p) => s + Number(p.montant || 0), 0)

  return (
    <div>
      <PageHeader
        title="Paiements"
        subtitle="Suivi des règlements de scolarité"
        actions={<>
          <a href={paiementsExtra.exportUrl()} target="_blank" rel="noreferrer"><Button variant="secondary">Exporter CSV</Button></a>
          {isComptable && <Button onClick={openCreate}>＋ Nouveau paiement</Button>}
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard icon="💳" label="Total enregistré" value={`${totalPeriode.toLocaleString('fr-FR')} FCFA`} tone="success" />
        <StatCard icon="🧾" label="Nombre de paiements" value={data.length} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            background: tab === t.key ? 'var(--accent)' : 'var(--border-light)',
            color: tab === t.key ? '#fff' : 'var(--text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'liste' && (
        <Card style={{ padding: 0 }}>
          <Alert tone="error">{error}</Alert>
          <Table
            columns={[
              { key: 'eleve', label: 'Élève', render: (r) => r.eleve ? `${r.eleve.nom} ${r.eleve.prenom}` : `#${r.matricule}` },
              { key: 'classe', label: 'Classe', render: (r) => r.classe?.libelle || '—' },
              { key: 'montant', label: 'Montant', render: (r) => `${Number(r.montant).toLocaleString('fr-FR')} FCFA` },
              { key: 'mode', label: 'Mode', render: (r) => r.mode?.libelle || '—' },
              { key: 'datePaie', label: 'Date', render: (r) => r.datePaie?.slice(0, 10) },
            ]}
            rows={data}
            loading={loading}
            keyField="idPaie"
            emptyLabel="Aucun paiement enregistré"
          />
        </Card>
      )}

      {tab === 'impayes' && (
        <Card style={{ padding: 0 }}>
          {impayesLoading ? <Spinner /> : (
            <Table
              columns={[
                { key: 'eleve', label: 'Élève', render: (r) => `${r.eleve.nom} ${r.eleve.prenom}` },
                { key: 'classe', label: 'Classe', render: (r) => r.classe?.libelle },
                { key: 'montantDu', label: 'Solde dû', render: (r) => `${Number(r.montantDu).toLocaleString('fr-FR')} FCFA` },
                { key: 'retard', label: 'Retard', render: (r) => r.retard > 0 ? <Badge tone="danger">{r.retard} j.</Badge> : <Badge tone="success">À jour</Badge> },
              ]}
              rows={impayesData}
              keyField="matricule"
              emptyLabel="Aucun impayé — tous les élèves sont à jour"
            />
          )}
        </Card>
      )}

      <Modal open={!!modal} title="Nouveau paiement" onClose={() => setModal(null)} width={560}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Élève" required value={modal.values.matricule}
              onChange={(e) => { const matricule = e.target.value; setModal((m) => ({ ...m, values: { ...m.values, matricule } })); loadStatut(matricule, modal.values.idAca) }}
              options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom} (#${e.matricule})` }))} />
            <SelectField label="Année académique" required value={modal.values.idAca}
              onChange={(e) => { const idAca = e.target.value; setModal((m) => ({ ...m, values: { ...m.values, idAca } })); loadStatut(modal.values.matricule, idAca) }}
              options={annees.map((a) => ({ value: a.idAnnee, label: a.libelle }))} />

            {statut && (
              <div style={{ marginBottom: 14, padding: 12, background: 'var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Statut des tranches</div>
                {statut.tranches.map((t) => (
                  <div key={t.idTranche} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                    <span>{t.libelle} — {Number(t.montant).toLocaleString('fr-FR')} FCFA</span>
                    <Badge tone={t.statut === 'payé' ? 'success' : t.statut === 'partiel' ? 'warning' : 'danger'}>
                      {t.statut} ({Number(t.montantRestant).toLocaleString('fr-FR')} restant)
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <SelectField label="Tranche" required value={modal.values.idTranche} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idTranche: e.target.value } }))}
              options={(statut?.tranches || []).map((t) => ({ value: t.idTranche, label: `${t.libelle} (restant ${t.montantRestant})` }))} />
            <SelectField label="Mode de paiement" required value={modal.values.idMode} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idMode: e.target.value } }))}
              options={modes.map((mo) => ({ value: mo.idMode, label: mo.libelle }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Montant (FCFA)" type="number" required value={modal.values.montant} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, montant: e.target.value } }))} />
              <InputField label="Date de paiement" type="date" required value={modal.values.datePaie} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, datePaie: e.target.value } }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
