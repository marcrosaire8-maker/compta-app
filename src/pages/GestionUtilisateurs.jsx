// src/pages/GestionUtilisateurs.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

/* --- ICÔNES SVG (même style que AdminPlanModele) --- */
const IconUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IconBan = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;

/* --- MÊMES STYLES que AdminPlanModele.jsx (juste couleur primaire adaptée) --- */
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
  .layout-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; width: 100%; align-items: start; }
  .card {
    background: white;
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    width: 100%;
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
  .search-input-list { width: 100%; padding: 0.6rem 0.6rem 0.6rem 2.2rem; border: 1px solid #cbd5e1; border-radius: 6px; }
  .table-wrapper { width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f5f9; padding: 0.85rem; text-align: left; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;}
  td { padding: 0.85rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; }
  .badge-role {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-owner { background: #fff7ed; color: #c2410c; }
  .badge-admin { background: #eff6ff; color: #1d4ed8; }
  .badge-user  { background: #f1f5f9; color: #475569; }
  .btn-danger {
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
  }
  .btn-danger:hover { background: #b91c1c; color: white; }

  /* MOBILE : TABLEAU → CARTES */
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
    .btn-danger { width: 100%; justify-content: center; padding: 0.75rem; }
  }

  @media (min-width: 900px) {
    .dashboard-wrapper { padding: 2rem; }
    .header h1 { font-size: 2.2rem; }
    .list-header { flex-direction: row; justify-content: space-between; align-items: center; }
    .search-box { width: 300px; }
  }
`;

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  async function fetchAllUsers() {
    setLoading(true);
    try {
      // Propriétaires
      const { data: ownersData } = await supabase
        .from('entreprises')
        .select('id, nom, email_contact, created_at, owner_id');
      const owners = (ownersData || []).map(ent => ({
        id: `owner-${ent.id}`,
        real_id: ent.id,
        email: ent.email_contact,
        role: 'PROPRIÉTAIRE',
        entreprise_nom: ent.nom,
        created_at: ent.created_at,
        is_owner: true
      }));

      // Membres
      const { data: membersData } = await supabase
        .from('membres_entreprise')
        .select('id, email, role, created_at, entreprise:entreprises (nom)');
      const members = (membersData || []).map(mem => ({
        id: mem.id,
        real_id: mem.id,
        email: mem.email,
        role: mem.role || 'UTILISATEUR',
        entreprise_nom: mem.entreprise?.nom || 'Inconnu',
        created_at: mem.created_at,
        is_owner: false
      }));

      const all = [...owners, ...members]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setUsers(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleKickUser = async (user) => {
    if (user.is_owner) return alert("Impossible de retirer un propriétaire.");
    if (!confirm(`Retirer l’accès à ${user.email} ?`)) return;

    try {
      const { error } = await supabase
        .from('membres_entreprise')
        .delete()
        .eq('id', user.real_id);
      if (error) throw error;
      alert("Utilisateur retiré avec succès");
      fetchAllUsers();
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.entreprise_nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleClass = (role) => {
    if (role === 'PROPRIÉTAIRE') return 'badge-owner';
    if (role === 'ADMIN') return 'badge-admin';
    return 'badge-user';
  };

  if (loading) return <div style={{height:'100vh',display:'grid',placeItems:'center'}}>Chargement...</div>;

  return (
    <div className="dashboard-wrapper">
      <style>{styles}</style>

      <div className="dashboard-container">
        <div className="header">
          <h1>Gestion des Utilisateurs</h1>
          <p>Vue administrateur complète – retrait d’accès possible</p>
        </div>

        <div className="layout-grid">
          <div className="card">
            <div className="list-header">
              <h3 style={{margin:0, fontSize:'1.1rem'}}>Tous les utilisateurs ({filtered.length})</h3>
              <div className="search-box">
                <div className="search-icon"><IconSearch /></div>
                <input
                  type="text"
                  className="search-input-list"
                  placeholder="Rechercher par email ou entreprise..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Entreprise</th>
                    <th>Rôle</th>
                    <th>Inscrit le</th>
                    <th style={{textAlign:'right'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td data-label="Utilisateur" style={{fontWeight:700}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:20,height:20}}><IconUser /></div>
                          <span style={{marginLeft:8}}>{u.email}</span>
                        </div>
                      </td>
                      <td data-label="Entreprise">{u.entreprise_nom}</td>
                      <td data-label="Rôle">
                        <span className={`badge-role ${getRoleClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td data-label="Inscrit le">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td data-label="Action" style={{textAlign:'right'}}>
                        {u.is_owner ? (
                          <span style={{color:'#94a3b8',fontStyle:'italic',fontSize:'0.85rem'}}>
                            Propriétaire
                          </span>
                        ) : (
                          <button onClick={() => handleKickUser(u)} className="btn-danger">
                            <div style={{width:16,height:16}}><IconBan /></div>
                            Retirer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{textAlign:'center',padding:'2rem',color:'#94a3b8'}}>
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
