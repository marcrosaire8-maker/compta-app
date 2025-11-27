import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format monétaire
const formatMoney = (value) => {
  return value.toLocaleString('fr-FR') + ' F';
};

export default function DepensesUltimateResponsive() {
  const navigate = useNavigate();
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [depenses, setDepenses] = useState([]);
  const [listeFournisseurs, setListeFournisseurs] = useState([]);
  
  // UI & UX
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Nouveau pour le mobile
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // FORM
  const [fournisseurId, setFournisseurId] = useState('');
  const [fournisseurNom, setFournisseurNom] = useState('');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);

  useEffect(() => { checkUser(); }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      await Promise.all([fetchDepenses(ste.id), fetchFournisseurs(ste.id)]);
    }
    setLoading(false);
  }

  async function fetchDepenses(entrepriseId) {
    const { data } = await supabase
      .from('factures')
      .select('*, lignes_facture:lignes_facture(*)')
      .eq('entreprise_id', entrepriseId)
      .eq('type_facture', 'ACHAT')
      .order('date_emission', { ascending: false });
    setDepenses(data || []);
  }

  async function fetchFournisseurs(entrepriseId) {
    const { data } = await supabase
      .from('tiers')
      .select('id, nom_complet')
      .eq('entreprise_id', entrepriseId)
      .eq('type_tier', 'FOURNISSEUR')
      .order('nom_complet');
    setListeFournisseurs(data || []);
  }

  const handleFournisseurSelect = (e) => {
    const id = e.target.value;
    const f = listeFournisseurs.find(x => x.id === id);
    setFournisseurId(id);
    setFournisseurNom(f ? f.nom_complet : '');
  };

  // --- LOGIQUE FORMULAIRE ---
  const addLigne = () => setLignes([...lignes, { description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  const updateLigne = (i, field, val) => {
    const newL = [...lignes];
    newL[i][field] = field === 'quantite' || field === 'prix' ? Number(val) || 0 : val;
    setLignes(newL);
  };
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));
  const total = () => lignes.reduce((a, l) => a + l.quantite * l.prix, 0);

  async function handleSave(e) {
    e.preventDefault();
    if (!fournisseurId) return alert("Sélectionnez un fournisseur");
    if (lignes.some(l => !l.description || l.prix <= 0)) return alert("Remplissez toutes les lignes");

    try {
      const numero = `ACH-${Date.now().toString().slice(-6)}`;
      const { data: facture } = await supabase
        .from('factures')
        .insert([{
          entreprise_id: entreprise.id,
          tier_id: fournisseurId,
          client_nom: fournisseurNom,
          numero,
          date_emission: dateEmission,
          type_facture: 'ACHAT',
          statut: 'PAYEE',
          total_ht: total(),
          total_ttc: total()
        }])
        .select()
        .single();

      await supabase.from('lignes_facture').insert(
        lignes.map(l => ({
          facture_id: facture.id,
          description: l.description,
          quantite: l.quantite,
          unite: l.unite,
          prix_unitaire: l.prix
        }))
      );

      alert("Dépense enregistrée !");
      setIsModalOpen(false);
      resetForm();
      fetchDepenses(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  const resetForm = () => {
    setFournisseurId(''); setFournisseurNom('');
    setDateEmission(new Date().toISOString().split('T')[0]);
    setLignes([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  };

  const generatePDF = (facture) => {
    const lignes = facture.lignes_facture || [];
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(entreprise?.nom || "Entreprise", 14, 25);
    doc.setFontSize(16); doc.text("BON DE DÉPENSE", 105, 25, { align: "center" });
    autoTable(doc, {
      startY: 65,
      head: [['Description', 'Qté', 'Prix U.', 'Total']],
      body: lignes.map(l => [l.description, l.quantite, formatMoney(l.prix_unitaire), formatMoney(l.quantite * l.prix_unitaire)]),
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] }
    });
    doc.save(`Depense_${facture.numero}.pdf`);
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000', color:'white'}}>Chargement...</div>;

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
          --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .light {
          --bg-main: #f2f2f7;
          --bg-glass: rgba(255, 255, 255, 0.7);
          --bg-card: #ffffff;
          --text-primary: #1d1d1f;
          --text-secondary: #86868b;
          --border: rgba(0,0,0,0.08);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
          --danger: #ef4444;
          --danger-glow: rgba(239, 68, 68, 0.3);
          --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000;
          --bg-glass: rgba(28, 28, 30, 0.7);
          --bg-card: #1c1c1e;
          --text-primary: #f5f5f7;
          --text-secondary: #a1a1a6;
          --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6);
          --danger: #ff453a;
          --danger-glow: rgba(255, 69, 58, 0.4);
          --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }

        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- SIDEBAR RESPONSIVE WRAPPER --- */
        .sidebar-wrapper {
          position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 50;
          transition: transform 0.3s ease;
        }
        /* Mobile Overlay pour fermer le menu */
        .mobile-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40;
          display: none; opacity: 0; transition: opacity 0.3s;
        }

        /* --- MAIN CONTENT --- */
        main {
          min-height: 100vh;
          padding: 40px;
          margin-left: 260px; /* Par défaut sur PC */
          position: relative; 
          z-index: 1;
          transition: margin-left 0.3s ease;
        }

        /* --- HEADER & BUTTONS --- */
        .header-bar {
          display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px;
          animation: slideDown 0.8s ease-out;
          flex-wrap: wrap; gap: 20px;
        }
        .header-content h1 {
          font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text; color: transparent;
        }
        .actions { display: flex; gap: 12px; align-items: center; }

        .btn-menu-mobile {
          display: none; /* Caché sur PC */
          background: var(--bg-card); border: 1px solid var(--border); 
          color: var(--text-primary); font-size: 24px; padding: 8px 12px; 
          border-radius: 12px; cursor: pointer;
        }

        .btn-theme {
          width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border);
          background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 20px; transition: var(--transition); box-shadow: var(--shadow);
        }
        
        .btn-add {
          padding: 14px 24px; border-radius: 99px; border: none;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          color: white; font-weight: 600; font-size: 15px; cursor: pointer;
          box-shadow: 0 8px 20px var(--danger-glow); transition: var(--transition);
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
        }

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

        /* --- TABLE / CARDS --- */
        .list-container { display: flex; flex-direction: column; gap: 12px; }
        
        .list-header {
          display: grid; grid-template-columns: 1.5fr 1.5fr 2fr 1.5fr 1fr; gap: 20px;
          padding: 0 24px; margin-bottom: 4px;
          color: var(--text-secondary); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        
        .expense-row {
          display: grid; grid-template-columns: 1.5fr 1.5fr 2fr 1.5fr 1fr; gap: 20px; align-items: center;
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 18px;
          padding: 18px 24px;
          transition: var(--transition);
          animation: fadeSlide 0.5s ease-out backwards;
        }
        .expense-row:hover {
          background: var(--bg-card); border-color: var(--danger);
          transform: scale(1.01); z-index: 2; box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }

        .cell-main { font-weight: 700; color: var(--text-primary); font-size: 14px; }
        .cell-sub { color: var(--text-secondary); font-size: 13px; }
        .cell-amount { font-weight: 800; color: var(--danger); font-size: 16px; text-align: right; }
        .cell-action { text-align: center; }

        .btn-pdf {
          padding: 6px 14px; border-radius: 10px; border: 1px solid var(--border);
          background: rgba(255,255,255,0.1); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;
        }

        /* --- MODAL RESPONSIVE --- */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 100;
          padding: 20px;
        }
        .modal-card {
          width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto;
          background: var(--bg-card); padding: 30px; border-radius: 28px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--border);
          animation: zoomIn 0.3s ease-out;
        }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .input-field {
          width: 100%; padding: 14px; border-radius: 14px; border: 1px solid transparent;
          background: var(--input-bg); color: var(--text-primary); outline: none; transition: 0.3s;
        }
        .line-item { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 10px; align-items: center; }
        
        /* --- ORBS BACKGROUND --- */
        .orb {
          position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4;
        }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #ef4444; }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #f59e0b; }

        /* ================================================================= */
        /* ===================== MEDIA QUERIES (MOBILE) ==================== */
        /* ================================================================= */
        
        @media (max-width: 1024px) {
          .sidebar-wrapper { transform: translateX(-100%); } /* Cache la sidebar */
          .sidebar-wrapper.open { transform: translateX(0); } /* Montre si ouvert */
          .mobile-overlay.open { display: block; opacity: 1; }
          
          main { margin-left: 0; padding: 20px; width: 100%; } /* Pleine largeur */
          
          .btn-menu-mobile { display: block; } /* Affiche le bouton burger */
        }

        @media (max-width: 768px) {
          .header-bar { flex-direction: column; align-items: flex-start; gap: 20px; }
          .actions { width: 100%; justify-content: space-between; }
          .btn-add { width: 100%; justify-content: center; }

          /* TABLE BECOMES CARDS */
          .list-header { display: none; }
          
          .expense-row {
            display: flex; flex-direction: column; gap: 12px; align-items: flex-start;
            padding: 20px; position: relative;
          }
          
          /* Réarrangement interne de la carte mobile */
          .cell-main { font-size: 16px; margin-bottom: 4px; } /* Fournisseur plus gros */
          .cell-sub { order: -1; font-size: 12px; opacity: 0.7; } /* Date en premier */
          .cell-amount { 
            align-self: flex-start; 
            font-size: 24px; margin: 8px 0;
            background: rgba(239, 68, 68, 0.1); padding: 4px 10px; border-radius: 8px;
          }
          .cell-action { width: 100%; }
          .btn-pdf { width: 100%; padding: 12px; background: var(--input-bg); }

          /* FORM MOBILE */
          .form-grid { grid-template-columns: 1fr; }
          .line-item { 
            grid-template-columns: 1fr 1fr; 
            background: var(--input-bg); padding: 10px; border-radius: 12px;
          }
          .line-item input:first-child { grid-column: span 2; } /* Description full width */
        }

        /* Animations */
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* OVERLAY MOBILE POUR FERMER LA SIDEBAR */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* SIDEBAR WRAPPER */}
      <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />
      </div>

      <div className="orb orb-1" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}></div>
      <div className="orb orb-2" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}></div>

      <main>
        {/* HEADER AVEC BOUTON MOBILE */}
        <div className="header-bar">
          <div style={{display:'flex', alignItems:'center', gap:'15px', width:'100%'}}>
            <button className="btn-menu-mobile" onClick={() => setIsMobileMenuOpen(true)}>
              ☰
            </button>
            <div className="header-content">
              <h1>Dépenses</h1>
              <div style={{color:'var(--text-secondary)'}}>Suivi des achats fournisseurs</div>
            </div>
          </div>
          
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="btn-add" onClick={() => setIsModalOpen(true)}>
              + Ajouter
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total ce mois</div>
            <div className="stat-value" style={{color: 'var(--danger)'}}>
              {formatMoney(depenses.reduce((acc, curr) => acc + curr.total_ttc, 0))}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Factures</div>
            <div className="stat-value">{depenses.length}</div>
          </div>
        </div>

        {/* LISTE INTELLIGENTE */}
        <div className="list-container">
          <div className="list-header">
            <div>Date</div>
            <div>Ref</div>
            <div>Fournisseur</div>
            <div style={{textAlign:'right'}}>Montant</div>
            <div style={{textAlign:'center'}}>PDF</div>
          </div>

          {depenses.map((d, index) => (
            <div key={d.id} className="expense-row" style={{animationDelay: `${index * 0.05}s`}}>
              <div className="cell-sub">{new Date(d.date_emission).toLocaleDateString('fr-FR')}</div>
              <div className="cell-sub" style={{fontFamily:'monospace'}}>{d.numero}</div>
              <div className="cell-main">{d.client_nom}</div>
              <div className="cell-amount">- {formatMoney(d.total_ttc)}</div>
              <div className="cell-action">
                <button className="btn-pdf" onClick={() => generatePDF(d)}>Télécharger</button>
              </div>
            </div>
          ))}

          {depenses.length === 0 && (
            <div style={{textAlign:'center', padding:'40px', color:'var(--text-secondary)', fontStyle:'italic'}}>
              Aucune dépense enregistrée.
            </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{fontSize:'24px', fontWeight:'800', marginBottom:'24px', color:'var(--text-primary)'}}>
              Nouvelle Dépense
            </h2>
            
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div>
                  <label style={{display:'block', marginBottom:'8px', color:'var(--text-secondary)', fontSize:'12px'}}>Fournisseur</label>
                  <select value={fournisseurId} onChange={handleFournisseurSelect} required className="input-field">
                    <option value="">-- Choisir --</option>
                    {listeFournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom_complet}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block', marginBottom:'8px', color:'var(--text-secondary)', fontSize:'12px'}}>Date</label>
                  <input type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} required className="input-field" />
                </div>
              </div>

              <div style={{marginBottom:'10px', fontWeight:'600', fontSize:'14px', color:'var(--text-secondary)'}}>Articles</div>
              
              {lignes.map((l, i) => (
                <div key={i} className="line-item">
                  <input placeholder="Quoi ?" value={l.description} onChange={e => updateLigne(i, 'description', e.target.value)} required className="input-field" />
                  <input type="number" placeholder="Qté" value={l.quantite} onChange={e => updateLigne(i, 'quantite', e.target.value)} className="input-field" />
                  <input placeholder="Unité" value={l.unite} onChange={e => updateLigne(i, 'unite', e.target.value)} className="input-field" />
                  <input type="number" placeholder="Prix" value={l.prix} onChange={e => updateLigne(i, 'prix', e.target.value)} required className="input-field" />
                  {lignes.length > 1 && <button type="button" onClick={() => removeLigne(i)} style={{background:'none', border:'none', color:'var(--danger)', fontSize:'20px', cursor:'pointer'}}>×</button>}
                </div>
              ))}

              <button type="button" onClick={addLigne} style={{width:'100%', padding:'12px', border:'1px dashed var(--border)', background:'transparent', color:'var(--text-secondary)', borderRadius:'12px', cursor:'pointer', margin:'10px 0'}}>
                + Ajouter une ligne
              </button>

              <div style={{textAlign:'right', fontSize:'28px', fontWeight:'900', color:'var(--danger)', margin:'20px 0'}}>
                {formatMoney(total())}
              </div>

              <div style={{display:'flex', gap:'10px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{flex:1, padding:'16px', borderRadius:'14px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', fontWeight:'600'}}>
                  Annuler
                </button>
                <button type="submit" style={{flex:1, padding:'16px', borderRadius:'14px', border:'none', background:'var(--danger)', color:'white', fontWeight:'800', boxShadow:'0 5px 20px var(--danger-glow)'}}>
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
