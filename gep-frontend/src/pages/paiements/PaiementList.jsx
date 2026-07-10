import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { paiementApi, extractList } from '../../api'
import { mapPaiementToRow } from '../../utils/apiMappers'
import Module36Layout from './Module36Layout'
import {
  filterPaymentsList,
  formatFcfa,
  module36ListStatusStyles,
} from './module36Data'

const PER_PAGE = 10

export default function Liste() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    async function loadPayments() {
      setLoading(true)
      setFetchError('')

      try {
        const response = await paiementApi.list()
        setPayments(extractList(response).map(mapPaiementToRow))
      } catch (error) {
        console.error('Failed to load paiements', error)
        setPayments([])
        setFetchError('Impossible de charger les paiements depuis le backend.')
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [])

  const filtered = useMemo(
    () => filterPaymentsList(payments, search),
    [payments, search],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * PER_PAGE
  const pageRows = filtered.slice(start, start + PER_PAGE)

  function handleSearchChange(value) {
    setSearch(value)
    setCurrentPage(1)
  }

  return (
    <Module36Layout>
      <div className="module36-page-header">
        <div className="module36-greeting" style={{ marginBottom: 0 }}>
          <h1>Paiements</h1>
          <p>Gérez et suivez tous les paiements de l&apos;école.</p>
        </div>
        <button type="button" className="module36-add-btn" onClick={() => navigate('/paiements/create')}>
          <span className="module36-add-btn-icon">+</span>
          Ajouter un paiement
        </button>
      </div>

      <div className="module36-list-filters">
        <div className="module36-list-filters-search">
          <span className="module36-search-icon">🔍</span>
          <input
            className="module36-search-input"
            value={search}
            onChange={event => handleSearchChange(event.target.value)}
            placeholder="Rechercher par élève, facture..."
          />
        </div>
      </div>

      {loading && <div className="module36-table-card" style={{ padding: 16 }}>Chargement des paiements…</div>}
      {fetchError && <div className="module36-table-card" style={{ padding: 16, color: '#b91c1c' }}>{fetchError}</div>}

      <div className="module36-table-card module36-list-table-wrap">
        <table className="module36-table">
          <thead>
            <tr>
              {['N° Facture', 'Élève', 'Classe', 'Type', 'Montant', 'Date', 'Statut', 'Actions'].map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Aucun paiement trouvé.</td></tr>
            )}
            {pageRows.map(row => {
              const status = module36ListStatusStyles[row.statut]

              return (
                <tr key={row.facture} className="list-row">
                  <td className="module36-table-invoice">{row.facture}</td>
                  <td className="module36-table-name">{row.eleve}</td>
                  <td>
                    <span
                      className="module36-class-badge"
                      style={{ background: `${row.classeColor}18`, color: row.classeColor }}
                    >
                      {row.classe}
                    </span>
                  </td>
                  <td className="module36-table-type">{row.type}</td>
                  <td className="module36-table-montant">{formatFcfa(row.montant)}</td>
                  <td className="module36-table-date">{row.date}</td>
                  <td>
                    <span
                      className="module36-list-status-badge"
                      style={{ background: status.bg, color: status.color }}
                    >
                      ● {row.statut}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="module36-invoice-link-btn"
                      onClick={() => navigate(`/paiements/factures/${row.factureId}`)}
                    >
                      📄 Facture
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="module36-pagination">
          <span className="module36-pagination-info">
            Affichage de {filtered.length === 0 ? 0 : start + 1} à {Math.min(start + PER_PAGE, filtered.length)} sur {filtered.length} paiements
          </span>
          <div className="module36-pagination-controls">
            <button type="button" className="module36-page-btn nav" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
              <button
                key={page}
                type="button"
                className={`module36-page-btn${safePage === page ? ' active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button type="button" className="module36-page-btn nav" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</button>
          </div>
        </div>
      </div>
    </Module36Layout>
  )
}
