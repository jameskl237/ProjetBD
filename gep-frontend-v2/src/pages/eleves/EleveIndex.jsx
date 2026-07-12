import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import { useResource } from '../../hooks/useResource'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

export default function EleveIndex() {
  const { data, loading, error } = useResource(elevesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter((e) => `${e.nom} ${e.prenom} ${e.matricule} ${e.matriculeCode}`.toLowerCase().includes(q))
  }, [data, search])

  const columns = [
    { key: 'matricule', label: 'Matricule', render: (r) => r.matriculeCode || r.matricule },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    {
      key: 'classe', label: 'Classe',
      render: (row) => row.inscriptions?.[0]?.classe?.libelle || '—',
    },
    {
      key: 'actif', label: 'Statut',
      render: (row) => <Badge tone={row.actif ? 'success' : 'neutral'}>{row.actif ? 'Actif' : 'Inactif'}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Élèves"
        subtitle={`${filtered.length} élève(s)`}
        actions={roleKey === ROLES.ADMINISTRATEUR ? <Link to="/eleves/nouveau"><Button>＋ Nouvel élève</Button></Link> : null}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <input
            placeholder="Rechercher un élève (nom, prénom, matricule)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 360, padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 13.5 }}
          />
        </div>
        <Table
          columns={columns}
          rows={filtered}
          loading={loading}
          keyField="matricule"
          emptyLabel="Aucun élève trouvé"
          actions={(row) => <Link to={`/eleves/${row.matricule}`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Voir la fiche</Link>}
        />
      </Card>
    </div>
  )
}
