import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

// Animation & Icons
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Printer, X, Trash2, Moon, Sun, 
  Search, FileText, CheckCircle, AlertCircle, ArrowLeft, ArrowRight
} from 'lucide-react';

// --- CONFIG ANIMATIONS ---
const containerVar = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVar = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function Factures() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Data States
  const [entreprise, setEntreprise] = useState(null);
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isCreanceModalOpen, setIsCreanceModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form States
  const [clientId, setClientId] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [typeFiscal, setTypeFiscal] = useState('TVA');
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, prix: 0, tva_taux: 18, aib_taux: 1 }]);
  const [montantVerse, setMontantVerse] = useState(0);

  const [selectedFacture, setSelectedFacture] = useState(null);
  const [montantPaiementUlterieur, setMontantPaiementUlterieur] = useState('');

  const TYPES_FISCAUX = ['TVA', 'TPS', 'EXONERE', 'EXCEPTION', 'RESERVE'];

  // --- THEME ENGINE ---
  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    card: darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    inputBg: darkMode ? 'rgba(15, 23, 42, 0.5)' : '#fff',
    highlight: '#6366f1'
  };

  useEffect(() => { initData(); }, []);

  // --- LOGIQUE METIER (IDENTIQUE) ---
  async function initData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const ste = await getEntrepriseForUser(user.id, user.email);
        if (ste) {
            setEntreprise(ste);
            fetchFactures(ste.id);
            fetchReferentiels(ste.id);
        }
    } catch(e) { console.error(e); } 
    finally { setLoading(false); }
  }

  async function fetchFactures(entrepriseId) {
    const { data } = await supabase.from('factures').select('*').eq('entreprise_id', entrepriseId).eq('type_facture', 'VENTE').order('created_at', { ascending: false });
    setFactures(data || []);
  }

  async function fetchReferentiels(entrepriseId) {
    const { data: tiers } = await supabase.from('tiers').select('id, nom_complet').eq('entreprise_id', entrepriseId).eq('type_tier', 'CLIENT');
    setClients(tiers || []);
    const { data: prods } = await supabase.from('produits').select('*').eq('entreprise_id', entrepriseId);
    setProduits(prods || []);
  }

  const addLigne = () => setLignes([...lignes, { description: '', quantite: 1, prix: 0, tva_taux: 18, aib_taux: 1 }]);
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));
  const updateLigne = (i, field, value) => { const n = [...lignes]; n[i][field] = value; setLignes(n); };
  
  const handleProductSelect = (i, nom) => {
      const p = produits.find(x => x.nom === nom);
      const n = [...lignes]; n[i].description = nom;
      if (p) { n[i].prix = p.prix_vente; }
      setLignes(n);
  };

  const calculateTotals = () => {
      let totalHT = 0, totalTVA = 0, totalAIB = 0;
      lignes.forEach(l => {
          const ligneHT = l.quantite * l.prix;
          let tauxTVA = typeFiscal === 'EXONERE' ? 0 : (l.tva_taux || 0);
          totalHT += ligneHT;
          totalTVA += ligneHT * (tauxTVA / 100);
          totalAIB += ligneHT * ((l.aib_taux || 0) / 100);
      });
      return { ht: totalHT, tva: totalTVA, aib: totalAIB, ttc: totalHT + totalTVA + totalAIB };
  };

  async function handleSave(e) {
    e.preventDefault();
    if (!clientId) return alert("Veuillez sélectionner un client.");
    try {
      setLoading(true);
      const totals = calculateTotals();
      const paye = Number(montantVerse);
      let statut = paye >= totals.ttc ? 'PAYEE' : (paye > 0 ? 'PARTIELLE' : 'IMPAYEE');
      const numeroFacture = `FAC-${Date.now().toString().slice(-6)}`;

      const { data: facture, error: errFact } = await supabase.from('factures').insert([{
          entreprise_id: entreprise.id, tier_id: clientId, client_nom: clientNom, numero: numeroFacture, date_emission: dateEmission, 
          type_facture: 'VENTE', type_fiscal: typeFiscal, total_ht: totals.ht, total_tva: totals.tva, total_aib: totals.aib, 
          total_ttc: totals.ttc, montant_paye: paye, statut: statut
      }]).select().single();
      if (errFact) throw errFact;

      const lignesToInsert = lignes.map(l => ({
            facture_id: facture.id, description: l.description, quantite: l.quantite, prix_unitaire: l.prix,
            tva_taux: typeFiscal === 'EXONERE' ? 0 : l.tva_taux, aib_taux: l.aib_taux
      }));
      await supabase.from('lignes_facture').insert(lignesToInsert);
      
      // Stock update
      for (const l of lignes) {
        const productRef = produits.find(p => p.nom === l.description);
        if (productRef) {
            await supabase.from('produits').update({ stock_actuel: (productRef.stock_actuel || 0) - l.quantite }).eq('id', productRef.id);
        }
      }

      await createEcritureVente(totals, numeroFacture, clientNom);
      if (paye > 0) await createEcritureReglement(paye, `Règlement Immédiat ${numeroFacture}`, '411');

      alert("Facture enregistrée !");
      setIsModalOpen(false); resetForm(); fetchFactures(entreprise.id);
    } catch (error) { alert("Erreur : " + error.message); } 
    finally { setLoading(false); }
  }

  const createEcritureVente = async (totals, numero, client) => {
      const { data: plan } = await supabase.from('plan_comptable').select('id, code_compte').eq('entreprise_id', entreprise.id);
      const idClient = plan.find(c => c.code_compte.startsWith('411'))?.id;
      const idVente = plan.find(c => c.code_compte.startsWith('701'))?.id;
      const idTva = plan.find(c => c.code_compte.startsWith('443'))?.id;
      const idAib = plan.find(c => c.code_compte.startsWith('442'))?.id;

      if (idClient && idVente) {
          const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
              entreprise_id: entreprise.id, date_ecriture: new Date(), libelle: `Facture N° ${numero} - ${client}`, journal_code: 'VT' 
          }]).select().single();
          const lines = [
             { ecriture_id: ecriture.id, compte_id: idClient, debit: totals.ttc, credit: 0 },
             { ecriture_id: ecriture.id, compte_id: idVente, debit: 0, credit: totals.ht }
          ];
          if (totals.tva > 0 && idTva) lines.push({ ecriture_id: ecriture.id, compte_id: idTva, debit: 0, credit: totals.tva });
          if (totals.aib > 0 && idAib) lines.push({ ecriture_id: ecriture.id, compte_id: idAib, debit: 0, credit: totals.aib });
          await supabase.from('lignes_ecriture').insert(lines);
      }
  };

  const createEcritureReglement = async (montant, libelle, compteTiersCode) => {
      const { data: plan } = await supabase.from('plan_comptable').select('id, code_compte').eq('entreprise_id', entreprise.id);
      const idBanque = plan.find(c => c.code_compte.startsWith('521'))?.id;
      const idTiers = plan.find(c => c.code_compte.startsWith(compteTiersCode))?.id;
      if (idBanque && idTiers) {
          const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
              entreprise_id: entreprise.id, date_ecriture: new Date(), libelle: libelle, journal_code: 'BQ'
          }]).select().single();
          await supabase.from('lignes_ecriture').insert([
              { ecriture_id: ecriture.id, compte_id: idBanque, debit: montant, credit: 0 },
              { ecriture_id: ecriture.id, compte_id: idTiers, debit: 0, credit: montant }
          ]);
      }
  };

  const handlePaiementUlterieur = async () => {
      const montant = Number(montantPaiementUlterieur);
      if (montant <= 0) return;
      try {
          const newPaye = (selectedFacture.montant_paye || 0) + montant;
          const newStatut = newPaye >= selectedFacture.total_ttc ? 'PAYEE' : 'PARTIELLE';
          await supabase.from('factures').update({ montant_paye: newPaye, statut: newStatut }).eq('id', selectedFacture.id);
          await createEcritureReglement(montant, `Règlement ${selectedFacture.numero}`, '411');
          alert("Paiement enregistré !"); setIsPayModalOpen(false); fetchFactures(entreprise.id);
      } catch (err) { alert(err.message); }
  };

  const resetForm = () => {
      setClientId(''); setClientNom(''); setMontantVerse(0); setTypeFiscal('TVA');
      setLignes([{ description: '', quantite: 1, prix: 0, tva_taux: 18, aib_taux: 1 }]);
  };

  const generatePDF = (f) => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text(`FACTURE ${f.numero}`, 14, 20);
    doc.setFontSize(12); doc.text(`Client: ${f.client_nom}`, 14, 30);
    autoTable(doc, { startY: 45, head: [['Description', 'Prix Unitaire', 'Qté', 'Total HT']], body: [['Article(s)', `${(f.total_ht || 0).toLocaleString()}`, '1', `${(f.total_ht || 0).toLocaleString()}`]] });
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total TTC: ${f.total_ttc.toLocaleString()} F`, 140, finalY + 10);
    doc.save(`Facture_${f.numero}.pdf`);
  };

  const filteredFactures = factures.filter(f => 
    f.client_nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.numero?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const facturesNonPayees = factures.filter(f => (f.total_ttc - (f.montant_paye || 0)) > 5);
  const totalCreancesGlobal = facturesNonPayees.reduce((acc, f) => acc + (f.total_ttc - (f.montant_paye || 0)), 0);

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background: theme.bg, color: theme.text}}>Chargement...</div>;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: 'Inter, sans-serif', overflowX:'hidden', transition: 'background 0.5s ease' }}>
        
        {/* --- STYLES CSS RESPONSIVE --- */}
        <style>{`
          /* Layout Général */
          .responsive-main {
            flex: 1;
            padding: clamp(15px, 4vw, 40px);
            margin-left: 260px;
            transition: margin 0.3s ease, padding 0.3s ease;
          }

          /* Grille du tableau des factures */
          .facture-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1fr 80px;
            align-items: center;
            gap: 10px;
          }
          
          .mobile-label { display: none; }
          .header-controls { display: flex; gap: 15px; align-items: center; }
          .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }

          /* RESPONSIVE BREAKPOINTS */
          @media (max-width: 1024px) {
            .responsive-main { margin-left: 0; }
            /* Note: La Sidebar doit être gérée (hamburger menu) ou elle se superposera */
          }

          @media (max-width: 768px) {
            /* Header en colonne */
            .page-header { flex-direction: column; align-items: flex-start; gap: 20px; }
            .header-controls { width: 100%; justify-content: space-between; flex-wrap: wrap; }
            
            /* Cacher l'entête du tableau */
            .table-header { display: none !important; }

            /* Transformer les lignes en Cartes */
            .facture-card {
              display: flex !important;
              flex-direction: column;
              align-items: flex-start !important;
              gap: 12px !important;
              padding: 20px !important;
            }
            
            /* Les cellules prennent toute la largeur en flex */
            .facture-card > div {
              width: 100%;
              display: flex;
              justify-content: space-between;
              align-items: center;
              text-align: left !important;
            }

            .mobile-label { 
              display: inline-block; 
              font-weight: 600; 
              color: ${theme.textMuted};
              font-size: 0.85rem;
            }
          }
        `}</style>

        {/* Background Ambient Orbs */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <motion.div animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 20, repeat: Infinity }}
                style={{ position:'absolute', top:'-10%', right:'-10%', width:'500px', height:'500px', borderRadius:'50%', background: darkMode ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }} />
            <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 15, repeat: Infinity }}
                style={{ position:'absolute', bottom:'0%', left:'0%', width:'400px', height:'400px', borderRadius:'50%', background: darkMode ? 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }} />
        </div>

        <div style={{ display: 'flex', position: 'relative', zIndex: 10 }}>
            {/* Sidebar : Note, sur mobile elle sera cachée derrière ou devra être toggleable */}
            <div className="sidebar-wrapper">
                 <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} darkMode={darkMode} />
            </div>
            
            <main className="responsive-main">
                
                {/* HEADER */}
                <header className="page-header">
                    <div>
                         <motion.button 
                            onClick={() => navigate('/dashboard')}
                            whileHover={{ x: -5 }}
                            style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color: theme.textMuted, fontSize:'0.9rem', marginBottom: 5 }}
                        >
                            <ArrowLeft size={16}/> Retour Dashboard
                        </motion.button>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Facturation
                        </h1>
                        <p style={{ color: theme.textMuted, marginTop: 5 }}>Gérez les ventes et les encaissements</p>
                    </div>

                    <div className="header-controls">
                        <GlassButton onClick={() => setDarkMode(!darkMode)} theme={theme} icon>
                            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                        </GlassButton>
                        <GlassButton onClick={() => setIsCreanceModalOpen(true)} theme={theme} accentColor="#ef4444">
                            <AlertCircle size={18}/> 
                            <span style={{whiteSpace: 'nowrap'}}>{totalCreancesGlobal > 0 ? `${totalCreancesGlobal.toLocaleString()} F Dûs` : 'Impayés'}</span>
                        </GlassButton>
                        <PrimaryButton onClick={() => {resetForm(); setIsModalOpen(true);}}>
                            <Plus size={20} strokeWidth={3}/> <span style={{whiteSpace: 'nowrap'}}>Créer</span>
                        </PrimaryButton>
                    </div>
                </header>

                {/* SEARCH BAR */}
                <div style={{ marginBottom: 30, position:'relative', maxWidth: 400 }}>
                    <Search size={18} style={{ position:'absolute', left: 15, top: '50%', transform:'translateY(-50%)', color: theme.textMuted }} />
                    <input 
                        type="text" 
                        placeholder="Rechercher client, n° facture..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, outline:'none', backdropFilter: 'blur(10px)' }}
                    />
                </div>

                {/* LISTE DES FACTURES */}
                <motion.div variants={containerVar} initial="hidden" animate="show" style={{ display: 'grid', gap: 15 }}>
                    
                    {/* Table Header (Desktop only) */}
                    <div className="table-header facture-grid" style={{ padding: '0 20px', color: theme.textMuted, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        <div>Client / Date</div>
                        <div>Numéro</div>
                        <div style={{textAlign:'right'}}>Montant TTC</div>
                        <div style={{textAlign:'center'}}>Reste Dû</div>
                        <div style={{textAlign:'center'}}>Statut</div>
                        <div style={{textAlign:'center'}}>Type</div>
                        <div style={{textAlign:'right'}}>Actions</div>
                    </div>

                    {filteredFactures.map((f) => {
                        const reste = f.total_ttc - (f.montant_paye || 0);
                        return (
                            <motion.div 
                                key={f.id} variants={itemVar} whileHover={{ scale: 1.01, x: 5 }}
                                className="facture-grid facture-card"
                                style={{ 
                                    background: theme.card, padding: '15px 20px', borderRadius: 16, 
                                    border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <div>
                                    <span className="mobile-label">Client</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{f.client_nom}</div>
                                        <div style={{ fontSize: '0.8rem', color: theme.textMuted }}>{new Date(f.date_emission).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div>
                                    <span className="mobile-label">N° Facture</span>
                                    <div style={{ fontFamily: 'monospace', color: theme.textMuted }}>{f.numero}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="mobile-label">Total TTC</span>
                                    <div style={{ fontWeight: 700 }}>{f.total_ttc.toLocaleString()} <span style={{fontSize:'0.7em', opacity:0.7}}>F</span></div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span className="mobile-label">Reste à payer</span>
                                    <div style={{ fontWeight: 700, color: reste > 10 ? '#ef4444' : '#10b981' }}>
                                        {reste > 10 ? reste.toLocaleString() : <CheckCircle size={16}/>}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span className="mobile-label">Statut</span>
                                    <Badge statut={f.statut} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span className="mobile-label">Régime</span>
                                    <span style={{ fontSize: '0.7rem', border: `1px solid ${theme.border}`, padding: '2px 8px', borderRadius: 10, color: theme.textMuted }}>{f.type_fiscal}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <span className="mobile-label"></span>
                                    <div style={{display:'flex', gap:8}}>
                                        {reste > 10 && (
                                            <button onClick={() => {setSelectedFacture(f); setMontantPaiementUlterieur(reste); setIsPayModalOpen(true)}} 
                                                    title="Encaisser"
                                                    style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display:'flex' }}>
                                                <span style={{fontSize:'1.2em'}}>💰</span>
                                            </button>
                                        )}
                                        <button onClick={() => generatePDF(f)} style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 6, cursor: 'pointer', display:'flex' }}>
                                            <Printer size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}

                    {filteredFactures.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>
                            <FileText size={40} style={{ opacity: 0.2, marginBottom: 10 }} />
                            <p>Aucune facture trouvée.</p>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>

        {/* --- MODAL CRÉATION FACTURE --- */}
        <AnimatePresence>
        {isModalOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 10 }}>
                <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
                    style={{ background: theme.bg, width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, padding: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #3b82f6, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nouvelle Facture</h2>
                        <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted }}><X /></button>
                    </div>

                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
                            <FormGroup label="Client" theme={theme}>
                                <select onChange={e => {setClientId(e.target.value); setClientNom(e.target.options[e.target.selectedIndex].text)}} required style={inputStyle(theme)}>
                                    <option value="">-- Sélectionner --</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
                                </select>
                            </FormGroup>
                            <FormGroup label="Date d'émission" theme={theme}>
                                <input type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} style={inputStyle(theme)} required />
                            </FormGroup>
                            <FormGroup label="Régime Fiscal" theme={theme}>
                                <select value={typeFiscal} onChange={e => setTypeFiscal(e.target.value)} style={inputStyle(theme)}>
                                    {TYPES_FISCAUX.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </FormGroup>
                        </div>

                        {/* Lignes de facture - Scrollable horizontalement sur mobile */}
                        <div style={{ background: theme.card, borderRadius: 16, padding: 20, border: `1px solid ${theme.border}`, marginBottom: 20, overflowX: 'auto' }}>
                            <div style={{ minWidth: '600px' }}> {/* Force width for mobile scroll */}
                                <div style={{ display: 'grid', gridTemplateColumns: '3fr 0.8fr 1fr 0.8fr 0.8fr 1fr auto', gap: 10, marginBottom: 10, fontSize: '0.75rem', color: theme.textMuted, fontWeight: 700, paddingLeft: 10 }}>
                                    <div>PRODUIT</div><div>QTÉ</div><div>PRIX U.</div><div>TVA</div><div>AIB</div><div style={{textAlign:'right'}}>TOTAL</div><div></div>
                                </div>
                                {lignes.map((l, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 0.8fr 1fr 0.8fr 0.8fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                                        <select value={l.description} onChange={e => handleProductSelect(idx, e.target.value)} style={inputStyle(theme)} required>
                                            <option value="">-- Choisir --</option>
                                            {produits.map((p, i) => <option key={i} value={p.nom}>{p.nom}</option>)}
                                        </select>
                                        <input type="number" min="1" value={l.quantite} onChange={e => updateLigne(idx, 'quantite', Number(e.target.value))} style={inputStyle(theme)} />
                                        <input type="number" value={l.prix} onChange={e => updateLigne(idx, 'prix', Number(e.target.value))} style={inputStyle(theme)} />
                                        <input type="number" value={l.tva_taux} onChange={e => updateLigne(idx, 'tva_taux', Number(e.target.value))} style={inputStyle(theme)} disabled={typeFiscal === 'EXONERE'} />
                                        <input type="number" value={l.aib_taux} onChange={e => updateLigne(idx, 'aib_taux', Number(e.target.value))} style={inputStyle(theme)} />
                                        <div style={{ textAlign: 'right', fontWeight: 600 }}>{(l.quantite * l.prix).toLocaleString()}</div>
                                        <button type="button" onClick={() => removeLigne(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addLigne} style={{ marginTop: 10, color: '#3b82f6', background: 'none', border: '1px dashed #3b82f6', borderRadius: 8, padding: '8px 15px', cursor: 'pointer', fontSize: '0.9rem', width: '100%' }}>+ Ajouter un produit</button>
                        </div>

                        {/* Totaux & Paiement */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                             {(() => {
                                const t = calculateTotals();
                                const reste = t.ttc - montantVerse;
                                return (
                                    <>
                                        <div style={{ display: 'flex', gap: 20, color: theme.textMuted, fontSize: '0.9rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            <span>HT: {t.ht.toLocaleString()}</span>
                                            <span>TVA: {t.tva.toLocaleString()}</span>
                                            <span>AIB: {t.aib.toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{t.ttc.toLocaleString()} <span style={{fontSize:'1rem'}}>F CFA</span></div>
                                        
                                        <div style={{ background: '#f0fdf4', padding: 15, borderRadius: 12, border: '1px solid #bbf7d0', minWidth: '100%', maxWidth: '300px' }}>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#166534', fontWeight: 600, marginBottom: 5 }}>Versement immédiat</label>
                                            <input type="number" value={montantVerse} onChange={e => setMontantVerse(Number(e.target.value))} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 700, color: '#15803d', outline: 'none', borderBottom: '1px solid #166534' }} />
                                            {reste > 0 && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 5, textAlign: 'right' }}>Reste à devoir : <strong>{reste.toLocaleString()} F</strong></div>}
                                        </div>
                                    </>
                                )
                             })()}
                        </div>

                        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 15 }}>
                            <GlassButton onClick={() => setIsModalOpen(false)} theme={theme}>Annuler</GlassButton>
                            <PrimaryButton type="submit">Valider</PrimaryButton>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
        </AnimatePresence>

        {/* --- MODAL SUIVI CRÉANCES --- */}
        <AnimatePresence>
        {isCreanceModalOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 10 }}>
                <motion.div 
                     initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                     style={{ background: theme.bg, padding: 30, borderRadius: 24, width: '100%', maxWidth: '600px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0, color: '#ef4444', display:'flex', alignItems:'center', gap: 10 }}><AlertCircle/> Impayés</h2>
                        <button onClick={() => setIsCreanceModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted }}><X /></button>
                    </div>
                    
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: 20, borderRadius: 16, textAlign: 'center', marginBottom: 20, fontSize: '1.2rem', fontWeight: 700 }}>
                        Total Dehors : {totalCreancesGlobal.toLocaleString()} F
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {facturesNonPayees.length === 0 ? <p style={{textAlign:'center', color:'#10b981'}}>Tout est payé ! 🎉</p> : (
                            facturesNonPayees.map(f => (
                                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${theme.border}` }}>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{f.client_nom}</div>
                                        <div style={{ fontSize: '0.8rem', color: theme.textMuted }}>Facture {f.numero}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#ef4444', fontWeight: 700 }}>{(f.total_ttc - (f.montant_paye||0)).toLocaleString()} F</div>
                                        <button 
                                            onClick={() => {setIsCreanceModalOpen(false); setSelectedFacture(f); setMontantPaiementUlterieur(f.total_ttc - (f.montant_paye||0)); setIsPayModalOpen(true);}}
                                            style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}
                                        >
                                            Encaisser <ArrowRight size={12}/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        )}
        </AnimatePresence>

        {/* --- MODAL PAIEMENT --- */}
        {isPayModalOpen && selectedFacture && (
             <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110, padding: 10 }}>
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    style={{ background: theme.bg, padding: 30, borderRadius: 24, width: '100%', maxWidth: '400px', border: `1px solid ${theme.border}` }}
                >
                    <h3 style={{ marginTop: 0, color: '#10b981' }}>Encaisser un règlement</h3>
                    <p style={{ margin: '10px 0', color: theme.textMuted }}>Pour : <strong>{selectedFacture.client_nom}</strong></p>
                    <input type="number" autoFocus value={montantPaiementUlterieur} onChange={e => setMontantPaiementUlterieur(e.target.value)} style={{ ...inputStyle(theme), fontSize: '1.5rem', textAlign: 'center', color: '#10b981', fontWeight: 800 }} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <GlassButton onClick={() => setIsPayModalOpen(false)} theme={theme} style={{ flex: 1 }}>Annuler</GlassButton>
                        <PrimaryButton onClick={handlePaiementUlterieur} style={{ flex: 1, background: '#10b981', justifyContent:'center' }}>Valider</PrimaryButton>
                    </div>
                </motion.div>
             </div>
        )}

    </div>
  );
}

// --- SUB COMPONENTS UI (DESIGN SYSTEM) ---

function PrimaryButton({ children, onClick, style, type="button" }) {
    return (
        <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            type={type} onClick={onClick}
            style={{ 
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', 
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
                ...style 
            }}
        >
            {children}
        </motion.button>
    )
}

function GlassButton({ children, onClick, theme, icon, accentColor, style }) {
    return (
        <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: accentColor ? `${accentColor}20` : theme.border }} 
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={{ 
                background: theme.card, border: `1px solid ${accentColor || theme.border}`, 
                color: accentColor || theme.text, padding: icon ? '10px' : '10px 20px', borderRadius: '14px', 
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                backdropFilter: 'blur(10px)', ...style
            }}
        >
            {children}
        </motion.button>
    )
}

function Badge({ statut }) {
    const styles = {
        'PAYEE': { bg: '#dcfce7', color: '#166534', label: 'Payée' },
        'PARTIELLE': { bg: '#ffedd5', color: '#9a3412', label: 'Partielle' },
        'IMPAYEE': { bg: '#fee2e2', color: '#991b1b', label: 'Impayée' }
    };
    const s = styles[statut] || styles['IMPAYEE'];
    return (
        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {s.label}
        </span>
    )
}

function FormGroup({ label, children, theme }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: theme.textMuted, marginLeft: 5 }}>{label}</label>
            {children}
        </div>
    )
}

const inputStyle = (theme) => ({
    width: '100%', padding: '12px 16px', borderRadius: '12px', 
    border: `1px solid ${theme.border}`, background: theme.inputBg, 
    color: theme.text, outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem'
});
