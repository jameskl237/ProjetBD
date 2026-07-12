import { useEffect, useState, useMemo } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import SelectField from '../../components/forms/SelectField'
import { elevesApi } from '../../api/eleves.api'
import { absencesApi } from '../../api/absences.api'
import { anneesApi } from '../../api/annees.api'

const MOIS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
]

export default function ParentAbsences() {
  const [enfants, setEnfants] = useState([])
  const [annees, setAnnees] = useState([])
  const [absences, setAbsences] = useState([])
  const [matricule, setMatricule] = useState('')
  const [mois, setMois] = useState('')
  const [idAca, setIdAca] = useState('')
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const errs = []
    Promise.allSettled([
      elevesApi.list().then((e) => { setEnfants(e); if (e.length === 1) setMatricule(String(e[0].matricule)) }),
      anneesApi.list().then((a) => {
        setAnnees(a)
        if (a.length > 0) setIdAca(String(a[a.length - 1].idAnnee))
      }),
      absencesApi.list().then(setAbsences),
    ]).then((results) => {
      results.forEach((r, i) => { if (r.status === 'rejected') errs.push(['enfants', 'années', 'absences'][i]) })
      if (errs.length) setErrors(errs)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = absences
    if (matricule) result = result.filter((a) => String(a.matricule) === matricule)
    if (mois) result = result.filter((a) => new Date(a.date).getMonth() + 1 === Number(mois))
    if (idAca) result = result.filter((a) => String(a.idAca) === idAca)
    return result
  }, [absences, matricule, mois, idAca])

  return (
    <div>
      <PageHeader title="Absences" subtitle="Absences enregistrées pour votre / vos enfant(s)" />
      {errors.length > 0 && <Alert tone="error">Erreur lors du chargement : {errors.join(', ')}</Alert>}
      {loading ? <Spinner /> : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {enfants.length > 0 && (
                <SelectField
                  label="Enfant"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  options={enfants.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))}
                  placeholder="Tous les enfants"
                />
              )}
              <SelectField
                label="Mois"
                value={mois}
                onChange={(e) => setMois(e.target.value)}
                options={MOIS}
                placeholder="Tous les mois"
              />
              {annees.length > 0 && (
                <SelectField
                  label="Année scolaire"
                  value={idAca}
                  onChange={(e) => setIdAca(e.target.value)}
                  options={annees.map((a) => ({ value: a.idAnnee, label: a.libelle }))}
                  placeholder="Toutes les années"
                />
              )}
            </div>
          </Card>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {filtered.length} absence(s) trouvée(s)
          </div>
          <Card style={{ padding: 0 }}>
            <Table
              columns={[
                { key: 'eleve', label: 'Enfant', render: (r) => r.eleve ? `${r.eleve.nom} ${r.eleve.prenom}` : '—' },
                { key: 'cours', label: 'Cours', render: (r) => r.cours?.libelle || '—' },
                { key: 'date', label: 'Date', render: (r) => r.date?.slice(0, 10) },
                { key: 'auteur', label: 'Enseignant', render: (r) => r.auteur ? `${r.auteur.nom} ${r.auteur.prenom}` : '—' },
                { key: 'justifiee', label: 'Statut', render: (r) => <Badge tone={r.justifiee ? 'success' : 'warning'}>{r.justifiee ? 'Justifiée' : 'Non justifiée'}</Badge> },
                { key: 'commentaire', label: 'Commentaire', render: (r) => r.commentaire || '—' },
              ]}
              rows={filtered}
              loading={loading}
              keyField="idAbsence"
              emptyLabel="Aucune absence enregistrée"
            />
          </Card>
        </>
      )}
    </div>
  )
}
