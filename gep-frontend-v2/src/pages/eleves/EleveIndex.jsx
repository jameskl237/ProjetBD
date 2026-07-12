import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

export default function EleveIndex() {
  const { data, loading, error } = useResource(elevesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isDirecteur = roleKey === ROLES.ADMINISTRATEUR

  const [search, setSearch] = useState('')
  const [filterBy, setFilterBy] = useState('nom')
  const [sortBy, setSortBy] = useState('nom')
  const [groupedByClass, setGroupedByClass] = useState(false)

  const filtered = useMemo(() => {
    let result = [...(data || [])]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((e) => {
        const parentNom = e.tuteurs?.[0]?.tuteur?.nom || ''
        const parentPrenom = e.tuteurs?.[0]?.tuteur?.prenom || ''
        const quartier = e.quartier?.libelle || ''
        const classe = e.inscriptions?.[0]?.classe?.libelle || ''
        const searchFields = `${e.nom} ${e.prenom} ${e.matricule} ${parentNom} ${parentPrenom} ${quartier} ${classe}`.toLowerCase()
        return searchFields.includes(q)
      })
    }

    result.sort((a, b) => {
      if (sortBy === 'nom') return (a.nom || '').localeCompare(b.nom || '')
      if (sortBy === 'prenom') return (a.prenom || '').localeCompare(b.prenom || '')
      if (sortBy === 'classe') {
        const clA = a.inscriptions?.[0]?.classe?.libelle || ''
        const clB = b.inscriptions?.[0]?.classe?.libelle || ''
        return clA.localeCompare(clB)
      }
      if (sortBy === 'quartier') {
        const qA = a.quartier?.libelle || ''
        const qB = b.quartier?.libelle || ''
        return qA.localeCompare(qB)
      }
      if (sortBy === 'parent') {
        const pA = a.tuteurs?.[0]?.tuteur?.nom || ''
        const pB = b.tuteurs?.[0]?.tuteur?.nom || ''
        return pA.localeCompare(pB)
      }
      return 0
    })

    return result
  }, [data, search, sortBy, filterBy])

  const grouped = useMemo(() => {
    if (!groupedByClass) return null
    const groups = {}
    for (const e of filtered) {
      const classe = e.inscriptions?.[0]?.classe?.libelle || 'Non inscrit'
      if (!groups[classe]) groups[classe] = []
      groups[classe].push(e)
    }
    return groups
  }, [filtered, groupedByClass])

  const columns = [
    { key: 'matricule', label: 'Matricule' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'classe', label: 'Classe', render: (row) => row.inscriptions?.[0]?.classe?.libelle || '—' },
    { key: 'parent', label: 'Parent', render: (row) => {
      const t = row.tuteurs?.[0]?.tuteur
      return t ? `${t.nom} ${t.prenom}` : '—'
    }},
    { key: 'quartier', label: 'Quartier', render: (row) => row.quartier?.libelle || '—' },
    { key: 'paiement', label: 'Paiement', render: (row) => {
      const statut = row.paiementStatut || '—'
      const tone = statut === 'payé' ? 'success' : statut === 'partiel' ? 'warning' : statut === 'impayé' ? 'danger' : 'neutral'
      return <Badge tone={tone}>{statut}</Badge>
    }},
    { key: 'actif', label: 'Statut élève', render: (row) => <Badge tone={row.actif ? 'success' : 'neutral'}>{row.actif ? 'Actif' : 'Inactif'}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title="Élèves"
        subtitle={`${filtered.length} élève(s)`}
      />
      <Alert tone="error">{error}</Alert>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              placeholder="Rechercher (nom, prénom, matricule, parent, quartier)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 13.5 }}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <SelectField label="Trier par" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'nom', label: 'Nom (A-Z)' },
                { value: 'prenom', label: 'Prénom (A-Z)' },
                { value: 'classe', label: 'Classe' },
                { value: 'quartier', label: 'Quartier' },
                { value: 'parent', label: 'Parent' },
              ]} />
          </div>
          <Button variant="secondary" onClick={() => setGroupedByClass(!groupedByClass)}>
            {groupedByClass ? 'Vue plate' : 'Grouper par classe'}
          </Button>
        </div>
      </Card>

      {grouped ? (
        Object.entries(grouped).map(([classe, eleves]) => (
          <div key={classe} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, padding: '0 4px' }}>
              {classe} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>({eleves.length} élève(s))</span>
            </h3>
            <Card style={{ padding: 0 }}>
              <Table
                columns={columns}
                rows={eleves}
                loading={loading}
                keyField="matricule"
                emptyLabel="Aucun élève dans cette classe"
                actions={(row) => <Link to={`/eleves/${row.matricule}`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Voir la fiche</Link>}
              />
            </Card>
          </div>
        ))
      ) : (
        <Card style={{ padding: 0 }}>
          <Table
            columns={columns}
            rows={filtered}
            loading={loading}
            keyField="matricule"
            emptyLabel="Aucun élève trouvé"
            actions={(row) => <Link to={`/eleves/${row.matricule}`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Voir la fiche</Link>}
          />
        </Card>
      )}
    </div>
  )
}
