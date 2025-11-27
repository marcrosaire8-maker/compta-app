import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* --- ICONS --- */
const IconSync = () => <svg width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const IconPlus = () => <svg width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IconDownload = () => <svg width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const IconSun = () => <svg width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;
const IconMoon = () => <svg width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>;

export default function JournalUltimate() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [ecritures, setEcritures] = useState([]);
  const [comptes, setComptes] = useState([]);
  
  // KPIs
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    libelle: '',
    compteDebit: '',
    compteCredit: '',
    montant: ''
  });

  // --- EFFECTS ---
  useEffect(() => { initData(); }, []);

  // Parallaxe Logic
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  async function initData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ste = await getEntrepriseForUser(user.id, user.email);
      if (ste) {
        setEntreprise(ste);
        await fetchComptes(ste.id);
        await fetchEcritures(ste.id);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }

  async function fetchComptes(id) {
    const { data } = await supabase.from('plan_comptable').select('id, code_compte, libelle').eq('entreprise_id', id).order('code_compte');
    setComptes(data || []);
  }

  async function fetchEcritures(id) {
    const { data } = await supabase.from('ecritures_comptables')
      .select(`id, date_ecriture, libelle, journal_code, lignes_ecriture ( id, debit, credit, compte_id, plan_comptable (code_compte, libelle) )`)
      .eq('entreprise_id', id)
      .order('date_ecriture', { ascending: false });

    const all = data || [];
    setEcritures(all);

    let d = 0, c = 0;
    all.forEach(e => { e.lignes_ecriture.forEach(l => { d += l.debit || 0; c += l.credit || 0; }); });
    setTotalDebit(d);
    setTotalCredit(c);
  }

  // --- ACTIONS ---
  const syncTout = async () => {
    setSyncing(true);
    try {
      // Simulation / Logique de synchro (à adapter selon votre logique backend existante)
      const { data: factures } = await supabase.from('factures').select('*').eq('entreprise_id', entreprise.id).eq('est_comptabilise', false);
      if (factures?.length > 0) {
        // Ici votre logique de transformation Facture -> Ecriture
        alert("Synchronisation des écritures lancée..."); 
      } else {
        alert("Tout est à jour.");
      }
      await fetchEcritures(entreprise.id);
    } catch (error) { alert(error.message); } 
    finally { setSyncing(false); }
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    try {
      const { data: head } = await supabase.from('ecritures_comptables').insert([{
          entreprise_id: entreprise.id, date_ecriture: form.date, libelle: form.libelle, journal_code: 'OD'
        }]).select().single();

      await supabase.from('lignes_ecriture').insert([
        { ecriture_id: head.id, compte_id: form.compteDebit, debit: parseFloat(form.montant), credit: 0 },
        { ecriture_id: head.id, compte_id: form.compteCredit, debit: 0, credit: parseFloat(form.montant) }
      ]);

      alert("Écriture enregistrée !");
      setIsModalOpen(false);
      fetchEcritures(entreprise.id);
      setForm({ ...form, libelle: '', montant: '' });
    } catch (err) { alert("Erreur : " + err.message); }
  };

  // --- EXPORTS ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Journal - ${entreprise?.nom}`, 14, 20);
    const rows = [];
    ecritures.forEach(e => {
      e.lignes_ecriture.forEach(l => {
        rows.push([new Date(e.date_ecriture).toLocaleDateString(), e.journal_code, e.libelle, l.plan_comptable?.code_compte, l.debit || '', l.credit || '']);
      });
    });
    autoTable(doc, { startY: 30, head: [['Date', 'Jnl', 'Libellé', 'Cpt', 'Débit', 'Crédit']], body: rows });
    doc.save('journal.pdf');
  };

  const exportExcel = () => {
    const flat = [];
    ecritures.forEach(e => {
      e.lignes_ecriture.forEach(l => {
        flat.push({ Date: e.date_ecriture, Journal: e.journal_code, Libellé: e.libelle, Compte: l.plan_comptable?.code_compte, Débit: l.debit, Crédit: l.credit });
      });
    });
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Journal");
    XLSX.writeFile(wb, "Journal.xlsx");
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000', color:'white'}}>Chargement...</div>;

  const estEquilibre = totalDebit === totalCredit;

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
          --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .light {
          --bg-main: #f2f2f7;
          --bg-glass: rgba(255, 255, 255, 0.75);
          --bg-card: #ffffff;
          --text-primary: #1d1d1f;
          --text-secondary: #86868b;
          --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
          --primary: #0071e3; /* Apple Blue */
          --primary-glow: rgba(0, 113, 227, 0.3);
          --success: #34c759;
          --danger: #ff3b30;
          --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000;
          --bg-glass: rgba(28, 28, 30, 0.75);
          --bg-card: #1c1c1e;
          --text-primary: #f5f5f7;
          --text-secondary: #a1a1a6;
          --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6);
          --primary: #2997ff;
          --primary-glow: rgba(41, 151, 255, 0.4);
          --success: #30d158;
          --danger: #ff453a;
          --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }

        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- SIDEBAR RESPONSIVE --- */
        .sidebar-wrapper {
          position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 50;
          transition: transform 0.3s ease;
        }
        .mobile-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40;
          display: none; opacity: 0; transition: opacity 0.3s;
        }

        /* --- PARALLAX ORBS (Blue theme for Journal) --- */
        .orb {
          position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4;
        }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--primary); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #6366f1; }

        /* --- MAIN LAYOUT --- */
        main {
          min-height: 100vh; padding: 40px; margin-left: 260px; position: relative; z-index: 1;
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
        .actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }

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

        .btn-glass {
          padding: 12px 20px; border-radius: 12px; border: 1px solid var(--border);
          background: var(--bg-card); color: var(--text-primary); font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: 0.2s;
        }
        .btn-glass:hover { background: var(--text-primary); color: var(--bg-main); }

        .btn-primary {
          padding: 12px 24px; border-radius: 99px; border: none;
          background: linear-gradient(135deg, var(--primary), #2563eb);
          color: white; font-weight: 600; cursor: pointer;
          box-shadow: 0 8px 20px var(--primary-glow); transition: 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px var(--primary-glow); }

        /* --- KPI CARDS --- */
        .kpi-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;
        }
        .kpi-card {
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 20px; padding: 24px;
          animation: fadeUp 0.6s ease-out; position: relative; overflow: hidden;
        }
        .kpi-card::before {
          content:''; position:absolute; top:0; left:0; width:4px; height:100%; background: var(--color);
        }
        .kpi-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: 8px; }
        .kpi-val { font-size: 28px; font-weight: 800; color: var(--text-primary); }

        /* --- JOURNAL STREAM (GROUPED LIST) --- */
        .journal-stream { display: flex; flex-direction: column; gap: 24px; }

        .ecriture-block {
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 20px;
          overflow: hidden;
          animation: fadeSlide 0.5s ease-out backwards;
          transition: 0.3s;
        }
        .ecriture-block:hover {
          box-shadow: 0 15px 40px rgba(0,0,0,0.1);
          border-color: var(--primary); transform: translateY(-2px);
        }

        .block-header {
          background: rgba(120, 120, 120, 0.05);
          padding: 16px 24px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid var(--border);
        }
        .header-left { display: flex; gap: 15px; align-items: center; }
        .badge-date { background: var(--bg-card); padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 13px; color: var(--text-primary); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .badge-code { background: var(--primary); color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .header-libelle { font-weight: 600; font-size: 15px; color: var(--text-primary); }

        .rows-container { padding: 8px 0; }
        .journal-row {
          display: grid; grid-template-columns: 1fr 2fr 1fr 1fr; gap: 20px;
          padding: 12px 24px; align-items: center;
          font-size: 14px; border-bottom: 1px dashed var(--border);
        }
        .journal-row:last-child { border-bottom: none; }
        
        .cell-compte { font-family: monospace; font-weight: 700; color: var(--primary); }
        .cell-intitule { color: var(--text-secondary); font-size: 13px; }
        .cell-money { text-align: right; font-weight: 600; color: var(--text-primary); }
        .cell-empty { text-align: right; color: var(--text-secondary); opacity: 0.3; }

        /* --- MODAL --- */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
        }
        .modal-card {
          width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto;
          background: var(--bg-card); padding: 30px; border-radius: 28px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--border);
          animation: zoomIn 0.3s ease-out;
        }
        .modal-title { font-size: 24px; font-weight: 800; margin-bottom: 24px; color: var(--text-primary); }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .input-group { margin-bottom: 16px; }
        .input-group label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .input-field {
          width: 100%; padding: 14px; border-radius: 14px; border: 1px solid transparent;
          background: var(--input-bg); color: var(--text-primary); outline: none; transition: 0.3s;
        }
        .input-field:focus { border-color: var(--primary); background: var(--bg-card); box-shadow: 0 0 0 4px var(--primary-glow); }

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
          
          .block-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          
          /* Transform Grid Rows to Mini Cards inside Block */
          .journal-row {
            display: flex; flex-direction: column; align-items: flex-start; gap: 5px;
            padding: 15px; background: rgba(120,120,120,0.03); margin: 10px; border-radius: 12px; border: none;
          }
          .cell-compte { font-size: 16px; margin-bottom: 2px; }
          .cell-money { width: 100%; text-align: left; font-size: 16px; color: var(--success); }
          .cell-empty { display: none; } /* Hide empty dashes on mobile */
          
          /* Form */
          .form-grid { grid-template-columns: 1fr; }
        }

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
              <h1>Journal Général</h1>
              <div style={{color:'var(--text-secondary)'}}>Historique exhaustif des écritures</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              <div style={{width:20, height:20}}>{darkMode ? <IconSun/> : <IconMoon/>}</div>
            </button>
            <button className="btn-glass" onClick={exportExcel}>
              <div style={{width:18, height:18}}><IconDownload/></div> Excel
            </button>
            <button className="btn-glass" onClick={syncTout} disabled={syncing}>
              <div style={{width:18, height:18}}><IconSync/></div> {syncing ? '...' : 'Sync'}
            </button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <div style={{width:18, height:18}}><IconPlus/></div> Saisie
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="kpi-grid">
          <div className="kpi-card" style={{'--color': 'var(--success)'}}>
            <div className="kpi-label">Total Débit</div>
            <div className="kpi-val">{totalDebit.toLocaleString()} F</div>
          </div>
          <div className="kpi-card" style={{'--color': 'var(--danger)'}}>
            <div className="kpi-label">Total Crédit</div>
            <div className="kpi-val">{totalCredit.toLocaleString()} F</div>
          </div>
          <div className="kpi-card" style={{'--color': estEquilibre ? 'var(--success)' : 'var(--danger)'}}>
            <div className="kpi-label">Balance</div>
            <div className="kpi-val" style={{color: estEquilibre ? 'var(--success)' : 'var(--danger)'}}>
              {estEquilibre ? 'ÉQUILIBRÉ' : 'DÉSÉQUILIBRE'}
            </div>
          </div>
        </div>

        {/* JOURNAL STREAM (LISTE GROUPÉE) */}
        <div className="journal-stream">
          {ecritures.length === 0 && (
            <div style={{textAlign:'center', padding:'4rem', color:'var(--text-secondary)', background:'var(--bg-glass)', borderRadius:'20px'}}>
              Aucune écriture comptable pour le moment.
            </div>
          )}

          {ecritures.map((e, i) => (
            <div key={e.id} className="ecriture-block" style={{animationDelay: `${i * 0.05}s`}}>
              {/* HEADER DU BLOC (Date, Journal, Libellé) */}
              <div className="block-header">
                <div className="header-left">
                  <div className="badge-date">{new Date(e.date_ecriture).toLocaleDateString('fr-FR')}</div>
                  <div className="badge-code">{e.journal_code}</div>
                </div>
                <div className="header-libelle">{e.libelle}</div>
              </div>

              {/* LIGNES (Compte, Débit, Crédit) */}
              <div className="rows-container">
                {e.lignes_ecriture.map(l => (
                  <div key={l.id} className="journal-row">
                    <div className="cell-compte">{l.plan_comptable?.code_compte}</div>
                    <div className="cell-intitule">{l.plan_comptable?.libelle}</div>
                    {l.debit > 0 ? (
                      <div className="cell-money" style={{color:'var(--text-primary)'}}>Débit: {l.debit.toLocaleString()}</div>
                    ) : (
                      <div className="cell-empty">-</div>
                    )}
                    {l.credit > 0 ? (
                      <div className="cell-money" style={{color:'var(--text-primary)'}}>Crédit: {l.credit.toLocaleString()}</div>
                    ) : (
                      <div className="cell-empty">-</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL SAISIE MANUELLE */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-card">
            <h2 className="modal-title">Saisie d'Écriture</h2>
            <form onSubmit={handleManualSave}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Date</label>
                  <input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Montant</label>
                  <input type="number" className="input-field" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} placeholder="0" required />
                </div>
              </div>

              <div className="input-group">
                <label>Libellé</label>
                <input type="text" className="input-field" value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} required />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Compte Débit</label>
                  <select className="input-field" value={form.compteDebit} onChange={e => setForm({...form, compteDebit: e.target.value})} required>
                    <option value="">Sélectionner...</option>
                    {comptes.map(c => <option key={c.id} value={c.id}>{c.code_compte} - {c.libelle}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Compte Crédit</label>
                  <select className="input-field" value={form.compteCredit} onChange={e => setForm({...form, compteCredit: e.target.value})} required>
                    <option value="">Sélectionner...</option>
                    {comptes.map(c => <option key={c.id} value={c.id}>{c.code_compte} - {c.libelle}</option>)}
                  </select>
                </div>
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding:'12px 24px', borderRadius:'12px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', cursor:'pointer'}}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
