import { useEffect, useState } from 'react';
import { classeApi, examenApi, api, extractData, extractList } from '../../api';
import useAuth from '../../hooks/useAuth';
import '../discipline/Discipline.css';
import './Notes.css';

const getInitiales = (nom, prenom) => `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}` || '?';
const getAppreciation = (n) => {
  if (n >= 18) return 'Excellent'; if (n >= 16) return 'Très Bien'; if (n >= 14) return 'Bien';
  if (n >= 12) return 'Assez Bien'; if (n >= 10) return 'Passable'; if (n >= 8) return 'Médiocre';
  return 'Insuffisant';
};

export default function NotesSaisie() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState('');
  const [cours, setCours] = useState([]);
  const [coursId, setCoursId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [epreuves, setEpreuves] = useState([]);
  const [epreuveId, setEpreuveId] = useState('');
  const [eleves, setEleves] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [mesCoursIds, setMesCoursIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const [classesRes, sessionsRes, epreuvesRes] = await Promise.all([
          classeApi.list(),
          examenApi.list(),
          api.get('/evaluations/epreuves'),
        ]);
        if (cancelled) return;
        setClasses(extractList(classesRes));
        setSessions(extractList(sessionsRes));
        setEpreuves(extractList(epreuvesRes));

        try {
          const ensRes = await api.get('/cours/enseignants');
          if (cancelled) return;
          const assignments = extractList(ensRes);
          const myIds = assignments
            .filter(a => a.idPers === user?.id)
            .map(a => a.idCours);
          setMesCoursIds(myIds);
        } catch { setMesCoursIds([]); }

        const classesList = extractList(classesRes);
        if (classesList.length > 0) setClasseId(String(classesList[0].idClasse));
      } catch {
        if (!cancelled) setFeedback('Impossible de charger les données depuis le backend.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true };
  }, []);

  useEffect(() => {
    if (!classeId) return;
    let cancelled = false;
    setStudentsLoading(true);
    Promise.all([classeApi.get(classeId), api.get(`/classes/${classeId}/eleves`)])
      .then(([classeRes, elevesRes]) => {
        if (cancelled) return;
        const classeData = extractData(classeRes);
        const allMatieres = Array.isArray(classeData.matieres) ? classeData.matieres : [];
        const matieres = mesCoursIds.length > 0
          ? allMatieres.filter(m => mesCoursIds.includes(m.idCours))
          : allMatieres;
        setCours(matieres);
        setCoursId(matieres.length > 0 ? String(matieres[0].idCours) : '');
        const students = extractList(elevesRes);
        setEleves(students);
        setNotes(students.reduce((acc, e) => ({ ...acc, [e.matricule]: { note: '', appreciation: '', saved: false } }), {}));
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les élèves de cette classe.'); })
      .finally(() => { if (!cancelled) setStudentsLoading(false); });
    return () => { cancelled = true };
  }, [classeId, mesCoursIds]);

  useEffect(() => {
    setNotes(eleves.reduce((acc, e) => ({ ...acc, [e.matricule]: { note: '', appreciation: '', saved: false } }), {}));
  }, [coursId]);

  function updateNote(matricule, value) {
    setNotes(prev => ({ ...prev, [matricule]: { ...prev[matricule], note: value, saved: false } }));
  }

  async function saveAll() {
    if (!coursId || !sessionId || !epreuveId) {
      setFeedback('Sélectionnez une matière, une session et une épreuve avant d\'enregistrer.');
      return;
    }
    const toSave = eleves.filter(e => notes[e.matricule]?.note !== '' && notes[e.matricule]?.note != null);
    if (toSave.length === 0) {
      setFeedback('Aucune note à enregistrer.');
      return;
    }
    setSaving(true);
    setFeedback('');
    try {
      await Promise.all(toSave.map(e => {
        const val = parseFloat(notes[e.matricule].note);
        return api.post('/evaluations', {
          note: val,
          appreciation: getAppreciation(val),
          matricule: e.matricule,
          idEpreuve: Number(epreuveId),
          idCours: Number(coursId),
          idSession: Number(sessionId),
        });
      }));
      setNotes(prev => {
        const next = { ...prev };
        toSave.forEach(e => { next[e.matricule] = { ...next[e.matricule], saved: true }; });
        return next;
      });
      setFeedback(`${toSave.length} note(s) enregistrée(s) avec succès.`);
    } catch (error) {
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Saisie des notes</h1>
          <p className="page-sub">Sélectionnez une classe, une matière et une épreuve pour saisir les notes.</p>
        </div>
      </div>

      <div className="card mb-18">
        <div className="filters-row">
          <div className="filter-group"><label>Classe</label>
            <select className="fselect" value={classeId} onChange={e => setClasseId(e.target.value)}>
              {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
            </select>
          </div>
          <div className="filter-group fg-2"><label>Matière</label>
            <select className="fselect" value={coursId} onChange={e => setCoursId(e.target.value)}>
              {cours.length === 0 && <option value="">Aucune matière pour cette classe</option>}
              {cours.map(m => <option key={m.idCours} value={m.idCours}>{m.libelle} (coeff {m.coefficient})</option>)}
            </select>
          </div>
          <div className="filter-group"><label>Session</label>
            <select className="fselect" value={sessionId} onChange={e => setSessionId(e.target.value)}>
              <option value="">Choisir…</option>
              {sessions.map(s => <option key={s.idSession} value={s.idSession}>{s.libelle}</option>)}
            </select>
          </div>
          <div className="filter-group"><label>Épreuve</label>
            <select className="fselect" value={epreuveId} onChange={e => setEpreuveId(e.target.value)}>
              <option value="">Choisir…</option>
              {epreuves.map(e => <option key={e.idEpreuve} value={e.idEpreuve}>{e.libelle}</option>)}
            </select>
          </div>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Élève</th><th>Note /20</th><th>Appréciation</th></tr>
            </thead>
            <tbody>
              {studentsLoading && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20 }}>Chargement des élèves…</td></tr>}
              {!studentsLoading && !loading && eleves.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20 }}>Aucun élève inscrit dans cette classe pour l'année active.</td></tr>
              )}
              {eleves.map(eleve => {
                const n = notes[eleve.matricule] || { note: '', saved: false };
                const val = parseFloat(n.note);
                const appre = n.note !== '' && !isNaN(val) ? getAppreciation(val) : '—';
                const noteColor = !isNaN(val) && n.note !== '' ? (val >= 10 ? '#059669' : '#E11D48') : '#1E1B4B';
                return (
                  <tr key={eleve.matricule}>
                    <td>
                      <div className="eleve-cell">
                        <div className="avatar">{getInitiales(eleve.nom, eleve.prenom)}</div>
                        <div><div className="cell-name">{eleve.prenom} {eleve.nom}</div><div className="cell-sub">{eleve.matricule}</div></div>
                      </div>
                    </td>
                    <td><input type="number" min="0" max="20" step="0.5" className="note-input" value={n.note} placeholder="—" style={{ color: noteColor, fontWeight: n.note !== '' ? 700 : 400 }} onChange={ev => updateNote(eleve.matricule, ev.target.value)} /></td>
                    <td style={{ fontStyle: appre === '—' ? 'italic' : 'normal', color: appre === '—' ? '#94a3b8' : '#1E1B4B' }}>{appre}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Les notes sont enregistrées dans la base via /api/evaluations.</span>
          <button className="btn-primary" onClick={saveAll} disabled={saving || eleves.length === 0}>
            {saving ? 'Enregistrement…' : 'Enregistrer toutes les notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
