// src/pages/EtatsFinanciers.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* --- ICÔNES SVG --- */
const IconDownload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const IconChart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const IconScale = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A5.974 5.974 0 0114.175 2.076m0 0A5.967 5.967 0 012.25 4.97m11.925-2.894A5.951 5.951 0 0012 2.75c-1.296 0-2.508.38-3.543 1.032m0 0c1.035.652 2.247 1.032 3.543 1.032 1.296 0 2.508-.38 3.543-1.032M2.25 4.971c.907.304 1.852.485 2.835.529 1.472.066 2.946-.226 4.172-.855 1.226.629 2.7.921 4.172.855 1.258-.056 2.455-.333 3.543-.808" /></svg>;
const IconWallet = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>;

/* --- CSS STYLES --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  /* CORRECTIF CRITIQUE MOBILE */
  @media (max-width: 900px) {
    main {
      margin-left: 0 !important;
      padding: 1rem !important;
      width: 100% !important;
    }
  }

  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }

  /* LAYOUT */
  .layout { display: flex; min-height: 100vh; width: 100%; }
  
  .main-area {
    margin-left: 260px;
    padding: 2rem;
    width: 100%;
    transition: all 0.3s ease;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dashboard-container {
    width: 100%;
    max-width: 1000px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* HEADER */
  .header-flex {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    text-align: center;
    margin-bottom: 1rem;
  }
  .header-content h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    color: #0f172a;
    line-height: 1.2;
  }
  .header-content p { color: #64748b; font-size: 0.9rem; margin: 0; }

  .btn-download {
    padding: 0.75rem 1.25rem;
    background: #0f172a;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    transition: transform 0.1s;
  }
  .btn-download:active { transform: scale(0.98); }

  /* TABS (Segmented Control) */
  .tabs-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 0.5rem;
  }
  .tabs-container {
    background: #e2e8f0;
    padding: 4px;
    border-radius: 12px;
    display: flex;
    gap: 4px;
    width: 100%;
    max-width: 600px;
    overflow-x: auto; /* Scroll si trop petit */
  }
  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    color: #64748b;
    background: transparent;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .tab-btn.active {
    background: white;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  /* BILAN GRID */
  .bilan-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  /* CARDS */
  .financial-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    height: 100%;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #f1f5f9;
  }
  .card-title { margin: 0; font-size: 1.1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .tag { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
  .tag-green { background: #dcfce7; color: #166534; }
  .tag-red { background: #fee2e2; color: #991b1b; }

  /* ROWS */
  .data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px dashed #e2e8f0;
    font-size: 0.95rem;
  }
  .data-row:last-of-type { border-bottom: none; }
  .row-label { color: #64748b; }
  .row-value { font-weight: 600; color: #0f172a; font-family: 'Inter', monospace; }

  .total-row {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 800;
    font-size: 1.1rem;
  }

  /* RESULTAT NET CARD */
  .result-net-card {
    margin-top: 2rem;
    padding: 1.5rem;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid transparent;
  }
  .result-positive { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; }
  .result-negative { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }

  /* MEDIA QUERIES */
  @media (min-width: 768px) {
    .header-flex { flex-direction: row; justify-content: space-between; text-align: left; }
    .bilan-grid { grid-template-columns: 1fr 1fr; }
  }
`;

export default function EtatsFinanciers() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [activeTab, setActiveTab] = useState('bilan');

  const [bilan, setBilan] = useState({ actif: { immob: 0, stocks: 0, creances: 0, tresorerie: 0, total: 0 }, passif: { capitaux: 0, dettesFi: 0, dettesFourn: 0, dettesFiscales: 0, total: 0 } });
  const [resultat, setResultat] = useState({ produits: { ventes: 0, autres: 0, total: 0 }, charges: { achats: 0, transports: 0, externes: 0, impots: 0, personnel: 0, total: 0 }, net: 0 });

  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      calculerEtats(ste.id);
    }
    setLoading(false);
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
    doc.text(`BILAN & RÉSULTAT`, 14, 20);
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

  if (loading) return <div style={{height:'100vh', display:'grid', placeItems:'center'}}>Chargement...</div>;

  return (
    <div className="layout">
      <style>{styles}</style>
      
      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <main className="main-area">
        <div className="dashboard-container">
          
          {/* HEADER */}
          <div className="header-flex">
            <div className="header-content">
              <h1>États Financiers</h1>
              <p>Vue d'ensemble de la santé financière</p>
            </div>
            <button onClick={exportPDF} className="btn-download">
              <div style={{width:20, height:20}}><IconDownload /></div> Télécharger
            </button>
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

          {/* CONTENU: BILAN */}
          {activeTab === 'bilan' && (
            <div className="bilan-grid">
              
              {/* CARD ACTIF */}
              <div className="financial-card" style={{borderTop:'4px solid #10b981'}}>
                <div className="card-header">
                  <h3 className="card-title" style={{color:'#10b981'}}>Actif</h3>
                  <span className="tag tag-green">Possessions</span>
                </div>
                <FinancialRow label="Immobilisations" value={bilan.actif.immob} />
                <FinancialRow label="Stocks" value={bilan.actif.stocks} />
                <FinancialRow label="Créances Clients" value={bilan.actif.creances} />
                <FinancialRow label="Trésorerie" value={bilan.actif.tresorerie} />
                
                <div className="total-row" style={{color:'#065f46'}}>
                  <span>Total Actif</span>
                  <span>{bilan.actif.total.toLocaleString()} F</span>
                </div>
              </div>

              {/* CARD PASSIF */}
              <div className="financial-card" style={{borderTop:'4px solid #ef4444'}}>
                <div className="card-header">
                  <h3 className="card-title" style={{color:'#ef4444'}}>Passif</h3>
                  <span className="tag tag-red">Dettes & Capitaux</span>
                </div>
                <FinancialRow label="Capitaux Propres" value={bilan.passif.capitaux} />
                <FinancialRow label="Emprunts Bancaires" value={bilan.passif.dettesFi} />
                <FinancialRow label="Dettes Fournisseurs" value={bilan.passif.dettesFourn} />
                <FinancialRow label="Fiscalité & Taxes" value={bilan.passif.dettesFiscales} />
                
                <div className="total-row" style={{color:'#991b1b'}}>
                  <span>Total Passif</span>
                  <span>{bilan.passif.total.toLocaleString()} F</span>
                </div>
              </div>

            </div>
          )}

          {/* CONTENU: RESULTAT */}
          {activeTab === 'resultat' && (
            <div className="financial-card" style={{maxWidth:'800px', margin:'0 auto'}}>
              <h3 className="card-title" style={{textAlign:'center', marginBottom:'1.5rem'}}>Compte de Résultat</h3>
              
              <div style={{marginBottom:'2rem'}}>
                <h4 style={{margin:'0 0 10px 0', color:'#10b981', fontSize:'1rem'}}>+ PRODUITS (Recettes)</h4>
                <FinancialRow label="Chiffre d'Affaires" value={resultat.produits.ventes} bold />
                <FinancialRow label="Autres produits" value={resultat.produits.autres} />
              </div>

              <div>
                <h4 style={{margin:'0 0 10px 0', color:'#ef4444', fontSize:'1rem'}}>- CHARGES (Dépenses)</h4>
                <FinancialRow label="Achats Marchandises" value={resultat.charges.achats} />
                <FinancialRow label="Transport" value={resultat.charges.transports} />
                <FinancialRow label="Services Extérieurs" value={resultat.charges.externes} />
                <FinancialRow label="Impôts & Taxes" value={resultat.charges.impots} />
                <FinancialRow label="Personnel" value={resultat.charges.personnel} />
              </div>

              <div className={`result-net-card ${resultat.net >= 0 ? 'result-positive' : 'result-negative'}`}>
                <div>
                  <div style={{fontSize:'0.85rem', fontWeight:'600', textTransform:'uppercase'}}>Résultat Net</div>
                  <div style={{fontSize:'1.5rem', fontWeight:'800'}}>
                    {resultat.net > 0 ? '+' : ''}{resultat.net.toLocaleString()} F
                  </div>
                </div>
                <div style={{fontSize:'2.5rem'}}>
                  {resultat.net >= 0 ? '📈' : '📉'}
                </div>
              </div>
            </div>
          )}

          {/* CONTENU: TRESORERIE */}
          {activeTab === 'tresorerie' && (
            <div className="financial-card" style={{maxWidth:'500px', margin:'0 auto', textAlign:'center', padding:'3rem'}}>
              <div style={{width:80, height:80, background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem auto', color:'#4f46e5'}}>
                <div style={{width:40, height:40}}><IconWallet /></div>
              </div>
              <h2 style={{margin:0, color:'#0f172a'}}>Trésorerie Disponible</h2>
              <p style={{color:'#64748b', margin:'0.5rem 0 2rem 0'}}>Solde cumulé Banque + Caisse</p>
              
              <div style={{fontSize:'3rem', fontWeight:'800', color:'#4f46e5'}}>
                {bilan.actif.tresorerie.toLocaleString()} <span style={{fontSize:'1rem', color:'#64748b'}}>F</span>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Composant Helper pour les lignes
function FinancialRow({ label, value, bold }) {
  return (
    <div className="data-row">
      <span className="row-label" style={{fontWeight: bold ? '600' : '400', color: bold ? '#0f172a' : '#64748b'}}>{label}</span>
      <span className="row-value">{value.toLocaleString()}</span>
    </div>
  );
}
