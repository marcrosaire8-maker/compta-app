import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Animations & Icons
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Printer, FileCheck, CheckCircle, Clock, 
  DollarSign, TrendingDown, TrendingUp, Sun, Moon, X, User 
} from 'lucide-react';

// --- CONFIG ANIMATION ---
const containerVar = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVar = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function Paie() {
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Data State
  const [entreprise, setEntreprise] = useState(null);
  const [bulletins, setBulletins] = useState([]);
  const [employes, setEmployes] = useState([]);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    employe_id: '',
    mois: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    date_paie: new Date().toISOString().split('T')[0],
    salaire_base: 0,
    primes: 0,
    cotisations: 0,
    impots: 0,
    avance_opposition: 0
  });

  // --- THEME ENGINE ---
  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    card: darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    inputBg: darkMode ? 'rgba(15, 23, 42, 0.5)' : '#fff',
    accent: '#3b82f6',
    success: '#10b981',
    danger: '#ef4444'
  };

  useEffect(() => { initData(); }, []);

  // --- LOGIQUE METIER (IDENTIQUE) ---
  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchBulletins(ste.id);
      fetchEmployes(ste.id);
    }
    setLoading(false);
  }

  async function fetchBulletins(id) {
    const { data } = await supabase.from('fiches_paie').select('*').eq('entreprise_id', id).order('created_at', { ascending: false });
    setBulletins(data || []);
  }

  async function fetchEmployes(id) {
    const { data } = await supabase.from('tiers').select('id, nom_complet').eq('entreprise_id', id).eq('type_tier', 'EMPLOYE');
    setEmployes(data || []);
  }

  // Calcul Automatique
  useEffect(() => {
    const brut = Number(form.salaire_base) + Number(form.primes);
    const cnss = Math.round(brut * 0.036); 
    const baseImposable = brut - cnss;
    let its = 0;
    if (baseImposable > 50000) {
        its = Math.round((baseImposable - 50000) * 0.10);
    }
    if (brut > 0) {
        setForm(prev => ({ ...prev, cotisations: cnss, impots: its }));
    }
  }, [form.salaire_base, form.primes]);

  const brut = Number(form.salaire_base) + Number(form.primes);
  const totalRetenues = Number(form.cotisations) + Number(form.impots) + Number(form.avance_opposition);
  const netAPayer = brut - totalRetenues;

  async function handleSave(e) {
    e.preventDefault();
    if (!form.employe_id) return alert("Veuillez sélectionner un employé.");
    try {
      const employeChoisi = employes.find(e => e.id === form.employe_id);
      const payload = {
        entreprise_id: entreprise.id, employe_id: form.employe_id, employe_nom: employeChoisi ? employeChoisi.nom_complet : 'Inconnu',
        mois: form.mois, date_paie: form.date_paie, salaire_base: Number(form.salaire_base), primes: Number(form.primes),
        cotisations_sociales: Number(form.cotisations), impots_revenu: Number(form.impots), avance_opposition: Number(form.avance_opposition),
        salaire_net: netAPayer
      };
      const { error } = await supabase.from('fiches_paie').insert([payload]);
      if (error) throw error;
      alert("Bulletin créé avec succès !"); setIsModalOpen(false); fetchBulletins(entreprise.id);
    } catch (error) { alert("Erreur : " + error.message); }
  }

  const generatePDF = (b) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("BULLETIN DE PAIE", 105, 20, null, null, "center");
    doc.setFontSize(10); doc.text(`Employeur : ${entreprise.nom}`, 14, 35); doc.text(`Employé : ${b.employe_nom}`, 140, 35); doc.text(`Période : ${b.mois}`, 14, 45);
    autoTable(doc, { startY: 55, head: [['Rubrique', 'Gains (+)', 'Retenues (-)']], body: [
        ['Salaire de Base', b.salaire_base.toLocaleString(), ''], ['Primes & Indemnités', b.primes.toLocaleString(), ''], ['Salaire BRUT', b.salaire_brut.toLocaleString(), ''],
        ['CNSS (Part Salariale)', '', b.cotisations_sociales.toLocaleString()], ['Impôts (ITS/IRPP)', '', b.impots_revenu.toLocaleString()], ['Avances / Oppositions', '', (b.avance_opposition || 0).toLocaleString()],
    ], theme: 'grid' });
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(`NET À PAYER : ${b.salaire_net.toLocaleString()} FCFA`, 140, doc.lastAutoTable.finalY + 15);
    doc.save(`Paie_${b.employe_nom}.pdf`);
  };

  const comptabiliser = async (b) => {
      if(!confirm("Générer l'écriture comptable ?")) return;
      try {
          const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
              entreprise_id: entreprise.id, date_ecriture: b.date_paie, libelle: `Paie ${b.mois} - ${b.employe_nom}`, journal_code: 'OD'
          }]).select().single();
          
          const getCompteID = async (code) => {
             const { data } = await supabase.from('plan_comptable').select('id').eq('entreprise_id', entreprise.id).ilike('code_compte', `${code}%`).maybeSingle();
             return data ? data.id : null;
          }

          const lignes = [
              { ecriture_id: ecriture.id, debit: b.salaire_brut, credit: 0, compte_id: await getCompteID('661') },
              { ecriture_id: ecriture.id, debit: 0, credit: b.salaire_net, compte_id: await getCompteID('422') },
              { ecriture_id: ecriture.id, debit: 0, credit: b.cotisations_sociales, compte_id: await getCompteID('431') },
              { ecriture_id: ecriture.id, debit: 0, credit: b.impots_revenu, compte_id: await getCompteID('447') },
          ];
          if (b.avance_opposition > 0) lignes.push({ ecriture_id: ecriture.id, debit: 0, credit: b.avance_opposition, compte_id: await getCompteID('421') });

          await supabase.from('lignes_ecriture').insert(lignes.filter(l => l.compte_id));
          await supabase.from('fiches_paie').update({ est_comptabilise: true }).eq('id', b.id);
          fetchBulletins(entreprise.id); alert("Écritures générées avec succès !");
      } catch (e) { alert("Erreur: " + e.message); }
  };

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background: theme.bg, color: theme.text}}>Chargement Paie...</div>;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: 'Inter, sans-serif', overflowX:'hidden', transition: 'background 0.5s ease' }}>
        
        {/* --- STYLE CSS RESPONSIVE --- */}
        <style>{`
          /* Layout Principal */
          .responsive-main {
            flex: 1;
            padding: clamp(15px, 4vw, 40px);
            margin-left: 260px;
            transition: margin 0.3s ease;
          }

          /* Grille du tableau (Desktop) */
          .bulletin-grid {
            display: grid;
            grid-template-columns: 1fr 1.5fr 1fr 1fr 1.2fr 1fr 120px;
            align-items: center;
            gap: 10px;
          }

          /* Grille du formulaire modal (Gains/Retenues) */
          .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }

          .mobile-label { display: none; }
          .page-header { display: flex; justify-content: space-between; alignItems: center; marginBottom: 35px; flex-wrap: wrap; gap: 20px; }
          .header-controls { display: flex; gap: 12px; }

          /* RESPONSIVE MEDIA QUERIES */
          @media (max-width: 1024px) {
            .responsive-main { margin-left: 0; }
          }

          @media (max-width: 768px) {
            .page-header { flex-direction: column; align-items: flex-start; }
            .header-controls { width: 100%; justify-content: space-between; }

            /* Table -> Cards */
            .table-header { display: none !important; }
            
            .bulletin-card {
                display: flex !important;
                flex-direction: column;
                gap: 12px !important;
                padding: 20px !important;
            }

            .bulletin-card > div {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                text-align: left !important;
                border-bottom: 1px dashed ${theme.border};
                padding-bottom: 8px;
            }
            .bulletin-card > div:last-child { border-bottom: none; }

            .mobile-label { 
                display: inline-block; 
                font-weight: 600; 
                color: ${theme.textMuted};
                font-size: 0.85rem;
            }

            /* Modal Input Stacking */
            .form-grid-2, .form-grid-3 { grid-template-columns: 1fr !important; gap: 15px; }
          }
        `}</style>

        {/* PARALLAX ORBS */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <motion.div animate={{ x: [0, 60, 0], y: [0, -40, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ position:'absolute', top:'-15%', right:'-5%', width:'600px', height:'600px', borderRadius:'50%', background: darkMode ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }} />
            <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ position:'absolute', bottom:'-10%', left:'-10%', width:'500px', height:'500px', borderRadius:'50%', background: darkMode ? 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }} />
        </div>

        <div style={{ display: 'flex', position: 'relative', zIndex: 10 }}>
            <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} darkMode={darkMode} />
            
            <main className="responsive-main">
                
                {/* HEADER */}
                <header className="page-header">
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Gestion Paie
                        </h1>
                        <p style={{ color: theme.textMuted, marginTop: 5, fontSize: '1.05rem' }}>Centralisez les bulletins et les déclarations.</p>
                    </div>
                    <div className="header-controls">
                        <GlassButton onClick={() => setDarkMode(!darkMode)} theme={theme} icon>
                            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                        </GlassButton>
                        <PrimaryButton onClick={() => { setIsModalOpen(true); }}>
                            <Plus size={20} strokeWidth={3}/> <span>Nouveau</span>
                        </PrimaryButton>
                    </div>
                </header>

                {/* LISTE DES BULLETINS */}
                <motion.div variants={containerVar} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    
                    {/* Header Row (Desktop Only) */}
                    <div className="bulletin-grid table-header" style={{ padding: '0 20px', color: theme.textMuted, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <div>Période</div>
                        <div>Employé</div>
                        <div style={{textAlign:'right'}}>Brut</div>
                        <div style={{textAlign:'right'}}>Retenues</div>
                        <div style={{textAlign:'right'}}>Net à Payer</div>
                        <div style={{textAlign:'center'}}>Statut</div>
                        <div style={{textAlign:'right'}}>Actions</div>
                    </div>

                    {bulletins.map(b => {
                        const retenues = b.cotisations_sociales + b.impots_revenu + (b.avance_opposition || 0);
                        return (
                            <motion.div 
                                key={b.id} variants={itemVar} whileHover={{ scale: 1.005, x: 5 }}
                                className="bulletin-grid bulletin-card"
                                style={{ 
                                    background: theme.card, padding: '20px', borderRadius: 16, 
                                    border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <div>
                                    <span className="mobile-label">Période</span>
                                    <div style={{ display:'flex', alignItems:'center', gap: 8, fontWeight: 600 }}>
                                        <Clock size={16} color={theme.textMuted}/> {b.mois}
                                    </div>
                                </div>
                                
                                <div>
                                    <span className="mobile-label">Employé</span>
                                    <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                                        <div style={{ width: 35, height: 35, borderRadius: '50%', background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', display:'flex', alignItems:'center', justifyContent:'center', color: '#64748b' }}>
                                            <User size={18}/>
                                        </div>
                                        <span style={{ fontWeight: 700 }}>{b.employe_nom}</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', color: theme.textMuted }}>
                                    <span className="mobile-label">Brut</span>
                                    {b.salaire_brut.toLocaleString()}
                                </div>

                                <div style={{ textAlign: 'right', color: theme.danger, fontWeight: 500 }}>
                                    <span className="mobile-label">Retenues</span>
                                    - {retenues.toLocaleString()}
                                </div>

                                <div style={{ textAlign: 'right', color: theme.success, fontWeight: 800, fontSize: '1.1rem' }}>
                                    <span className="mobile-label">Net à Payer</span>
                                    {b.salaire_net.toLocaleString()} F
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <span className="mobile-label">Statut</span>
                                    {b.est_comptabilise ? (
                                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: theme.success, padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <CheckCircle size={12}/> Validé
                                        </span>
                                    ) : (
                                        <span style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={12}/> Attente
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <span className="mobile-label"></span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => generatePDF(b)} title="Imprimer" style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', color: theme.textMuted, cursor: 'pointer', transition: 'background 0.2s' }}>
                                            <Printer size={18}/>
                                        </button>
                                        {!b.est_comptabilise && (
                                            <button onClick={() => comptabiliser(b)} title="Comptabiliser" style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', color: theme.accent, cursor: 'pointer', transition: 'background 0.2s' }}>
                                                <FileCheck size={18}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}

                    {bulletins.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>
                            <DollarSign size={50} style={{ opacity: 0.2, marginBottom: 15 }} />
                            <p>Aucun bulletin de paie généré pour le moment.</p>
                        </div>
                    )}
                </motion.div>

            </main>
        </div>

        {/* --- MODAL CREATION --- */}
        <AnimatePresence>
        {isModalOpen && (
             <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 10 }}>
                <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
                    style={{ background: theme.bg, width: '100%', maxWidth: '600px', borderRadius: 24, padding: 35, border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #3b82f6, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Nouveau Bulletin
                            </h2>
                            <p style={{ margin: '5px 0 0 0', color: theme.textMuted, fontSize: '0.9rem' }}>Les calculs fiscaux sont automatiques.</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted }}><X /></button>
                    </div>

                    <form onSubmit={handleSave}>
                        {/* 1. INFO GÉNÉRALES */}
                        <div className="form-grid-2" style={{ marginBottom: 25 }}>
                            <FormGroup label="Employé" theme={theme}>
                                <select value={form.employe_id} onChange={e => setForm({...form, employe_id: e.target.value})} style={inputStyle(theme)} required>
                                    <option value="">-- Sélectionner --</option>
                                    {employes.map(em => <option key={em.id} value={em.id}>{em.nom_complet}</option>)}
                                </select>
                            </FormGroup>
                            <FormGroup label="Période (Mois)" theme={theme}>
                                <input type="text" value={form.mois} onChange={e => setForm({...form, mois: e.target.value})} style={inputStyle(theme)} />
                            </FormGroup>
                        </div>

                        {/* 2. GAINS (Vert) */}
                        <div style={{ background: darkMode ? 'rgba(16, 185, 129, 0.05)' : '#f0fdf4', borderRadius: 16, padding: 20, border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0'}`, marginBottom: 20 }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18}/> Gains</h3>
                            <div className="form-grid-2">
                                <FormGroup label="Salaire de Base" theme={theme}>
                                    <input type="number" value={form.salaire_base} onChange={e => setForm({...form, salaire_base: e.target.value})} style={inputStyle(theme)} />
                                </FormGroup>
                                <FormGroup label="Primes & Indemnités" theme={theme}>
                                    <input type="number" value={form.primes} onChange={e => setForm({...form, primes: e.target.value})} style={inputStyle(theme)} />
                                </FormGroup>
                            </div>
                            <div style={{ textAlign: 'right', marginTop: 10, fontWeight: 700, color: theme.text, opacity: 0.8 }}>Brut : {brut.toLocaleString()} F</div>
                        </div>

                        {/* 3. RETENUES (Rouge) */}
                        <div style={{ background: darkMode ? 'rgba(239, 68, 68, 0.05)' : '#fef2f2', borderRadius: 16, padding: 20, border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fecaca'}`, marginBottom: 25 }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}><TrendingDown size={18}/> Retenues</h3>
                            <div className="form-grid-3">
                                <FormGroup label="CNSS (Auto)" theme={theme}>
                                    <input type="number" value={form.cotisations} onChange={e => setForm({...form, cotisations: e.target.value})} style={inputStyle(theme)} />
                                </FormGroup>
                                <FormGroup label="Impôt ITS (Auto)" theme={theme}>
                                    <input type="number" value={form.impots} onChange={e => setForm({...form, impots: e.target.value})} style={inputStyle(theme)} />
                                </FormGroup>
                                <FormGroup label="Avance / Oppos." theme={theme}>
                                    <input type="number" value={form.avance_opposition} onChange={e => setForm({...form, avance_opposition: e.target.value})} style={{...inputStyle(theme), borderColor: theme.danger, color: theme.danger, fontWeight: 'bold'}} placeholder="0" />
                                </FormGroup>
                            </div>
                        </div>

                        {/* 4. TOTAL NET */}
                        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', borderRadius: 16, padding: 20, color: 'white', textAlign: 'center', marginBottom: 30, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)' }}>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500, letterSpacing: '1px' }}>NET À PAYER</span>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 5 }}>{netAPayer.toLocaleString()} <span style={{fontSize:'1.2rem'}}>FCFA</span></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 15 }}>
                            <GlassButton onClick={() => setIsModalOpen(false)} theme={theme}>Annuler</GlassButton>
                            <PrimaryButton type="submit">Générer le Bulletin</PrimaryButton>
                        </div>
                    </form>
                </motion.div>
             </div>
        )}
        </AnimatePresence>

    </div>
  );
}

// --- SUB COMPONENTS (Design System) ---

function PrimaryButton({ children, onClick, type="button" }) {
    return (
        <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            type={type} onClick={onClick}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)' }}
        >
            {children}
        </motion.button>
    )
}

function GlassButton({ children, onClick, theme, icon }) {
    return (
        <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: theme.border }} whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, padding: icon ? '12px' : '12px 20px', borderRadius: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(10px)' }}
        >
            {children}
        </motion.button>
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
    width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem'
});
