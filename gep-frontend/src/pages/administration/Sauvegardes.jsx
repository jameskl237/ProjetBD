import { useEffect, useState } from 'react'
import { api } from '../../api'
import './Sauvegardes.css'

export default function Sauvegardes() {
  const [status, setStatus] = useState(null)
  const [checkedAt, setCheckedAt] = useState(null)
  const [loading, setLoading] = useState(true)

  async function checkHealth() {
    setLoading(true)
    try {
      const response = await api.get('/healthz')
      setStatus(response.data?.status === 'ok' ? 'ok' : 'error')
    } catch (error) {
      setStatus('error')
    } finally {
      setCheckedAt(new Date())
      setLoading(false)
    }
  }

  useEffect(() => { checkHealth() }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sauvegardes & état du système</h1>
          <p className="page-subtitle">Vérifiez la disponibilité du serveur backend.</p>
        </div>
        <button className="btn-primary" onClick={checkHealth} disabled={loading}>{loading ? '⏳ Vérification…' : '🔄 Revérifier'}</button>
      </div>

      <div className="backup-stats">
        <div className="card backup-stat-card">
          <div className={`backup-stat-icon ${status === 'ok' ? 'green' : 'purple'}`}>{status === 'ok' ? '✅' : status === 'error' ? '⛔' : '⏳'}</div>
          <div>
            <p className="backup-stat-label">État du serveur backend</p>
            <p className="backup-stat-value">{loading ? 'Vérification…' : status === 'ok' ? 'Opérationnel' : 'Indisponible'}</p>
            {checkedAt && <p className="backup-stat-sub">Dernière vérification : {checkedAt.toLocaleTimeString('fr-FR')}</p>}
          </div>
        </div>
      </div>

      <div className="card config-card">
        <h2 className="config-title">Sauvegardes de la base de données</h2>
        <p className="config-subtitle">
          Aucune fonctionnalité de sauvegarde automatisée n'est actuellement implémentée côté serveur.
          Les sauvegardes de la base de données doivent être gérées au niveau de l'infrastructure (ex. mysqldump planifié côté serveur MariaDB).
        </p>
      </div>
    </div>
  )
}
