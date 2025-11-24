// src/pages/GestionSuppression.jsx
import React from 'react';
import { supabase } from '../services/supabase';
import { useOutletContext } from 'react-router-dom';

/* --- ICÔNES --- */
const IconDanger = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.Config5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;

/* --- STYLE IDENTIQUE aux autres pages --- */
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
    width: 100%;
  }
  .danger-alert {
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-left: 6px solid #b91c1c;
    padding: 1rem;
    border-radius: 12px;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .danger-alert-icon { width: 28px; height: 28px; color: #b91c1c; flex-shrink: 0; }
  .danger-alert h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #991b1b; }
  .danger-alert p { margin: 0.5rem 0 0; color: #b91c1c; font-size: 0.95rem; }
  .list-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .table-wrapper { width: 100%; }
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
    vertical-align: middle;
  }
  .btn-delete {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }
  }
  .btn-delete:hover {
    background: #b91c1c;
    color: white;
  }

  /* MOBILE → CARTES */
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
    .btn-delete {
      width: 100%;
      justify-content: center;
      padding: 0.75rem;
      font-size: 0.9rem;
    }
  }

  @media (min-width: 900px) {
    .dashboard-wrapper { padding: 2rem; }
    .header h1 { font-size: 2.2rem; }
  }
`;

export default function GestionSuppression() {
  const context = useOutletContext();
  const companies = context?.companies || [];

  const handleDeleteEnterprise = async (companyId, companyName) => {
    const confirmation = prompt(`SUPPRESSION TOTALE ET IRRÉVERSIBLE\n\nTapez exactement "SUPPRIMER" pour confirmer la suppression de :\n\n${companyName}`);
    if (confirmation !== 'SUPPRIMER') return;

    try {
      const { error } = await supabase.rpc('delete_enterprise_data', { enterprise_uuid: companyId });
      if (error) throw error;
      alert(`Entreprise "${companyName}" et toutes ses données ont été supprimées.`);
      window.location.reload();
    } catch (error) {
      alert('Erreur : ' + error.message);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <style>{styles}</style>

      <div className="dashboard-container">
        <div className="header">
          <h1>Suppression d'Entreprises</h1>
          <p>Action irréversible — Zone de danger maximale</p>
        </div>

        <div className="card danger-alert">
          <div className="danger-alert-icon"><IconDanger /></div>
          <div>
            <h3>Attention : suppression définitive</h3>
            <p>Cette action supprime l’entreprise, tous ses comptes, factures, utilisateurs et données associées.<br />Aucun retour en arrière possible.</p>
          </div>
        </div>

        <div className="card">
          <div className="list-header">
            <h3 style={{margin:0, fontSize:'1.1rem'}}>Entreprises présentes ({companies.length})</h3>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Contact</th>
                  <th>Inscription</th>
                  <th style={{textAlign:'right'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.length > 0 ? (
                  companies.map(c => (
                    <tr key={c.id}>
                      <td data-label="Entreprise" style={{fontWeight:700, color:'#b91c1c'}}>
                        {c.nom}
                      </td>
                      <td data-label="Contact">{c.email_contact}</td>
                      <td data-label="Inscription">
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td data-label="Action" style={{textAlign:'right'}}>
                        <button
                          onClick={() => handleDeleteEnterprise(c.id, c.nom)}
                          className="btn-delete"
                        >
                          <div style={{width:18,height:18}}><IconTrash /></div>
                          Supprimer tout
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>
                      Aucune entreprise trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
