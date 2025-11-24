// src/pages/Monetization.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useOutletContext } from 'react-router-dom';

/* --- ICÔNES (même style partout) --- */
const IconPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IconEdit = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5.5 7.5 7.5A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;

/* --- STYLE IDENTIQUE aux autres pages admin --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  @media (max-width: 900px) {
    main { margin-left: 0 !important; padding: 1rem !important; width: 100% !important; }
  }
  .dashboard-wrapper {
    font-family: 'Inter', sans-serif;
    color: #1e293b;
    width: 100%;
    min-height: 100vh;
    padding: 1rem;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: hidden;
  }
  .dashboard-container {
    width: 100%;
    max-width: 1100px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .header { text-align: center; margin-bottom: 0.5rem; }
  .header h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    color: #b91c1c;
    line-height: 1.2;
  }
  .header p { color: #64748b; font-size: 0.9rem; max-width: 600px; margin: 0 auto; }
  .card {
    background: white;
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .list-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
    align-items: flex-start;
  }
  .btn-primary {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.75rem 1.2rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .table-wrapper { width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: #f1f5f9;
    padding: 0.85rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
  }
  td {
    padding: 0.85rem;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.9rem;
    color: #334155;
  }
  .badge-subscribers {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .badge-active { background: #dcfce7; color: #166534; }
  .badge-inactive { background: #fee2e2; color: #991b1b; }
  .btn-edit, .btn-delete {
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
  }
  .btn-edit { background: #dbeafe; color: #1d4ed8; }
  .btn-delete { background: #fecaca; color: #b91c1c; }
  .btn-edit:hover { background: #bfdbfe; }
  .btn-delete:hover { background: #fca5a5; }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 560px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  }
  .modal-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .form-group { margin-bottom: 1rem; }
  .form-label {
    display: block;
    margin-bottom: 0.4rem;
    font-size: 0.85rem;
    color: #475569;
    font-weight: 600;
  }
  .form-input, .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    font-size: 0.95rem;
  }
  .form-textarea { height: 80px; resize: vertical; }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  .btn-cancel {
    background: #f1f5f9;
    color: #475569;
    padding: 0.75rem 1.2rem;
    border-radius: 8px;
    font-weight: 600;
  }
  .btn-save {
    background: #3b82f6;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 700;
  }

  /* Mobile → Cartes */
  @media (max-width: 900px) {
    thead { display: none; }
    table, tbody, tr, td { display: block; width: 100%; }
    tr {
      background: #fff;
      margin-bottom: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f8fafc;
      text-align: right;
    }
    td:last-child { border-bottom: none; }
    td::before {
      content: attr(data-label);
      float: left;
      font-weight: 600;
      color: #64748b;
      font-size: 0.85rem;
      text-transform: uppercase;
    }
    .btn-edit, .btn-delete { width: 44px; height: 44px; }
  }

  @media (min-width: 900px) {
    .dashboard-wrapper { padding: 2rem; }
    .header h1 { font-size: 2.2rem; }
    .list-header { flex-direction: row; justify-content: space-between; align-items: center; }
  }
`;

export default function Monetization() {
  const { companies } = useOutletContext();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    nom_plan: '', prix_mensuel: 0, max_utilisateurs: 1, max_ecritures: 1000, description: '', est_actif: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    const { data } = await supabase
      .from('plans')
      .select('*, abonnements(count)')
      .order('prix_mensuel', { ascending: true });
    setPlans(data || []);
    setIsLoading(false);
  }

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ ...plan });
    } else {
      setEditingPlan(null);
      setFormData({ nom_plan: '', prix_mensuel: 0, max_utilisateurs: 1, max_ecritures: 1000, description: '', est_actif: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      prix_mensuel: Number(formData.prix_mensuel),
      max_utilisateurs: Number(formData.max_utilisateurs),
      max_ecritures: Number(formData.max_ecritures)
    };

    const { error } = editingPlan
      ? await supabase.from('plans').update(payload).eq('id', editingPlan.id)
      : await supabase.from('plans').insert([payload]);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      setIsModalOpen(false);
      fetchPlans();
    }
  };

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer définitivement le plan "${nom}" ?`)) return;
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) {
      alert("Impossible de supprimer : des entreprises sont peut-être abonnées.");
    } else {
      fetchPlans();
    }
  };

  if (isLoading) return <div style={{height:'100vh',display:'grid',placeItems:'center'}}>Chargement...</div>;

  return (
    <div className="dashboard-wrapper">
      <style>{styles}</style>

      <div className="dashboard-container">
        <div className="header">
          <h1>Monétisation & Plans</h1>
          <p>Gérez les offres d’abonnement · {companies.length} entreprise{companies.length > 1 ? 's' : ''} active{companies.length > 1 ? 's' : ''}</p>
        </div>

        <div className="card">
          <div className="list-header">
            <h3 style={{margin:0, fontSize:'1.1rem'}}>Plans d'abonnement</h3>
            <button onClick={() => openModal()} className="btn-primary">
              <div style={{width:20,height:20}}><IconPlus /></div>
              Nouveau Plan
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Prix mensuel</th>
                  <th>Limites</th>
                  <th>Abonnés</th>
                  <th>Statut</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id}>
                    <td data-label="Plan" style={{fontWeight:700}}>{p.nom_plan}</td>
                    <td data-label="Prix" style={{fontWeight:'bold', color:'#b91c1c'}}>
                      {p.prix_mensuel.toLocaleString()} F
                    </td>
                    <td data-label="Limites">
                      {p.max_utilisateurs} utilisateurs<br/>
                      {p.max_ecritures.toLocaleString()} écritures
                    </td>
                    <td data-label="Abonnés">
                      <span className={`badge-subscribers ${p.abonnements[0]?.count > 0 ? 'badge-active' : 'badge-inactive'}`}>
                        {p.abonnements[0]?.count || 0}
                      </span>
                    </td>
                    <td data-label="Statut">
                      <span style={p.est_actif ? {color:'#166534'} : {color:'#991b1b'}}>
                        {p.est_actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td data-label="Actions" style={{textAlign:'right'}}>
                      <button onClick={() => openModal(p)} className="btn-edit">
                        <IconEdit />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.nom_plan)} className="btn-delete">
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {plans.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>
                      Aucun plan défini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingPlan ? 'Modifier le plan' : 'Créer un nouveau plan'}
            </h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nom du plan</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.nom_plan}
                  onChange={e => setFormData({...formData, nom_plan: e.target.value})}
                  placeholder="Ex: Starter, PRO, Enterprise"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Description courte du plan..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Prix mensuel (F CFA)</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    min="0"
                    value={formData.prix_mensuel}
                    onChange={e => setFormData({...formData, prix_mensuel: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max utilisateurs</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    min="1"
                    value={formData.max_utilisateurs}
                    onChange={e => setFormData({...formData, max_utilisateurs: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Max écritures / mois</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="1"
                  value={formData.max_ecritures}
                  onChange={e => setFormData({...formData, max_ecritures: e.target.value})}
                />
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  checked={formData.est_actif}
                  onChange={e => setFormData({...formData, est_actif: e.target.checked})}
                  id="active"
                />
                <label htmlFor="active" style={{margin:0, fontSize:'0.95rem'}}>
                  Plan actif (visible à l'inscription)
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-save">
                  {editingPlan ? 'Enregistrer' : 'Créer le plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
