import { useEffect, useMemo, useState } from 'react';
import { classeApi, examenApi, trimestreApi, api, extractData, extractList } from '../../api';
import '../discipline/Discipline.css';
import './Notes.css';

const getInitiales = (nom, prenom) => `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}` || '?';

export default function Moyennes() {
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState('');
  const [matieres, setMatieres] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [trimestres, setTrimestres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([classeApi.list(), examenApi.list(), trimestreApi.list()])
      .then(([classesRes, sessionsRes, trimestresRes]) => {
        if (cancelled) return;
        const list = extractList(classesRes);
        setClasses(list);
        if (list.length > 0) setClasseId(String(list[0].idClasse));
        setSessions(extractList(sessionsRes));
        const trims = extractList(trimestresRes).sort((a, b) => a.idTrimes - b.idTrimes);
        setTrimestres(trims);
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les données depuis le backend.'); })
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
        setEleves(extractList(elevesRes));
        setEvaluations(extractList(evalsRes));
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les notes de cette classe.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true };
  }, [classeId]);

  const sessionToTrimestre = useMemo(() => new Map(sessions.map(s => [s.idSession, s.idTrimestre])), [sessions]);

  const elevesMoyennes = useMemo(() => {
    return eleves.map(eleve => {
      const trimestreMoyennes = trimestres.map(trimestre => {
        let totalPoints = 0;
        let totalCoef = 0;
        matieres.forEach(m => {
          const notes = evaluations.filter(ev =>
            ev.matricule === eleve.matricule &&
            ev.idCours === m.idCours &&
            sessionToTrimestre.get(ev.idSession) === trimestre.idTrimes
          ).map(ev => Number(ev.note));
          if (notes.length === 0) return;
          const avg = notes.reduce((a, b) => a + b, 0) / notes.length;
          totalPoints += avg * (m.coefficient || 1);
          totalCoef += m.coefficient || 1;
        });
        return totalCoef > 0 ? totalPoints / totalCoef : null;
      });
      const validTrimestres = trimestreMoyennes.filter(m => m != null);
      const moyAnnuelle = validTrimestres.length > 0 ? validTrimestres.reduce((a, b) => a + b, 0) / validTrimestres.length : null;
      return { ...eleve, trimestreMoyennes, moyAnnuelle };
    }).sort((a, b) => (b.moyAnnuelle ?? -1) - (a.moyAnnuelle ?? -1));
  }, [eleves, trimestres, matieres, evaluations, sessionToTrimestre]);

  const withMoyenne = elevesMoyennes.filter(e => e.moyAnnuelle != null);
  const moyClasse = withMoyenne.length > 0 ? withMoyenne.reduce((a, e) => a + e.moyAnnuelle, 0) / withMoyenne.length : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Moyennes par classe</h1>
          <p className="page-sub">Moyennes calculées à partir des évaluations réellement enregistrées.</p>
        </div>
      </div>

      <div className="card mb-18">
        <div className="filters-row">
          <div className="filter-group"><label>Classe</label>
            <select className="fselect" value={classeId} onChange={e => setClasseId(e.target.value)}>
              {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
            </select>
          </div>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: 'Effectif', val: elevesMoyennes.length, color: '#4C1D95' },
          { label: 'Moyenne classe', val: moyClasse != null ? `${moyClasse.toFixed(2)}/20` : '—', color: '#059669' },
          { label: 'Admis (≥10)', val: withMoyenne.filter(e => e.moyAnnuelle >= 10).length, color: '#0891B2' },
          { label: 'À soutenir (<10)', val: withMoyenne.filter(e => e.moyAnnuelle < 10).length, color: '#E11D48' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 4, fontFamily: 'Outfit,sans-serif' }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>Rang</th>
                <th>Élève</th>
                {trimestres.map(t => <th key={t.idTrimes} style={{ textAlign: 'center' }}>Moy. {t.libelle}</th>)}
                <th style={{ textAlign: 'center', color: '#4C1D95' }}>Moy. Annuelle</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={trimestres.length + 3} style={{ textAlign: 'center', padding: 20 }}>Chargement…</td></tr>}
              {!loading && elevesMoyennes.length === 0 && <tr><td colSpan={trimestres.length + 3} style={{ textAlign: 'center', padding: 20 }}>Aucun élève inscrit dans cette classe.</td></tr>}
              {elevesMoyennes.map((eleve, index) => {
                const rang = index + 1;
                const isTop = rang <= 3 && eleve.moyAnnuelle != null;
                const isBad = eleve.moyAnnuelle != null && eleve.moyAnnuelle < 10;
                return (
                  <tr key={eleve.matricule} style={{ background: isBad ? 'rgba(225,29,72,0.04)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, margin: '0 auto', background: isTop ? 'linear-gradient(135deg,#3B0764,#4C1D95)' : '#F8FAFF', color: isTop ? 'white' : '#6B7280', border: isTop ? 'none' : '1.5px solid #EDE9FE' }}>{rang}</div>
                    </td>
                    <td>
                      <div className="eleve-cell">
                        <div className="avatar">{getInitiales(eleve.nom, eleve.prenom)}</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="cell-name">{eleve.prenom} {eleve.nom}</span>
                            {isTop && <span className="perf-top">Top</span>}
                            {isBad && <span className="perf-soutenir">À soutenir</span>}
                          </div>
                          <div className="cell-sub">{eleve.matricule}</div>
                        </div>
                      </div>
                    </td>
                    {eleve.trimestreMoyennes.map((m, i) => (
                      <td key={i} style={{ textAlign: 'center', color: '#6B7280' }}>{m != null ? m.toFixed(2) : '—'}</td>
                    ))}
                    <td style={{ textAlign: 'center' }}><strong style={{ fontSize: 15, color: eleve.moyAnnuelle == null ? '#94a3b8' : eleve.moyAnnuelle >= 10 ? '#4C1D95' : '#E11D48' }}>{eleve.moyAnnuelle != null ? eleve.moyAnnuelle.toFixed(2) : '—'}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <span>{elevesMoyennes.length} élève(s)</span>
        </div>
      </div>
    </div>
  );
}
