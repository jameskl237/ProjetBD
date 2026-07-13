import { useEffect, useState, useRef, useCallback } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import SelectField from '../../components/forms/SelectField'
import Spinner from '../../components/ui/Spinner'
import { bulletinApi, evaluationsApi } from '../../api/evaluations.api'
import { elevesApi } from '../../api/eleves.api'
import { classesApi } from '../../api/classes.api'

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden; }
    .print-area, .print-area * { visibility: visible; }
    .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
    .no-print { display: none !important; }
  }
`

export default function Bulletins() {
  return (
    <div>
      <PageHeader title="Bulletins" subtitle="Consultation et impression des bulletins validés" />
      <BulletinSearch />
    </div>
  )
}

function BulletinSearch() {
  const [eleves, setEleves] = useState([])
  const [classes, setClasses] = useState([])
  const [matricule, setMatricule] = useState('')
  const [classeId, setClasseId] = useState('')
  const [bulletin, setBulletin] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [evaluations, setEvaluations] = useState([])
  const printRef = useRef()

  useEffect(() => {
    Promise.all([elevesApi.list(), classesApi.list()])
      .then(([e, c]) => { setEleves(e); setClasses(c) })
      .catch(() => {})
  }, [])

  const filteredEleves = classeId
    ? eleves.filter((e) => String(e.idClasse) === classeId)
    : eleves

  const handleLoad = useCallback(async () => {
    if (!matricule) return
    setLoading(true)
    setError('')
    setBulletin(null)
    setEvaluations([])
    try {
      const b = await bulletinApi.get(matricule)
      setBulletin(b)
      const evs = await evaluationsApi.list()
      setEvaluations(evs.filter((e) => e.matricule === Number(matricule) && e.valider))
    } catch (err) {
      setError(err.response?.data?.error || 'Élève introuvable ou aucun bulletin disponible')
    } finally {
      setLoading(false)
    }
  }, [matricule])

  const handlePrint = useCallback(() => {
    const printContent = printRef.current
    if (!printContent) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Bulletin</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { font-size: 16px; margin: 0; }
        .header h2 { font-size: 13px; font-weight: normal; color: #555; margin: 4px 0 0; }
        .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 16px; font-size: 11px; }
        .session-block { margin-bottom: 16px; }
        .session-title { font-weight: 700; font-size: 13px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th, td { border: 1px solid #ddd; padding: 5px 8px; text-align: left; font-size: 11px; }
        th { background: #f5f5f5; font-weight: 600; }
        .moyenne { font-weight: 700; text-align: right; font-size: 12px; padding: 6px 0; }
        .moyenne-generale { border-top: 2px solid #1a1a1a; margin-top: 12px; padding-top: 10px; text-align: center; font-size: 14px; font-weight: 800; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
        .validated-stamp { text-align: center; margin-top: 16px; color: #16a34a; font-weight: 700; font-size: 11px; }
      </style></head><body>
      ${printContent.innerHTML}
      <script>window.onload=function(){window.print();window.close()}</script>
      </body></html>
    `)
    win.document.close()
  }, [])

  return (
    <>
      <style>{PRINT_STYLES}</style>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <SelectField
            label="Classe (filtre)"
            value={classeId}
            onChange={(e) => { setClasseId(e.target.value); setMatricule(''); setBulletin(null); setError('') }}
            options={[{ value: '', label: 'Toutes les classes' }, ...classes.map((c) => ({ value: c.idClasse, label: c.libelle || `Classe #${c.idClasse}` }))]}
            style={{ flex: 1, minWidth: 160 }}
          />
          <SelectField
            label="Élève"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            options={filteredEleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom} (#${e.matricule})` }))}
            style={{ flex: 2, minWidth: 220 }}
          />
          <Button onClick={handleLoad} disabled={!matricule || loading}>
            {loading ? 'Chargement…' : 'Afficher le bulletin'}
          </Button>
          {bulletin && (
            <Button variant="secondary" onClick={handlePrint} className="no-print">
              Imprimer
            </Button>
          )}
        </div>
        <Alert tone="error">{error}</Alert>
      </Card>

      {loading && <Spinner label="Génération du bulletin…" />}

      {bulletin && (
        <Card>
          <div ref={printRef} className="print-area">
            <div className="header">
              <h1>BULLETIN DE NOTES</h1>
              <h2>GEP — Gestion d'Établissement de Formation</h2>
            </div>

            <div className="student-info">
              <div><strong>Matricule :</strong> {bulletin.eleve.matricule}</div>
              <div><strong>Nom :</strong> {bulletin.eleve.nom} {bulletin.eleve.prenom}</div>
              <div><strong>Sexe :</strong> {bulletin.eleve.sexe === 1 ? 'Masculin' : 'Féminin'}</div>
              {bulletin.eleve.dateNaissance && (
                <div><strong>Né(e) le :</strong> {new Date(bulletin.eleve.dateNaissance).toLocaleDateString('fr-FR')}</div>
              )}
            </div>

            {bulletin.sessions.map((s, i) => (
              <div key={i} className="session-block">
                <div className="session-title">Session : {s.session}</div>
                <table>
                  <thead>
                    <tr>
                      <th>Cours</th>
                      <th>Coef.</th>
                      <th>Note /20</th>
                      <th>Pts pondérés</th>
                      <th>Appréciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.lignes.map((l, j) => (
                      <tr key={j}>
                        <td>{l.cours}</td>
                        <td>{l.coef}</td>
                        <td>{l.note}</td>
                        <td>{Math.round(l.note * l.coef * 100) / 100}</td>
                        <td>{l.appreciation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="moyenne">
                  Moyenne de session : {s.moyenne}/20 — {s.moyenne >= 16 ? 'Très Bien' : s.moyenne >= 14 ? 'Bien' : s.moyenne >= 12 ? 'Assez Bien' : s.moyenne >= 10 ? 'Passable' : 'Insuffisant'}
                </div>
              </div>
            ))}

            <div className="moyenne-generale">
              MOYENNE GÉNÉRALE : {bulletin.moyenneGenerale}/20 —{' '}
              {bulletin.moyenneGenerale >= 10 ? 'ADMIS(E)' : 'À REPRENDRE'}
            </div>

            <div className="validated-stamp">
              ✓ Bulletin validé par la Direction
            </div>

            <div className="footer">
              Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
