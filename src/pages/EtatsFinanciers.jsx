import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* STYLES CSS RESPONSIVE */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
  
  .page { display: flex; min-height: 100vh; flex-direction: column; }
  .main { 
    flex: 1; width: 100%; padding: 20px; padding-top: 80px; 
    transition: margin 0.3s; 
  }
  
  @media (min-width: 1024px) {
    .page { flex-direction: row; }
    .main { margin-left: 260px; padding: 40px; }
  }

  .header { display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; }
  .header h1 { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0; }
  .header p { color: #64748b; margin: 5px 0 0 0; font-size: 0.9rem; }
  
  @media (min-width: 640px) {
    .header { flex-direction: row; justify-content: space-between; align-items: center; }
  }

  /* ONGLETS */
  .tabs { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; margin-bottom: 20px; }
  .tab-btn {
    padding: 10px 20px; border: 1px solid #e2e8f0; border-radius: 20px; 
    background: white; color: #64748b; cursor: pointer; font-weight: 600; font-size: 0.9rem;
    white-space: nowrap; transition: all 0.2s;
  }
  .tab-btn.active { background: #1e293b; color: white; border-color: #1e293b; }
  .tab-btn:hover { transform: translateY(-2px); }

  /* CARTES DE DONNÉES */
  .paper { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); height: 100%; }
  .paper-header { margin-top: 0; padding: 10px; border-radius: 6px; text-align: center; margin-bottom: 20px; font-weight: 800; }
  .header-green { color: #166534; background: #dcfce7; }
  .header-red { color: #991b1b; background: #fee2e2; }
  .header-blue { color: #1e40af; background: #dbeafe; }

  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #e2e8f0; font-size: 0.95rem; }
  .row-label { color: #334155; }
  .row-val { font-weight: 700; color: #1e293b; }
  .total-row { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 2px solid #334155; font-weight: 800; font-size: 1.1rem; }

  .grid-2 { display: grid; grid-template-columns: 1fr; gap: 20px; }
  @media (min-width: 768px) { .grid-2 { grid-template-columns: 1fr 1fr; } }

  .btn-action { padding: 10px 20px; background: #ef4444; color: white; border: none; borderRadius: 6px; cursor: pointer; font-weight: 700; }
  
  .cash-display { text-align: center; padding: 40px; }
  .cash-value { font-size: 3rem; font-weight: 900; color: #3b82f6; margin: 10px 0; }
`;

export default function EtatsFinanciers() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [activeTab, setActiveTab] = useState('bilan'); 

  // Données Comptables
  const [bilan, setBilan] = useState({
    actif: { immob: 0, stocks: 0, creances: 0, tresorerie: 0, total: 0 },
    passif: { capitaux: 0, dettesFi: 0, dettesFourn: 0, dettesFiscales: 0, total: 0 }
  });

  const [resultat, setResultat] = useState({
    produits: { ventes: 0, autres: 0, total: 0 },
    charges: { achats: 0, transports: 0, externes: 0, impots: 0, personnel: 0, total: 0 },
    net: 0
  });

  useEffect(() => { initData(); }, []);

  async function initData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const ste = await getEntrepriseForUser(user.id, user.email);
        if (ste) {
            setEntreprise(ste);
            calculerEtats(ste.id);
        }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // --- CŒUR DU CALCUL COMPTABLE (HYBRIDE) ---
  async function calculerEtats(entrepriseId) {
    // 1. Récupérer les écritures comptables (Grand Livre)
    const { data: lignes } = await supabase
      .from('lignes_ecriture')
      .select(`debit, credit, compte:plan_comptable!inner(code_compte)`)
      .eq('plan_comptable.entreprise_id', entrepriseId);

    // 2. Récupérer les données commerciales "REELLES" (Factures, Stocks, IMMOBILISATIONS)
    const { data: factures } = await supabase.from('factures').select('*').eq('entreprise_id', entrepriseId);
    const { data: produits } = await supabase.from('produits').select('stock_actuel, prix_achat').eq('entreprise_id', entrepriseId);
    // AJOUT : Récupération des immobilisations
    const { data: immobilisations } = await supabase.from('tableau_amortissement').select('valeur_nette_comptable').eq('entreprise_id', entrepriseId);

    // --- CALCULS ---

    // A. Calculs Commerciaux (Source de vérité principale)
    
    // Stocks
    let stockReel = 0;
    if (produits) stockReel = produits.reduce((acc, p) => acc + (p.stock_actuel * p.prix_achat), 0);

    // Immobilisations (VNC)
    let immobReelles = 0;
    if (immobilisations) immobReelles = immobilisations.reduce((acc, i) => acc + (Number(i.valeur_nette_comptable) || 0), 0);

    // Créances & Ventes & Dettes Fiscales (TVA/AIB)
    let creancesReelles = 0;
    let ventesReelles = 0;
    let dettesFiscalesReelles = 0;

    if (factures) {
        factures.forEach(f => {
            const reste = f.total_ttc - (f.montant_paye || 0);
            if (reste > 0) creancesReelles += reste; // Créances Clients
            
            ventesReelles += (f.total_ht || 0); // Chiffre d'Affaires HT
            
            dettesFiscalesReelles += (f.total_tva || 0) + (f.total_aib || 0);
        });
    }

    // B. Calculs Comptables (Pour ce qui n'est pas commercial)
    let bActif = { immob: 0, stocks: 0, creances: 0, tresorerie: 0 };
    let bPassif = { capitaux: 0, dettesFi: 0, dettesFourn: 0, dettesFiscales: 0 };
    let cCharges = { achats: 0, transports: 0, externes: 0, impots: 0, personnel: 0 };
    let autresProduits = 0;

    if (lignes) {
        lignes.forEach(L => {
          const code = L.compte.code_compte.toString();
          const solde = L.debit - L.credit;

          // Passif
          if (code.startsWith('10') || code.startsWith('11') || code.startsWith('12')) 
             bPassif.capitaux += (L.credit - L.debit); 
          else if (code.startsWith('16')) bPassif.dettesFi += (L.credit - L.debit); 
          else if (code.startsWith('40')) bPassif.dettesFourn += (L.credit - L.debit); 
          
          // Actif (Ceux qu'on ne calcule pas via le commercial, ex: Trésorerie)
          else if (code.startsWith('5')) bActif.tresorerie += solde; 

          // Charges
          else if (code.startsWith('60')) cCharges.achats += solde; 
          else if (code.startsWith('61')) cCharges.transports += solde; 
          else if (code.startsWith('62') || code.startsWith('63')) cCharges.externes += solde;
          else if (code.startsWith('64')) cCharges.impots += solde; 
          else if (code.startsWith('66')) cCharges.personnel += solde;
          
          // Autres Produits
          else if (code.startsWith('7') && !code.startsWith('701')) autresProduits += (L.credit - L.debit);
        });
    }

    // --- FUSION ET SYNTHÈSE ---
    
    // On écrase les valeurs comptables par les valeurs "métier"
    bActif.stocks = stockReel;
    bActif.creances = creancesReelles;
    bActif.immob = immobReelles; // <--- AJOUT ICI
    
    // Pour le passif fiscal
    bPassif.dettesFiscales = Math.max(bPassif.dettesFiscales, dettesFiscalesReelles);

    // Résultat
    const totalProduits = ventesReelles + autresProduits;
    const totalCharges = cCharges.achats + cCharges.transports + cCharges.externes + cCharges.impots + cCharges.personnel;
    const resultatNet = totalProduits - totalCharges;

    // Équilibrage Bilan
    bPassif.capitaux += resultatNet; 

    // TOTAUX FINAUX
    const totalActif = Object.values(bActif).reduce((a, b) => a + b, 0);
    const totalPassif = bPassif.capitaux + bPassif.dettesFi + bPassif.dettesFourn + bPassif.dettesFiscales;

    setBilan({ actif: {...bActif, total: totalActif}, passif: {...bPassif, total: totalPassif} });
    setResultat({ produits: {ventes: ventesReelles, autres: autresProduits, total: totalProduits}, charges: {...cCharges, total: totalCharges}, net: resultatNet });
  }

  // --- EXPORT PDF ---
  const exportLiassePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(`LIASSE FISCALE - ${entreprise?.nom}`, 14, 20);
    doc.setFontSize(12); doc.text("1. Bilan (Patrimoine)", 14, 30);
    
    autoTable(doc, {
      startY: 35,
      head: [['ACTIF', 'Montant', '|', 'PASSIF', 'Montant']],
      body: [
        ['Immobilisations', bilan.actif.immob.toLocaleString(), '|', 'Capitaux Propres', bilan.passif.capitaux.toLocaleString()],
        ['Stocks', bilan.actif.stocks.toLocaleString(), '|', 'Dettes Financières', bilan.passif.dettesFi.toLocaleString()],
        ['Créances Clients', bilan.actif.creances.toLocaleString(), '|', 'Dettes Fournisseurs', bilan.passif.dettesFourn.toLocaleString()],
        ['Trésorerie', bilan.actif.tresorerie.toLocaleString(), '|', 'Dettes Fiscales', bilan.passif.dettesFiscales.toLocaleString()],
        ['TOTAL ACTIF', bilan.actif.total.toLocaleString(), '|', 'TOTAL PASSIF', bilan.passif.total.toLocaleString()],
      ],
      theme: 'grid', headStyles: { fillColor: [41, 128, 185] }
    });

    doc.addPage();
    doc.text("2. Compte de Résultat", 14, 20);
    autoTable(doc, {
      startY: 25,
      head: [['Rubrique', 'Montant']],
      body: [
        ['PRODUITS (Ventes)', resultat.produits.total.toLocaleString()],
        ['CHARGES (Dépenses)', resultat.charges.total.toLocaleString()],
        ['RÉSULTAT NET', resultat.net.toLocaleString()]
      ]
    });

    doc.save('liasse_fiscale.pdf');
  };

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Calcul en cours...</div>;

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

        <div className="main">
          
          <div className="header">
            <div>
                <h1>États Financiers (OHADA)</h1>
                <p>Données synchronisées en temps réel avec Facturation & Stocks</p>
            </div>
            <button onClick={exportLiassePDF} className="btn-action">📄 Télécharger la Liasse</button>
          </div>

          <div className="tabs">
            <button onClick={() => setActiveTab('bilan')} className={`tab-btn ${activeTab === 'bilan' ? 'active' : ''}`}>🏛️ 1. Bilan</button>
            <button onClick={() => setActiveTab('resultat')} className={`tab-btn ${activeTab === 'resultat' ? 'active' : ''}`}>📊 2. Résultat</button>
            <button onClick={() => setActiveTab('tresorerie')} className={`tab-btn ${activeTab === 'tresorerie' ? 'active' : ''}`}>💰 3. Flux (TFT)</button>
            <button onClick={() => setActiveTab('annexes')} className={`tab-btn ${activeTab === 'annexes' ? 'active' : ''}`}>📝 4. Notes Annexes</button>
          </div>
          
          {activeTab === 'bilan' && (
              <div className="grid-2">
                  <div className="paper">
                      <div className="paper-header header-green">ACTIF (Emplois)</div>
                      <Row label="Immobilisations (Classe 2)" value={bilan.actif.immob} bold />
                      <Row label="Stocks (Classe 3)" value={bilan.actif.stocks} />
                      <Row label="Créances Clients (Classe 4)" value={bilan.actif.creances} />
                      <Row label="Trésorerie Actif (Classe 5)" value={bilan.actif.tresorerie} />
                      <div className="total-row"><span>TOTAL ACTIF</span><span>{bilan.actif.total.toLocaleString()} F</span></div>
                  </div>
                  <div className="paper">
                      <div className="paper-header header-red">PASSIF (Ressources)</div>
                      <Row label="Capitaux Propres (+ Résultat)" value={bilan.passif.capitaux} />
                      <Row label="Emprunts Bancaires" value={bilan.passif.dettesFi} />
                      <Row label="Dettes Fournisseurs" value={bilan.passif.dettesFourn} />
                      <Row label="Dettes Fiscales (TVA/AIB)" value={bilan.passif.dettesFiscales} />
                      <div className="total-row"><span>TOTAL PASSIF</span><span>{bilan.passif.total.toLocaleString()} F</span></div>
                  </div>
              </div>
          )}

          {activeTab === 'resultat' && (
              <div className="paper" style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div className="paper-header header-blue">Compte de Résultat</div>
                  
                  <h4 style={{color: '#166534', borderBottom: '1px solid #eee', paddingBottom: 5}}>PRODUITS (+)</h4>
                  <Row label="Ventes de marchandises (CA)" value={resultat.produits.ventes} bold />
                  <Row label="Autres produits" value={resultat.produits.autres} />
                  
                  <h4 style={{color: '#991b1b', borderBottom: '1px solid #eee', paddingBottom: 5, marginTop: 20}}>CHARGES (-)</h4>
                  <Row label="Achats" value={resultat.charges.achats} />
                  <Row label="Transports & Services Ext." value={resultat.charges.transports + resultat.charges.externes} />
                  <Row label="Impôts et Taxes" value={resultat.charges.impots} />
                  <Row label="Personnel" value={resultat.charges.personnel} />

                  <div style={{ background: resultat.net >= 0 ? '#dcfce7' : '#fee2e2', padding: '20px', marginTop: 30, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: resultat.net >= 0 ? '#166534' : '#991b1b' }}>
                      <span>RÉSULTAT NET</span>
                      <span>{resultat.net.toLocaleString()} FCFA</span>
                  </div>
              </div>
          )}

          {activeTab === 'tresorerie' && (
              <div className="paper">
                  <div className="paper-header header-blue">Tableau des Flux de Trésorerie</div>
                  <div className="cash-display">
                      <p style={{ color: '#64748b' }}>Trésorerie Nette à la clôture :</p>
                      <div className="cash-value">{bilan.actif.tresorerie.toLocaleString()} FCFA</div>
                  </div>
              </div>
          )}

          {activeTab === 'annexes' && (
              <div className="paper" style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div className="paper-header header-blue">Notes Annexes</div>
                  <div style={{ marginBottom: 30 }}>
                      <h4 style={{color: '#334155', borderBottom: '1px solid #ddd'}}>Note 1 : Référentiel</h4>
                      <p style={{color: '#64748b'}}>États financiers établis conformément au Système Comptable OHADA Révisé.</p>
                  </div>
                  <div style={{ marginBottom: 30 }}>
                      <h4 style={{color: '#334155', borderBottom: '1px solid #ddd'}}>Note 2 : Actifs</h4>
                      <p style={{color: '#64748b'}}>
                          Valeur nette des immobilisations : <strong>{bilan.actif.immob.toLocaleString()} FCFA</strong>.
                      </p>
                  </div>
              </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value, bold }) {
    return (
        <div className="row">
            <span className="row-label" style={{ fontWeight: bold ? 'bold' : 'normal' }}>{label}</span>
            <span className="row-val">{value.toLocaleString()} F</span>
        </div>
    )
}
