import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';

/* --- ICÔNES (Légèrement retouchées pour l'animation) --- */
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="100%" height="100%"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconBox = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="100%" height="100%"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="100%" height="100%"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconPDF = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="100%" height="100%"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const IconRefresh = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="100%" height="100%"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const IconMoon = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="100%" height="100%"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>;
const IconSun = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="100%" height="100%"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;

/* --- STYLES CSS & THEME --- */
// On utilise des variables CSS pour une bascule Dark Mode instantanée
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&family=Inter:wght@300;400;600&display=swap');

  :root {
    --bg-primary: #F5F5F7;
    --bg-secondary: #FFFFFF;
    --text-primary: #1D1D1F;
    --text-secondary: #86868B;
    --accent: #0066CC;
    --accent-glow: rgba(0, 102, 204, 0.3);
    --border: #D2D2D7;
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(255, 255, 255, 0.5);
    --shadow-soft: 0 10px 40px -10px rgba(0,0,0,0.05);
    --shadow-hover: 0 20px 50px -12px rgba(0,0,0,0.12);
  }

  [data-theme='dark'] {
    --bg-primary: #000000;
    --bg-secondary: #1C1C1E;
    --text-primary: #F5F5F7;
    --text-secondary: #A1A1A6;
    --accent: #2997FF;
    --accent-glow: rgba(41, 151, 255, 0.3);
    --border: #38383A;
    --glass-bg: rgba(28, 28, 30, 0.7);
    --glass-border: rgba(255, 255, 255, 0.1);
    --shadow-soft: 0 10px 40px -10px rgba(0,0,0,0.5);
    --shadow-hover: 0 20px 50px -12px rgba(0,0,0,0.7);
  }

  body {
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), color 0.5s ease;
    overflow-x: hidden;
  }

  /* FLOU D'ARRIÈRE PLAN (Glassmorphism) */
  .glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border: 1px solid var(--glass-border);
  }

  /* LAYOUT */
  .layout { display: flex; min-height: 100vh; }
  
  .main-area {
    margin-left: 260px;
    padding: 3rem;
    width: 100%;
    position: relative;
    z-index: 1;
    overflow: hidden;
  }
  
  @media (max-width: 900px) {
    .main-area { margin-left: 0; padding: 1.5rem; }
  }

  /* TYPOGRAPHY */
  h1 { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
  p.subtitle { color: var(--text-secondary); font-size: 1.1rem; font-weight: 400; }

  /* INPUTS DESIGN */
  .custom-input {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 0.8rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
    width: 100%;
    transition: all 0.3s ease;
  }
  .custom-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 4px var(--accent-glow);
  }

  /* BUTTONS */
  .btn-modern {
    padding: 0.8rem 1.5rem;
    border-radius: 99px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  /* TABLE STYLES */
  .modern-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
  .modern-table th { 
    text-align: left; padding: 1rem; color: var(--text-secondary); 
    font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; 
  }
  .modern-table td { 
    padding: 1.25rem 1rem; background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    first-child: { border-left: 1px solid var(--border); border-top-left-radius: 16px; border-bottom-left-radius: 16px; }
  }
  /* L'astuce pour arrondir les rangées du tableau */
  .modern-table tr td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; border-left: 1px solid var(--border); }
  .modern-table tr td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; border-right: 1px solid var(--border); }

  /* RESPONSIVE TABLE */
  @media (max-width: 900px) {
    .modern-table thead { display: none; }
    .modern-table tr { display: flex; flex-direction: column; margin-bottom: 1rem; background: var(--bg-secondary); padding: 1rem; border-radius: 16px; border: 1px solid var(--border); }
    .modern-table td { display: flex; justify-content: space-between; border: none; padding: 0.5rem 0; background: transparent; }
    .modern-table td::before { content: attr(data-label); color: var(--text-secondary); font-weight: 600; }
  }
`;

export default function Editions() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [activeTab, setActiveTab] = useState('journal');
  const [theme, setTheme] = useState('light');
  
  // Filtres
  const [dateDebut, setDateDebut] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateFin, setDateFin] = useState(`${new Date().getFullYear()}-12-31`);

  // Données
  const [journalData, setJournalData] = useState([]);
  const [inventaireData, setInventaireData] = useState([]);

  useEffect(() => { initData(); }, []);

  // Application du thème au body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) setEntreprise(ste);
    setLoading(false);
  }

  async function fetchJournal() {
    setLoading(true);
    const { data, error } = await supabase
      .from('lignes_ecriture')
      .select(`debit, credit, ecriture:ecritures_comptables!inner (date_ecriture, libelle, numero_piece:id), compte:plan_comptable!inner (code_compte, libelle)`)
      .eq('plan_comptable.entreprise_id', entreprise.id)
      .gte('ecriture.date_ecriture', dateDebut)
      .lte('ecriture.date_ecriture', dateFin)
      .order('ecriture(date_ecriture)', { ascending: true });

    if (error) console.error(error);
    else setJournalData(data || []);
    setLoading(false);
  }

  async function fetchInventaire() {
    setLoading(true);
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('entreprise_id', entreprise.id)
      .eq('type_produit', 'BIEN')
      .gt('stock_actuel', 0);

    if (error) console.error(error);
    else setInventaireData(data || []);
    setLoading(false);
  }

  // --- Fonctions PDF (Identiques) ---
  const printLivreJournal = () => {
    const doc = new jsPDF();
    doc.text(`LIVRE-JOURNAL`, 14, 20);
    doc.setFontSize(10); doc.text(`Période : ${dateDebut} au ${dateFin}`, 14, 28);
    const rows = journalData.map(L => [L.ecriture.date_ecriture, L.ecriture.numero_piece?.toString().substring(0, 8), L.compte.code_compte, L.compte.libelle, L.ecriture.libelle, L.debit > 0 ? L.debit.toLocaleString() : '', L.credit > 0 ? L.credit.toLocaleString() : '']);
    autoTable(doc, { startY: 35, head: [['Date', 'Ref', 'Cpt', 'Compte', 'Libellé', 'Débit', 'Crédit']], body: rows });
    doc.save('livre_journal.pdf');
  };

  const printInventaire = () => {
    const doc = new jsPDF();
    doc.text(`LIVRE D'INVENTAIRE`, 14, 20);
    let totalValeur = 0;
    const rows = inventaireData.map(p => {
      const valeur = p.stock_actuel * p.prix_vente;
      totalValeur += valeur;
      return [p.nom, `${p.stock_actuel} ${p.unite}`, p.prix_vente.toLocaleString(), valeur.toLocaleString()];
    });
    rows.push(['TOTAL', '', '', totalValeur.toLocaleString()]);
    autoTable(doc, { startY: 35, head: [['Désignation', 'Qté', 'PU (Est.)', 'Valeur']], body: rows });
    doc.save('livre_inventaire.pdf');
  };

  // --- VARIANTS D'ANIMATION (FRAMER MOTION) ---
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } };

  if (loading) return <div style={{height:'100vh', display:'grid', placeItems:'center', background:'var(--bg-primary)', color:'var(--text-primary)'}}>Chargement...</div>;

  return (
    <div className="layout">
      <style>{styles}</style>
      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <main className="main-area">
        {/* Éléments de fond décoratifs (Paralax/Glow) */}
        <div style={{position:'fixed', top:'-10%', right:'-10%', width:'600px', height:'600px', background:'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity:0.1, filter:'blur(80px)', zIndex:-1, pointerEvents:'none'}}></div>
        <div style={{position:'fixed', bottom:'-10%', left:'-10%', width:'500px', height:'500px', background:'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', opacity:0.1, filter:'blur(80px)', zIndex:-1, pointerEvents:'none'}}></div>

        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          style={{ maxWidth: '1100px', margin: '0 auto', display:'flex', flexDirection:'column', gap:'2rem' }}
        >
          
          {/* HEADER AVEC ANIMATION */}
          <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Éditions Légales</h1>
              <p className="subtitle">Générez et visualisez vos documents comptables obligatoires.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-primary)', width:48, height:48 }}
            >
              {theme === 'light' ? <IconMoon /> : <IconSun />}
            </motion.button>
          </motion.div>

          {/* ONGLETS "APPLE STYLE" (SEGMENTED CONTROL) */}
          <motion.div variants={itemVariants} style={{ alignSelf: 'center', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '16px', display: 'flex', gap: '8px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
            {['journal', 'inventaire'].map(tab => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  position: 'relative',
                  padding: '10px 24px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  zIndex: 2,
                  display: 'flex', alignItems: 'center', gap: 8,
                  textTransform: 'capitalize'
                }}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-primary)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div style={{width:18, height:18}}>{tab === 'journal' ? <IconBook/> : <IconBox/>}</div>
                {tab === 'journal' ? 'Livre-Journal' : 'Inventaire'}
              </motion.button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%' }}
            >
              {activeTab === 'journal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* CONTROLS CARD (GLASSMORPHISM) */}
                  <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', display:'flex', flexDirection:'column', gap:'1.5rem', boxShadow:'var(--shadow-soft)' }}>
                    <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'flex-end' }}>
                      <div style={{ flex:1, minWidth:'200px' }}>
                        <label style={{display:'block', marginBottom:8, fontSize:'0.85rem', fontWeight:600, color:'var(--text-secondary)'}}>Date Début</label>
                        <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="custom-input" />
                      </div>
                      <div style={{ flex:1, minWidth:'200px' }}>
                        <label style={{display:'block', marginBottom:8, fontSize:'0.85rem', fontWeight:600, color:'var(--text-secondary)'}}>Date Fin</label>
                        <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="custom-input" />
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-hover)' }} whileTap={{ scale: 0.98 }}
                        onClick={fetchJournal} 
                        className="btn-modern" 
                        style={{ background: 'var(--accent)', color: 'white', height:'46px' }}
                      >
                         <div style={{width:18, height:18}}><IconSearch/></div> Rechercher
                      </motion.button>
                      
                      {journalData.length > 0 && (
                        <motion.button 
                           whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)' }} whileTap={{ scale: 0.98 }}
                           onClick={printLivreJournal} 
                           className="btn-modern" 
                           style={{ background: '#ef4444', color: 'white', height:'46px' }}
                        >
                          <div style={{width:18, height:18}}><IconPDF/></div> PDF
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* DATA LIST / TABLE */}
                  {journalData.length > 0 ? (
                    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                      <table className="modern-table">
                        <thead>
                          <tr><th>Date</th><th>Compte</th><th>Libellé</th><th style={{textAlign:'right'}}>Débit</th><th style={{textAlign:'right'}}>Crédit</th></tr>
                        </thead>
                        <tbody>
                          {journalData.slice(0, 100).map((L, i) => (
                            <motion.tr key={i} variants={itemVariants} whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} style={{ transition: 'all 0.2s' }}>
                              <td data-label="Date" style={{fontWeight:500}}>{new Date(L.ecriture.date_ecriture).toLocaleDateString()}</td>
                              <td data-label="Compte">
                                <span style={{color:'var(--accent)', fontWeight:700, fontFamily:'monospace'}}>{L.compte.code_compte}</span>
                                <div style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>{L.compte.libelle}</div>
                              </td>
                              <td data-label="Libellé">{L.ecriture.libelle}</td>
                              <td data-label="Débit" style={{textAlign:'right', fontFamily:'monospace'}}>{L.debit > 0 ? L.debit.toLocaleString() : '-'}</td>
                              <td data-label="Crédit" style={{textAlign:'right', fontFamily:'monospace'}}>{L.credit > 0 ? L.credit.toLocaleString() : '-'}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  ) : (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign:'center', padding:'4rem', color:'var(--text-secondary)', border:'2px dashed var(--border)', borderRadius:'24px'}}>
                      Aucune écriture trouvée. Lancez une recherche.
                    </motion.div>
                  )}
                </div>
              )}

              {activeTab === 'inventaire' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'var(--shadow-soft)' }}>
                      <div>
                        <h3 style={{margin:0, fontSize:'1.2rem'}}>État des stocks</h3>
                        <p style={{margin:'0.25rem 0 0 0', color:'var(--text-secondary)', fontSize:'0.9rem'}}>Valorisation en temps réel.</p>
                      </div>
                      <div style={{display:'flex', gap:'1rem'}}>
                         <motion.button onClick={fetchInventaire} whileHover={{rotate:180, scale:1.1}} whileTap={{scale:0.9}} className="btn-modern" style={{background:'var(--bg-primary)', border:'1px solid var(--border)', padding:'12px', borderRadius:'50%'}}>
                            <div style={{width:20, height:20}}><IconRefresh/></div>
                         </motion.button>
                         {inventaireData.length > 0 && (
                            <motion.button onClick={printInventaire} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-modern" style={{ background: '#ef4444', color: 'white' }}>
                              <div style={{width:18, height:18}}><IconPDF/></div> Export
                            </motion.button>
                         )}
                      </div>
                  </div>

                  {inventaireData.length > 0 ? (
                    <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1.5rem'}}>
                      {inventaireData.map((p, i) => (
                        <motion.div 
                          key={i} 
                          variants={itemVariants}
                          whileHover={{ y: -5, boxShadow: 'var(--shadow-hover)' }}
                          style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border)', display:'flex', flexDirection:'column', gap:'1rem' }}
                        >
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                             <div style={{fontWeight:700, fontSize:'1.1rem'}}>{p.nom}</div>
                             <span style={{background:'var(--accent-glow)', color:'var(--accent)', padding:'4px 10px', borderRadius:'99px', fontSize:'0.75rem', fontWeight:700}}>{p.stock_actuel} {p.unite}</span>
                          </div>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', borderTop:'1px solid var(--border)', paddingTop:'1rem', marginTop:'auto'}}>
                             <div style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>P.U. {p.prix_vente.toLocaleString()}</div>
                             <div style={{fontSize:'1.2rem', fontWeight:800, color:'var(--text-primary)'}}>{(p.stock_actuel * p.prix_vente).toLocaleString()} <span style={{fontSize:'0.8rem', fontWeight:400}}>FCFA</span></div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div style={{textAlign:'center', color:'var(--text-secondary)'}}>Aucun stock.</div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
