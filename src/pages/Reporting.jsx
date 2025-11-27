import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* --- ICONS --- */
const IconEye = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const IconArrowLeft = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>;
const IconDownload = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>;
const IconSun = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>;
const IconMoon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>;

export default function ReportingUltimate() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [balance, setBalance] = useState([]);
  const [grandLivre, setGrandLivre] = useState(null);
  const [filterClasse, setFilterClasse] = useState('all');
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => { initData(); }, []);

  // Parallaxe
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
    await calculerBalance(ste.id);
    setLoading(false);
  }

  async function calculerBalance(entrepriseId) {
    const { data: lignes } = await supabase
      .from('lignes_ecriture')
      .select(`
        id, debit, credit,
        ecriture:ecritures_comptables (date_ecriture, libelle, journal_code),
        compte:plan_comptable!inner (id, code_compte, libelle)
      `)
      .eq('plan_comptable.entreprise_id', entrepriseId);

    if (!lignes) return;

    const map = {};
    lignes.forEach(L => {
      const c = L.compte;
      if (!map[c.id]) {
        map[c.id] = {
          id: c.id, code: c.code_compte, libelle: c.libelle,
          cumulDebit: 0, cumulCredit: 0, mouvements: []
        };
      }
      map[c.id].cumulDebit += L.debit;
      map[c.id].cumulCredit += L.credit;
      map[c.id].mouvements.push({
        date: L.ecriture.date_ecriture,
        journal: L.ecriture.journal_code,
        libelle: L.ecriture.libelle,
        debit: L.debit,
        credit: L.credit
      });
    });

    const result = Object.values(map).sort((a, b) => a.code.localeCompare(b.code));
    setBalance(result);
  }

  const voirGrandLivre = (compte) => {
    const copie = { ...compte };
    copie.mouvements.sort((a, b) => new Date(b.date) - new Date(a.date));
    setGrandLivre(copie);
  };

  const exportBalancePDF = () => {
    const doc = new jsPDF('l');
    doc.setFontSize(18); doc.text(`Balance Générale - ${entreprise.nom}`, 14, 20);
    const rows = balance
      .filter(c => filterClasse === 'all' || c.code.startsWith(filterClasse))
      .map(c => [
        c.code, c.libelle,
        c.cumulDebit.toLocaleString(), c.cumulCredit.toLocaleString(),
        (c.cumulDebit - c.cumulCredit).toLocaleString()
      ]);
    autoTable(doc, { startY: 35, head: [['Compte', 'Intitulé', 'Débit', 'Crédit', 'Solde']], body: rows, theme: 'grid' });
    doc.save(`Balance_${entreprise.nom}.pdf`);
  };

  if (loading) return <div style={{height:'100vh', background:'#000', color:'white', display:'flex', justifyContent:'center', alignItems:'center'}}>Chargement...</div>;

  const filteredBalance = balance.filter(c => filterClasse === 'all' || c.code.startsWith(filterClasse));

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root { --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

        .light {
          --bg-main: #f2f2f7; --bg-glass: rgba(255, 255, 255, 0.7); --bg-card: #ffffff;
          --text-primary: #1d1d1f; --text-secondary: #86868b; --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); 
          --accent: #ef4444; /* Reporting Red */
          --accent-glow: rgba(239, 68, 68, 0.3);
          --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000; --bg-glass: rgba(28, 28, 30, 0.7); --bg-card: #1c1c1e;
          --text-primary: #f5f5f7; --text-secondary: #a1a1a6; --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6); 
          --accent: #f87171;
          --accent-glow: rgba(248, 113, 113, 0.4);
          --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }
        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- PARALLAX ORBS --- */
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--accent); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #f59e0b; }

        /* --- LAYOUT --- */
        .sidebar-wrapper { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 50; transition: transform 0.3s ease; }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40; display: none; opacity: 0; transition: opacity 0.3s; }
        main { min-height: 100vh; padding: 40px; margin-left: 260px; position: relative; z-index: 1; transition: margin-left 0.3s ease; }

        /* --- HEADER --- */
        .header-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; animation: slideDown 0.8s ease-out; }
        .header-content h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%); -webkit-background-clip: text; color: transparent; }
        .actions { display: flex; gap: 12px; align-items: center; }

        .btn-menu-mobile { display: none; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-size: 24px; padding: 8px 12px; border-radius: 12px; cursor: pointer; }
        .btn-theme { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: var(--transition); box-shadow: var(--shadow); color: var(--text-primary); }
        .btn-theme:hover { transform: scale(1.1); }

        .btn-primary { padding: 14px 24px; border-radius: 99px; border: none; background: linear-gradient(135deg, var(--accent), #dc2626); color: white; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 8px 20px var(--accent-glow); transition: var(--transition); display: flex; align-items: center; gap: 8px; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px var(--accent-glow); }
        .btn-glass { padding: 12px 20px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-glass); color: var(--text-primary); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .btn-glass:hover { background: var(--bg-card); transform: translateY(-2px); }

        /* --- FILTER BAR --- */
        .filter-container { display: flex; gap: 16px; margin-bottom: 30px; animation: fadeIn 1s ease 0.2s backwards; align-items: center; }
        .filter-select { padding: 14px 20px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); outline: none; font-weight: 600; cursor: pointer; min-width: 200px; box-shadow: var(--shadow); }
        .count-badge { font-weight: 700; color: var(--accent); background: rgba(239,68,68,0.1); padding: 6px 12px; border-radius: 20px; font-size: 12px; }

        /* --- GRID & CARDS (BALANCE) --- */
        .report-grid { display: flex; flex-direction: column; gap: 12px; }
        
        .grid-header { display: grid; grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr; gap: 20px; padding: 0 24px; margin-bottom: 5px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; }

        .report-card {
          display: grid; grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr; gap: 20px; align-items: center;
          background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border);
          border-radius: 18px; padding: 16px 24px; transition: var(--transition);
          animation: fadeSlide 0.5s ease-out backwards;
        }
        .report-card:hover { transform: scale(1.01); background: var(--bg-card); border-color: var(--accent); z-index: 2; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

        .cell-code { font-family: monospace; font-weight: 700; color: var(--accent); font-size: 15px; }
        .cell-libelle { font-weight: 600; color: var(--text-primary); }
        .cell-val { color: var(--text-secondary); text-align: right; }
        .cell-solde { font-weight: 800; text-align: right; font-size: 15px; }
        
        .solde-D { color: #10b981; } /* Green for Debit/Pos */
        .solde-C { color: #ef4444; } /* Red for Credit/Neg */

        /* --- GRAND LIVRE VIEW (SLIDE IN) --- */
        .detail-view { animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .detail-header { background: var(--bg-glass); padding: 24px; border-radius: 24px; border: 1px solid var(--border); margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
        .detail-title { font-size: 20px; font-weight: 800; color: var(--text-primary); }
        
        .mouv-row {
          display: grid; grid-template-columns: 1fr 1fr 3fr 1fr 1fr; gap: 20px;
          padding: 16px 24px; border-bottom: 1px dashed var(--border); font-size: 14px; color: var(--text-primary);
        }
        .mouv-row:last-child { border: none; }
        
        .total-row { 
          background: var(--bg-card); padding: 16px 24px; border-radius: 16px; margin-top: 10px;
          display: flex; justify-content: space-between; font-weight: 800; color: var(--text-primary);
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
          .header-bar { flex-direction: column; align-items: flex-start; gap: 15px; }
          .actions { width: 100%; justify-content: space-between; }
          
          .grid-header { display: none; }
          .report-card { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 20px; position: relative; }
          .report-card div { width: 100%; display: flex; justify-content: space-between; }
          
          .cell-code { font-size: 18px; }
          .cell-val { display: none; } /* Hide intermediate columns on mobile */
          .cell-solde { font-size: 20px; text-align: right; margin-top: 5px; }
          
          .mouv-row { grid-template-columns: 1fr; gap: 5px; background: var(--bg-glass); margin-bottom: 10px; border-radius: 12px; border: 1px solid var(--border); }
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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
              <h1>Reporting</h1>
              <div style={{color:'var(--text-secondary)'}}>{grandLivre ? 'Détail des mouvements' : 'Balance Générale des Comptes'}</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <IconSun/> : <IconMoon/>}
            </button>
            {grandLivre ? (
              <button onClick={() => setGrandLivre(null)} className="btn-glass">
                <IconArrowLeft /> Retour
              </button>
            ) : (
              <button onClick={exportBalancePDF} className="btn-primary">
                <IconDownload /> Export PDF
              </button>
            )}
          </div>
        </div>

        {/* MODE BALANCE */}
        {!grandLivre && (
          <>
            <div className="filter-container">
              <select className="filter-select" value={filterClasse} onChange={e => setFilterClasse(e.target.value)}>
                <option value="all">Toutes les classes</option>
                <option value="1">Classe 1 - Capitaux</option>
                <option value="2">Classe 2 - Immo</option>
                <option value="3">Classe 3 - Stocks</option>
                <option value="4">Classe 4 - Tiers</option>
                <option value="5">Classe 5 - Trésorerie</option>
                <option value="6">Classe 6 - Charges</option>
                <option value="7">Classe 7 - Produits</option>
              </select>
              <span className="count-badge">{filteredBalance.length} Comptes</span>
            </div>

            <div className="report-grid">
              <div className="grid-header">
                <div>Compte</div>
                <div>Intitulé</div>
                <div style={{textAlign:'right'}}>Débit Cumul</div>
                <div style={{textAlign:'right'}}>Crédit Cumul</div>
                <div style={{textAlign:'right'}}>Solde</div>
                <div style={{textAlign:'right'}}>Action</div>
              </div>

              {filteredBalance.map((c, i) => {
                const solde = c.cumulDebit - c.cumulCredit;
                return (
                  <div key={c.id} className="report-card" style={{animationDelay: `${i * 0.03}s`}}>
                    <div className="cell-code">{c.code}</div>
                    <div className="cell-libelle">{c.libelle}</div>
                    <div className="cell-val">{c.cumulDebit.toLocaleString()}</div>
                    <div className="cell-val">{c.cumulCredit.toLocaleString()}</div>
                    <div className={`cell-solde ${solde >= 0 ? 'solde-D' : 'solde-C'}`}>
                      {Math.abs(solde).toLocaleString()} {solde >= 0 ? 'D' : 'C'}
                    </div>
                    <div style={{textAlign:'right'}}>
                      <button className="btn-glass" style={{padding:'8px 16px', fontSize:'12px'}} onClick={() => voirGrandLivre(c)}>
                        <IconEye /> Voir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* MODE GRAND LIVRE */}
        {grandLivre && (
          <div className="detail-view">
            <div className="detail-header">
              <div className="detail-title">
                <span style={{color:'var(--accent)', marginRight:'10px'}}>{grandLivre.code}</span>
                {grandLivre.libelle}
              </div>
              <div className="count-badge">{grandLivre.mouvements.length} Mouvements</div>
            </div>

            <div style={{background:'var(--bg-glass)', borderRadius:'24px', border:'1px solid var(--border)', overflow:'hidden', backdropFilter:'blur(20px)'}}>
              <div className="grid-header" style={{gridTemplateColumns:'1fr 1fr 3fr 1fr 1fr', padding:'20px 24px', background:'rgba(120,120,120,0.05)'}}>
                <div>Date</div>
                <div>Journal</div>
                <div>Libellé</div>
                <div style={{textAlign:'right'}}>Débit</div>
                <div style={{textAlign:'right'}}>Crédit</div>
              </div>

              {grandLivre.mouvements.map((m, i) => (
                <div key={i} className="mouv-row">
                  <div style={{color:'var(--text-secondary)'}}>{new Date(m.date).toLocaleDateString('fr')}</div>
                  <div style={{fontWeight:'700', color:'var(--accent)'}}>{m.journal}</div>
                  <div style={{fontWeight:'600'}}>{m.libelle}</div>
                  <div style={{textAlign:'right', color: m.debit > 0 ? 'var(--text-primary)' : 'transparent'}}>{m.debit > 0 ? m.debit.toLocaleString() : '-'}</div>
                  <div style={{textAlign:'right', color: m.credit > 0 ? 'var(--text-primary)' : 'transparent'}}>{m.credit > 0 ? m.credit.toLocaleString() : '-'}</div>
                </div>
              ))}
            </div>

            <div className="total-row">
              <div>TOTAL {grandLivre.code}</div>
              <div style={{display:'flex', gap:'40px'}}>
                <span style={{color:'#10b981'}}>D: {grandLivre.cumulDebit.toLocaleString()}</span>
                <span style={{color:'#ef4444'}}>C: {grandLivre.cumulCredit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
