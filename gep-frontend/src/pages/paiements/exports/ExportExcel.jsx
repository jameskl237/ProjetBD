import { useState } from 'react'
import { api } from '../../../api'
import Module36Layout from '../Module36Layout'

export default function ExportExcel() {
  const [format, setFormat] = useState('csv')
  const [downloading, setDownloading] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function handleDownload() {
    setDownloading(true)
    setFeedback('')
    try {
      const response = await api.get('/paiements/export', { params: { format }, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `paiements.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setFeedback("Impossible d'exporter les paiements.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Module36Layout>
      <div className="module36-page-header">
        <div className="module36-greeting" style={{ marginBottom: 0 }}>
          <h1>Export des paiements</h1>
          <p>Téléchargez le relevé complet des paiements enregistrés.</p>
        </div>
      </div>

      <div className="module36-filters-card">
        <div className="module36-filters-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label className="module36-filter-label" htmlFor="excel-format">Format</label>
            <div className="module36-select-wrap">
              <select id="excel-format" className="module36-select" value={format} onChange={event => setFormat(event.target.value)}>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>
        </div>
      </div>

      {feedback && <div className="module36-filters-card" style={{ padding: 16, color: '#b91c1c' }}>{feedback}</div>}

      <div className="module36-export-cards">
        <div className="module36-export-card">
          <div className="module36-export-card-icon">🧾</div>
          <h3>Relevé des paiements</h3>
          <p>Export complet de tous les paiements enregistrés, avec élève, montant, date et mode.</p>
          <button
            type="button"
            className="module36-btn-primary"
            style={{ marginBottom: 0 }}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? '⏳ Export…' : `⬇ Exporter .${format}`}
          </button>
        </div>
      </div>
    </Module36Layout>
  )
}
