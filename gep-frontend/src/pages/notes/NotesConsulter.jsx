import { useEffect, useMemo, useState } from 'react';
import { classeApi, api, extractData, extractList } from '../../api';
import '../discipline/Discipline.css';
import './Notes.css';

const getInitiales = (nom, prenom) => `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}` || '?';
const getAppreciation = (n) => {
  if (n >= 18) return 'Excellent'; if (n >= 16) return 'Très Bien'; if (n >= 14) return 'Bien';
  if (n >= 12) return 'Assez Bien'; if (n >= 10) return 'Passable'; if (n >= 8) return 'Médiocre';
  return 'Insuffisant';
};

export default function NotesConsulter() {
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState('');
  const [matieres, setMatieres] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [search, setSearch] = useState('');
  const [vue, setVue] = useState('classe');
  const [selectedMatricule, setSelectedMatricule] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let cancelled = false;
    classeApi.list()
      .then(response => {
        if (cancelled) return;
        const list = extractList(response);
        setClasses(list);
        if (list.length > 0) setClasseId(String(list[0].idClasse));
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les classes.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true };
  }, []);

  useEffect(() => {
    if (!classeId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([classeApi.get(classeId), api.get(`/classes/${classeId}/eleves`), api.get('/evaluations')])
      .then(([classeRes, elevesRes, evalsRes]) => {
        if (cancelled) return;
        const classeData = extractData(classeRes);
        setMatieres(Array.isArray(classeData.matieres) ? classeData.matieres : []);
        const students = extractList(elevesRes);
        setEleves(students);
        setSelectedMatricule(students[0]?.matricule ? String(students[0].matricule) : '');
        setEvaluations(extractList(evalsRes));
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les notes de cette classe.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true };
  }, [classeId]);

  const evalsByStudentAndCours = useMemo(() => {
    const map = new Map();
    evaluations.forEach(ev => {
      const key = `${ev.matricule}-${ev.idCours}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(Number(ev.note));
    });
    return map;
  }, [evaluations]);

  function averageFor(matricule, idCours) {
    const notes = evalsByStudentAndCours.get(`${matricule}-${idCours}`) || [];
    if (notes.length === 0) return null;
    return notes.reduce((a, b) => a + b, 0) / notes.length;
  }

  function moyenneGenerale(matricule) {
    let totalPoints = 0;
    let totalCoef = 0;
    matieres.forEach(m => {
      const avg = averageFor(matricule, m.idCours);
      if (avg == null) return;
      totalPoints += avg * (m.coefficient || 1);
      totalCoef += m.coefficient || 1;
    });
    return totalCoef > 0 ? totalPoints / totalCoef : null;
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return eleves.filter(e => !query || `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(query));
  }, [eleves, search]);

  const selectedStudent = eleves.find(e => String(e.matricule) === selectedMatricule);

  async function handleExportPdf() {
    if (!selectedMatricule) return;
    setExporting(true);
    try {
      const response = await api.get(`/evaluations/bulletin/${selectedMatricule}/export`, { params: { format: 'pdf' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulletin_${selectedMatricule}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setFeedback("Impossible d'exporter le bulletin.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Consulter les notes</h1>
          <p className="page-sub">Notes réelles issues des évaluations enregistrées.</p>
        </div>
        {vue === 'eleve' && selectedMatricule && (
          <button className="btn-outline" onClick={handleExportPdf} disabled={exporting}>
            {exporting ? 'Export…' : 'Exporter le bulletin PDF'}
          </button>
        )}
      </div>

      <div className="card mb-18">
        <div className="filters-row">
          <div className="filter-group"><label>Classe</label>
            <select className="fselect" value={classeId} onChange={e => setClasseId(e.target.value)}>
              {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
            </select>
          </div>
          <div className="filter-group fg-2"><label>Élève</label>
            <div className="input-icon">
              <input className="finput" placeholder="Nom ou matricule..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      <div className="vue-tabs">
        <button className={`vue-tab${vue === 'classe' ? ' active' : ''}`} onClick={() => setVue('classe')}>Vue par classe</button>
        <button className={`vue-tab${vue === 'eleve' ? ' active' : ''}`} onClick={() => setVue('eleve')}>Vue par élève</button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 20 }}>Chargement…</div>
      ) : vue === 'classe' ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Élève</th>
                  {matieres.map(m => (
                    <th key={m.idCours} style={{ fontSize: 9.5, maxWidth: 60, whiteSpace: 'normal', textAlign: 'center' }}>
                      {m.libelle}<br /><span style={{ color: '#06B6D4' }}>c{m.coefficient}</span>
                    </th>
                  ))}
                  <th style={{ color: '#4C1D95' }}>Moyenne</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={matieres.length + 2} style={{ textAlign: 'center', padding: 20 }}>Aucun élève inscrit dans cette classe.</td></tr>}
                {filtered.map(eleve => {
                  const moy = moyenneGenerale(eleve.matricule);
                  return (
                    <tr key={eleve.matricule}>
                      <td>
                        <div className="eleve-cell">
                          <div className="avatar">{getInitiales(eleve.nom, eleve.prenom)}</div>
                          <div><div className="cell-name">{eleve.prenom} {eleve.nom}</div><div className="cell-sub">{eleve.matricule}</div></div>
                        </div>
                      </td>
                      {matieres.map(m => {
                        const avg = averageFor(eleve.matricule, m.idCours);
                        return (
                          <td key={m.idCours} style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, color: avg == null ? '#94a3b8' : avg >= 10 ? '#059669' : '#E11D48' }}>{avg != null ? avg.toFixed(1) : '—'}</span>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center' }}><strong style={{ fontSize: 14, color: moy == null ? '#94a3b8' : moy >= 10 ? '#4C1D95' : '#E11D48' }}>{moy != null ? moy.toFixed(2) : '—'}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="card mb-18">
            <div className="filters-row">
              <div className="filter-group fg-2"><label>Élève sélectionné</label>
                <select className="fselect" value={selectedMatricule} onChange={e => setSelectedMatricule(e.target.value)}>
                  {filtered.map(e => <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom} — {e.matricule}</option>)}
                </select>
              </div>
            </div>
          </div>
          {selectedStudent && (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Matière</th><th>Coefficient</th><th style={{ textAlign: 'center' }}>Note /20</th><th style={{ textAlign: 'center' }}>Note × Coeff</th><th>Appréciation</th></tr>
                  </thead>
                  <tbody>
                    {matieres.map(m => {
                      const avg = averageFor(selectedStudent.matricule, m.idCours);
                      return (
                        <tr key={m.idCours}>
                          <td style={{ fontWeight: 500 }}>{m.libelle}</td>
                          <td style={{ color: '#06B6D4', fontWeight: 600 }}>{m.coefficient}</td>
                          <td style={{ textAlign: 'center' }}><span style={{ fontWeight: 700, color: avg == null ? '#94a3b8' : avg >= 10 ? '#059669' : '#E11D48' }}>{avg != null ? avg.toFixed(1) : '—'}</span></td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{avg != null ? (avg * m.coefficient).toFixed(1) : '—'}</td>
                          <td style={{ color: '#6B7280', fontStyle: 'italic' }}>{avg != null ? getAppreciation(avg) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
