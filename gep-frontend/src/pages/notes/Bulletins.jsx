import { useEffect, useMemo, useState } from 'react';
import { classeApi, api, extractData, extractList } from '../../api';
import '../discipline/Discipline.css';
import './Notes.css';
import './Bulletin.css';

const getAppreciation = (n) => {
  if (n >= 18) return 'Excellent'; if (n >= 16) return 'Très Bien'; if (n >= 14) return 'Bien';
  if (n >= 12) return 'Assez Bien'; if (n >= 10) return 'Passable'; if (n >= 8) return 'Médiocre';
  return 'Insuffisant';
};

export default function Bulletins() {
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState('');
  const [eleves, setEleves] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [search, setSearch] = useState('');
  const [eleveId, setEleveId] = useState('');
  const [bulletin, setBulletin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bulletinLoading, setBulletinLoading] = useState(false);
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
    setEleveId('');
    setBulletin(null);
    Promise.all([classeApi.get(classeId), api.get(`/classes/${classeId}/eleves`), api.get('/evaluations')])
      .then(([classeRes, elevesRes, evalsRes]) => {
        if (cancelled) return;
        const classeData = extractData(classeRes);
        setMatieres(Array.isArray(classeData.matieres) ? classeData.matieres : []);
        setEleves(extractList(elevesRes));
        setEvaluations(extractList(evalsRes));
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les élèves de cette classe.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true };
  }, [classeId]);

  useEffect(() => {
    if (!eleveId) { setBulletin(null); return; }
    let cancelled = false;
    setBulletinLoading(true);
    api.get(`/evaluations/bulletin/${eleveId}`)
      .then(response => { if (!cancelled) setBulletin(extractData(response)); })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger le bulletin de cet élève.'); })
      .finally(() => { if (!cancelled) setBulletinLoading(false); });
    return () => { cancelled = true };
  }, [eleveId]);

  const classAverages = useMemo(() => {
    return eleves.map(eleve => {
      let totalPoints = 0;
      let totalCoef = 0;
      matieres.forEach(m => {
        const notes = evaluations.filter(ev => ev.matricule === eleve.matricule && ev.idCours === m.idCours).map(ev => Number(ev.note));
        if (notes.length === 0) return;
        const avg = notes.reduce((a, b) => a + b, 0) / notes.length;
        totalPoints += avg * (m.coefficient || 1);
        totalCoef += m.coefficient || 1;
      });
      return { matricule: eleve.matricule, moyenne: totalCoef > 0 ? totalPoints / totalCoef : null };
    }).filter(e => e.moyenne != null).sort((a, b) => b.moyenne - a.moyenne);
  }, [eleves, matieres, evaluations]);

  const selectedEleve = eleves.find(e => String(e.matricule) === eleveId);
  const rangInfo = useMemo(() => {
    if (!eleveId) return null;
    const idx = classAverages.findIndex(e => String(e.matricule) === eleveId);
    if (idx === -1) return { rang: '—', max: '—', min: '—' };
    return {
      rang: idx + 1,
      max: classAverages[0]?.moyenne.toFixed(2),
      min: classAverages[classAverages.length - 1]?.moyenne.toFixed(2),
    };
  }, [eleveId, classAverages]);

  const filteredEleves = eleves.filter(e => !search || `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase()));

  async function handleDownloadPdf() {
    if (!eleveId) return;
    setExporting(true);
    try {
      const response = await api.get(`/evaluations/bulletin/${eleveId}/export`, { params: { format: 'pdf' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulletin_${eleveId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setFeedback('Impossible de télécharger le bulletin PDF.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Bulletin de notes</h1><p className="page-sub">Bulletin généré à partir des évaluations réellement enregistrées.</p></div>
        {eleveId && <button className="btn-primary" onClick={handleDownloadPdf} disabled={exporting}>{exporting ? 'Export…' : 'Télécharger le PDF officiel'}</button>}
      </div>

      <div className="card mb-18">
        <div className="filters-row">
          <div className="filter-group"><label>Classe</label>
            <select className="fselect" value={classeId} onChange={e => setClasseId(e.target.value)}>
              {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
            </select>
          </div>
          <div className="filter-group fg-2"><label>Rechercher</label>
            <div className="input-icon"><input className="finput" placeholder="Nom ou prénom..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
          <div className="filter-group fg-2"><label>Élève</label>
            <select className="fselect" value={eleveId} onChange={e => setEleveId(e.target.value)}>
              <option value="">Choisir...</option>
              {filteredEleves.map(e => <option key={e.matricule} value={e.matricule}>{e.nom} {e.prenom}</option>)}
            </select>
          </div>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      {!eleveId && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', marginBottom: 12 }}>
            {loading ? 'Chargement…' : `${filteredEleves.length} élève(s) dans cette classe`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {filteredEleves.map(e => (
              <button key={e.matricule} onClick={() => setEleveId(String(e.matricule))}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#F8FAFF', border: '1.5px solid #EDE9FE', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#3B0764,#4C1D95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>{(e.prenom?.[0] || '')}{(e.nom?.[0] || '')}</div>
                <div><div style={{ fontWeight: 600, fontSize: 13, color: '#1E1B4B' }}>{e.nom} {e.prenom}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{e.matricule}</div></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {eleveId && bulletinLoading && <div className="card" style={{ padding: 20 }}>Chargement du bulletin…</div>}

      {eleveId && !bulletinLoading && bulletin && (
        <div className="bulletin-container">
          <div className="bulletin-header">
            <div className="bulletin-header-center" style={{ margin: '0 auto' }}>
              <div className="bul-logo-name">GEP <span style={{ color: '#06B6D4' }}>Nebula</span></div>
              <div className="bul-title">BULLETIN DE NOTES</div>
            </div>
          </div>

          <div className="bul-eleve-wrap">
            <div className="bul-eleve-info">
              <div className="bul-info-row">
                <span className="bul-label">Nom et Prénom :</span><span className="bul-value">{selectedEleve?.nom} {selectedEleve?.prenom}</span>
                <span className="bul-label" style={{ marginLeft: 16 }}>Matricule :</span><span className="bul-value">{eleveId}</span>
                {rangInfo && <><span className="bul-label" style={{ marginLeft: 16 }}>Rang :</span><span className="bul-value" style={{ color: '#4C1D95' }}>{rangInfo.rang} / {classAverages.length}</span></>}
              </div>
            </div>
          </div>

          {bulletin.sessions.length === 0 ? (
            <p className="hint" style={{ padding: 16 }}>Aucune évaluation enregistrée pour cet élève.</p>
          ) : bulletin.sessions.map(s => (
            <div key={s.session} style={{ marginBottom: 20 }}>
              <table className="bul-table">
                <thead>
                  <tr>
                    <th className="col-mat">MATIÈRE — {s.session}</th>
                    <th className="col-coeff">Coeff</th>
                    <th className="col-note">Note /20</th>
                    <th className="col-note">Note×Coeff</th>
                    <th className="col-appre">Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {s.lignes.map((ligne, i) => (
                    <tr key={i}>
                      <td className="col-mat">{ligne.cours}</td>
                      <td className="col-coeff">{ligne.coef}</td>
                      <td className="col-note" style={{ color: ligne.note >= 10 ? '#059669' : '#E11D48', fontWeight: 700 }}>{ligne.note}</td>
                      <td className="col-note">{(ligne.note * ligne.coef).toFixed(1)}</td>
                      <td className="col-appre" style={{ fontStyle: 'italic', color: '#6B7280' }}>{ligne.appreciation || getAppreciation(ligne.note)}</td>
                    </tr>
                  ))}
                  <tr className="bul-moy-row">
                    <td colSpan={4} style={{ fontStyle: 'italic', color: '#4C1D95', fontWeight: 600 }}>Moyenne de session :</td>
                    <td style={{ fontWeight: 700, color: s.moyenne >= 10 ? '#059669' : '#E11D48' }}>{s.moyenne} / 20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          <div className="bul-resultats">
            <div className="bul-res-title">Résultats</div>
            <table className="bul-resume">
              <thead><tr><th>Moyenne Générale</th><th>Rang</th><th>Moy. Max Classe</th><th>Moy. Min Classe</th><th>Appréciation</th></tr></thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700, color: bulletin.moyenneGenerale >= 10 ? '#4C1D95' : '#E11D48', fontSize: 14 }}>{bulletin.moyenneGenerale} / 20</td>
                  <td style={{ fontWeight: 700, color: '#4C1D95' }}>{rangInfo?.rang} / {classAverages.length}</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>{rangInfo?.max}</td>
                  <td style={{ color: '#E11D48', fontWeight: 600 }}>{rangInfo?.min}</td>
                  <td style={{ fontStyle: 'italic', color: '#6B7280' }}>{getAppreciation(bulletin.moyenneGenerale)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
