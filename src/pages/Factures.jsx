import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ==================== FORMATTERS ==================== */
const formatMoney = (amount) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount).replace('XOF', 'F');
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function FacturesAppleStyle() {
  // --- LOGIC STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [factures, setFactures] = useState([]);
  const [listeClients, setListeClients] = useState([]);
  const [listeProduits, setListeProduits] = useState([]);

  // --- UI STATES ---
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);

  // --- FORM STATES ---
  const [clientId, setClientId] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  const [montantVerse, setMontantVerse] = useState(0);
  const [montantPaiementUlterieur, setMontantPaiementUlterieur] = useState('');

  // --- EFFECTS ---
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    initData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  // --- DATA LOADING ---
  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      await Promise.all([
        fetchFactures(ste.id),
        fetchListes(ste.id)
      ]);
    }
    setLoading(false);
  }

  async function fetchFactures(id) {
    const { data } = await supabase
      .from('factures')
      .select('*')
      .eq('entreprise_id', id)
      .eq('type_facture', 'VENTE')
      .order('created_at', { ascending: false });
    setFactures(data || []);
  }

  async function fetchListes(id) {
    const { data: clients } = await supabase.from('tiers').select('id, nom_complet').eq('entreprise_id', id).eq('type_tier', 'CLIENT');
    const { data: prods } = await supabase.from('produits').select('nom, prix_vente, unite').eq('entreprise_id', id);
    setListeClients(clients || []);
    setListeProduits(prods || []);
  }

  // --- FORM LOGIC ---
  const addLigne = () => setLignes([...lignes, { description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));
  const updateLigne = (i, field, value) => {
    const newLignes = [...lignes];
    newLignes[i][field] = field === 'quantite' ? Number(value) : value;
    setLignes(newLignes);
  };

  const handleProductSelect = (i, nom) => {
    const p = listeProduits.find(x => x.nom === nom);
    const newLignes = [...lignes];
    newLignes[i].description = nom;
    if (p) {
      newLignes[i].prix = p.prix_vente || 0;
      newLignes[i].unite = p.unite || 'unité';
    }
    setLignes(newLignes);
  };

  const calculateTotal = () => lignes.reduce((acc, l) => acc + (l.quantite * l.prix), 0);

  // --- ACTIONS ---
  async function handleSave(e) {
    e.preventDefault();
    if (!clientId) return alert("Veuillez sélectionner un client.");

    const totalTTC = calculateTotal();
    const paye = Number(montantVerse);
    const statut = paye >= totalTTC ? 'PAYEE' : paye > 0 ? 'PARTIELLE' : 'IMPAYEE';
    const numeroFacture = `FAC-${Date.now().toString().slice(-8)}`;

    try {
      const { data: facture } = await supabase.from('factures').insert([{
        entreprise_id: entreprise.id,
        tier_id: clientId,
        client_nom: clientNom,
        numero: numeroFacture,
        date_emission: dateEmission,
        type_facture: 'VENTE',
        total_ht: totalTTC,
        total_ttc: totalTTC,
        montant_paye: paye,
        statut
      }]).select().single();

      await supabase.from('lignes_facture').insert(
        lignes.map(l => ({
          facture_id: facture.id,
          description: l.description,
          quantite: l.quantite,
          unite: l.unite,
          prix_unitaire: l.prix
        }))
      );

      // (Optionnel) Création écriture comptable ici si nécessaire

      alert("Facture créée avec succès !");
      closeModal();
      fetchFactures(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  const handlePaiementUlterieur = async (e) => {
    e.preventDefault();
    const montant = Number(montantPaiementUlterieur);
    if (montant <= 0) return;

    const nouveauPaye = (selectedFacture.montant_paye || 0) + montant;
    const nouveauStatut = nouveauPaye >= selectedFacture.total_ttc ? 'PAYEE' : 'PARTIELLE';

    await supabase.from('factures')
      .update({ montant_paye: nouveauPaye, statut: nouveauStatut })
      .eq('id', selectedFacture.id);

    alert("Paiement enregistré !");
    setIsPayModalOpen(false);
    fetchFactures(entreprise.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setClientId(''); setClientNom(''); setMontantVerse(0);
    setLignes([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  };

  const generatePDF = (f) => {
    const doc = new jsPDF();
    // Header pro
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`FACTURE ${f.numero}`, 105, 13, { align: 'center' });
    
    // Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Émetteur : ${entreprise?.nom || 'Mon Entreprise'}`, 14, 40);
    doc.text(`Client : ${f.client_nom}`, 14, 50);
    doc.text(`Date : ${formatDate(f.date_emission)}`, 14, 60);

    // Lignes (On fetch les lignes au besoin ou on suppose qu'on les a, ici exemple statique si pas chargées)
    autoTable(doc, {
      startY: 75,
      head: [['Description', 'Total']],
      body: [['Prestation / Produits', formatMoney(f.total_ttc)]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    const finalY = doc.lastAutoTable.finalY;
    doc.text(`Payé : ${formatMoney(f.montant_paye || 0)}`, 14, finalY + 20);
    doc.text(`Reste à payer : ${formatMoney(f.total_ttc - (f.montant_paye || 0))}`, 14, finalY + 30);
    
    doc.save(`Facture_${f.numero}.pdf`);
  };

  if (loading) return <div style={{ height: '100vh', background: '#000', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Chargement...</div>;

  const totalCA = factures.reduce((acc, f) => acc + f.total_ttc, 0);
  const totalImpaye = factures.reduce((acc, f) => acc + (f.total_ttc - (f.montant_paye || 0)), 0);

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
          --accent: #3b82f6; /* Blue */
          --accent-glow: rgba(59, 130, 246, 0.3);
          --success: #34c759;
          --warning: #ff9f0a;
          --danger: #ff3b30;
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
          --accent: #0a84ff;
          --accent-glow: rgba(10, 132, 255, 0.4);
          --success: #30d158;
          --warning: #ff9f0a;
          --danger: #ff453a;
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
        .mobile-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40;
          display: none; opacity: 0; transition: opacity 0.3s;
        }

        /* --- BACKGROUND ORBS --- */
        .orb {
          position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4;
        }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--accent); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: var(--success); }

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
          flex-wrap: wrap; gap: 20px;
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

        .btn-primary {
          padding: 14px 24px; border-radius: 99px; border: none;
          background: linear-gradient(135deg, var(--accent), #2563eb);
          color: white; font-weight: 600; font-size: 15px; cursor: pointer;
          box-shadow: 0 8px 20px var(--accent-glow); transition: var(--transition);
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px var(--accent-glow); }

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
          display: grid; grid-template-columns: 1fr 1fr 1.5fr 1fr 1fr 1fr 1fr; gap: 15px;
          padding: 0 24px; margin-bottom: 4px;
          color: var(--text-secondary); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
        }

        .facture-row {
          display: grid; grid-template-columns: 1fr 1fr 1.5fr 1fr 1fr 1fr 1fr; gap: 15px; align-items: center;
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 18px;
          padding: 18px 24px;
          transition: var(--transition);
          animation: fadeSlide 0.5s ease-out backwards;
        }
        .facture-row:hover {
          background: var(--bg-card); border-color: var(--accent);
          transform: scale(1.01); z-index: 2; box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }

        .cell-date { color: var(--text-secondary); font-size: 13px; }
        .cell-ref { font-family: monospace; font-weight: 600; color: var(--text-primary); }
        .cell-client { font-weight: 600; color: var(--text-primary); }
        .cell-amount { font-weight: 700; color: var(--text-primary); }
        .cell-paye { color: var(--success); font-size: 13px; }
        .cell-reste { font-weight: 700; font-size: 13px; }

        .badge {
          padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; text-align: center;
        }
        .badge-PAYEE { background: rgba(52, 199, 89, 0.15); color: var(--success); }
        .badge-PARTIELLE { background: rgba(255, 159, 10, 0.15); color: var(--warning); }
        .badge-IMPAYEE { background: rgba(255, 59, 48, 0.15); color: var(--danger); }

        .actions-cell { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-icon {
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.1);
          color: var(--text-primary); cursor: pointer; transition: 0.2s;
        }
        .btn-icon:hover { background: var(--text-primary); color: var(--bg-main); }
        .btn-pay { color: var(--success); border-color: rgba(52, 199, 89, 0.3); }
        .btn-pay:hover { background: var(--success); color: white; }

        /* --- MODAL --- */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 100;
          padding: 20px;
        }
        .modal-card {
          width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto;
          background: var(--bg-card); padding: 30px; border-radius: 28px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--border);
          animation: zoomIn 0.3s ease-out;
        }
        .modal-title { font-size: 24px; font-weight: 800; margin-bottom: 24px; color: var(--text-primary); }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .input-group label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 600; }
        .input-field {
          width: 100%; padding: 14px; border-radius: 14px; border: 1px solid transparent;
          background: var(--input-bg); color: var(--text-primary); outline: none; transition: 0.3s;
        }
        .input-field:focus { border-color: var(--accent); background: var(--bg-card); box-shadow: 0 0 0 4px var(--accent-glow); }

        .line-item { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: center; }
        .btn-remove { background: none; border: none; color: var(--danger); font-size: 20px; cursor: pointer; }

        .total-box {
          background: rgba(52, 199, 89, 0.1); border-radius: 16px; padding: 20px; margin-top: 20px;
          border: 1px solid rgba(52, 199, 89, 0.2);
        }
        .total-line { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }

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
          
          /* Table -> Cards */
          .list-header { display: none; }
          .facture-row {
            display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
            padding: 20px; position: relative;
          }
          .cell-ref { font-size: 16px; margin-bottom: 4px; }
          .cell-client { font-size: 14px; opacity: 0.8; }
          .cell-amount { font-size: 20px; color: var(--accent); margin: 5px 0; }
          .actions-cell { width: 100%; justify-content: space-between; margin-top: 10px; }
          .btn-icon { flex: 1; height: 40px; border-radius: 10px; }

          /* Form */
          .form-grid { grid-template-columns: 1fr; }
          .line-item { grid-template-columns: 1fr 1fr; background: var(--input-bg); padding: 10px; border-radius: 12px; }
          .line-item select { grid-column: span 2; }
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* OVERLAYS & SIDEBAR */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`sidebar-wrapper ${sidebarOpen || isMobileMenuOpen ? 'open' : ''}`}>
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
              <h1>Factures de Vente</h1>
              <div style={{color:'var(--text-secondary)'}}>Gérez vos encaissements clients</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Nouvelle Facture</button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Chiffre d'Affaires</div>
            <div className="stat-value" style={{color: 'var(--accent)'}}>{formatMoney(totalCA)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Reste à recouvrer</div>
            <div className="stat-value" style={{color: 'var(--danger)'}}>{formatMoney(totalImpaye)}</div>
          </div>
        </div>

        {/* LISTE DES FACTURES */}
        <div className="list-container">
          <div className="list-header">
            <div>Date</div>
            <div>N°</div>
            <div>Client</div>
            <div>Montant TTC</div>
            <div>Déjà Payé</div>
            <div>Reste</div>
            <div style={{textAlign:'right'}}>Actions</div>
          </div>

          {factures.map((f, i) => {
            const reste = f.total_ttc - (f.montant_paye || 0);
            return (
              <div key={f.id} className="facture-row" style={{animationDelay: `${i * 0.05}s`}}>
                <div className="cell-date">{formatDate(f.date_emission)}</div>
                <div className="cell-ref">{f.numero}</div>
                <div className="cell-client">{f.client_nom}</div>
                <div className="cell-amount">{formatMoney(f.total_ttc)}</div>
                <div className="cell-paye">{formatMoney(f.montant_paye || 0)}</div>
                <div className="cell-reste" style={{color: reste > 0 ? 'var(--danger)' : 'var(--success)'}}>
                  {reste > 0 ? formatMoney(reste) : 'Soldé'}
                </div>
                
                <div className="actions-cell">
                   {reste > 0 && (
                     <button className="btn-icon btn-pay" title="Encaisser" onClick={() => {
                       setSelectedFacture(f);
                       setMontantPaiementUlterieur(reste);
                       setIsPayModalOpen(true);
                     }}>
                       $
                     </button>
                   )}
                   <button className="btn-icon" title="PDF" onClick={() => generatePDF(f)}>
                     ⬇
                   </button>
                </div>
              </div>
            );
          })}
          
          {factures.length === 0 && (
            <div style={{textAlign:'center', padding:'4rem', color:'var(--text-secondary)', fontStyle:'italic'}}>
              Aucune facture enregistrée. Commencez par en créer une !
            </div>
          )}
        </div>
      </main>

      {/* MODAL CRÉATION FACTURE */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <h2 className="modal-title">Nouvelle Facture</h2>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Client</label>
                  <select 
                    className="input-field"
                    value={clientId} 
                    onChange={(e) => {
                      setClientId(e.target.value);
                      const opt = e.target.selectedOptions[0];
                      setClientNom(opt ? opt.text : '');
                    }} 
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {listeClients.map(c => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Date d'émission</label>
                  <input type="date" className="input-field" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} required />
                </div>
              </div>

              <h3 style={{fontSize:'14px', marginBottom:'10px', color:'var(--text-secondary)'}}>Lignes de facture</h3>
              {lignes.map((ligne, i) => (
                <div key={i} className="line-item">
                  <select 
                    className="input-field"
                    value={ligne.description} 
                    onChange={(e) => handleProductSelect(i, e.target.value)} 
                    required
                  >
                    <option value="">Produit / Service</option>
                    {listeProduits.map(p => <option key={p.nom} value={p.nom}>{p.nom}</option>)}
                  </select>
                  <input type="number" min="1" className="input-field" placeholder="Qté" value={ligne.quantite} onChange={(e) => updateLigne(i, 'quantite', e.target.value)} />
                  <input type="text" className="input-field" value={ligne.unite} readOnly />
                  <input type="number" className="input-field" value={ligne.prix} readOnly />
                  {lignes.length > 1 && <button type="button" className="btn-remove" onClick={() => removeLigne(i)}>×</button>}
                </div>
              ))}
              
              <button type="button" onClick={addLigne} style={{color:'var(--accent)', background:'none', border:'none', fontWeight:'600', cursor:'pointer', marginTop:'10px'}}>
                + Ajouter une ligne
              </button>

              <div className="total-box">
                <div className="total-line">
                  <span>Total TTC</span>
                  <span>{formatMoney(calculateTotal())}</span>
                </div>
                <div className="input-group">
                  <label>Montant payé immédiatement</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    min="0"
                    value={montantVerse} 
                    onChange={(e) => setMontantVerse(Number(e.target.value))}
                    style={{fontWeight:'bold', color:'var(--success)'}}
                  />
                </div>
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                <button type="button" onClick={closeModal} style={{padding:'12px 24px', borderRadius:'12px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', cursor:'pointer'}}>Annuler</button>
                <button type="submit" className="btn-primary">Créer la facture</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT */}
      {isPayModalOpen && selectedFacture && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsPayModalOpen(false)}>
          <div className="modal-content" style={{maxWidth:'500px'}}>
            <h2 className="modal-title" style={{color:'var(--success)'}}>Encaissement</h2>
            <p style={{marginBottom:'20px', color:'var(--text-secondary)'}}>
              Client : <strong>{selectedFacture.client_nom}</strong><br/>
              Facture N° : {selectedFacture.numero}
            </p>
            
            <div style={{fontSize:'32px', fontWeight:'800', color:'var(--danger)', marginBottom:'20px', textAlign:'center'}}>
              {formatMoney(selectedFacture.total_ttc - (selectedFacture.montant_paye || 0))}
            </div>
            
            <div className="input-group">
              <label>Montant reçu ce jour</label>
              <input 
                type="number" 
                className="input-field"
                value={montantPaiementUlterieur} 
                onChange={(e) => setMontantPaiementUlterieur(e.target.value)}
                autoFocus
                style={{fontSize:'20px', textAlign:'center'}}
              />
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
              <button type="button" onClick={() => setIsPayModalOpen(false)} style={{padding:'12px 24px', borderRadius:'12px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', cursor:'pointer'}}>Annuler</button>
              <button onClick={handlePaiementUlterieur} className="btn-primary" style={{background:'var(--success)'}}>Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
