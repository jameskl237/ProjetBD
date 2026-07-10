import { useEffect, useState } from 'react';
import { eleveApi, anneeAcademiqueApi, api, extractList } from '../../api';
import './Discipline.css';

const getInitiales = (nom, prenom) => `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}` || '?';

function graviteFromPoints(points) {
  if (points == null) return 'Non classé';
  if (points >= 4) return 'Grave';
  if (points >= 2) return 'Moyenne';
  return 'Faible';
}

const PER_PAGE = 10;

export default function IncidentsList() {
  const [rapports, setRapports] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [anneeActive, setAnneeActive] = useState(null);
  const [search, setSearch] = useState('');
  const [gravite, setGravite] = useState('');
  const [page, setPage] = useState(1);
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
      console.error('Failed to load incidents', error);
      setFeedback('Impossible de charger les incidents depuis le backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const items = rapports.map(r => ({
    id: r.idRap,
    nom: r.eleve ? `${r.eleve.prenom || ''} ${r.eleve.nom || ''}`.trim() : `Matricule #${r.matricule}`,
    initiales: getInitiales(r.eleve?.nom, r.eleve?.prenom),
    matricule: r.matricule,
    type: r.discipline?.libelle || 'Non classé',
    gravite: graviteFromPoints(r.discipline?.points),
    date: r.event_date ? new Date(r.event_date).toLocaleDateString('fr-FR') : '—',
    commentaire: r.commentaire,
    auteur: r.auteur ? `${r.auteur.prenom || ''} ${r.auteur.nom || ''}`.trim() : '—',
  }));

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    return (!search || i.nom.toLowerCase().includes(s) || String(i.matricule).includes(s) || i.type.toLowerCase().includes(s))
      && (!gravite || i.gravite === gravite);
  });

  const total = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const reset = () => { setSearch(''); setGravite(''); setPage(1); };

  const badgeGravite = g => g === 'Grave' ? 'badge badge-grave' : g === 'Moyenne' ? 'badge badge-moyenne' : g === 'Faible' ? 'badge badge-faible' : 'badge';

  async function saveIncident() {
    if (!form.matricule || !form.commentaire || !form.event_date) {
      setFeedback('Élève, description et date sont obligatoires.');
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
        idDiscipline: form.idDiscipline ? Number(form.idDiscipline) : null,
      });
      setShowModal(false);
      setForm({ matricule: '', idDiscipline: '', commentaire: '', event_date: '' });
      loadAll();
    } catch (error) {
      console.error('Create incident failed', error);
      setFeedback(error?.response?.data?.error || error?.message || 'Erreur lors de l’enregistrement de l’incident.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion de la discipline</h1>
          <p className="page-sub">Liste des incidents signalés au sein de l'établissement.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nouvel incident</button>
      </div>

      <div className="card mb-18">
        <div className="filters-row">
          <div className="filter-group fg-2">
            <label>Recherche</label>
            <div className="input-icon">
              <input className="finput" placeholder="Nom, matricule, type..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
          <div className="filter-group">
            <label>Gravité</label>
            <select className="fselect" value={gravite} onChange={e => { setGravite(e.target.value); setPage(1); }}>
              <option value="">Toutes</option><option>Faible</option><option>Moyenne</option><option>Grave</option><option>Non classé</option>
            </select>
          </div>
          <button className="btn-reset" onClick={reset}>Réinitialiser les filtres</button>
        </div>
      </div>

      <div className="card">
        {feedback && <div style={{ color: '#b91c1c', padding: '8px 12px' }}>{feedback}</div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Élève</th><th>Type</th><th>Gravité</th><th>Date</th><th>Rapporté par</th><th>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="empty">Chargement…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={6} className="empty">Aucun incident trouvé.</td></tr>
              ) : pageItems.map(inc => (
                <tr key={inc.id}>
                  <td>
                    <div className="eleve-cell">
                      <div className="avatar">{inc.initiales}</div>
                      <div>
                        <div className="cell-name">{inc.nom}</div>
                        <div className="cell-sub">{inc.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td>{inc.type}</td>
                  <td><span className={badgeGravite(inc.gravite)}>{inc.gravite}</span></td>
                  <td>{inc.date}</td>
                  <td>{inc.auteur}</td>
                  <td style={{ maxWidth: 260 }}>{inc.commentaire}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <span>{filtered.length} incident(s) — page {page} / {total || 1}</span>
          <div className="pagination">
            <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Previous</button>
            {Array.from({ length: total }, (_, i) => i + 1).map(p => (
              <button key={p} className={`pg-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="pg-btn" onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total || total === 0}>Next ›</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Nouvel incident</h2>
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
                <label>Type d'incident</label>
                <select className="fselect" value={form.idDiscipline} onChange={e => setForm({ ...form, idDiscipline: e.target.value })}>
                  <option value="">Non classé</option>
                  {disciplines.map(d => <option key={d.ID} value={d.ID}>{d.libelle}</option>)}
                </select>
              </div>
              <div className="fgroup"><label>Date</label><input type="date" className="finput" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
              <div className="fgroup"><label>Description</label><textarea className="finput ftextarea" placeholder="Décrivez l'incident..." value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} /></div>
            </div>
            <div className="modal-foot">
              <button className="btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={saveIncident}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
