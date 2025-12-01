import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format monétaire
const formatMoney = (value) => {
  return (value || 0).toLocaleString('fr-FR') + ' F';
};

/* --- ICONS --- */
const IconTrash = () => <svg width="18" height="18" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const IconMoney = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;

export default function DepensesUltimateResponsive() {
  const navigate = useNavigate();
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [depenses, setDepenses] = useState([]);
  const [listeFournisseurs, setListeFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  
  // UI & UX
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // FORMULAIRE DÉPENSE
  const [fournisseurId, setFournisseurId] = useState('');
  const [fournisseurNom, setFournisseurNom] = useState('');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [typeFiscal, setTypeFiscal] = useState('TVA'); // Régime fiscal
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, prix: 0, tva_taux: 18, aib_taux: 0 }]); // Note: AIB 0 par défaut en achat sauf si retenue
  const [montantVerse, setMontantVerse] = useState(0);

  // PAIEMENT DETTE
  const [selectedDepense, setSelectedDepense] = useState(null);
  const [montantDette, setMontantDette] = useState('');

  const TYPES_FISCAUX = ['TVA', 'TPS', 'EXONERE', 'EXCEPTION', 'RESERVE'];

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
      await Promise.all([
          fetchDepenses(ste.id), 
          fetchFournisseurs(ste.id),
          fetchProduits(ste.id)
      ]);
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
    const { data } = await supabase.from('tiers').select('id, nom_complet').eq('entreprise_id', entrepriseId).eq('type_tier', 'FOURNISSEUR').order('nom_complet');
    setListeFournisseurs(data || []);
  }

  async function fetchProduits(entrepriseId) {
    const { data } = await supabase.from('produits').select('*').eq('entreprise_id', entrepriseId);
    setProduits(data || []);
  }

  const handleFournisseurSelect = (e) => {
    const id = e.target.value;
    const f = listeFournisseurs.find(x => x.id === id);
    setFournisseurId(id);
    setFournisseurNom(f ? f.nom_complet : '');
  };

  // --- LOGIQUE LIGNES ---
  const addLigne = () => setLignes([...lignes, { description: '', quantite: 1, prix: 0, tva_taux: 18, aib_taux: 0 }]);
  
  const updateLigne = (i, field, val) => {
    const newL = [...lignes];
    newL[i][field] = (field === 'quantite' || field === 'prix' || field === 'tva_taux' || field === 'aib_taux') ? Number(val) : val;
    setLignes(newL);
  };
  
  const handleProductSelect = (i, nom) => {
      const p = produits.find(x => x.nom === nom);
      const newL = [...lignes];
      newL[i].description = nom;
      if (p) { newL[i].prix = p.prix_achat || 0; } // Prix d'achat suggéré
      setLignes(newL);
  };

  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));

  // --- CALCULS FISCAUX ---
  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalAIB = 0;

    lignes.forEach(l => {
        const ligneHT = l.quantite * l.prix;
        let tauxTVA = l.tva_taux || 0;
        let tauxAIB = l.aib_taux || 0;

        if (typeFiscal === 'EXONERE') tauxTVA = 0;

        const ligneTVA = ligneHT * (tauxTVA / 100);
        const ligneAIB = ligneHT * (tauxAIB / 100);

        totalHT += ligneHT;
        totalTVA += ligneTVA;
        totalAIB += ligneAIB;
    });

    return {
        ht: totalHT,
        tva: totalTVA,
        aib: totalAIB,
        ttc: totalHT + totalTVA + totalAIB
    };
  };

  // --- SAUVEGARDE COMPLÈTE ---
  async function handleSave(e) {
    e.preventDefault();
    if (!fournisseurId) return alert("Sélectionnez un fournisseur");

    try {
      setLoading(true);
      const totals = calculateTotals();
      const paye = Number(montantVerse);
      let statut = 'IMPAYEE';
      if (paye >= totals.ttc) statut = 'PAYEE';
      else if (paye > 0) statut = 'PARTIELLE';

      const numero = `ACH-${Date.now().toString().slice(-6)}`;

      // 1. Création Facture Achat
      const { data: facture, error: errFact } = await supabase
        .from('factures')
        .insert([{
          entreprise_id: entreprise.id,
          tier_id: fournisseurId,
          client_nom: fournisseurNom, // Ici c'est le fournisseur
          numero,
          date_emission: dateEmission,
          type_facture: 'ACHAT',
          type_fiscal: typeFiscal,
          statut: statut,
          total_ht: totals.ht,
          total_tva: totals.tva,
          total_aib: totals.aib,
          total_ttc: totals.ttc,
          montant_paye: paye
        }])
        .select()
        .single();

      if (errFact) throw errFact;

      // 2. Lignes & Mise à jour Stock (+ Increment)
      const lignesToInsert = [];
      for (const l of lignes) {
          lignesToInsert.push({
            facture_id: facture.id,
            description: l.description,
            quantite: l.quantite,
            prix_unitaire: l.prix,
            tva_taux: typeFiscal === 'EXONERE' ? 0 : l.tva_taux,
            aib_taux: l.aib_taux
          });

          // UPDATE STOCK (Incrémentation car Achat)
          const productRef = produits.find(p => p.nom === l.description);
          if (productRef) {
              const newStock = (productRef.stock_actuel || 0) + l.quantite;
              await supabase.from('produits').update({ stock_actuel: newStock }).eq('id', productRef.id);
          }
      }
      await supabase.from('lignes_facture').insert(lignesToInsert);

      // 3. Écriture Comptable d'Achat (Journal AC)
      await createEcritureAchat(totals, numero, fournisseurNom);

      // 4. Écriture de Règlement (Si acompte versé)
      if (paye > 0) {
          await createEcritureReglement(paye, `Règlement Achat ${numero}`, '401', 'ACHAT');
      }

      alert("Dépense enregistrée et Stock mis à jour !");
      setIsModalOpen(false);
      resetForm();
      fetchDepenses(entreprise.id);
      fetchProduits(entreprise.id); // Refresh stock

    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
        setLoading(false);
    }
  }

  // COMPTA : Écriture d'Achat
  const createEcritureAchat = async (totals, numero, nomFournisseur) => {
      const { data: plan } = await supabase.from('plan_comptable').select('id, code_compte').eq('entreprise_id', entreprise.id);
      
      const idFournisseur = plan.find(c => c.code_compte.startsWith('401'))?.id; 
      const idAchat = plan.find(c => c.code_compte.startsWith('601'))?.id; // Achat Marchandise
      const idTva = plan.find(c => c.code_compte.startsWith('445'))?.id;   // État TVA Récupérable
      const idAib = plan.find(c => c.code_compte.startsWith('448'))?.id;   // État AIB Retenu (Passif)

      if (idFournisseur && idAchat) {
          const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
              entreprise_id: entreprise.id, date_ecriture: new Date(), libelle: `Achat N° ${numero} - ${nomFournisseur}`, journal_code: 'AC' 
          }]).select().single();

          const lignesEcriture = [];

          // Crédit Fournisseur (TTC) -> Dette
          lignesEcriture.push({ ecriture_id: ecriture.id, compte_id: idFournisseur, debit: 0, credit: totals.ttc });

          // Débit Achat (HT)
          lignesEcriture.push({ ecriture_id: ecriture.id, compte_id: idAchat, debit: totals.ht, credit: 0 });

          // Débit TVA (Récupérable)
          if (totals.tva > 0 && idTva) {
             lignesEcriture.push({ ecriture_id: ecriture.id, compte_id: idTva, debit: totals.tva, credit: 0 });
          }

          // Crédit AIB (Si c'est une retenue qu'on doit reverser à l'état, c'est une dette)
          // Note : Parfois l'AIB sur achat est une charge, ici on simule une retenue à la source simple.
          if (totals.aib > 0 && idAib) {
             lignesEcriture.push({ ecriture_id: ecriture.id, compte_id: idAib, debit: 0, credit: totals.aib });
          }

          await supabase.from('lignes_ecriture').insert(lignesEcriture);
      }
  };

  // COMPTA : Règlement Dette
  const handlePayerDette = async (e) => {
      e.preventDefault();
      const montant = Number(montantDette);
      if (montant <= 0) return;

      try {
          const newPaye = (selectedDepense.montant_paye || 0) + montant;
          const newStatut = newPaye >= selectedDepense.total_ttc ? 'PAYEE' : 'PARTIELLE';

          await supabase.from('factures').update({ montant_paye: newPaye, statut: newStatut }).eq('id', selectedDepense.id);
          
          // Comptabilisation : Débit Fournisseur (401) / Crédit Banque (521)
          await createEcritureReglement(montant, `Règlement Dette ${selectedDepense.numero}`, '401', 'ACHAT');

          alert("Paiement enregistré !");
          setIsPayModalOpen(false);
          fetchDepenses(entreprise.id);
      } catch (err) { alert(err.message); }
  };

  const createEcritureReglement = async (montant, libelle, compteTiersCode, type) => {
      const { data: plan } = await supabase.from('plan_comptable').select('id, code_compte').eq('entreprise_id', entreprise.id);
      const idBanque = plan.find(c => c.code_compte.startsWith('521'))?.id;
      const idTiers = plan.find(c => c.code_compte.startsWith(compteTiersCode))?.id;

      if (idBanque && idTiers) {
          const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
              entreprise_id: entreprise.id, date_ecriture: new Date(), libelle: libelle, journal_code: 'BQ'
          }]).select().single();
          
          // Règlement Dépense : On Débite le Tiers (Diminue la dette) et on Crédite la Banque (Sortie d'argent)
          await supabase.from('lignes_ecriture').insert([
              { ecriture_id: ecriture.id, compte_id: idTiers, debit: montant, credit: 0 },
              { ecriture_id: ecriture.id, compte_id: idBanque, debit: 0, credit: montant }
          ]);
      }
  };

  const resetForm = () => {
    setFournisseurId(''); setFournisseurNom('');
    setDateEmission(new Date().toISOString().split('T')[0]);
    setTypeFiscal('TVA');
    setLignes([{ description: '', quantite: 1, prix: 0, tva_taux: 18, aib_taux: 0 }]);
    setMontantVerse(0);
  };

  const generatePDF = (facture) => {
    const lignes = facture.lignes_facture || [];
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(entreprise?.nom || "Entreprise", 14, 25);
    doc.setFontSize(16); doc.text("BON DE DÉPENSE", 105, 25, { align: "center" });
    doc.setFontSize(10); doc.text(`Fournisseur: ${facture.client_nom}`, 14, 40);
    
    autoTable(doc, {
      startY: 50,
      head: [['Description', 'Qté', 'Prix U.', 'TVA', 'AIB', 'Total TTC']],
      body: lignes.map(l => {
          const ht = l.quantite * l.prix_unitaire;
          const tva = ht * (l.tva_taux/100);
          const aib = ht * (l.aib_taux/100);
          const ttc = ht + tva + aib;
          return [l.description, l.quantite, formatMoney(l.prix_unitaire), `${l.tva_taux}%`, `${l.aib_taux}%`, formatMoney(ttc)];
      }),
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] }
    });
    
    let y = doc.lastAutoTable.finalY + 10;
    doc.text(`Total HT: ${formatMoney(facture.total_ht)}`, 140, y);
    doc.text(`Total TVA: ${formatMoney(facture.total_tva)}`, 140, y + 7);
    doc.text(`Total AIB: ${formatMoney(facture.total_aib)}`, 140, y + 14);
    doc.setFontSize(14); doc.text(`Total TTC: ${formatMoney(facture.total_ttc)}`, 140, y + 25);
    
    doc.save(`Depense_${facture.numero}.pdf`);
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000', color:'white'}}>Chargement...</div>;

  const totals = calculateTotals();
  const resteAPayer_Form = totals.ttc - montantVerse;

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root { --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

        .light {
          --bg-main: #f2f2f7; --bg-glass: rgba(255, 255, 255, 0.7); --bg-card: #ffffff;
          --text-primary: #1d1d1f; --text-secondary: #86868b; --border: rgba(0,0,0,0.08);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
          --danger: #ef4444; --danger-glow: rgba(239, 68, 68, 0.3); --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000; --bg-glass: rgba(28, 28, 30, 0.7); --bg-card: #1c1c1e;
          --text-primary: #f5f5f7; --text-secondary: #a1a1a6; --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6);
          --danger: #ff453a; --danger-glow: rgba(255, 69, 58, 0.4); --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }
        .app-wrapper { min-height: 100vh; position: relative; }

        .sidebar-wrapper { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 50; transition: transform 0.3s ease; }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40; display: none; opacity: 0; transition: opacity 0.3s; }
        main { min-height: 100vh; padding: 40px; margin-left: 260px; position: relative; z-index: 1; transition: margin-left 0.3s ease; }

        .header-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; animation: slideDown 0.8s ease-out; flex-wrap: wrap; gap: 20px; }
        .header-content h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%); -webkit-background-clip: text; color: transparent; }
        .actions { display: flex; gap: 12px; align-items: center; }

        .btn-menu-mobile { display: none; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-size: 24px; padding: 8px 12px; border-radius: 12px; cursor: pointer; }
        .btn-theme { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: var(--transition); box-shadow: var(--shadow); }
        .btn-add { padding: 14px 24px; border-radius: 99px; border: none; background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 8px 20px var(--danger-glow); transition: var(--transition); display: flex; align-items: center; gap: 8px; white-space: nowrap; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px; }
        .stat-card { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); padding: 20px; border-radius: 20px; animation: fadeUp 0.6s ease-out; }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 6px; }
        .stat-value { font-size: 24px; font-weight: 800; color: var(--text-primary); }

        .list-container { display: flex; flex-direction: column; gap: 12px; }
        .list-header { display: grid; grid-template-columns: 1.5fr 1.5fr 2fr 1.5fr 1fr 1fr; gap: 20px; padding: 0 24px; margin-bottom: 4px; color: var(--text-secondary); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .expense-row { display: grid; grid-template-columns: 1.5fr 1.5fr 2fr 1.5fr 1fr 1fr; gap: 20px; align-items: center; background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 18px; padding: 18px 24px; transition: var(--transition); animation: fadeSlide 0.5s ease-out backwards; }
        .expense-row:hover { background: var(--bg-card); border-color: var(--danger); transform: scale(1.01); z-index: 2; box-shadow: 0 5px 20px rgba(0,0,0,0.05); }

        .cell-main { font-weight: 700; color: var(--text-primary); font-size: 14px; }
        .cell-sub { color: var(--text-secondary); font-size: 13px; }
        .cell-amount { font-weight: 800; color: var(--danger); font-size: 16px; text-align: right; }
        .cell-action { text-align: center; }

        .badge-dette { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: bold; }
        .badge-payee { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: bold; }

        .btn-pdf { padding: 6px 14px; border-radius: 10px; border: 1px solid var(--border); background: rgba(255,255,255,0.1); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer; }
        .btn-pay { padding: 6px 14px; border-radius: 10px; border: none; background: #10b981; color: white; font-size: 12px; font-weight: 600; cursor: pointer; margin-right: 5px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .modal-card { width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; background: var(--bg-card); padding: 30px; border-radius: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--border); animation: zoomIn 0.3s ease-out; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .input-field { width: 100%; padding: 14px; border-radius: 14px; border: 1px solid transparent; background: var(--input-bg); color: var(--text-primary); outline: none; transition: 0.3s; }
        
        .line-item { display: grid; grid-template-columns: 2fr 0.5fr 0.8fr 0.6fr 0.6fr 0.6fr auto; gap: 8px; margin-bottom: 10px; align-items: center; }
        
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #ef4444; }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #f59e0b; }

        @media (max-width: 1024px) {
          .sidebar-wrapper { transform: translateX(-100%); } .sidebar-wrapper.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; opacity: 1; }
          main { margin-left: 0; padding: 20px; width: 100%; }
          .btn-menu-mobile { display: block; }
        }

        @media (max-width: 768px) {
          .header-bar { flex-direction: column; align-items: flex-start; gap: 20px; }
          .actions { width: 100%; justify-content: space-between; }
          .btn-add { width: 100%; justify-content: center; }
          .list-header { display: none; }
          .expense-row { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; padding: 20px; position: relative; }
          .cell-main { font-size: 16px; margin-bottom: 4px; }
          .cell-sub { order: -1; font-size: 12px; opacity: 0.7; }
          .cell-amount { align-self: flex-start; font-size: 24px; margin: 8px 0; background: rgba(239, 68, 68, 0.1); padding: 4px 10px; border-radius: 8px; }
          .cell-action { width: 100%; }
          .btn-pdf { width: 100%; padding: 12px; background: var(--input-bg); }
          .form-grid { grid-template-columns: 1fr; }
          .line-item { grid-template-columns: 1fr 1fr; background: var(--input-bg); padding: 10px; border-radius: 12px; }
          .line-item select:first-child { grid-column: span 2; }
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />
      </div>

      <div className="orb orb-1" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}></div>
      <div className="orb orb-2" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}></div>

      <main>
        <div className="header-bar">
          <div style={{display:'flex', alignItems:'center', gap:'15px', width:'100%'}}>
            <button className="btn-menu-mobile" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="header-content">
              <h1>Dépenses & Achats</h1>
              <div style={{color:'var(--text-secondary)'}}>Gestion des fournisseurs et des stocks</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
            <button className="btn-add" onClick={() => setIsModalOpen(true)}>+ Ajouter</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Dépenses</div>
            <div className="stat-value" style={{color: 'var(--danger)'}}>
              {formatMoney(depenses.reduce((acc, curr) => acc + curr.total_ttc, 0))}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Dettes Fournisseurs</div>
            <div className="stat-value" style={{color: '#b91c1c'}}>
               {formatMoney(depenses.reduce((acc, curr) => acc + (curr.total_ttc - (curr.montant_paye || 0)), 0))}
            </div>
          </div>
        </div>

        <div className="list-container">
          <div className="list-header">
            <div>Date</div>
            <div>Fournisseur</div>
            <div style={{textAlign:'right'}}>Total TTC</div>
            <div style={{textAlign:'right'}}>Reste Dû</div>
            <div style={{textAlign:'center'}}>Statut</div>
            <div style={{textAlign:'center'}}>Actions</div>
          </div>

          {depenses.map((d, index) => {
            const reste = d.total_ttc - (d.montant_paye || 0);
            return (
              <div key={d.id} className="expense-row" style={{animationDelay: `${index * 0.05}s`}}>
                <div className="cell-sub">{new Date(d.date_emission).toLocaleDateString('fr-FR')}</div>
                <div className="cell-main">{d.client_nom}</div>
                <div className="cell-amount">{formatMoney(d.total_ttc)}</div>
                <div className="cell-amount" style={{color: reste > 0 ? '#b91c1c' : '#166534'}}>
                  {reste > 0 ? formatMoney(reste) : '-'}
                </div>
                <div style={{textAlign:'center'}}>
                    <span className={reste > 0 ? 'badge-dette' : 'badge-payee'}>{reste > 0 ? 'Dette' : 'Payée'}</span>
                </div>
                <div className="cell-action">
                  {reste > 0 && (
                      <button className="btn-pay" onClick={() => {setSelectedDepense(d); setMontantDette(reste); setIsPayModalOpen(true);}}>
                          <IconMoney/> Payer
                      </button>
                  )}
                  <button className="btn-pdf" onClick={() => generatePDF(d)}>PDF</button>
                </div>
              </div>
            )
          })}

          {depenses.length === 0 && (
            <div style={{textAlign:'center', padding:'40px', color:'var(--text-secondary)', fontStyle:'italic'}}>
              Aucune dépense enregistrée.
            </div>
          )}
        </div>
      </main>

      {/* MODAL AJOUT */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{fontSize:'24px', fontWeight:'800', marginBottom:'24px', color:'var(--text-primary)'}}>Nouvelle Dépense</h2>
            
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
                  <label style={{display:'block', marginBottom:'8px', color:'var(--text-secondary)', fontSize:'12px'}}>Régime Fiscal</label>
                  <select value={typeFiscal} onChange={e => setTypeFiscal(e.target.value)} className="input-field">
                    {TYPES_FISCAUX.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block', marginBottom:'8px', color:'var(--text-secondary)', fontSize:'12px'}}>Date</label>
                  <input type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} required className="input-field" />
                </div>
              </div>

              <div style={{marginBottom:'10px', fontWeight:'600', fontSize:'14px', color:'var(--text-secondary)', display:'flex', justifyContent:'space-between'}}>
                  <span>Détail (Description / Qté / Prix / Taxes)</span>
              </div>
              
              {lignes.map((l, i) => (
                <div key={i} className="line-item">
                  <select value={l.description} onChange={e => handleProductSelect(i, e.target.value)} required className="input-field">
                      <option value="">-- Produit / Service --</option>
                      {produits.map(p => <option key={p.id} value={p.nom}>{p.nom}</option>)}
                  </select>
                  <input type="number" placeholder="Qté" value={l.quantite} onChange={e => updateLigne(i, 'quantite', e.target.value)} className="input-field" />
                  <input type="number" placeholder="Prix" value={l.prix} onChange={e => updateLigne(i, 'prix', e.target.value)} className="input-field" />
                  <input type="number" placeholder="TVA%" value={l.tva_taux} onChange={e => updateLigne(i, 'tva_taux', e.target.value)} disabled={typeFiscal === 'EXONERE'} className="input-field" />
                  <input type="number" placeholder="AIB%" value={l.aib_taux} onChange={e => updateLigne(i, 'aib_taux', e.target.value)} className="input-field" />
                  <div style={{fontSize:'12px', fontWeight:'bold'}}>{formatMoney(l.quantite * l.prix)}</div>
                  {lignes.length > 1 && <button type="button" onClick={() => removeLigne(i)} style={{background:'none', border:'none', cursor:'pointer'}}><IconTrash/></button>}
                </div>
              ))}

              <button type="button" onClick={addLigne} style={{width:'100%', padding:'12px', border:'1px dashed var(--border)', background:'transparent', color:'var(--text-secondary)', borderRadius:'12px', cursor:'pointer', margin:'10px 0'}}>+ Ajouter une ligne</button>

              <div style={{background:'var(--input-bg)', padding:'15px', borderRadius:'12px', marginTop:'20px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'13px'}}>
                      <span>Total HT:</span> <span>{formatMoney(totals.ht)}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'13px'}}>
                      <span>Total TVA:</span> <span>{formatMoney(totals.tva)}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', fontSize:'13px'}}>
                      <span>Total AIB (Retenue):</span> <span>{formatMoney(totals.aib)}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'18px', fontWeight:'900', color:'var(--text-primary)'}}>
                      <span>NET À PAYER (TTC):</span> <span>{formatMoney(totals.ttc)}</span>
                  </div>
                  
                  <div style={{marginTop:'15px', borderTop:'1px dashed var(--border)', paddingTop:'15px'}}>
                      <label style={{display:'block', marginBottom:'5px', color:'var(--danger)', fontWeight:'bold'}}>Montant versé immédiatement :</label>
                      <input type="number" value={montantVerse} onChange={e => setMontantVerse(e.target.value)} className="input-field" style={{borderColor:'var(--danger)', fontWeight:'bold'}} />
                      <div style={{textAlign:'right', marginTop:'5px', fontSize:'12px', color:'var(--text-secondary)'}}>
                          Reste à payer (Dette) : <strong>{formatMoney(resteAPayer_Form > 0 ? resteAPayer_Form : 0)}</strong>
                      </div>
                  </div>
              </div>

              <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{flex:1, padding:'16px', borderRadius:'14px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', fontWeight:'600', cursor:'pointer'}}>Annuler</button>
                <button type="submit" style={{flex:1, padding:'16px', borderRadius:'14px', border:'none', background:'var(--danger)', color:'white', fontWeight:'800', boxShadow:'0 5px 20px var(--danger-glow)', cursor:'pointer'}}>Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT DETTE */}
      {isPayModalOpen && selectedDepense && (
        <div className="modal-overlay" onClick={() => setIsPayModalOpen(false)}>
          <div className="modal-card" style={{maxWidth:'400px'}}>
            <h2 style={{color:'#10b981', marginTop:0}}>Payer Dette Fournisseur</h2>
            <p>Fournisseur : <strong>{selectedDepense.client_nom}</strong></p>
            <p>Reste à payer : <strong style={{color:'#ef4444'}}>{formatMoney(selectedDepense.total_ttc - (selectedDepense.montant_paye||0))}</strong></p>
            <input type="number" value={montantDette} onChange={e => setMontantDette(e.target.value)} autoFocus className="input-field" style={{fontSize:'1.2rem', padding:15, marginBottom:20}} />
            <div style={{display:'flex', gap:'10px', justifyContent:'end'}}>
                <button onClick={() => setIsPayModalOpen(false)} style={{padding:'10px', background:'#f1f5f9', border:'none', borderRadius:5, cursor:'pointer'}}>Annuler</button>
                <button onClick={handlePayerDette} style={{padding:'10px 20px', background:'#10b981', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>Valider Paiement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
