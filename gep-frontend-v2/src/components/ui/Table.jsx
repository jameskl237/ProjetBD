import EmptyState from './EmptyState'
import Spinner from './Spinner'

// Table générique piloté par une liste de colonnes { key, label, render? }.
// Utilisée par toutes les pages de listing pour éviter de recoder un <table> partout.
export default function Table({ columns, rows, loading, emptyLabel = 'Aucun résultat', keyField = 'id', actions }) {
  if (loading) return <Spinner />
  if (!rows || rows.length === 0) return <EmptyState title={emptyLabel} />

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4,
              }}>
                {col.label}
              </th>
            ))}
            {actions && <th style={{ borderBottom: '1px solid var(--border)' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField] ?? JSON.stringify(row)} style={{ borderBottom: '1px solid var(--border-light)' }}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
              {actions && <td style={{ padding: '12px 14px', textAlign: 'right' }}>{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
