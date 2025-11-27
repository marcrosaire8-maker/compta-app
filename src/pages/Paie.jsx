import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format monétaire
const formatMoney = (value) => value?.toLocaleString('fr-FR') + ' F' || '0 F';

export default function PaieUltimate() {
  const navigate = useNavigate();
  
  // --- STATES LOGIQUES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [bulletins, setBulletins] = useState([]);
  const [employes, setEmployes] = useState([]);
  
  // --- STATES UI & UX ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // --- FORM STATE ---
  const [form, setForm] = useState({
    employe_id: '',
    mois: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    salaire_base: 0,
    primes: 0,
    cotisations: 0,
    impots: 0
  });

  // --- INIT ---
  useEffect(() => { initData(); }, []);

  // Parallaxe Mouse Effect
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
      await Promise.all([fetchBulletins(ste.id), fetchEmployes(ste.id)]);
    }
    setLoading(false);
  }

  async function fetchBulletins(id) {
    const { data } = await supabase
      .from('fiches_paie')
      .select('*')
      .eq('entreprise_id', id)
      .order('created_at', { ascending: false });
    setBulletins(data || []);
  }

  async function fetchEmployes(id) {
    const { data } = await supabase
      .from('tiers')
      .select('id, nom_complet')
      .eq('entreprise_id', id)
      .eq('type_tier', 'EMPLOYE');
    setEmployes(data || []);
  }

  // --- CALCULS ---
  const brut = Number(form.salaire_base) + Number(form.primes);
  const net = brut - Number(form.cotisations) - Number(form.impots);

  // --- ACTIONS ---
  async function handleSave(e) {
    e.preventDefault();
    if (!form.employe_id) return alert("Veuillez sélectionner un employé");

    try {
      const employe = employes.find(e => e.id === form.employe_id);
      const payload = {
        entreprise_id: entreprise.id,
        employe_id: form.employe_id,
        employe_nom: employe?.nom_complet || 'Inconnu',
        mois: form.mois,
        salaire_base: Number(form.salaire_base),
        primes: Number(form.primes),
        salaire_brut: brut,
        cotisations_sociales: Number(form.cotisations),
        impots_revenu: Number(form.impots),
        salaire_net: net,
        est_comptabilise: false
      };

      await supabase.from('fiches_paie').insert([payload]);
      alert("Bulletin généré avec succès !");
      setIsModalOpen(false);
      setForm({
        employe_id: '',
        mois: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        salaire_base: 0, primes: 0, cotisations: 0, impots: 0
      });
      fetchBulletins(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  const generatePDF = (b) => {
    const doc = new jsPDF();
    // Header Pro
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("BULLETIN DE PAIE", 105, 20, { align: "center" });
    
    // Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Employeur : ${entreprise?.nom || 'Entreprise'}`, 14, 45);
    doc.text(`Employé : ${b.employe_nom}`, 14, 52);
    doc.text(`Période : ${b.mois}`, 14, 59);

    autoTable(doc, {
      startY: 70,
      head: [['Rubrique', 'Montant']],
      body: [
        ['Salaire de base', formatMoney(b.salaire_base)],
        ['Primes & indemnités', formatMoney(b.primes)],
        ['Salaire BRUT', { content: formatMoney(b.salaire_brut), styles: { fontStyle: 'bold' } }],
        ['Cotisations sociales', formatMoney(b.cotisations_sociales)],
        ['Impôts sur le revenu', formatMoney(b.impots_revenu)],
        ['NET À PAYER', { content: formatMoney(b.salaire_net), styles: { fillColor: [220, 252, 231], fontStyle: 'bold', textColor: [22, 101, 52], fontSize: 14 } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      styles: { cellPadding: 8, fontSize: 11 }
    });

    doc.save(`Paie_${b.employe_nom}_${b.mois}.pdf`);
  };

  const comptabiliser = async (b) => {
    if (!confirm("Confirmer la comptabilisation ?")) return;
    try {
      const { data: ecriture } = await supabase
        .from('ecritures_comptables')
        .insert([{
          entreprise_id: entreprise.id,
          date_ecriture: new Date().toISOString().split('T')[0],
          libelle: `Paie ${b.mois} - ${b.employe_nom}`,
          journal_code: 'OD'
        }])
        .select().single();

      await supabase.from('lignes_ecriture').insert([
        { ecriture_id: ecriture.id, debit: b.salaire_brut, credit: 0, compte_id: null },
        { ecriture_id: ecriture.id, debit: 0, credit: b.salaire_net, compte_id: null }
      ]);

      await supabase.from('fiches_paie').update({ est_comptabilise: true }).eq('id', b.id);
      fetchBulletins(entreprise.id);
      alert("Comptabilisé !");
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000', color:'white'}}>Chargement...</div>;

  const totalPaie = bulletins.reduce((acc, b) => acc + b.salaire_net, 0);

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
          --primary: #4f46e5; /* Indigo */
          --primary-glow: rgba(79, 70, 229, 0.3);
          --success: #10b981;
          --warning: #f59e0b;
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
          --primary: #6366f1;
          --primary-glow: rgba(99, 102, 241, 0.4);
          --success: #34d399;
          --warning: #fbbf24;
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

        /* --- PARALLAX ORBS (Indigo/Violet/Green theme for Money) --- */
        .orb {
          position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4;
        }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--primary); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #8b5cf6; } /* Violet */

        /* --- MAIN CONTENT --- */
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

        .btn-primary {
          padding: 14px 24px; border-radius: 99px; border: none;
          background: linear-gradient(135deg, var(--primary), #4338ca);
          color: white; font-weight: 600; font-size: 15px; cursor: pointer;
          box-shadow: 0 8px 20px var(--primary-glow); transition: var(--transition);
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px var(--primary-glow); }

        /* --- STATS GRID --- */
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px;
        }
        .stat-card {
          background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border);
          padding: 20px; border-radius: 20px; animation: fadeUp 0.6s ease-out;
        }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 6px; }
        .stat-value { font-size: 24px; font-weight: 800; color: var(--text-primary); }

        /* --- LIST / TABLE --- */
        .list-container { display: flex; flex-direction: column; gap: 12px; }
        
        .list-header {
          display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 1.5fr; gap: 20px;
          padding: 0 24px; margin-bottom: 4px;
          color: var(--text-secondary); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        
        .row-item {
          display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 1.5fr; gap: 20px; align-items: center;
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 18px;
          padding: 18px 24px;
          transition: var(--transition);
          animation: fadeSlide 0.5s ease-out backwards;
        }
        .row-item:hover {
          background: var(--bg-card); border-color: var(--primary);
          transform: scale(1.01); z-index: 2; box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }

        .cell-main { font-weight: 700; color: var(--text-primary); font-size: 14px; }
        .cell-sub { color: var(--text-secondary); font-size: 13px; }
        .cell-amount { font-weight: 800; color: var(--success); font-size: 15px; }
        .cell-brut { color: var(--text-primary); opacity: 0.7; }

        .badge {
          padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; text-align: center;
        }
        .badge-done { background: rgba(16, 185, 129, 0.15); color: var(--success); }
        .badge-pending { background: rgba(245, 158, 11, 0.15); color: var(--warning); }

        .actions-cell { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-icon {
          padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.1);
          color: var(--text-primary); cursor: pointer; transition: 0.2s; font-size: 12px; font-weight: 600;
        }
        .btn-icon:hover { background: var(--text-primary); color: var(--bg-main); }

        /* --- MODAL --- */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
        }
        .modal-card {
          width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto;
          background: var(--bg-card); padding: 30px; border-radius: 28px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--border);
          animation: zoomIn 0.3s ease-out;
        }
        .modal-title { font-size: 24px; font-weight: 800; margin-bottom: 24px; color: var(--primary); }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .input-group label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 600; }
        .input-field {
          width: 100%; padding: 14px; border-radius: 14px; border: 1px solid transparent;
          background: var(--input-bg); color: var(--text-primary); outline: none; transition: 0.3s;
        }
        .input-field:focus { border-color: var(--primary); background: var(--bg-card); box-shadow: 0 0 0 4px var(--primary-glow); }

        .summary-box {
          background: rgba(79, 70, 229, 0.05); border-radius: 16px; padding: 20px; margin: 20px 0;
          border: 1px solid rgba(79, 70, 229, 0.1); text-align: right;
        }
        .summary-val { font-size: 24px; font-weight: 900; color: var(--success); }

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
          
          /* Table -> Cards */
          .list-header { display: none; }
          .row-item {
            display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
            padding: 20px; position: relative;
          }
          .cell-main { font-size: 16px; margin-bottom: 4px; }
          .cell-sub { font-size: 13px; opacity: 0.8; }
          .cell-amount { font-size: 22px; margin: 8px 0; }
          .cell-brut { display: none; } /* On cache le brut sur mobile pour simplifier */
          .actions-cell { width: 100%; justify-content: space-between; margin-top: 10px; }
          .btn-icon { flex: 1; text-align: center; }

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
              <h1>Gestion de la Paie</h1>
              <div style={{color:'var(--text-secondary)'}}>Bulletins et salaires</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Nouveau Bulletin</button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Masse Salariale Totale</div>
            <div className="stat-value" style={{color: 'var(--primary)'}}>{formatMoney(totalPaie)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Bulletins Générés</div>
            <div className="stat-value">{bulletins.length}</div>
          </div>
        </div>

        {/* LISTE DES BULLETINS */}
        <div className="list-container">
          <div className="list-header">
            <div>Période</div>
            <div>Employé</div>
            <div>Salaire Brut</div>
            <div>Net à Payer</div>
            <div>Statut</div>
            <div style={{textAlign:'right'}}>Actions</div>
          </div>

          {bulletins.map((b, i) => (
            <div key={b.id} className="row-item" style={{animationDelay: `${i * 0.05}s`}}>
              <div className="cell-sub" style={{fontWeight:'600'}}>{b.mois}</div>
              <div className="cell-main">{b.employe_nom}</div>
              <div className="cell-brut">{formatMoney(b.salaire_brut)}</div>
              <div className="cell-amount">{formatMoney(b.salaire_net)}</div>
              <div>
                {b.est_comptabilise ? (
                  <span className="badge badge-done">Comptabilisé</span>
                ) : (
                  <span className="badge badge-pending">En attente</span>
                )}
              </div>
              <div className="actions-cell">
                <button className="btn-icon" onClick={() => generatePDF(b)}>PDF</button>
                {!b.est_comptabilise && (
                  <button className="btn-icon" onClick={() => comptabiliser(b)} style={{color:'var(--primary)'}}>
                    Compta
                  </button>
                )}
              </div>
            </div>
          ))}

          {bulletins.length === 0 && (
            <div style={{textAlign:'center', padding:'4rem', color:'var(--text-secondary)', fontStyle:'italic'}}>
              Aucun bulletin de paie pour le moment.
            </div>
          )}
        </div>
      </main>

      {/* MODAL CREATION */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-content">
            <h2 className="modal-title">Nouveau Bulletin</h2>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Employé</label>
                  <select 
                    className="input-field"
                    value={form.employe_id} 
                    onChange={e => setForm({...form, employe_id: e.target.value})} 
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {employes.map(e => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Période (Mois)</label>
                  <input className="input-field" value={form.mois} onChange={e => setForm({...form, mois: e.target.value})} />
                </div>
              </div>

              <div style={{background:'var(--bg-main)', padding:'20px', borderRadius:'16px', marginBottom:'20px'}}>
                <h3 style={{fontSize:'14px', marginBottom:'15px', color:'var(--text-primary)'}}>Revenus</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Salaire de Base</label>
                    <input type="number" className="input-field" value={form.salaire_base} onChange={e => setForm({...form, salaire_base: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Primes & Indemnités</label>
                    <input type="number" className="input-field" value={form.primes} onChange={e => setForm({...form, primes: e.target.value})} />
                  </div>
                </div>
                <div style={{textAlign:'right', fontWeight:'700', color:'var(--text-secondary)'}}>
                  Brut: {formatMoney(brut)}
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Cotisations Sociales</label>
                  <input type="number" className="input-field" value={form.cotisations} onChange={e => setForm({...form, cotisations: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Impôts (IRPP)</label>
                  <input type="number" className="input-field" value={form.impots} onChange={e => setForm({...form, impots: e.target.value})} />
                </div>
              </div>

              <div className="summary-box">
                <div style={{fontSize:'12px', color:'var(--text-secondary)', marginBottom:'5px'}}>NET À PAYER</div>
                <div className="summary-val">{formatMoney(net)}</div>
              </div>

              <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding:'12px 24px', borderRadius:'12px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', cursor:'pointer'}}>Annuler</button>
                <button type="submit" className="btn-primary">Générer le bulletin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
