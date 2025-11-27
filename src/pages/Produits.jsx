import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';

/* --- ICONS --- */
const IconSearch = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>;
const IconPlus = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const IconDownload = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>;
const IconEdit = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>;
const IconTrash = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>;
const IconSun = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>;
const IconMoon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>;

const formatMoney = (value) => value?.toLocaleString('fr-FR') + ' F' || '0 F';

export default function ProduitsUltimate() {
  const navigate = useNavigate();
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [produits, setProduits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Form
  const [form, setForm] = useState({
    nom: '', quantite: 0, prix_achat: 0, prix_vente: 0, unite: 'unité', seuil_alerte: 5
  });

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
    if (!user) return navigate('/login');
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchProduits(ste.id);
    }
    setLoading(false);
  }

  async function fetchProduits(id) {
    const { data } = await supabase
      .from('produits')
      .select('*')
      .eq('entreprise_id', id)
      .order('nom', { ascending: true });
    setProduits(data || []);
  }

  // --- LOGIQUE ---
  const filtered = produits.filter(p =>
    p.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (p) => {
    setEditing(p);
    setForm({
      nom: p.nom, quantite: p.stock_actuel || 0, prix_achat: p.prix_achat || 0,
      prix_vente: p.prix_vente || 0, unite: p.unite || 'unité', seuil_alerte: p.seuil_alerte || 5
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ nom: '', quantite: 0, prix_achat: 0, prix_vente: 0, unite: 'unité', seuil_alerte: 5 });
  };

  const saveProduit = async (e) => {
    e.preventDefault();
    if (!form.nom || form.prix_vente <= 0) return alert("Champs obligatoires manquants");

    try {
      const payload = {
        entreprise_id: entreprise.id,
        nom: form.nom.trim(),
        stock_actuel: Number(form.quantite),
        prix_achat: Number(form.prix_achat),
        prix_vente: Number(form.prix_vente),
        unite: form.unite,
        seuil_alerte: Number(form.seuil_alerte),
        type_produit: 'BIEN'
      };

      if (editing) {
        await supabase.from('produits').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('produits').insert([payload]);
      }

      alert(editing ? "Modifié avec succès !" : "Ajouté avec succès !");
      setIsModalOpen(false);
      resetForm();
      fetchProduits(entreprise.id);
    } catch (err) { alert("Erreur : " + err.message); }
  };

  const deleteProduit = async (id) => {
    if (!confirm("Supprimer définitivement ?")) return;
    await supabase.from('produits').delete().eq('id', id);
    fetchProduits(entreprise.id);
  };

  const exportExcel = () => {
    const data = filtered.map(p => ({
      'Produit': p.nom, 'Stock': p.stock_actuel, 'Unité': p.unite,
      'Prix Achat': p.prix_achat, 'Prix Vente': p.prix_vente,
      'Valeur': p.stock_actuel * p.prix_achat
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, `Stock.xlsx`);
  };

  if (loading) return <div style={{height:'100vh', background:'#000', display:'flex', justifyContent:'center', alignItems:'center', color:'white'}}>Chargement...</div>;

  const valeurTotaleStock = produits.reduce((acc, p) => acc + (p.stock_actuel * p.prix_achat), 0);
  const produitsEnAlerte = produits.filter(p => p.stock_actuel <= p.seuil_alerte).length;

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root { --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

        .light {
          --bg-main: #f2f2f7; --bg-glass: rgba(255, 255, 255, 0.7); --bg-card: #ffffff;
          --text-primary: #1d1d1f; --text-secondary: #86868b; --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); --primary: #10b981; /* Emerald Green for Inventory */
          --primary-glow: rgba(16, 185, 129, 0.3); --danger: #ef4444; --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000; --bg-glass: rgba(28, 28, 30, 0.7); --bg-card: #1c1c1e;
          --text-primary: #f5f5f7; --text-secondary: #a1a1a6; --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6); --primary: #34d399;
          --primary-glow: rgba(52, 211, 153, 0.4); --danger: #ff453a; --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }
        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- PARALLAX ORBS --- */
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--primary); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #0ea5e9; }

        /* --- SIDEBAR & OVERLAY --- */
        .sidebar-wrapper { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 50; transition: transform 0.3s ease; }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40; display: none; opacity: 0; transition: opacity 0.3s; }

        /* --- MAIN CONTENT --- */
        main { min-height: 100vh; padding: 40px; margin-left: 260px; position: relative; z-index: 1; transition: margin-left 0.3s ease; }

        /* --- HEADER --- */
        .header-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; animation: slideDown 0.8s ease-out; flex-wrap: wrap; gap: 20px; }
        .header-content h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%); -webkit-background-clip: text; color: transparent; }
        .actions { display: flex; gap: 12px; align-items: center; }

        .btn-menu-mobile { display: none; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-size: 24px; padding: 8px 12px; border-radius: 12px; cursor: pointer; }
        .btn-theme { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: var(--transition); box-shadow: var(--shadow); color: var(--text-primary); }
        .btn-theme:hover { transform: scale(1.1); }

        .btn-primary { padding: 14px 24px; border-radius: 99px; border: none; background: linear-gradient(135deg, var(--primary), #059669); color: white; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 8px 20px var(--primary-glow); transition: var(--transition); display: flex; align-items: center; gap: 8px; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px var(--primary-glow); }
        .btn-glass { padding: 12px 20px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-glass); color: var(--text-primary); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .btn-glass:hover { background: var(--bg-card); transform: translateY(-2px); }

        /* --- SEARCH --- */
        .search-bar { position: relative; margin-bottom: 30px; animation: fadeIn 1s ease 0.2s backwards; max-width: 500px; }
        .search-input { width: 100%; padding: 16px 20px 16px 50px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 16px; outline: none; box-shadow: var(--shadow); transition: 0.3s; }
        .search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        .search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }

        /* --- KPI STATS --- */
        .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .kpi-card { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); padding: 24px; border-radius: 24px; display: flex; flex-direction: column; position: relative; overflow: hidden; animation: fadeUp 0.5s ease-out; }
        .kpi-val { font-size: 32px; font-weight: 800; color: var(--text-primary); margin: 5px 0; }
        .kpi-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); }
        
        /* --- PRODUCT GRID (Smart Grid) --- */
        .product-grid { display: flex; flex-direction: column; gap: 16px; }
        
        /* Header Row (PC) */
        .grid-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr; gap: 15px; padding: 0 24px; margin-bottom: 5px; color: var(--text-secondary); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }

        .product-card {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 20px; padding: 16px 24px;
          transition: var(--transition); animation: fadeSlide 0.5s ease-out backwards;
        }
        .product-card:hover { transform: scale(1.01); background: var(--bg-card); border-color: var(--primary); z-index: 2; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

        /* Inner Elements */
        .prod-name { font-weight: 700; font-size: 15px; color: var(--text-primary); display: flex; align-items: center; gap: 12px; }
        .prod-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #e2e8f0, #cbd5e1); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #64748b; font-size: 14px; }
        .prod-stock { font-weight: 800; font-size: 15px; }
        .stock-low { color: var(--danger); animation: pulse 2s infinite; }
        .stock-ok { color: var(--primary); }
        .prod-price { font-weight: 600; color: var(--text-secondary); }
        .prod-marge { font-weight: 700; color: var(--primary); background: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: 6px; font-size: 12px; width: fit-content; }
        
        .actions-cell { display: flex; gap: 8px; justify-content: center; }
        .btn-icon { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.1); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-icon:hover { background: var(--text-primary); color: var(--bg-main); }
        .btn-icon.del:hover { background: var(--danger); color: white; border-color: var(--danger); }

        /* --- MODAL --- */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .modal-card { width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; background: var(--bg-card); padding: 40px; border-radius: 32px; box-shadow: 0 30px 80px rgba(0,0,0,0.4); border: 1px solid var(--border); animation: zoomIn 0.3s ease-out; }
        .modal-title { font-size: 26px; font-weight: 800; margin-bottom: 30px; color: var(--text-primary); }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .input-group label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .input-field { width: 100%; padding: 16px; border-radius: 16px; border: 1px solid transparent; background: var(--input-bg); color: var(--text-primary); font-size: 16px; outline: none; transition: 0.3s; }
        .input-field:focus { border-color: var(--primary); background: var(--bg-card); box-shadow: 0 0 0 4px var(--primary-glow); }

        /* --- MEDIA QUERIES (MOBILE) --- */
        @media (max-width: 1024px) {
          .sidebar-wrapper { transform: translateX(-100%); }
          .sidebar-wrapper.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; opacity: 1; }
          main { margin-left: 0; padding: 20px; width: 100%; }
          .btn-menu-mobile { display: block; }
        }

        @media (max-width: 768px) {
          .header-bar { flex-direction: column; align-items: flex-start; }
          .actions { width: 100%; justify-content: space-between; }
          .search-bar { max-width: 100%; }
          
          /* Card transformation */
          .grid-header { display: none; }
          .product-card { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px; position: relative; }
          .prod-name { font-size: 18px; width: 100%; }
          .prod-icon { width: 48px; height: 48px; font-size: 18px; }
          .prod-info-row { display: flex; justify-content: space-between; width: 100%; font-size: 14px; color: var(--text-secondary); border-bottom: 1px dashed var(--border); padding-bottom: 8px; }
          .actions-cell { width: 100%; margin-top: 10px; justify-content: flex-end; gap: 15px; }
          .btn-icon { width: 40px; height: 40px; border-radius: 12px; }
          
          /* Form */
          .form-grid { grid-template-columns: 1fr; }
        }

        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* OVERLAY MOBILE */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />
      </div>

      <div className="orb orb-1" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}></div>
      <div className="orb orb-2" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}></div>

      <main>
        {/* HEADER */}
        <div className="header-bar">
          <div style={{display:'flex', alignItems:'center', gap:'15px', width:'100%'}}>
            <button className="btn-menu-mobile" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="header-content">
              <h1>Stock & Produits</h1>
              <div style={{color:'var(--text-secondary)'}}>Catalogue et inventaire temps réel</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <IconSun /> : <IconMoon />}
            </button>
            <button className="btn-glass" onClick={exportExcel}>
              <IconDownload /> Export
            </button>
            <button className="btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <IconPlus /> Ajouter
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-label">Valeur du Stock</div>
            <div className="kpi-val">{formatMoney(valeurTotaleStock)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Produits en Alerte</div>
            <div className="kpi-val" style={{color: produitsEnAlerte > 0 ? 'var(--danger)' : 'var(--text-primary)'}}>
              {produitsEnAlerte}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Références</div>
            <div className="kpi-val">{produits.length}</div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="search-bar">
          <div className="search-icon"><IconSearch /></div>
          <input 
            type="text" 
            placeholder="Rechercher un produit, un code..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="search-input"
          />
        </div>

        {/* GRID LIST */}
        <div className="product-grid">
          <div className="grid-header">
            <div>Produit</div>
            <div style={{textAlign:'center'}}>Stock</div>
            <div>Unité</div>
            <div style={{textAlign:'right'}}>P. Achat</div>
            <div style={{textAlign:'right'}}>P. Vente</div>
            <div style={{textAlign:'center'}}>Marge</div>
            <div style={{textAlign:'center'}}>Actions</div>
          </div>

          {filtered.map((p, i) => {
            const alerte = p.stock_actuel <= p.seuil_alerte;
            const marge = p.prix_vente - p.prix_achat;
            
            return (
              <div key={p.id} className="product-card" style={{animationDelay: `${i * 0.03}s`}}>
                
                {/* Mobile Layout Helper */}
                <div className="prod-name">
                  <div className="prod-icon">{p.nom.substring(0, 2).toUpperCase()}</div>
                  <div>{p.nom}</div>
                </div>

                {/* Desktop Columns / Mobile Rows */}
                <div className="prod-info-row" style={{justifyContent:'center', textAlign:'center'}}>
                  <span className={`prod-stock ${alerte ? 'stock-low' : 'stock-ok'}`}>
                    {p.stock_actuel}
                  </span>
                  {/* Only visible on mobile via flex */}
                  <span style={{display:'none'}} className="mobile-label">En stock</span> 
                </div>

                <div className="prod-info-row">{p.unite}</div>
                
                <div className="prod-info-row" style={{justifyContent:'flex-end'}}>
                  {formatMoney(p.prix_achat)}
                </div>
                
                <div className="prod-info-row" style={{justifyContent:'flex-end', fontWeight:'700', color:'var(--text-primary)'}}>
                  {formatMoney(p.prix_vente)}
                </div>

                <div className="prod-info-row" style={{justifyContent:'center'}}>
                  <span className="prod-marge">+{marge.toLocaleString()}</span>
                </div>

                <div className="actions-cell">
                  <button className="btn-icon" onClick={() => handleEdit(p)}><IconEdit /></button>
                  <button className="btn-icon del" onClick={() => deleteProduit(p.id)}><IconTrash /></button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{textAlign:'center', padding:'4rem', color:'var(--text-secondary)', background:'var(--bg-glass)', borderRadius:'20px'}}>
              Aucun produit trouvé.
            </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h2>
            <form onSubmit={saveProduit}>
              <div className="input-group" style={{marginBottom:'20px'}}>
                <label>Nom du produit</label>
                <input className="input-field" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required placeholder="Ex: iPhone 15 Pro" />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Stock Actuel</label>
                  <input type="number" className="input-field" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Unité</label>
                  <input className="input-field" value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} placeholder="pcs, kg..." />
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Prix Achat (Coût)</label>
                  <input type="number" className="input-field" value={form.prix_achat} onChange={e => setForm({...form, prix_achat: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Prix Vente</label>
                  <input type="number" className="input-field" value={form.prix_vente} onChange={e => setForm({...form, prix_vente: e.target.value})} required />
                </div>
              </div>

              <div className="input-group" style={{marginBottom:'30px'}}>
                <label>Seuil d'alerte</label>
                <input type="number" className="input-field" value={form.seuil_alerte} onChange={e => setForm({...form, seuil_alerte: e.target.value})} />
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:'15px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding:'14px 28px', borderRadius:'12px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', fontWeight:'600', cursor:'pointer'}}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
