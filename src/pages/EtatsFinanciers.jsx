// src/pages/EtatsFinanciers.jsx
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* --- ICONS (Optimized strokes) --- */
const IconDownload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const IconChart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const IconScale = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A5.974 5.974 0 0114.175 2.076m0 0A5.967 5.967 0 012.25 4.97m11.925-2.894A5.951 5.951 0 0012 2.75c-1.296 0-2.508.38-3.543 1.032m0 0c1.035.652 2.247 1.032 3.543 1.032 1.296 0 2.508-.38 3.543-1.032M2.25 4.971c.907.304 1.852.485 2.835.529 1.472.066 2.946-.226 4.172-.855 1.226.629 2.7.921 4.172.855 1.258-.056 2.455-.333 3.543-.808" /></svg>;
const IconWallet = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>;
const IconSun = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;
const IconMoon = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>;

/* --- HIGH-END APPLE STYLE CSS --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

  :root {
    /* LIGHT THEME (Default) */
    --bg-app: #f5f5f7;
    --text-primary: #1d1d1f;
    --text-secondary: #86868b;
    --card-bg: rgba(255, 255, 255, 0.75);
    --card-border: rgba(255, 255, 255, 0.4);
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    --accent-color: #0071e3;
    --success-bg: rgba(52, 199, 89, 0.1);
    --success-text: #28cd41;
    --danger-bg: rgba(255, 59, 48, 0.1);
    --danger-text: #ff3b30;
    --blob-1: #ffcfd2;
    --blob-2: #cfdfff;
    --blob-3: #e0f2fe;
    --sidebar-width: 260px;
  }

  [data-theme='dark'] {
    --bg-app: #000000;
    --text-primary: #f5f5f7;
    --text-secondary: #a1a1a6;
    --card-bg: rgba(28, 28, 30, 0.65);
    --card-border: rgba(255, 255, 255, 0.1);
    --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
    --accent-color: #2997ff;
    --success-bg: rgba(48, 209, 88, 0.15);
    --success-text: #30d158;
    --danger-bg: rgba(255, 69, 58, 0.15);
    --danger-text: #ff453a;
    --blob-1: #2c0e12;
    --blob-2: #091a38;
    --blob-3: #121212;
  }

  * { box-sizing: border-box; transition: background-color 0.4s ease, border-color 0.4s ease, color 0.3s ease; }
  body { 
    font-family: 'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
    margin: 0; 
    background: var(--bg-app); 
    color: var(--text-primary); 
    overflow-x: hidden;
  }

  /* LAYOUT & SCROLLBAR */
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--text-secondary); border-radius: 4px; opacity: 0.2; }

  .layout { display: flex; min-height: 100vh; position: relative; z-index: 1; }
  
  /* AURORA BACKGROUND ANIMATION */
  .aurora-bg {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: -1;
    overflow: hidden;
    background: var(--bg-app);
  }
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.6;
    animation: moveBlob 20s infinite alternate;
  }
  .blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--blob-1); animation-duration: 25s; }
  .blob-2 { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: var(--blob-2); animation-duration: 30s; animation-direction: reverse; }
  .blob-3 { top: 40%; left: 40%; width: 40vw; height: 40vw; background: var(--blob-3); animation-delay: -5s; }

  @keyframes moveBlob {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(50px, 50px) scale(1.1); }
  }

  .main-area {
    margin-left: var(--sidebar-width);
    padding: 3rem;
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dashboard-container {
    width: 100%;
    max-width: 1100px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    perspective: 1000px; /* Essential for 3D tilt */
  }

  /* HEADER SECTION */
  .header-flex {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 1rem;
    animation: slideDown 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .header-titles h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.02em;
  }
  .header-titles p { color: var(--text-secondary); font-size: 1.1rem; margin-top: 0.5rem; }

  .actions-group {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  /* BUTTONS & TOGGLES */
  .btn-download {
    padding: 0.8rem 1.5rem;
    background: var(--text-primary);
    color: var(--bg-app);
    border: none;
    border-radius: 30px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .btn-download:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
  .btn-download:active { transform: scale(0.95); }

  .theme-toggle {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text-primary);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  .theme-toggle:hover { background: var(--text-primary); color: var(--bg-app); }

  /* NAVIGATION TABS (Segmented Control) */
  .tabs-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 1rem;
    animation: fadeIn 1s ease 0.2s backwards;
  }
  .tabs-container {
    background: rgba(118, 118, 128, 0.12);
    padding: 4px;
    border-radius: 20px;
    display: flex;
    position: relative;
    backdrop-filter: blur(20px);
  }
  .tab-btn {
    position: relative;
    z-index: 2;
    padding: 8px 24px;
    border: none;
    border-radius: 16px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    color: var(--text-secondary);
    background: transparent;
    transition: color 0.3s;
    display: flex; align-items: center; gap: 8px;
  }
  .tab-btn.active { color: var(--text-primary); }
  
  /* Sliding indicator logic handled via simple bg for now, kept robust */
  .tab-btn.active {
    background: var(--card-bg);
    box-shadow: 0 3px 8px rgba(0,0,0,0.12);
  }

  /* GLASSMORPHISM CARDS */
  .glass-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 24px;
    padding: 2rem;
    box-shadow: var(--glass-shadow);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    transition: transform 0.1s linear, box-shadow 0.3s ease; /* Fast transform for tilt */
    position: relative;
    overflow: hidden;
  }
  /* Shine effect */
  .glass-card::before {
    content: '';
    position: absolute; top: 0; left: -50%; width: 200%; height: 100%;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
    transform: rotate(30deg);
    pointer-events: none;
    transition: 0.5s;
    opacity: 0;
  }
  .glass-card:hover::before { opacity: 1; left: 100%; transition: 0.7s; }

  /* GRID LAYOUTS */
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 2rem;
    animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s backwards;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  .card-title { margin: 0; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.01em; }
  .badge { padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .badge-green { background: var(--success-bg); color: var(--success-text); }
  .badge-red { background: var(--danger-bg); color: var(--danger-text); }

  /* DATA ROWS */
  .data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid rgba(150, 150, 150, 0.1);
    font-size: 1rem;
    transition: background 0.2s;
  }
  .data-row:hover { padding-left: 10px; padding-right: 10px; background: rgba(150,150,150,0.05); border-radius: 12px; border-bottom-color: transparent; }
  .row-label { color: var(--text-secondary); }
  .row-value { font-weight: 600; color: var(--text-primary); font-variant-numeric: tabular-nums; letter-spacing: -0.5px; }

  .total-row {
    margin-top: 1.5rem;
    padding: 1.2rem;
    background: rgba(120, 120, 120, 0.05);
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 800;
    font-size: 1.2rem;
  }

  /* RESULT NET WIDGET */
  .result-widget {
    margin-top: 2rem;
    padding: 2rem;
    border-radius: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
  }
  .res-pos { background: linear-gradient(135deg, rgba(48,209,88,0.1), rgba(48,209,88,0.05)); border: 1px solid rgba(48,209,88,0.2); color: var(--success-text); }
  .res-neg { background: linear-gradient(135deg, rgba(255,69,58,0.1), rgba(255,69,58,0.05)); border: 1px solid rgba(255,69,58,0.2); color: var(--danger-text); }

  /* TRESORERIE BIG NUMBER */
  .big-stat {
    font-size: 4rem;
    font-weight: 800;
    letter-spacing: -2px;
    background: linear-gradient(to right, var(--accent-color), #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 1rem 0;
  }

  /* ANIMATIONS */
  @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* MOBILE RESPONSIVE */
  @media (max-width: 900px) {
    .main-area { margin-left: 0; padding: 1.5rem; }
    .header-flex { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .actions-group { width: 100%; justify-content: space-between; }
    .bento-grid { grid-template-columns: 1fr; }
    .tabs-container { width: 100%; overflow-x: auto; }
  }
`;

// Hook pour effet Tilt 3D (Parallaxe Souris)
const useTilt = (active) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    
    const card = ref.current;
    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Rotation values (subtle)
      const rotateX = ((y - centerY) / centerY) * -3; // Max 3deg
      const rotateY = ((x - centerX) / centerX) * 3;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    };

    const handleLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
    return () => {
      card.removeEventListener('mousemove', handleMove);
      card.removeEventListener('mouseleave', handleLeave);
    };
  }, [active]);

  return ref;
};

// Composant Wrapper Carte avec effet Tilt
const TiltCard = ({ children, style, className }) => {
  const tiltRef = useTilt(true); // Activer l'effet
  return (
    <div ref={tiltRef} className={`glass-card ${className || ''}`} style={style}>
      {children}
    </div>
  );
};

export default function EtatsFinanciers() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [entreprise, setEntreprise] = useState(null);
  const [activeTab, setActiveTab] = useState('bilan');

  // Etats financiers
  const [bilan, setBilan] = useState({ actif: { immob: 0, stocks: 0, creances: 0, tresorerie: 0, total: 0 }, passif: { capitaux: 0, dettesFi: 0, dettesFourn: 0, dettesFiscales: 0, total: 0 } });
  const [resultat, setResultat] = useState({ produits: { ventes: 0, autres: 0, total: 0 }, charges: { achats: 0, transports: 0, externes: 0, impots: 0, personnel: 0, total: 0 }, net: 0 });

  // Gestion du thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Chargement données (identique à ton code original)
  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      calculerEtats(ste.id);
    } else {
      setLoading(false);
    }
  }

  async function calculerEtats(entrepriseId) {
    const { data: lignes } = await supabase
      .from('lignes_ecriture')
      .select(`debit, credit, compte:plan_comptable!inner(code_compte)`)
      .eq('plan_comptable.entreprise_id', entrepriseId);

    if (!lignes) { setLoading(false); return; }

    let bActif = { immob: 0, stocks: 0, creances: 0, tresorerie: 0 };
    let bPassif = { capitaux: 0, dettesFi: 0, dettesFourn: 0, dettesFiscales: 0 };
    let cProduits = { ventes: 0, autres: 0 };
    let cCharges = { achats: 0, transports: 0, externes: 0, impots: 0, personnel: 0 };

    lignes.forEach(L => {
      const code = L.compte.code_compte.toString();
      const solde = L.debit - L.credit; 

      if (code.startsWith('1')) bPassif.capitaux += (L.credit - L.debit);
      else if (code.startsWith('16')) bPassif.dettesFi += (L.credit - L.debit);
      else if (code.startsWith('2')) bActif.immob += solde;
      else if (code.startsWith('3')) bActif.stocks += solde;
      else if (code.startsWith('40')) bPassif.dettesFourn += (L.credit - L.debit);
      else if (code.startsWith('41')) bActif.creances += solde;
      else if (code.startsWith('44')) bPassif.dettesFiscales += (L.credit - L.debit);
      else if (code.startsWith('5')) bActif.tresorerie += solde;
      else if (code.startsWith('60')) cCharges.achats += solde;
      else if (code.startsWith('61')) cCharges.transports += solde;
      else if (code.startsWith('62') || code.startsWith('63')) cCharges.externes += solde;
      else if (code.startsWith('64')) cCharges.impots += solde;
      else if (code.startsWith('66')) cCharges.personnel += solde;
      else if (code.startsWith('70')) cProduits.ventes += (L.credit - L.debit);
      else if (code.startsWith('7')) cProduits.autres += (L.credit - L.debit);
    });

    const totalActif = Object.values(bActif).reduce((a, b) => a + b, 0);
    const totalProduits = cProduits.ventes + cProduits.autres;
    const totalCharges = cCharges.achats + cCharges.transports + cCharges.externes + cCharges.impots + cCharges.personnel;
    const resultatNet = totalProduits - totalCharges;

    bPassif.capitaux += resultatNet; 
    const totalPassif = bPassif.capitaux + bPassif.dettesFi + bPassif.dettesFourn + bPassif.dettesFiscales;

    setBilan({ actif: {...bActif, total: totalActif}, passif: {...bPassif, total: totalPassif} });
    setResultat({ produits: {...cProduits, total: totalProduits}, charges: {...cCharges, total: totalCharges}, net: resultatNet });
    setLoading(false);
  }

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`BILAN & RÉSULTAT - ${entreprise?.nom || ''}`, 14, 20);
    autoTable(doc, {
      startY: 30, head: [['Poste', 'Montant']],
      body: [
        ['Total Actif', bilan.actif.total.toLocaleString()],
        ['Total Passif', bilan.passif.total.toLocaleString()],
        ['Résultat Net', resultat.net.toLocaleString()]
      ]
    });
    doc.save('etats_financiers.pdf');
  };

  if (loading) return (
    <div style={{height:'100vh', width:'100%', display:'flex', justifyContent:'center', alignItems:'center', background:'var(--bg-app)', color:'var(--text-primary)'}}>
       <style>{styles}</style>Chargement des données...
    </div>
  );

  return (
    <div className="layout">
      <style>{styles}</style>
      
      {/* BACKGROUND BLOBS */}
      <div className="aurora-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <main className="main-area">
        <div className="dashboard-container">
          
          {/* HEADER */}
          <div className="header-flex">
            <div className="header-titles">
              <h1>États Financiers</h1>
              <p>Vue immersive de votre santé financière</p>
            </div>
            <div className="actions-group">
              <button onClick={toggleTheme} className="theme-toggle" title="Changer le thème">
                <div style={{width:24, height:24}}>
                  {theme === 'light' ? <IconMoon /> : <IconSun />}
                </div>
              </button>
              <button onClick={exportPDF} className="btn-download">
                <div style={{width:20, height:20}}><IconDownload /></div> 
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* ONGLETS */}
          <div className="tabs-wrapper">
            <div className="tabs-container">
              <button onClick={() => setActiveTab('bilan')} className={`tab-btn ${activeTab === 'bilan' ? 'active' : ''}`}>
                <div style={{width:18, height:18}}><IconScale /></div> Bilan
              </button>
              <button onClick={() => setActiveTab('resultat')} className={`tab-btn ${activeTab === 'resultat' ? 'active' : ''}`}>
                <div style={{width:18, height:18}}><IconChart /></div> Résultat
              </button>
              <button onClick={() => setActiveTab('tresorerie')} className={`tab-btn ${activeTab === 'tresorerie' ? 'active' : ''}`}>
                <div style={{width:18, height:18}}><IconWallet /></div> Trésorerie
              </button>
            </div>
          </div>

          {/* CONTENU: BILAN (BENTO GRID) */}
          {activeTab === 'bilan' && (
            <div className="bento-grid">
              
              <TiltCard style={{ borderTop: '4px solid #34c759' }}>
                <div className="card-header">
                  <h3 className="card-title">Actif</h3>
                  <span className="badge badge-green">Possessions</span>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                  <FinancialRow label="Immobilisations" value={bilan.actif.immob} />
                  <FinancialRow label="Stocks" value={bilan.actif.stocks} />
                  <FinancialRow label="Créances Clients" value={bilan.actif.creances} />
                  <FinancialRow label="Trésorerie" value={bilan.actif.tresorerie} />
                </div>
                <div className="total-row" style={{color:'var(--success-text)', marginTop:'2rem'}}>
                  <span>Total Actif</span>
                  <span>{bilan.actif.total.toLocaleString()} F</span>
                </div>
              </TiltCard>

              <TiltCard style={{ borderTop: '4px solid #ff3b30' }}>
                <div className="card-header">
                  <h3 className="card-title">Passif</h3>
                  <span className="badge badge-red">Dettes</span>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                  <FinancialRow label="Capitaux Propres" value={bilan.passif.capitaux} />
                  <FinancialRow label="Emprunts Bancaires" value={bilan.passif.dettesFi} />
                  <FinancialRow label="Dettes Fournisseurs" value={bilan.passif.dettesFourn} />
                  <FinancialRow label="Fiscalité & Taxes" value={bilan.passif.dettesFiscales} />
                </div>
                <div className="total-row" style={{color:'var(--danger-text)', marginTop:'2rem'}}>
                  <span>Total Passif</span>
                  <span>{bilan.passif.total.toLocaleString()} F</span>
                </div>
              </TiltCard>

            </div>
          )}

          {/* CONTENU: RESULTAT */}
          {activeTab === 'resultat' && (
            <div style={{maxWidth:'800px', width:'100%', margin:'0 auto', animation: 'slideUp 0.6s ease'}}>
              <TiltCard>
                <h3 className="card-title" style={{textAlign:'center', marginBottom:'2.5rem', fontSize:'1.5rem'}}>Compte de Résultat</h3>
                
                <div className="bento-grid" style={{gap:'3rem', marginBottom:'2rem'}}>
                    <div>
                        <h4 style={{margin:'0 0 15px 0', color:'var(--success-text)', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'1px'}}>Produits (Recettes)</h4>
                        <FinancialRow label="Chiffre d'Affaires" value={resultat.produits.ventes} bold />
                        <FinancialRow label="Autres produits" value={resultat.produits.autres} />
                        <div style={{textAlign:'right', fontWeight:'800', marginTop:'10px', color:'var(--success-text)'}}>
                            Total: {resultat.produits.total.toLocaleString()} F
                        </div>
                    </div>

                    <div>
                        <h4 style={{margin:'0 0 15px 0', color:'var(--danger-text)', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'1px'}}>Charges (Dépenses)</h4>
                        <FinancialRow label="Achats Marchandises" value={resultat.charges.achats} />
                        <FinancialRow label="Transport" value={resultat.charges.transports} />
                        <FinancialRow label="Services Extérieurs" value={resultat.charges.externes} />
                        <FinancialRow label="Impôts & Taxes" value={resultat.charges.impots} />
                        <FinancialRow label="Personnel" value={resultat.charges.personnel} />
                        <div style={{textAlign:'right', fontWeight:'800', marginTop:'10px', color:'var(--danger-text)'}}>
                            Total: {resultat.charges.total.toLocaleString()} F
                        </div>
                    </div>
                </div>

                <div className={`result-widget ${resultat.net >= 0 ? 'res-pos' : 'res-neg'}`}>
                  <div>
                    <div style={{fontSize:'0.8rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1px', opacity:0.8}}>Résultat Net</div>
                    <div style={{fontSize:'2rem', fontWeight:'800', marginTop:'5px'}}>
                      {resultat.net > 0 ? '+' : ''}{resultat.net.toLocaleString()} F
                    </div>
                  </div>
                  <div style={{fontSize:'3rem', filter:'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'}}>
                    {resultat.net >= 0 ? '🚀' : '📉'}
                  </div>
                </div>
              </TiltCard>
            </div>
          )}

          {/* CONTENU: TRESORERIE */}
          {activeTab === 'tresorerie' && (
            <div style={{maxWidth:'600px', width:'100%', margin:'0 auto', animation: 'slideUp 0.6s ease'}}>
                <TiltCard style={{textAlign:'center', padding:'4rem 2rem'}}>
                <div style={{
                    width:100, height:100, 
                    background:'linear-gradient(135deg, var(--accent-color), #a855f7)', 
                    borderRadius:'50%', 
                    display:'flex', alignItems:'center', justifyContent:'center', 
                    margin:'0 auto 2rem auto', 
                    boxShadow: '0 10px 30px -10px var(--accent-color)',
                    color: 'white'
                }}>
                    <div style={{width:50, height:50}}><IconWallet /></div>
                </div>
                <h2 style={{margin:0, fontSize:'1.8rem', fontWeight:'700'}}>Trésorerie Disponible</h2>
                <p style={{color:'var(--text-secondary)', margin:'0.5rem 0 0 0'}}>Solde cumulé immédiat (Banque + Caisse)</p>
                
                <div className="big-stat">
                    {bilan.actif.tresorerie.toLocaleString()} <span style={{fontSize:'1.5rem', color:'var(--text-secondary)', fontWeight:'500'}}>F</span>
                </div>
                <p style={{fontSize:'0.9rem', color:'var(--text-secondary)', background:'rgba(120,120,120,0.1)', display:'inline-block', padding:'5px 15px', borderRadius:'15px'}}>
                    Mis à jour à l'instant
                </p>
                </TiltCard>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Composant Helper pour les lignes (Memoized for performance ideally, but fine here)
function FinancialRow({ label, value, bold }) {
  return (
    <div className="data-row">
      <span className="row-label" style={{fontWeight: bold ? '600' : '400', color: bold ? 'var(--text-primary)' : 'var(--text-secondary)'}}>{label}</span>
      <span className="row-value">{value.toLocaleString()}</span>
    </div>
  );
}
