import { useEffect, useState, useMemo } from 'react'
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const TABS = [
  { key: 'liste', label: 'Paiements' },
  { key: 'impayes', label: 'Impayés' },
  { key: 'stats', label: 'Évolution Graphique' },
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
    setImpayesLoading(true)
    paiementsExtra.impayes().then(setImpayesData).catch(() => setImpayesData([])).finally(() => setImpayesLoading(false))
  }, [])

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

  const totalPeriode = data ? data.reduce((s, p) => s + Number(p.montant || 0), 0) : 0

  const nbImpayes = impayesData.length
  const nbEcheancesDepassees = impayesData.filter((i) => i.retard > 0).length
  const tauxRecouvrement = useMemo(() => {
    if (!impayesData.length) return 0
    const totalAttendu = impayesData.reduce((s, i) => s + Number(i.montantAttendu || 0), 0)
    const totalPaye = impayesData.reduce((s, i) => s + Number(i.montantPaye || 0), 0)
    return totalAttendu > 0 ? Math.round((totalPaye / totalAttendu) * 100) : 0
  }, [impayesData])

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    const sorted = [...data].sort((a, b) => new Date(a.datePaie).getTime() - new Date(b.datePaie).getTime())

    const groups = {}
    sorted.forEach((p) => {
      if (!p.datePaie) return
      const date = new Date(p.datePaie)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })

      if (!groups[key]) {
        groups[key] = { label, t1: 0, t2: 0, t3: 0, autres: 0 }
      }

      const comment = (p.comentaire || '').toLowerCase()
      const montant = Number(p.montant || 0)

      if (comment.includes('1ère') || comment.includes('1ere') || comment.includes('première') || comment.includes('tranche 1') || p.idTranche === 1) {
        groups[key].t1 += montant
      } else if (comment.includes('2ème') || comment.includes('2eme') || comment.includes('deuxième') || comment.includes('tranche 2') || p.idTranche === 2) {
        groups[key].t2 += montant
      } else if (comment.includes('3ème') || comment.includes('3eme') || comment.includes('troisième') || comment.includes('tranche 3') || p.idTranche === 3) {
        groups[key].t3 += montant
      } else {
        groups[key].autres += montant
      }
    })

    const sortedKeys = Object.keys(groups).sort()
    const labels = sortedKeys.map((k) => groups[k].label)
    const t1Data = sortedKeys.map((k) => groups[k].t1)
    const t2Data = sortedKeys.map((k) => groups[k].t2)
    const t3Data = sortedKeys.map((k) => groups[k].t3)
    const autresData = sortedKeys.map((k) => groups[k].autres)

    return {
      labels,
      datasets: [
        {
          label: '1ère Tranche',
          data: t1Data,
          borderColor: '#1A6B3C',
          backgroundColor: 'rgba(26,107,60,0.15)',
          hoverBackgroundColor: 'rgba(26,107,60,0.3)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#1A6B3C',
          pointBorderWidth: 2.5,
          pointHoverBorderColor: '#fff',
          pointHoverBackgroundColor: '#1A6B3C',
          tension: 0.4,
          fill: true,
        },
        {
          label: '2ème Tranche',
          data: t2Data,
          borderColor: '#D4A017',
          backgroundColor: 'rgba(212,160,23,0.15)',
          hoverBackgroundColor: 'rgba(212,160,23,0.3)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#D4A017',
          pointBorderWidth: 2.5,
          pointHoverBorderColor: '#fff',
          pointHoverBackgroundColor: '#D4A017',
          tension: 0.4,
          fill: true,
        },
        {
          label: '3ème Tranche',
          data: t3Data,
          borderColor: '#0891B2',
          backgroundColor: 'rgba(8,145,178,0.15)',
          hoverBackgroundColor: 'rgba(8,145,178,0.3)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#0891B2',
          pointBorderWidth: 2.5,
          pointHoverBorderColor: '#fff',
          pointHoverBackgroundColor: '#0891B2',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Inscriptions / Autres',
          data: autresData,
          borderColor: '#6B7280',
          backgroundColor: 'rgba(107,114,128,0.15)',
          hoverBackgroundColor: 'rgba(107,114,128,0.3)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#6B7280',
          pointBorderWidth: 2.5,
          pointHoverBorderColor: '#fff',
          pointHoverBackgroundColor: '#6B7280',
          tension: 0.4,
          fill: true,
        },
      ],
    }
  }, [data])

  const doughnutData = useMemo(() => {
    if (!impayesData.length) return null
    const totalAttendu = impayesData.reduce((s, i) => s + Number(i.montantAttendu || 0), 0)
    const totalPaye = impayesData.reduce((s, i) => s + Number(i.montantPaye || 0), 0)
    const totalRestant = Math.max(0, totalAttendu - totalPaye)
    return {
      labels: ['Total payé', 'Total restant'],
      datasets: [{
        data: [totalPaye, totalRestant],
        backgroundColor: ['#1A6B3C', '#F87171'],
        borderColor: ['#16a34a', '#dc2626'],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    }
  }, [impayesData])

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
        <StatCard icon="⚠️" label="Élèves impayés" value={nbImpayes} tone="danger" />
        <StatCard icon="⏰" label="Échéances dépassées" value={nbEcheancesDepassees} tone={nbEcheancesDepassees > 0 ? 'danger' : 'success'} />
        <StatCard icon="📊" label="Taux de recouvrement" value={`${tauxRecouvrement}%`} tone={tauxRecouvrement >= 80 ? 'success' : tauxRecouvrement >= 50 ? 'warning' : 'danger'} />
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
              { key: 'eleve', label: 'Élève', render: (r) => r.eleve ? `${r.eleve.nom} ${r.eleve.prenom}` : `#${r.eleve?.matriculeCode || r.matricule}` },
              { key: 'classe', label: 'Classe', render: (r) => r.classe?.libelle || '—' },
              { key: 'montant', label: 'Montant', render: (r) => `${Number(r.montant).toLocaleString('fr-FR')} FCFA` },
              { key: 'mode', label: 'Mode', render: (r) => r.mode?.libelle || '—' },
              { key: 'datePaie', label: 'Date', render: (r) => r.datePaie?.slice(0, 10) },
              { key: 'recu', label: 'Reçu', render: (r) => <button onClick={() => paiementsExtra.openRecu(r.idPaie)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>Reçu PDF 🧾</button> },
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
                { key: 'montantAttendu', label: 'Total dû', render: (r) => `${Number(r.montantAttendu).toLocaleString('fr-FR')} FCFA` },
                { key: 'montantPaye', label: 'Déjà payé', render: (r) => <span style={{ color: 'var(--success, #16a34a)' }}>{Number(r.montantPaye).toLocaleString('fr-FR')} FCFA</span> },
                { key: 'montantDu', label: 'Reste dû', render: (r) => <span style={{ color: '#dc2626', fontWeight: 600 }}>{Number(r.montantDu).toLocaleString('fr-FR')} FCFA</span> },
                { key: 'tranches', label: 'Tranches', render: (r) => <span>{r.nbreTranchesPayees}/{r.nbreTranchesTotal} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>({r.pctPaye}%)</span></span> },
                { key: 'dernierPaiement', label: 'Dernier paiement', render: (r) => r.dernierPaiement ? new Date(r.dernierPaiement).toLocaleDateString('fr-FR') : <span style={{ color: '#dc2626' }}>Aucun</span> },
                { key: 'echeance', label: 'Échéance', render: (r) => r.echeance ? new Date(r.echeance).toLocaleDateString('fr-FR') : '—' },
                { key: 'retard', label: 'Retard', render: (r) => r.retard > 0 ? <Badge tone="danger">{r.retard} jour{r.retard > 1 ? 's' : ''}</Badge> : <Badge tone="success">À jour</Badge> },
              ]}
              rows={impayesData}
              keyField="matricule"
              emptyLabel="Aucun impayé — tous les élèves sont à jour"
            />
          )}
        </Card>
      )}

      {tab === 'stats' && (
        <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', overflowX: 'hidden' }}>
          <Card style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--primary)' }}>
                Évolution mensuelle des paiements par tranche
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Année académique {annees.length > 0 ? annees[annees.length - 1].libelle : ''}
              </p>
            </div>
            {chartData ? (
              <div style={{ height: 380, position: 'relative' }}>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 12, weight: '500' }, color: '#64748b', padding: 8 },
                        border: { color: '#e2e8f0' },
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9', drawTicks: false },
                        ticks: {
                          font: { size: 12 },
                          color: '#64748b',
                          padding: 12,
                          callback: (val) => `${(val / 1000).toLocaleString()}k`,
                        },
                        border: { display: false },
                      },
                    },
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          pointStyle: 'circle',
                          font: { size: 12.5, weight: '500' },
                        },
                      },
                      tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 13 },
                        bodySpacing: 8,
                        padding: { top: 12, right: 16, bottom: 12, left: 16 },
                        cornerRadius: 10,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                          label: (ctx) => ` ${ctx.dataset.label} : ${Number(ctx.raw).toLocaleString('fr-FR')} FCFA`,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                Aucun paiement enregistré pour afficher les statistiques.
              </div>
            )}
          </Card>

          {doughnutData && (
            <Card style={{ padding: 24, marginTop: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', alignItems: 'center', gap: 32 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--primary)' }}>
                    Répartition du recouvrement
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Comparaison entre les montants perçus et les soldes restants
                  </p>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>Total attendu</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                        {impayesData.reduce((s, i) => s + Number(i.montantAttendu || 0), 0).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>Total payé</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1A6B3C' }}>
                        {impayesData.reduce((s, i) => s + Number(i.montantPaye || 0), 0).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>Total restant</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>
                        {Math.max(0, impayesData.reduce((s, i) => s + Number(i.montantAttendu || 0), 0) - impayesData.reduce((s, i) => s + Number(i.montantPaye || 0), 0)).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ height: 240, display: 'flex', justifyContent: 'center' }}>
                  <Doughnut
                    data={doughnutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '68%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12.5, weight: '500' },
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(15, 23, 42, 0.92)',
                          titleFont: { size: 13, weight: '600' },
                          bodyFont: { size: 13 },
                          padding: { top: 10, right: 14, bottom: 10, left: 14 },
                          cornerRadius: 10,
                          callbacks: {
                            label: (ctx) => {
                              const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
                              const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0
                              return ` ${ctx.label} : ${Number(ctx.raw).toLocaleString('fr-FR')} FCFA (${pct}%)`
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}


      <Modal open={!!modal} title="Nouveau paiement" onClose={() => setModal(null)} width={560}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Élève" required value={modal.values.matricule}
              onChange={(e) => { const matricule = e.target.value; setModal((m) => ({ ...m, values: { ...m.values, matricule } })); loadStatut(matricule, modal.values.idAca) }}
              options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom} (#${e.matriculeCode || e.matricule})` }))} />
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
