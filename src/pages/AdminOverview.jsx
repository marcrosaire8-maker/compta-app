// src/pages/AdminOverview.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

/* --- ICÔNES (même style que partout ailleurs) --- */
const IconBuilding = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5M12 6.75h1.5m-3 3h1.5m0 3h1.5m0 3h1.5M9 6.75v12.75m3-12.75v12.75m3-12.75v12.75M9 10.5v0m3 0v0m3 0v0M9 14.25v0m3 0v0m3 0v0M9 18v0m3 0v0m3 0v0" /></svg>;

const IconBill = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 00-9-9z" /></svg>;

const IconUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;

const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;

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

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .stat-card {
    background: white;
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .stat-info h3 {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #64748b;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    letter-spacing: 0.05em;
  }
  .stat-info p {
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0;
    color: #1e293b;
  }
  .stat-icon {
    width: 48px;
    height: 48px;
    background: #f1f5f9;
    color: #475569;
    border-radius: 10px;
    padding: 10px;
    flex-shrink: 0;
  }

  /* Table Card */
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
  }
  .search-box { position: relative; width: 100%; }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 18px; color: #94a3b8; }
  .search-input-list {
    width: 100%;
    padding: 0.6rem 0.6rem 0.6rem 2.2rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  /* Tableau */
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
  .badge-status {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-intensif { background: #fee2e2; color: #991b1b; }
  .badge-actif { background: #dcfce7; color: #166534; }
  .badge-calme { background: #fef3c7; color: #92400e; }
  .badge-inactif { background: #f1f5f9; color: #475569; }

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
  }

  @media (min-width: 900px) {
    .dashboard-wrapper { padding: 2rem; }
    .header h1 { font-size: 2.2rem; }
    .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .list-header { flex-direction: row; justify-content: space-between; align-items: center; }
    .search-box { width: 300px; }
  }
`;

export default function AdminOverview() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: rpcData, error } = await supabase.rpc('get_companies_activity');
        if (error) throw error;
        setData(rpcData || []);
      } catch (e) {
        console.error(e);
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = data.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.email_contact?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCompanies = data.length;
  const totalFactures = data.reduce((a, c) => a + (c.total_factures || 0), 0);
  const totalUsers = data.reduce((a, c) => a + (c.total_users || 0), 0);

  const getStatusBadge = (date, factures) => {
    if (!date) return <span className="badge-status badge-inactif">Inactif</span>;
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

    if (factures > 1000) return <span className="badge-status badge-intensif">Intensif</span>;
    if (days < 7) return <span className="badge-status badge-actif">Actif</span>;
    if (days < 30) return <span className="badge-status badge-calme">Calme</span>;
    return <span className="badge-status badge-inactif">Inactif</span>;
  };

  if (loading) return <div style={{height:'100vh',display:'grid',placeItems:'center'}}>Chargement...</div>;

  return (
    <div className="dashboard-wrapper">
      <style>{styles}</style>

      <div className="dashboard-container">

        <div className="header">
          <h1>Monitoring Admin</h1>
          <p>Vue globale en temps réel de l'activité des entreprises</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Entreprises</h3>
              <p>{totalCompanies}</p>
            </div>
            <div className="stat-icon"><IconBuilding /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Factures totales</h3>
              <p>{totalFactures.toLocaleString()}</p>
            </div>
            <div className="stat-icon"><IconBill /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Utilisateurs</h3>
              <p>{totalUsers}</p>
            </div>
            <div className="stat-icon"><IconUsers /></div>
          </div>
        </div>

        {/* Liste Entreprises */}
        <div className="card">
          <div className="list-header">
            <h3 style={{margin:0, fontSize:'1.1rem'}}>Activité des entreprises ({filtered.length})</h3>
            <div className="search-box">
              <div className="search-icon"><IconSearch /></div>
              <input
                type="text"
                className="search-input-list"
                placeholder="Rechercher une entreprise..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Contact</th>
                  <th>Factures</th>
                  <th>Dernière activité</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td data-label="Entreprise" style={{fontWeight:700, color:'#b91c1c'}}>{c.nom}</td>
                    <td data-label="Contact">{c.email_contact}</td>
                    <td data-label="Factures" style={{fontWeight:'bold'}}>{c.total_factures || 0}</td>
                    <td data-label="Dernière activité">
                      {c.derniere_activite ? new Date(c.derniere_activite).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td data-label="Statut">
                      {getStatusBadge(c.derniere_activite, c.total_factures)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>
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
