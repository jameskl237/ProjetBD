import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import { useResource } from '../../hooks/useResource'
import { classesApi } from '../../api/classes.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

export default function ClasseIndex() {
  const { data, loading, error, reload } = useResource(classesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isAdmin = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE

  async function handleDelete(row) {
    if (!confirm(`Supprimer la classe ${row.libelle} ?`)) return
    await classesApi.remove(row.idClasse)
    reload()
  }

  const columns = [
    { key: 'libelle', label: 'Classe' },
    { key: 'cycle', label: 'Cycle', render: (r) => r.cycle?.libelle || '—' },
    { key: 'effectif', label: 'Effectif' },
    { key: 'moyenne', label: 'Moyenne générale', render: (r) => r.moyenne != null ? `${Number(r.moyenne).toFixed(2)}/20` : '—' },
  ]

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle={`${data.length} classe(s)`}
        actions={isAdmin ? <Link to="/classes/nouvelle"><Button>＋ Nouvelle classe</Button></Link> : null}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={columns}
          rows={data}
          loading={loading}
          keyField="idClasse"
          actions={(row) => (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Link to={`/classes/${row.idClasse}`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Voir</Link>
              {isAdmin && <Link to={`/classes/${row.idClasse}/modifier`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</Link>}
              {isAdmin && <button onClick={() => handleDelete(row)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>}
            </div>
          )}
        />
      </Card>
    </div>
  )
}
