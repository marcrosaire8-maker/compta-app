// src/pages/AdminPlanModele.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

/* --- ICÔNES SVG --- */
const IconRocket = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconWarning = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;

/* --- STYLES CSS IN-JS --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  /* FIX GLOBAL LAYOUT MOBILE */
  @media (max-width: 900px) {
    main {
      margin-left: 0 !important;
      padding: 1rem !important;
      width: 100% !important;
    }
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

  /* HEADER */
  .header { text-align: center; margin-bottom: 0.5rem; }
  .header h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    color: #b91c1c;
    line-height: 1.2;
  }
  .header p { color: #64748b; font-size: 0.9rem; max-width: 600px; margin: 0 auto; }

  /* GRID PRINCIPALE */
  .layout-grid {
    display: grid;
    grid-template-columns: 1fr; /* Mobile : empilé */
    gap: 1.5rem;
    width: 100%;
    align-items: start;
  }

  /* CARDS */
  .card {
    background: white;
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    width: 100%;
  }

  /* FORMULAIRE */
  .form-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #b91c1c;
    font-weight: 700;
    font-size: 1.1rem;
    border-bottom: 2px solid #fee2e2;
    padding-bottom: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .form-group { margin-bottom: 1rem; }
  .form-label { display: block; margin-bottom: 0.4rem; font-size: 0.85rem; color: #475569; font-weight: 600; }
  .form-input, .form-select {
    width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.95rem; background: #fff;
  }
  .btn-broadcast {
    width: 100%; padding: 1rem; background: #b91c1c; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem;
  }

  /* RECHERCHE */
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

  /* --- TRANSFORMATION DU TABLEAU EN CARTE (Mobile) --- */
  
  /* Structure de base du tableau */
  .table-wrapper { width: 100%; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f5f9; padding: 0.85rem; text-align: left; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;}
  td { padding: 0.85rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; }
  .badge-type { padding: 2px 8px; background: #f1f5f9; color: #475569; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }

  /* @MEDIA MOBILE (< 900px) : On casse le tableau */
  @media (max-width: 900px) {
    /* On cache l'en-tête du tableau car on aura des labels par ligne */
    thead { display: none; }
    
    /* Le tableau et le body prennent toute la largeur */
    table, tbody, th, td, tr { display: block; width: 100%; }
    
    /* Chaque ligne devient une "Carte" */
    tr {
      background: #fff;
      margin-bottom: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    /* Chaque cellule devient une ligne Flex (Label à gauche, Valeur à droite) */
    td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f8fafc;
      text-align: right; /* Valeur à droite */
    }
    
    td:last-child { border-bottom: none; }

    /* On ajoute le Label via l'attribut data-label */
    td::before {
      content: attr(data-label);
      float: left;
      font-weight: 600;
      color: #64748b;
      font-size: 0.85rem;
      text-transform: uppercase;
    }
    
    /* Ajustement spécifique pour le badge en mode mobile */
    .badge-type {
      background: #eff6ff;
      color: #1e40af;
      font-size: 0.85rem;
    }
  }

  /* MEDIA DESKTOP */
  @media (min-width: 900px) {
    .dashboard-wrapper { padding: 2rem; }
    .header h1 { font-size: 2.2rem; }
    .layout-grid { grid-template-columns: 350px 1fr; }
    .list-header { flex-direction: row; justify-content: space-between; align-items: center; }
    .search-box { width: 250px; }
  }
`;

export default function AdminPlanModele() {
  const [modele, setModele] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ code: '', libelle: '', type: 'ACTIF' });

  useEffect(() => {
    fetchModele();
  }, []);

  async function fetchModele() {
    try {
      const { data, error } = await supabase
        .from('modele_plan_ohada')
        .select('*')
        .order('code_compte', { ascending: true });
      if (error) throw error;
      setModele(data || []);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!window.confirm(`ATTENTION : Ajouter ${formData.code} partout ?`)) return;
    setSending(true);
    try {
      const { error } = await supabase.rpc('admin_broadcast_account', {
        p_code: formData.code,
        p_libelle: formData.libelle,
        p_type: formData.type
      });
      if (error) throw error;
      alert("✅ Succès !");
      setFormData({ code: '', libelle: '', type: 'ACTIF' });
      fetchModele();
    } catch (error) { alert("Erreur : " + error.message); } 
    finally { setSending(false); }
  };

  const filteredList = modele.filter(m =>
    m.code_compte.includes(searchTerm) ||
    m.libelle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{height:'100vh', display:'grid', placeItems:'center'}}>Chargement...</div>;

  return (
    <div className="dashboard-wrapper">
      <style>{styles}</style>

      <div className="dashboard-container">
        
        <div className="header">
          <h1>Plan Comptable Maître</h1>
          <p>Ajouter ici répercute sur <strong>tous les clients</strong>.</p>
        </div>

        <div className="layout-grid">
          
          {/* CARD FORMULAIRE */}
          <div className="card">
            <div className="form-title">
              <div style={{width:24, height:24}}><IconWarning /></div>
              Diffusion Globale
            </div>
            
            <form onSubmit={handleBroadcast}>
              <div className="form-group">
                <label className="form-label">Numéro de Compte</label>
                <input type="text" required className="form-input" placeholder="Ex: 401100" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Libellé</label>
                <input type="text" required className="form-input" placeholder="Ex: Fournisseurs" value={formData.libelle} onChange={e => setFormData({...formData, libelle: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Type (Classe)</label>
                <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="ACTIF">ACTIF</option>
                  <option value="PASSIF">PASSIF</option>
                  <option value="CHARGE">CHARGE</option>
                  <option value="PRODUIT">PRODUIT</option>
                </select>
              </div>
              <button type="submit" className="btn-broadcast" disabled={sending}>
                <div style={{width:20, height:20}}><IconRocket /></div>
                {sending ? 'Diffusion...' : 'Ajouter & Diffuser'}
              </button>
            </form>
          </div>

          {/* CARD LISTE */}
          <div className="card">
            <div className="list-header">
              <h3 style={{margin:0, fontSize:'1.1rem'}}>Modèle ({filteredList.length})</h3>
              <div className="search-box">
                <div className="search-icon"><IconSearch /></div>
                <input type="text" className="search-input-list" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Libellé</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((m, i) => (
                    <tr key={i}>
                      {/* L'attribut data-label sert à afficher le titre sur mobile */}
                      <td data-label="Code" style={{fontWeight:'700', color:'#b91c1c'}}>{m.code_compte}</td>
                      <td data-label="Libellé">{m.libelle}</td>
                      <td data-label="Type">
                        <span className="badge-type">{m.type_compte}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredList.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', padding:'2rem'}}>Aucun compte</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
