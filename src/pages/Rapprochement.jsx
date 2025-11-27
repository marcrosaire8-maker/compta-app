import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';

/* --- ICONS --- */
const IconBank = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"/></svg>;
const IconFile = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>;
const IconLink = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>;
const IconSun = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>;
const IconMoon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>;
const IconCheck = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>;

export default function RapprochementUltimate() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [comptes5, setComptes5] = useState([]);
  
  // Selection States
  const [selectedCompte, setSelectedCompte] = useState('');
  const [comptaLines, setComptaLines] = useState([]);
  const [bankLines, setBankLines] = useState([]);
  const [selectedCompta, setSelectedCompta] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    if (ste) {
      setEntreprise(ste);
      await fetchComptes5(ste.id);
    }
    setLoading(false);
  }

  async function fetchComptes5(entrepriseId) {
    const { data } = await supabase
      .from('plan_comptable')
      .select('id, code_compte, libelle')
      .eq('entreprise_id', entrepriseId)
      .ilike('code_compte', '5%')
      .order('code_compte');
    setComptes5(data || []);
    if (data?.length > 0) {
      setSelectedCompte(data[0].id);
      fetchUnreconciled(data[0].id, entrepriseId);
    }
  }

  async function fetchUnreconciled(compteId, entrepriseId) {
    const [comptaRes, bankRes] = await Promise.all([
      supabase
        .from('lignes_ecriture')
        .select('*, ecriture:ecritures_comptables(date_ecriture, libelle)')
        .eq('compte_id', compteId)
        .eq('est_rapproche', false),
      supabase
        .from('releves_bancaires')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .eq('est_pointe', false)
        .order('date_releve', { ascending: false })
    ]);

    setComptaLines(comptaRes.data || []);
    setBankLines(bankRes.data || []);
    setSelectedCompta(null);
    setSelectedBank(null);
  }

  const handleMatch = async () => {
    if (!selectedCompta || !selectedBank) return alert("Sélection incomplete");

    // Tolérance de 1 FCFA pour les arrondis
    if (Math.abs(Math.abs(selectedCompta.debit - selectedCompta.credit) - Math.abs(selectedBank.montant)) > 1) {
      if (!confirm(`Écart détecté !\nCompta: ${Math.abs(selectedCompta.debit - selectedCompta.credit)}\nBanque: ${Math.abs(selectedBank.montant)}\nRapprocher quand même ?`)) return;
    }

    try {
      await Promise.all([
        supabase.from('lignes_ecriture').update({ est_rapproche: true }).eq('id', selectedCompta.id),
        supabase.from('releves_bancaires').update({ est_pointe: true, ecriture_liee_id: selectedCompta.id }).eq('id', selectedBank.id)
      ]);
      fetchUnreconciled(selectedCompte, entreprise.id);
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{height:'100vh', background:'#000', color:'white', display:'grid', placeItems:'center'}}>Chargement...</div>;

  const canMatch = selectedCompta && selectedBank;

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root { --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

        .light {
          --bg-main: #f2f2f7; --bg-glass: rgba(255, 255, 255, 0.65); --bg-card: #ffffff;
          --text-primary: #1d1d1f; --text-secondary: #86868b; --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); 
          --accent: #007AFF; /* Bank Blue */
          --accent-glow: rgba(0, 122, 255, 0.3);
          --success: #34c759; --danger: #ff3b30;
          --card-gradient: linear-gradient(135deg, #ffffff 0%, #f5f5f7 100%);
        }

        .dark {
          --bg-main: #000000; --bg-glass: rgba(28, 28, 30, 0.65); --bg-card: #1c1c1e;
          --text-primary: #f5f5f7; --text-secondary: #a1a1a6; --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6); 
          --accent: #0a84ff;
          --accent-glow: rgba(10, 132, 255, 0.4);
          --success: #30d158; --danger: #ff453a;
          --card-gradient: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%);
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }
        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- PARALLAX ORBS --- */
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--accent); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #34c759; }

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

        /* --- ACCOUNT SELECTOR (Physical Card Style) --- */
        .account-card {
          background: linear-gradient(135deg, #000000, #333333);
          color: white; border-radius: 24px; padding: 24px;
          margin-bottom: 40px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
          display: flex; justify-content: space-between; align-items: center;
          position: relative; overflow: hidden;
          animation: fadeUp 0.6s ease-out;
        }
        .account-card::before {
          content:''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
          transform: rotate(30deg); pointer-events: none;
        }
        .card-info label { font-size: 12px; text-transform: uppercase; opacity: 0.7; letter-spacing: 1px; }
        .card-select { 
          background: transparent; border: none; color: white; font-size: 24px; font-weight: 700; 
          outline: none; cursor: pointer; appearance: none; width: 100%; margin-top: 5px;
        }
        .card-chip { width: 50px; height: 35px; background: linear-gradient(135deg, #bf953f, #fcf6ba); border-radius: 6px; position: relative; overflow: hidden; }
        .card-chip::after { content:''; position: absolute; top:0; left:0; right:0; bottom:0; border: 1px solid rgba(0,0,0,0.2); border-radius: 6px; }

        /* --- SPLIT VIEW CONTAINER --- */
        .split-view { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; height: calc(100vh - 350px); min-height: 500px; }
        
        .panel {
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 24px;
          display: flex; flex-direction: column; overflow: hidden;
          transition: 0.3s;
        }
        .panel:hover { border-color: var(--accent); box-shadow: var(--shadow); }

        .panel-header {
          padding: 20px; background: rgba(120,120,120,0.05); border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .panel-title { font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
        .count-badge { background: var(--bg-card); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; color: var(--text-secondary); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

        .list-content { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        
        /* --- TRANSACTION CARDS --- */
        .trans-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; padding: 16px; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative; overflow: hidden;
          animation: fadeSlide 0.4s ease-out backwards;
        }
        .trans-card:hover { transform: scale(1.02); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        
        .trans-card.selected {
          border-color: var(--accent); background: rgba(59, 130, 246, 0.05);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }
        
        .trans-top { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: var(--text-secondary); }
        .trans-main { display: flex; justify-content: space-between; align-items: center; }
        .trans-libelle { font-weight: 600; color: var(--text-primary); font-size: 14px; max-width: 70%; line-height: 1.4; }
        .trans-amount { font-weight: 700; font-size: 15px; font-variant-numeric: tabular-nums; }
        
        .amount-pos { color: var(--success); }
        .amount-neg { color: var(--text-primary); }

        /* --- FLOATING ACTION BUTTON --- */
        .fab-container {
          position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
          z-index: 100; pointer-events: none;
        }
        .btn-match {
          background: linear-gradient(135deg, var(--accent), #6366f1);
          color: white; border: none; padding: 16px 32px; border-radius: 99px;
          font-weight: 700; font-size: 16px; cursor: pointer; pointer-events: auto;
          box-shadow: 0 10px 30px var(--accent-glow);
          display: flex; align-items: center; gap: 10px;
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transition: transform 0.2s;
        }
        .btn-match:hover { transform: scale(1.05); }
        .btn-match:active { transform: scale(0.95); }

        /* --- MEDIA QUERIES --- */
        @media (max-width: 1024px) {
          .sidebar-wrapper { transform: translateX(-100%); }
          .sidebar-wrapper.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; opacity: 1; }
          main { margin-left: 0; padding: 20px; width: 100%; }
          .btn-menu-mobile { display: block; }
          .split-view { grid-template-columns: 1fr; height: auto; }
          .panel { max-height: 500px; }
        }

        /* --- ANIMATIONS --- */
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
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
              <h1>Rapprochement</h1>
              <div style={{color:'var(--text-secondary)'}}>Pointez vos écritures avec la banque</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <IconSun/> : <IconMoon/>}
            </button>
          </div>
        </div>

        {/* ACCOUNT SELECTOR (Physical Card Look) */}
        <div className="account-card">
          <div className="card-info">
            <label>Compte de Trésorerie</label>
            <select 
              className="card-select" 
              value={selectedCompte} 
              onChange={e => {setSelectedCompte(e.target.value); fetchUnreconciled(e.target.value, entreprise.id);}}
            >
              {comptes5.map(c => (
                <option key={c.id} value={c.id}>{c.code_compte} - {c.libelle}</option>
              ))}
            </select>
          </div>
          <div className="card-chip"></div>
        </div>

        {/* SPLIT VIEW */}
        <div className="split-view">
          
          {/* LEFT: COMPTA */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><IconFile/> Comptabilité</div>
              <div className="count-badge">{comptaLines.length} restants</div>
            </div>
            <div className="list-content">
              {comptaLines.map((L, i) => {
                const montant = L.debit > 0 ? L.debit : -L.credit;
                return (
                  <div 
                    key={L.id} 
                    className={`trans-card ${selectedCompta?.id === L.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCompta(L)}
                    style={{animationDelay: `${i * 0.03}s`}}
                  >
                    <div className="trans-top">
                      <span>{new Date(L.ecriture.date_ecriture).toLocaleDateString()}</span>
                      <span>N° {L.ecriture.id.toString().slice(-4)}</span>
                    </div>
                    <div className="trans-main">
                      <div className="trans-libelle">{L.ecriture.libelle}</div>
                      <div className={`trans-amount ${montant > 0 ? 'amount-pos' : 'amount-neg'}`}>
                        {montant.toLocaleString()} F
                      </div>
                    </div>
                  </div>
                );
              })}
              {comptaLines.length === 0 && <div style={{textAlign:'center', color:'var(--text-secondary)', marginTop:'40px'}}>Tout est pointé 🎉</div>}
            </div>
          </div>

          {/* RIGHT: BANQUE */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><IconBank/> Relevé Bancaire</div>
              <div className="count-badge">{bankLines.length} restants</div>
            </div>
            <div className="list-content">
              {bankLines.map((B, i) => (
                <div 
                  key={B.id} 
                  className={`trans-card ${selectedBank?.id === B.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBank(B)}
                  style={{animationDelay: `${i * 0.03}s`}}
                >
                  <div className="trans-top">
                    <span>{new Date(B.date_releve).toLocaleDateString()}</span>
                    <span>REF: {B.id.toString().slice(-4)}</span>
                  </div>
                  <div className="trans-main">
                    <div className="trans-libelle">{B.libelle_banque}</div>
                    <div className={`trans-amount ${B.montant > 0 ? 'amount-pos' : 'amount-neg'}`}>
                      {B.montant.toLocaleString()} F
                    </div>
                  </div>
                </div>
              ))}
              {bankLines.length === 0 && <div style={{textAlign:'center', color:'var(--text-secondary)', marginTop:'40px'}}>Aucun mouvement banque</div>}
            </div>
          </div>

        </div>

        {/* FLOATING MATCH ACTION */}
        {canMatch && (
          <div className="fab-container">
            <button className="btn-match" onClick={handleMatch}>
              <IconLink /> Valider le rapprochement
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
