import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* --- ICONS --- */
const IconPlus = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const IconEdit = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>;
const IconTrash = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>;
const IconDownload = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>;
const IconSearch = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>;
const IconSun = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>;
const IconMoon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>;

export default function PlanComptableUltimate() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [comptes, setComptes] = useState([]);
  const [entreprise, setEntreprise] = useState(null);
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Filters & Form
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClasse, setFilterClasse] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', libelle: '', type: 'ACTIF' });

  // --- EFFECTS ---
  useEffect(() => { initData(); }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (!ste) return;
    setEntreprise(ste);
    fetchComptes(ste.id);
    setLoading(false);
  }

  async function fetchComptes(id) {
    const { data } = await supabase
      .from('plan_comptable')
      .select('*')
      .eq('entreprise_id', id)
      .order('code_compte', { ascending: true });
    setComptes(data || []);
  }

  // --- ACTIONS ---
  async function importOHADA() {
    if (!confirm("Importer le plan comptable OHADA standard ?")) return;
    setImporting(true);
    try {
      const { data: modele } = await supabase.from('modele_plan_ohada').select('*');
      if (!modele?.length) throw new Error("Modèle introuvable");

      const toInsert = modele.map(m => ({
        entreprise_id: entreprise.id,
        code_compte: m.code_compte,
        libelle: m.libelle,
        type_compte: m.type_compte
      }));

      const { error } = await supabase.from('plan_comptable').insert(toInsert);
      if (error) throw error;

      alert("Importation réussie !");
      fetchComptes(entreprise.id);
    } catch (err) { alert("Erreur : " + err.message); } 
    finally { setImporting(false); }
  }

  const saveCompte = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        entreprise_id: entreprise.id,
        code_compte: form.code,
        libelle: form.libelle,
        type_compte: form.type
      };

      if (editing) {
        await supabase.from('plan_comptable').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('plan_comptable').insert([payload]);
      }

      setOpen(false);
      setEditing(null);
      setForm({ code: '', libelle: '', type: 'ACTIF' });
      fetchComptes(entreprise.id);
    } catch (err) { alert("Erreur : " + err.message); }
  };

  const deleteCompte = async (id) => {
    if (!confirm("Supprimer ce compte ?")) return;
    await supabase.from('plan_comptable').delete().eq('id', id);
    fetchComptes(entreprise.id);
  };

  // --- EXPORTS ---
  const exportExcel = () => {
    const data = filtered.map(c => ({ Code: c.code_compte, Libellé: c.libelle, Type: c.type_compte }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan Comptable");
    XLSX.writeFile(wb, `Plan_Comptable.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Plan Comptable - ${entreprise.nom}`, 14, 20);
    autoTable(doc, {
      startY: 35,
      head: [['Code', 'Libellé', 'Type']],
      body: filtered.map(c => [c.code_compte, c.libelle, c.type_compte]),
      theme: 'grid'
    });
    doc.save(`Plan_Comptable.pdf`);
  };

  // --- FILTRAGE ---
  const filtered = comptes.filter(c => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = c.libelle.toLowerCase().includes(search) || c.code_compte.includes(searchTerm);
    const matchesClasse = filterClasse === 'all' || c.code_compte.startsWith(filterClasse);
    return matchesSearch && matchesClasse;
  });

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000', color:'white'}}>Chargement...</div>;

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root { --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

        .light {
          --bg-main: #f2f2f7; --bg-glass: rgba(255, 255, 255, 0.7); --bg-card: #ffffff;
          --text-primary: #1d1d1f; --text-secondary: #86868b; --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); 
          --primary: #ec4899; /* Pink/Magenta for Plan Comptable */
          --primary-glow: rgba(236, 72, 153, 0.3);
          --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000; --bg-glass: rgba(28, 28, 30, 0.7); --bg-card: #1c1c1e;
          --text-primary: #f5f5f7; --text-secondary: #a1a1a6; --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6); 
          --primary: #f472b6;
          --primary-glow: rgba(244, 114, 182, 0.4);
          --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }
        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- PARALLAX ORBS --- */
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--primary); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #8b5cf6; } /* Purple */

        /* --- SIDEBAR & OVERLAY --- */
        .sidebar-wrapper { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 50; transition: transform 0.3s ease; }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40; display: none; opacity: 0; transition: opacity 0.3s; }
        main { min-height: 100vh; padding: 40px; margin-left: 260px; position: relative; z-index: 1; transition: margin-left 0.3s ease; }

        /* --- HEADER --- */
        .header-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; animation: slideDown 0.8s ease-out; }
        .header-content h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%); -webkit-background-clip: text; color: transparent; }
        .actions { display: flex; gap: 12px; align-items: center; }

        .btn-menu-mobile { display: none; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-size: 24px; padding: 8px 12px; border-radius: 12px; cursor: pointer; }
        .btn-theme { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: var(--transition); box-shadow: var(--shadow); color: var(--text-primary); }
        .btn-theme:hover { transform: scale(1.1); }

        .btn-primary { padding: 14px 24px; border-radius: 99px; border: none; background: linear-gradient(135deg, var(--primary), #db2777); color: white; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 8px 20px var(--primary-glow); transition: var(--transition); display: flex; align-items: center; gap: 8px; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px var(--primary-glow); }
        .btn-glass { padding: 12px 20px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-glass); color: var(--text-primary); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .btn-glass:hover { background: var(--bg-card); transform: translateY(-2px); }

        /* --- SEARCH & FILTERS --- */
        .search-container { display: flex; gap: 16px; margin-bottom: 30px; animation: fadeIn 1s ease 0.2s backwards; max-width: 800px; }
        .search-bar { flex: 1; position: relative; }
        .search-input { width: 100%; padding: 16px 20px 16px 50px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 16px; outline: none; box-shadow: var(--shadow); transition: 0.3s; }
        .search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        .search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
        .filter-select { padding: 0 20px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); outline: none; font-weight: 600; cursor: pointer; }

        /* --- LIST COMPTES --- */
        .accounts-list { display: flex; flex-direction: column; gap: 12px; }
        
        /* Header Row */
        .list-header { display: grid; grid-template-columns: 1fr 2fr 1fr 1fr; gap: 20px; padding: 0 24px; margin-bottom: 5px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; }

        .account-card {
          display: grid; grid-template-columns: 1fr 2fr 1fr 1fr; gap: 20px; align-items: center;
          background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border);
          border-radius: 18px; padding: 16px 24px; transition: var(--transition);
          animation: fadeSlide 0.5s ease-out backwards;
        }
        .account-card:hover { transform: scale(1.01); background: var(--bg-card); border-color: var(--primary); z-index: 2; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

        .cell-code { font-family: monospace; font-weight: 700; font-size: 16px; color: var(--primary); letter-spacing: 1px; }
        .cell-name { font-weight: 600; color: var(--text-primary); font-size: 15px; }
        
        .badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; width: fit-content; }
        .badge-ACTIF { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .badge-PASSIF { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .badge-CHARGE { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .badge-PRODUIT { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .actions-cell { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-icon { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.1); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-icon:hover { background: var(--text-primary); color: var(--bg-main); }

        /* --- EMPTY STATE (IMPORT) --- */
        .empty-state { text-align: center; padding: 60px; background: var(--bg-glass); border-radius: 24px; border: 1px dashed var(--border); margin-top: 20px; }
        .empty-title { font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 10px; }
        .empty-desc { color: var(--text-secondary); margin-bottom: 30px; }

        /* --- MODAL --- */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .modal-card { width: 100%; max-width: 500px; background: var(--bg-card); padding: 40px; border-radius: 32px; box-shadow: 0 30px 80px rgba(0,0,0,0.4); border: 1px solid var(--border); animation: zoomIn 0.3s ease-out; }
        .modal-title { font-size: 26px; font-weight: 800; margin-bottom: 30px; color: var(--text-primary); }

        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .form-input { width: 100%; padding: 16px; border-radius: 16px; border: 1px solid transparent; background: var(--input-bg); color: var(--text-primary); font-size: 16px; outline: none; transition: 0.3s; }
        .form-input:focus { border-color: var(--primary); background: var(--bg-card); box-shadow: 0 0 0 4px var(--primary-glow); }

        /* --- MEDIA QUERIES --- */
        @media (max-width: 1024px) {
          .sidebar-wrapper { transform: translateX(-100%); }
          .sidebar-wrapper.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; opacity: 1; }
          main { margin-left: 0; padding: 20px; width: 100%; }
          .btn-menu-mobile { display: block; }
        }

        @media (max-width: 768px) {
          .header-bar { flex-direction: column; align-items: flex-start; gap: 15px; }
          .actions { width: 100%; justify-content: space-between; }
          .search-container { flex-direction: column; }
          
          /* Card Transformation */
          .list-header { display: none; }
          .account-card { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 20px; position: relative; }
          .cell-code { font-size: 20px; }
          .cell-name { font-size: 16px; }
          .actions-cell { width: 100%; justify-content: flex-end; margin-top: 10px; }
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* OVERLAY & SIDEBAR */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />
      </div>

      {/* PARALLAX ORBS */}
      <div className="orb orb-1" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}></div>
      <div className="orb orb-2" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}></div>

      <main>
        {/* HEADER */}
        <div className="header-bar">
          <div style={{display:'flex', alignItems:'center', gap:'15px', width:'100%'}}>
            <button className="btn-menu-mobile" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="header-content">
              <h1>Plan Comptable</h1>
              <div style={{color:'var(--text-secondary)'}}>Codification OHADA</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <IconSun/> : <IconMoon/>}
            </button>
            <button className="btn-glass" onClick={exportExcel}><IconDownload /> Excel</button>
            <button className="btn-glass" onClick={exportPDF}><IconDownload /> PDF</button>
            <button className="btn-primary" onClick={() => { setEditing(null); setForm({code:'',libelle:'',type:'ACTIF'}); setOpen(true); }}>
              <IconPlus /> Ajouter
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="search-container">
          <div className="search-bar">
            <div className="search-icon"><IconSearch /></div>
            <input 
              type="text" 
              placeholder="Rechercher un compte (ex: 411, Client...)" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="search-input"
            />
          </div>
          <select className="filter-select" value={filterClasse} onChange={e => setFilterClasse(e.target.value)}>
            <option value="all">Toutes Classes</option>
            {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>Classe {n}</option>)}
          </select>
        </div>

        {/* CONTENT */}
        <div className="accounts-list">
          {comptes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Plan Comptable Vide</div>
              <p className="empty-desc">Votre plan comptable n'est pas encore configuré.</p>
              <button className="btn-primary" onClick={importOHADA} disabled={importing}>
                {importing ? 'Installation...' : 'Importer le standard OHADA'}
              </button>
            </div>
          ) : (
            <>
              <div className="list-header">
                <div>Code</div>
                <div>Intitulé</div>
                <div>Type</div>
                <div style={{textAlign:'right'}}>Actions</div>
              </div>
              
              {filtered.map((c, i) => (
                <div key={c.id} className="account-card" style={{animationDelay: `${i * 0.02}s`}}>
                  <div className="cell-code">{c.code_compte}</div>
                  <div className="cell-name">{c.libelle}</div>
                  <div>
                    <span className={`badge badge-${c.type_compte}`}>{c.type_compte}</span>
                  </div>
                  <div className="actions-cell">
                    <button className="btn-icon" onClick={() => { setEditing(c); setForm({code:c.code_compte, libelle:c.libelle, type:c.type_compte}); setOpen(true); }}>
                      <IconEdit />
                    </button>
                    <button className="btn-icon" onClick={() => deleteCompte(c.id)}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      {/* MODAL */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? 'Modifier Compte' : 'Nouveau Compte'}</h2>
            <form onSubmit={saveCompte}>
              <div className="form-group">
                <label className="form-label">Code Compte</label>
                <input className="form-input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required placeholder="ex: 601100" />
              </div>
              <div className="form-group">
                <label className="form-label">Libellé</label>
                <input className="form-input" value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} required placeholder="ex: Achat Marchandises" />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="ACTIF">ACTIF</option>
                  <option value="PASSIF">PASSIF</option>
                  <option value="CHARGE">CHARGE</option>
                  <option value="PRODUIT">PRODUIT</option>
                </select>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:'15px', marginTop:'30px'}}>
                <button type="button" onClick={() => setOpen(false)} style={{padding:'14px 28px', borderRadius:'12px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', fontWeight:'600', cursor:'pointer'}}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
