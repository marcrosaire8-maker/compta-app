import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* --- ICÔNES --- */
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconBox = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconPDF = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const IconRefresh = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;

export default function EditionsUltimate() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [activeTab, setActiveTab] = useState('journal');
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Filters & Data
  const [dateDebut, setDateDebut] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateFin, setDateFin] = useState(`${new Date().getFullYear()}-12-31`);
  const [journalData, setJournalData] = useState([]);
  const [inventaireData, setInventaireData] = useState([]);

  useEffect(() => { initData(); }, []);

  // Parallaxe Effect
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
    if (ste) setEntreprise(ste);
    setLoading(false);
  }

  // --- LOGIC (JOURNAL & INVENTAIRE) ---
  async function fetchJournal() {
    // Petit délai artificiel pour montrer l'animation de chargement si c'est trop rapide
    setLoading(true);
    const { data, error } = await supabase
      .from('lignes_ecriture')
      .select(`debit, credit, ecriture:ecritures_comptables!inner (date_ecriture, libelle, numero_piece:id), compte:plan_comptable!inner (code_compte, libelle)`)
      .eq('plan_comptable.entreprise_id', entreprise.id)
      .gte('ecriture.date_ecriture', dateDebut)
      .lte('ecriture.date_ecriture', dateFin)
      .order('ecriture(date_ecriture)', { ascending: true });

    if (error) console.error(error);
    else setJournalData(data || []);
    setLoading(false);
  }

  async function fetchInventaire() {
    setLoading(true);
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('entreprise_id', entreprise.id)
      .eq('type_produit', 'BIEN')
      .gt('stock_actuel', 0);

    if (error) console.error(error);
    else setInventaireData(data || []);
    setLoading(false);
  }

  const printLivreJournal = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(`LIVRE-JOURNAL`, 14, 20);
    doc.setFontSize(10); doc.text(`Période : ${dateDebut} au ${dateFin}`, 14, 28);

    const rows = journalData.map(L => [
      new Date(L.ecriture.date_ecriture).toLocaleDateString(),
      L.ecriture.numero_piece?.toString().substring(0, 8),
      L.compte.code_compte,
      L.compte.libelle,
      L.ecriture.libelle,
      L.debit > 0 ? L.debit.toLocaleString() : '',
      L.credit > 0 ? L.credit.toLocaleString() : ''
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Ref', 'Cpt', 'Compte', 'Libellé', 'Débit', 'Crédit']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save('livre_journal.pdf');
  };

  const printInventaire = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(`LIVRE D'INVENTAIRE`, 14, 20);
    doc.setFontSize(10); doc.text(`Arrêté au : ${new Date().toLocaleDateString()}`, 14, 28);

    let totalValeur = 0;
    const rows = inventaireData.map(p => {
      const valeur = p.stock_actuel * p.prix_vente;
      totalValeur += valeur;
      return [p.nom, `${p.stock_actuel} ${p.unite}`, p.prix_vente.toLocaleString(), valeur.toLocaleString()];
    });
    rows.push(['TOTAL', '', '', totalValeur.toLocaleString()]);

    autoTable(doc, {
      startY: 35,
      head: [['Désignation', 'Qté', 'PU (Est.)', 'Valeur']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });
    doc.save('livre_inventaire.pdf');
  };

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
          --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .light {
          --bg-main: #f2f2f7;
          --bg-glass: rgba(255, 255, 255, 0.65);
          --bg-card: #ffffff;
          --text-primary: #1d1d1f;
          --text-secondary: #86868b;
          --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
          --accent: #4f46e5;
          --accent-glow: rgba(79, 70, 229, 0.3);
          --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000;
          --bg-glass: rgba(28, 28, 30, 0.65);
          --bg-card: #1c1c1e;
          --text-primary: #f5f5f7;
          --text-secondary: #a1a1a6;
          --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6);
          --accent: #6366f1;
          --accent-glow: rgba(99, 102, 241, 0.4);
          --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }

        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- BACKGROUND ORBS --- */
        .orb {
          position: fixed; border-radius: 50%; filter: blur(120px); z-index: 0; pointer-events: none; opacity: 0.4;
        }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--accent); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #ec4899; } /* Pink/Magenta */

        /* --- SIDEBAR & OVERLAY --- */
        .sidebar-wrapper {
          position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 50;
          transition: transform 0.3s ease;
        }
        .mobile-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40;
          display: none; opacity: 0; transition: opacity 0.3s;
        }

        /* --- MAIN LAYOUT --- */
        main {
          min-height: 100vh;
          padding: 40px;
          margin-left: 260px;
          position: relative; 
          z-index: 1;
          transition: margin-left 0.3s ease;
        }

        /* --- HEADER --- */
        .header-bar {
          display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px;
          animation: slideDown 0.8s ease-out;
        }
        .header-content h1 {
          font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text; color: transparent;
        }
        .actions { display: flex; gap: 12px; align-items: center; }

        .btn-menu-mobile {
          display: none; background: var(--bg-card); border: 1px solid var(--border); 
          color: var(--text-primary); font-size: 24px; padding: 8px 12px; 
          border-radius: 12px; cursor: pointer;
        }

        .btn-theme {
          width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border);
          background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 20px; transition: var(--transition); box-shadow: var(--shadow);
        }
        .btn-theme:hover { transform: scale(1.1); }

        /* --- TABS SEGMENTED CONTROL --- */
        .tabs-container {
          background: var(--bg-glass);
          padding: 6px; border-radius: 16px;
          display: flex; gap: 8px; width: fit-content; margin: 0 auto 40px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          animation: fadeUp 0.5s ease-out;
        }
        .tab-btn {
          padding: 10px 24px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: 0.3s;
          background: transparent; color: var(--text-secondary);
        }
        .tab-btn.active {
          background: var(--bg-card); color: var(--text-primary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .tab-btn:hover:not(.active) { color: var(--text-primary); background: rgba(255,255,255,0.05); }

        /* --- FILTER CARD --- */
        .filter-card {
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 20px;
          padding: 24px; margin-bottom: 30px;
          display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap;
          animation: zoomIn 0.4s ease-out;
        }
        .input-group { flex: 1; min-width: 150px; }
        .input-group label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .input-field {
          width: 100%; padding: 14px; border-radius: 12px; border: 1px solid transparent;
          background: var(--input-bg); color: var(--text-primary); outline: none; transition: 0.3s;
        }
        .input-field:focus { border-color: var(--accent); background: var(--bg-card); }

        .btn-action {
          padding: 14px 28px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: 0.3s; flex: 1; justify-content: center;
        }
        .btn-search { background: var(--text-primary); color: var(--bg-main); }
        .btn-pdf { background: #ef4444; color: white; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3); }
        .btn-refresh { background: var(--accent); color: white; box-shadow: 0 8px 20px var(--accent-glow); }
        .btn-action:hover { transform: translateY(-2px); opacity: 0.9; }

        /* --- GRID TABLE (JOURNAL/INVENTAIRE) --- */
        .data-grid { display: flex; flex-direction: column; gap: 12px; }
        
        /* Headers differ based on content, defined in JSX */
        .grid-header {
          display: grid; gap: 16px; padding: 0 24px; margin-bottom: 5px;
          color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase;
        }
        
        .grid-row {
          display: grid; gap: 16px; align-items: center;
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 18px;
          padding: 16px 24px; transition: 0.3s;
          animation: fadeSlide 0.4s ease-out backwards;
        }
        .grid-row:hover {
          transform: scale(1.01); background: var(--bg-card);
          border-color: var(--accent); z-index: 2;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        .cell-main { font-weight: 700; color: var(--accent); font-size: 14px; font-family: 'Monaco', monospace; }
        .cell-desc { font-weight: 500; color: var(--text-primary); font-size: 14px; }
        .cell-date { font-size: 13px; color: var(--text-secondary); }
        .cell-money { font-weight: 700; color: var(--text-primary); text-align: right; }
        .cell-tag { 
          background: rgba(79, 70, 229, 0.1); color: var(--accent); 
          padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; width: fit-content;
        }

        /* --- MEDIA QUERIES --- */
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
          
          .grid-header { display: none; }
          .grid-row { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 20px; }
          
          .grid-row div { width: 100%; display: flex; justify-content: space-between; }
          .grid-row div::before { content: attr(data-label); color: var(--text-secondary); font-size: 11px; font-weight: 700; text-transform: uppercase; }
          
          .cell-money { text-align: right; font-size: 16px; color: #10b981; } /* Highlight money on mobile */
        }

        /* --- ANIMATIONS --- */
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
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
              <h1>Éditions Légales</h1>
              <div style={{color:'var(--text-secondary)'}}>Documents comptables officiels</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </div>

        {/* TABS SWITCHER */}
        <div className="tabs-container">
          <button onClick={() => setActiveTab('journal')} className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}>
            <div style={{width:18, height:18}}><IconBook /></div> Livre-Journal
          </button>
          <button onClick={() => setActiveTab('inventaire')} className={`tab-btn ${activeTab === 'inventaire' ? 'active' : ''}`}>
            <div style={{width:18, height:18}}><IconBox /></div> Inventaire
          </button>
        </div>

        {/* ================= JOURNAL SECTION ================= */}
        {activeTab === 'journal' && (
          <div style={{animation:'fadeUp 0.5s ease-out'}}>
            
            {/* FILTERS CARD */}
            <div className="filter-card">
              <div className="input-group">
                <label>Date Début</label>
                <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="input-field" />
              </div>
              <div className="input-group">
                <label>Date Fin</label>
                <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="input-field" />
              </div>
              <button onClick={fetchJournal} className="btn-action btn-search">
                <div style={{width:18, height:18}}><IconSearch /></div> Rechercher
              </button>
              {journalData.length > 0 && (
                <button onClick={printLivreJournal} className="btn-action btn-pdf">
                  <div style={{width:18, height:18}}><IconPDF /></div> PDF
                </button>
              )}
            </div>

            {loading ? (
               <div style={{textAlign:'center', padding:'3rem', color:'var(--text-secondary)'}}>Chargement des écritures...</div>
            ) : journalData.length > 0 ? (
              <div className="data-grid">
                {/* Header PC */}
                <div className="grid-header" style={{gridTemplateColumns: '1fr 0.8fr 1.5fr 2fr 1fr 1fr'}}>
                  <div>Date</div>
                  <div>Compte</div>
                  <div>Libellé du Compte</div>
                  <div>Libellé Écriture</div>
                  <div style={{textAlign:'right'}}>Débit</div>
                  <div style={{textAlign:'right'}}>Crédit</div>
                </div>

                {/* Rows */}
                {journalData.slice(0, 100).map((L, i) => (
                  <div key={i} className="grid-row" style={{gridTemplateColumns: '1fr 0.8fr 1.5fr 2fr 1fr 1fr', animationDelay: `${i * 0.02}s`}}>
                    <div className="cell-date" data-label="Date">{new Date(L.ecriture.date_ecriture).toLocaleDateString()}</div>
                    <div className="cell-main" data-label="Compte">{L.compte.code_compte}</div>
                    <div className="cell-desc" data-label="Intitulé Cpt" style={{fontSize:'13px', opacity:0.8}}>{L.compte.libelle}</div>
                    <div className="cell-desc" data-label="Libellé" style={{fontStyle:'italic'}}>{L.ecriture.libelle}</div>
                    <div className="cell-money" data-label="Débit" style={{color: L.debit > 0 ? 'var(--text-primary)' : 'transparent'}}>
                      {L.debit > 0 ? L.debit.toLocaleString() : '-'}
                    </div>
                    <div className="cell-money" data-label="Crédit" style={{color: L.credit > 0 ? 'var(--text-primary)' : 'transparent'}}>
                      {L.credit > 0 ? L.credit.toLocaleString() : '-'}
                    </div>
                  </div>
                ))}
                
                <div style={{textAlign:'center', padding:'20px', color:'var(--text-secondary)', fontSize:'12px'}}>
                  Affichage des 100 premières lignes. Générez le PDF pour le document complet.
                </div>
              </div>
            ) : (
              <div style={{textAlign:'center', padding:'3rem', color:'var(--text-secondary)', background:'var(--bg-glass)', borderRadius:'20px'}}>
                Aucune écriture trouvée sur cette période.
              </div>
            )}
          </div>
        )}

        {/* ================= INVENTAIRE SECTION ================= */}
        {activeTab === 'inventaire' && (
          <div style={{animation:'fadeUp 0.5s ease-out'}}>
            
            <div className="filter-card" style={{justifyContent:'flex-start'}}>
              <div style={{flex:2}}>
                <h3 style={{fontSize:'18px', fontWeight:'800', marginBottom:'5px', color:'var(--text-primary)'}}>Valorisation du Stock</h3>
                <p style={{color:'var(--text-secondary)', fontSize:'13px'}}>État actuel des stocks et valorisation estimée.</p>
              </div>
              <button onClick={fetchInventaire} className="btn-action btn-refresh">
                <div style={{width:18, height:18}}><IconRefresh /></div> Actualiser
              </button>
              {inventaireData.length > 0 && (
                <button onClick={printInventaire} className="btn-action btn-pdf">
                   <div style={{width:18, height:18}}><IconPDF /></div> PDF
                </button>
              )}
            </div>

            {loading ? (
              <div style={{textAlign:'center', padding:'3rem', color:'var(--text-secondary)'}}>Calcul du stock...</div>
            ) : inventaireData.length > 0 ? (
              <div className="data-grid">
                <div className="grid-header" style={{gridTemplateColumns: '2fr 1fr 1fr 1fr'}}>
                  <div>Article</div>
                  <div style={{textAlign:'center'}}>Stock</div>
                  <div style={{textAlign:'right'}}>Prix Unitaire</div>
                  <div style={{textAlign:'right'}}>Valeur Totale</div>
                </div>

                {inventaireData.map((p, i) => (
                  <div key={i} className="grid-row" style={{gridTemplateColumns: '2fr 1fr 1fr 1fr', animationDelay: `${i * 0.03}s`}}>
                    <div className="cell-desc" data-label="Article" style={{fontWeight:'700'}}>{p.nom}</div>
                    <div style={{textAlign:'center'}} data-label="Quantité">
                      <span className="cell-tag">{p.stock_actuel} {p.unite}</span>
                    </div>
                    <div className="cell-money" data-label="P.U." style={{fontSize:'14px', opacity:0.8}}>
                      {p.prix_vente.toLocaleString()}
                    </div>
                    <div className="cell-money" data-label="Valeur" style={{color:'#10b981'}}>
                      {(p.stock_actuel * p.prix_vente).toLocaleString()} F
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center', padding:'3rem', color:'var(--text-secondary)', background:'var(--bg-glass)', borderRadius:'20px'}}>
                Aucun stock disponible.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
