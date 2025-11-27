import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* --- ICONS --- */
const IconPlus = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const IconEdit = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>;
const IconTrash = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>;
const IconSearch = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>;
const IconDownload = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>;
const IconSun = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>;
const IconMoon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>;
const IconMail = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>;
const IconPhone = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>;

export default function TiersUltimate() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [tiers, setTiers] = useState([]);
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Filters & Form
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TOUS');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom_complet: '', type_tier: 'CLIENT', email: '', telephone: '', adresse: '' });

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
    fetchTiers(ste.id);
    setLoading(false);
  }

  async function fetchTiers(id) {
    const { data } = await supabase
      .from('tiers')
      .select('*')
      .eq('entreprise_id', id)
      .order('nom_complet');
    setTiers(data || []);
  }

  // --- ACTIONS ---
  const saveTier = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, entreprise_id: entreprise.id };
      if (editing) {
        await supabase.from('tiers').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('tiers').insert([payload]);
      }
      setIsModalOpen(false);
      setEditing(null);
      setForm({ nom_complet: '', type_tier: 'CLIENT', email: '', telephone: '', adresse: '' });
      fetchTiers(entreprise.id);
    } catch (err) { alert(err.message); }
  };

  const deleteTier = async (id) => {
    if (confirm("Supprimer ce contact ?")) {
      await supabase.from('tiers').delete().eq('id', id);
      fetchTiers(entreprise.id);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(`Tiers - ${entreprise.nom}`, 14, 20);
    autoTable(doc, {
      startY: 35,
      head: [['Nom', 'Type', 'Email', 'Tél', 'Adresse']],
      body: filtered.map(t => [t.nom_complet, t.type_tier, t.email || '-', t.telephone || '-', t.adresse || '-']),
      theme: 'grid'
    });
    doc.save(`Tiers.pdf`);
  };

  const filtered = tiers.filter(t => {
    const matchSearch = t.nom_complet.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'TOUS' || t.type_tier === filterType;
    return matchSearch && matchType;
  });

  if (loading) return <div style={{height:'100vh', background:'#000', color:'white', display:'flex', justifyContent:'center', alignItems:'center'}}>Chargement...</div>;

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root { --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

        .light {
          --bg-main: #f2f2f7; --bg-glass: rgba(255, 255, 255, 0.7); --bg-card: #ffffff;
          --text-primary: #1d1d1f; --text-secondary: #86868b; --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); 
          --primary: #8b5cf6; /* Violet for Contacts */
          --primary-glow: rgba(139, 92, 246, 0.3);
          --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000; --bg-glass: rgba(28, 28, 30, 0.7); --bg-card: #1c1c1e;
          --text-primary: #f5f5f7; --text-secondary: #a1a1a6; --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6); 
          --primary: #a78bfa;
          --primary-glow: rgba(167, 139, 250, 0.4);
          --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }
        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- PARALLAX ORBS --- */
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--primary); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #f472b6; } /* Pink */

        /* --- SIDEBAR --- */
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

        .btn-primary { padding: 14px 24px; border-radius: 99px; border: none; background: linear-gradient(135deg, var(--primary), #7c3aed); color: white; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 8px 20px var(--primary-glow); transition: var(--transition); display: flex; align-items: center; gap: 8px; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px var(--primary-glow); }
        .btn-glass { padding: 12px 20px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-glass); color: var(--text-primary); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .btn-glass:hover { background: var(--bg-card); transform: translateY(-2px); }

        /* --- FILTERS --- */
        .filters-bar { display: flex; gap: 16px; margin-bottom: 30px; animation: fadeIn 1s ease 0.2s backwards; flex-wrap: wrap; }
        .search-input { flex: 1; min-width: 200px; padding: 14px 20px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); outline: none; transition: 0.3s; box-shadow: var(--shadow); }
        .search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        
        .filter-tabs { display: flex; background: var(--bg-glass); padding: 4px; border-radius: 14px; border: 1px solid var(--border); }
        .filter-tab { padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 13px; color: var(--text-secondary); border: none; background: transparent; transition: 0.2s; }
        .filter-tab.active { background: var(--bg-card); color: var(--text-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

        /* --- CONTACT CARDS GRID --- */
        .contacts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        
        .contact-card {
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 24px; padding: 24px;
          position: relative; overflow: hidden; transition: 0.3s;
          display: flex; flex-direction: column; gap: 16px;
          animation: fadeUp 0.5s ease-out backwards;
        }
        .contact-card:hover { transform: scale(1.02); border-color: var(--primary); box-shadow: 0 15px 40px rgba(0,0,0,0.1); z-index: 2; }

        .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .avatar-placeholder { width: 50px; height: 50px; border-radius: 16px; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; }
        .badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .badge-CLIENT { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .badge-FOURNISSEUR { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .badge-EMPLOYE { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

        .contact-name { font-size: 18px; font-weight: 700; color: var(--text-primary); }
        .contact-details { display: flex; flex-direction: column; gap: 8px; margin-top: 5px; }
        .detail-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); }
        
        .card-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: auto; pt: 16px; border-top: 1px dashed var(--border); }
        .btn-icon { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.1); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-icon:hover { background: var(--text-primary); color: var(--bg-main); }

        /* --- MODAL --- */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .modal-card { width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; background: var(--bg-card); padding: 40px; border-radius: 32px; box-shadow: 0 30px 80px rgba(0,0,0,0.4); border: 1px solid var(--border); animation: zoomIn 0.3s ease-out; }
        .modal-title { font-size: 26px; font-weight: 800; margin-bottom: 30px; color: var(--text-primary); }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
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
          .header-bar { flex-direction: column; align-items: flex-start; gap: 20px; }
          .actions { width: 100%; justify-content: space-between; }
          .filters-bar { flex-direction: column; }
          .filter-tabs { overflow-x: auto; width: 100%; }
          .form-grid { grid-template-columns: 1fr; }
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
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
              <h1>Carnet de Tiers</h1>
              <div style={{color:'var(--text-secondary)'}}>Clients, fournisseurs et employés</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <IconSun/> : <IconMoon/>}
            </button>
            <button className="btn-glass" onClick={exportPDF}>
              <IconDownload /> Export
            </button>
            <button className="btn-primary" onClick={() => { setEditing(null); setForm({nom_complet:'',type_tier:'CLIENT',email:'',telephone:'',adresse:''}); setIsModalOpen(true); }}>
              <IconPlus /> Nouveau Contact
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters-bar">
          <input 
            className="search-input" 
            placeholder="Rechercher un nom, email..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
          <div className="filter-tabs">
            {['TOUS', 'CLIENT', 'FOURNISSEUR', 'EMPLOYE'].map(type => (
              <button 
                key={type}
                className={`filter-tab ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type === 'TOUS' ? 'Tous' : type.charAt(0) + type.slice(1).toLowerCase() + 's'}
              </button>
            ))}
          </div>
        </div>

        {/* CONTACT CARDS GRID */}
        <div className="contacts-grid">
          {filtered.length === 0 && (
            <div style={{gridColumn:'1/-1', textAlign:'center', padding:'60px', color:'var(--text-secondary)'}}>
              Aucun contact trouvé.
            </div>
          )}

          {filtered.map((t, i) => (
            <div key={t.id} className="contact-card" style={{animationDelay: `${i * 0.05}s`}}>
              <div className="card-header">
                <div className="avatar-placeholder">{t.nom_complet.substring(0, 2).toUpperCase()}</div>
                <div className={`badge badge-${t.type_tier}`}>{t.type_tier}</div>
              </div>
              
              <div>
                <div className="contact-name">{t.nom_complet}</div>
                <div className="contact-details">
                  <div className="detail-row"><IconMail /> {t.email || 'Non renseigné'}</div>
                  <div className="detail-row"><IconPhone /> {t.telephone || 'Non renseigné'}</div>
                </div>
              </div>

              <div className="card-actions">
                <button className="btn-icon" onClick={() => { setEditing(t); setForm(t); setIsModalOpen(true); }}>
                  <IconEdit />
                </button>
                <button className="btn-icon" onClick={() => deleteTier(t.id)} style={{color:'var(--danger)'}}>
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? 'Modifier le contact' : 'Nouveau contact'}</h2>
            <form onSubmit={saveTier}>
              <div className="form-group">
                <label className="form-label">Nom Complet</label>
                <input className="form-input" required value={form.nom_complet} onChange={e => setForm({...form, nom_complet: e.target.value})} placeholder="Ex: Société ABC" />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type_tier} onChange={e => setForm({...form, type_tier: e.target.value})}>
                    <option value="CLIENT">Client</option>
                    <option value="FOURNISSEUR">Fournisseur</option>
                    <option value="EMPLOYE">Employé</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input className="form-input" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="+225 ..." />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contact@example.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input className="form-input" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="Abidjan, Cocody..." />
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:'15px', marginTop:'30px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding:'14px 28px', borderRadius:'12px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', fontWeight:'600', cursor:'pointer'}}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
