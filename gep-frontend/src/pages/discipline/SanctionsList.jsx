import { useEffect, useState } from 'react';
import { eleveApi, anneeAcademiqueApi, api, extractList } from '../../api';
import './Discipline.css';

const getInitiales = (nom, prenom) => `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}` || '?';

export default function SanctionsList() {
  const [rapports, setRapports] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [anneeActive, setAnneeActive] = useState(null);
  const [eleveFilter, setEleveFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ matricule: '', idDiscipline: '', commentaire: '', event_date: '' });
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const [rapportsRes, elevesRes, disciplinesRes, anneesRes] = await Promise.all([
        api.get('/parents/rapports'),
        eleveApi.list(),
        api.get('/parents/disciplines'),
        anneeAcademiqueApi.list(),
      ]);
      setRapports(extractList(rapportsRes));
      setEleves(extractList(elevesRes));
      setDisciplines(extractList(disciplinesRes));
      const annees = extractList(anneesRes);
      const latest = annees.reduce((best, current) => (!best || current.idAnnee > best.idAnnee ? current : best), null);
      setAnneeActive(latest);
    } catch (error) {
      console.error('Failed to load sanctions', error);
      setFeedback('Impossible de charger les sanctions depuis le backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const sanctions = rapports
    .filter(r => r.idDiscipline != null)
    .map(r => ({
      id: r.idRap,
      nom: r.eleve ? `${r.eleve.prenom || ''} ${r.eleve.nom || ''}`.trim() : `Matricule #${r.matricule}`,
      initiales: getInitiales(r.eleve?.nom, r.eleve?.prenom),
      matricule: r.matricule,
      type: r.discipline?.libelle || 'Sanction',
      points: r.discipline?.points,
      description: r.commentaire,
      date: r.event_date ? new Date(r.event_date).toLocaleDateString('fr-FR') : '—',
      auteur: r.auteur ? `${r.auteur.prenom || ''} ${r.auteur.nom || ''}`.trim() : '—',
    }));

  const filtered = sanctions.filter(s =>
    (!eleveFilter || s.nom.toLowerCase().includes(eleveFilter.toLowerCase())) &&
    (!typeFilter || s.type === typeFilter)
  );

  const reset = () => { setEleveFilter(''); setTypeFilter(''); };

  async function saveSanction() {
    if (!form.matricule || !form.idDiscipline || !form.commentaire || !form.event_date) {
      setFeedback('Élève, type de sanction, description et date sont obligatoires.');
      return;
    }
    if (!anneeActive) {
      setFeedback('Aucune année académique active trouvée.');
      return;
    }
    setFeedback('');
    try {
      await api.post('/parents/rapports', {
        matricule: Number(form.matricule),
        idAca: anneeActive.idAnnee,
        commentaire: form.commentaire,
        event_date: form.event_date,
        idDiscipline: Number(form.idDiscipline),
      });
      setShowModal(false);
      setForm({ matricule: '', idDiscipline: '', commentaire: '', event_date: '' });
      loadAll();
    } catch (error) {
      console.error('Create sanction failed', error);
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de l’enregistrement de la sanction.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sanctions disciplinaires</h1>
          <p className="page-sub">Sanctions formellement classifiées appliquées aux élèves.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nouvelle sanction</button>
      </div>

      <div className="card mb-18">
        <div className="filters-row">
          <div className="filter-group fg-2">
            <label>Élève</label>
            <div className="input-icon">
              <input className="finput" placeholder="Tous les élèves" value={eleveFilter} onChange={e => setEleveFilter(e.target.value)} />
            </div>
          </div>
          <div className="filter-group fg-2">
            <label>Type de sanction</label>
            <select className="fselect" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Tous les types</option>
              {disciplines.map(d => <option key={d.ID} value={d.libelle}>{d.libelle}</option>)}
            </select>
          </div>
          <button className="btn-reset" onClick={reset} style={{ marginTop: 22 }}>Reset</button>
        </div>
      </div>

      <div className="card">
        {feedback && <div style={{ color: '#b91c1c', padding: '8px 12px' }}>{feedback}</div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Élève</th><th>Sanction</th><th>Points</th><th>Description</th><th>Date</th><th>Appliquée par</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="empty">Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty">Aucune sanction trouvée.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="eleve-cell">
                      <div className="avatar">{s.initiales}</div>
                      <div>
                        <div className="cell-name">{s.nom}</div>
                        <div className="cell-sub">{s.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13.5 }}>{s.type}</td>
                  <td>{s.points ?? '—'}</td>
                  <td style={{ maxWidth: 220 }}>{s.description}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{s.date}</td>
                  <td>{s.auteur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Nouvelle sanction</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="fgroup">
                <label>Élève</label>
                <select className="fselect" value={form.matricule} onChange={e => setForm({ ...form, matricule: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {eleves.map(e => <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom} — {e.matricule}</option>)}
                </select>
              </div>
              <div className="fgroup">
                <label>Type de sanction</label>
                <select className="fselect" value={form.idDiscipline} onChange={e => setForm({ ...form, idDiscipline: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {disciplines.map(d => <option key={d.ID} value={d.ID}>{d.libelle}</option>)}
                </select>
              </div>
              <div className="fgroup"><label>Description</label><textarea className="finput ftextarea" placeholder="Décrivez la sanction..." value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} /></div>
              <div className="fgroup"><label>Date</label><input type="date" className="finput" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
            </div>
            <div className="modal-foot">
              <button className="btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={saveSanction}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
