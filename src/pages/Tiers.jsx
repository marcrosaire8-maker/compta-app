import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';

// Animations & Icons
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Plus, Download, Edit2, Trash2, 
  Phone, Mail, MapPin, CreditCard, Sun, Moon, X, Filter 
} from 'lucide-react';

// --- CONFIG ANIMATION ---
const containerVar = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardVar = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function Tiers() {
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Data State
  const [entreprise, setEntreprise] = useState(null);
  const [tiers, setTiers] = useState([]);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TOUS');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [form, setForm] = useState({
    nom_complet: '', type_tier: 'CLIENT', email: '', telephone: '', adresse: '', assujetti_aib: false
  });

  // --- THEME ENGINE ---
  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    card: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    inputBg: darkMode ? 'rgba(15, 23, 42, 0.5)' : '#fff',
    accent: '#3b82f6',
    danger: '#ef4444'
  };

  useEffect(() => { initData(); }, []);

  // --- LOGIQUE METIER (INCHANGÉE) ---
  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchTiers(ste.id);
    }
    setLoading(false);
  }

  async function fetchTiers(id) {
    const { data } = await supabase.from('tiers').select('*').eq('entreprise_id', id).order('nom_complet');
    setTiers(data || []);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, entreprise_id: entreprise.id };
      if (editingTier) await supabase.from('tiers').update(payload).eq('id', editingTier.id);
      else await supabase.from('tiers').insert([payload]);
      setIsModalOpen(false); resetForm(); fetchTiers(entreprise.id);
    } catch (error) { alert(error.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce contact ?")) return;
    await supabase.from('tiers').delete().eq('id', id);
    fetchTiers(entreprise.id);
  };

  const resetForm = () => {
      setEditingTier(null);
      setForm({ nom_complet: '', type_tier: 'CLIENT', email: '', telephone: '', adresse: '', assujetti_aib: false });
  };

  const handleEdit = (t) => {
      setEditingTier(t); setForm(t); setIsModalOpen(true);
  };

  const exportExcel = () => {
      const ws = XLSX.utils.json_to_sheet(filtered);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Contacts");
      XLSX.writeFile(wb, "Contacts.xlsx");
  };

  const filtered = tiers.filter(t => {
      const matchSearch = t.nom_complet.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'TOUS' || t.type_tier === filterType;
      return matchSearch && matchType;
  });

  // --- HELPERS VISUELS ---
  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';
  const getTypeColor = (type) => {
      switch(type) {
          case 'CLIENT': return { bg: '#dbeafe', text: '#1e40af', icon: '👤' };
          case 'FOURNISSEUR': return { bg: '#ffedd5', text: '#9a3412', icon: '🚚' };
          case 'EMPLOYE': return { bg: '#dcfce7', text: '#166534', icon: '👔' };
          default: return { bg: '#f1f5f9', text: '#475569', icon: '✨' };
      }
  };

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background: theme.bg, color: theme.text}}>Chargement de l'annuaire...</div>;

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

            /* Header & Toolbar */
            .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
            .header-controls { display: flex; gap: 12px; align-items: center; }
            .toolbar { display: flex; gap: 15px; marginBottom: 30px; flex-wrap: wrap; }
            
            /* Grille de Cartes */
            .cards-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* Min réduit pour mobile */
                gap: 20px;
            }

            /* Formulaire Modal */
            .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .mobile-hide { display: inline; }

            /* RESPONSIVE BREAKPOINTS */
            @media (max-width: 1024px) {
                .responsive-main { margin-left: 0; }
            }

            @media (max-width: 768px) {
                .page-header { flex-direction: column; align-items: flex-start; }
                .header-controls { width: 100%; justify-content: space-between; }
                .mobile-hide { display: none; }
                
                /* Toolbar empilée */
                .toolbar { flex-direction: column; gap: 15px; }
                .search-box, .filter-box { width: 100% !important; min-width: 0 !important; }

                /* Formulaire empilé */
                .form-row { grid-template-columns: 1fr; gap: 15px; }
            }
        `}</style>

        {/* PARALLAX BACKGROUND */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ position:'absolute', top:'-10%', left:'10%', width:'500px', height:'500px', borderRadius:'50%', background: darkMode ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }} />
            <motion.div animate={{ x: [0, -70, 0], y: [0, 70, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ position:'absolute', bottom:'10%', right:'-5%', width:'450px', height:'450px', borderRadius:'50%', background: darkMode ? 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }} />
        </div>

        <div style={{ display: 'flex', position: 'relative', zIndex: 10 }}>
            <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} darkMode={darkMode} />
            
            <main className="responsive-main">
                
                {/* HEADER */}
                <header className="page-header">
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Carnet d'Adresses
                        </h1>
                        <p style={{ color: theme.textMuted, marginTop: 5, fontSize: '1.05rem' }}>Gérez vos relations clients et partenaires.</p>
                    </div>
                    <div className="header-controls">
                        <GlassButton onClick={() => setDarkMode(!darkMode)} theme={theme} icon>
                            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                        </GlassButton>
                        <GlassButton onClick={exportExcel} theme={theme}>
                            <Download size={18}/> <span className="mobile-hide">Excel</span>
                        </GlassButton>
                        <PrimaryButton onClick={() => { resetForm(); setIsModalOpen(true); }}>
                            <Plus size={20} strokeWidth={3}/> <span>Nouveau</span>
                        </PrimaryButton>
                    </div>
                </header>

                {/* TOOLBAR (Search & Filter) */}
                <div className="toolbar" style={{marginBottom: 30}}>
                    <div className="search-box" style={{ flex: 1, minWidth: '250px', position:'relative' }}>
                        <Search size={18} style={{ position:'absolute', left: 15, top: '50%', transform:'translateY(-50%)', color: theme.textMuted }} />
                        <input 
                            type="text" 
                            placeholder="Rechercher par nom..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: 16, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, outline:'none', backdropFilter: 'blur(10px)', fontSize: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}
                        />
                    </div>
                    <div className="filter-box" style={{ position:'relative', minWidth: '200px' }}>
                        <Filter size={18} style={{ position:'absolute', left: 15, top: '50%', transform:'translateY(-50%)', color: theme.textMuted }} />
                        <select 
                            value={filterType} onChange={e => setFilterType(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: 16, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, outline:'none', cursor:'pointer', appearance:'none', backdropFilter: 'blur(10px)' }}
                        >
                            <option value="TOUS">Tous les types</option>
                            <option value="CLIENT">Clients</option>
                            <option value="FOURNISSEUR">Fournisseurs</option>
                            <option value="EMPLOYE">Employés</option>
                            <option value="AUTRE">Autres</option>
                        </select>
                    </div>
                </div>

                {/* GRID CARD LAYOUT */}
                <motion.div 
                    variants={containerVar} initial="hidden" animate="show" 
                    className="cards-grid"
                >
                    {filtered.map(t => {
                        const styleType = getTypeColor(t.type_tier);
                        return (
                            <motion.div 
                                key={t.id} variants={cardVar} whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                                style={{ 
                                    background: theme.card, borderRadius: 24, padding: 25, 
                                    border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)',
                                    display: 'flex', flexDirection: 'column', gap: 15, position: 'relative',
                                    transition: 'box-shadow 0.3s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                        <div style={{ minWidth: 50, width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', boxShadow: '0 5px 15px rgba(99, 102, 241, 0.3)' }}>
                                            {getInitials(t.nom_complet)}
                                        </div>
                                        <div style={{overflow: 'hidden'}}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nom_complet}</h3>
                                            <span style={{ fontSize: '0.75rem', marginTop: 4, display: 'inline-block', padding: '4px 10px', borderRadius: 20, background: styleType.bg, color: styleType.text, fontWeight: 700 }}>
                                                {styleType.icon} {t.type_tier}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        <button onClick={() => handleEdit(t)} style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', color: theme.textMuted, cursor: 'pointer', transition: 'background 0.2s' }}><Edit2 size={18}/></button>
                                        <button onClick={() => handleDelete(t.id)} style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', color: theme.danger, cursor: 'pointer', transition: 'background 0.2s' }}><Trash2 size={18}/></button>
                                    </div>
                                </div>
                                
                                <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {t.email && (
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: theme.textMuted, fontSize: '0.9rem' }}>
                                            <div style={{ background: theme.bg, padding: 6, borderRadius: 8 }}><Mail size={14}/></div>
                                            <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{t.email}</span>
                                        </div>
                                    )}
                                    {t.telephone && (
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: theme.textMuted, fontSize: '0.9rem' }}>
                                            <div style={{ background: theme.bg, padding: 6, borderRadius: 8 }}><Phone size={14}/></div>
                                            {t.telephone}
                                        </div>
                                    )}
                                    {t.adresse && (
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: theme.textMuted, fontSize: '0.9rem' }}>
                                            <div style={{ background: theme.bg, padding: 6, borderRadius: 8 }}><MapPin size={14}/></div>
                                            <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{t.adresse}</span>
                                        </div>
                                    )}
                                    {t.assujetti_aib && (
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#10b981', fontSize: '0.8rem', marginTop: 5, fontWeight: 600 }}>
                                            <CreditCard size={14}/> Assujetti AIB
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {filtered.length === 0 && (
                     <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>
                        <Users size={50} style={{ opacity: 0.2, marginBottom: 15 }} />
                        <p>Aucun contact trouvé.</p>
                    </div>
                )}

            </main>
        </div>

        {/* --- MODAL --- */}
        <AnimatePresence>
        {isModalOpen && (
             <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 10 }}>
                <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
                    style={{ background: theme.bg, width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, padding: 30, border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #3b82f6, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {editingTier ? 'Modifier' : 'Nouveau Contact'}
                        </h2>
                        <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted }}><X /></button>
                    </div>

                    <form onSubmit={handleSave}>
                        <div style={{ marginBottom: 20 }}>
                            <FormGroup label="Nom / Raison Sociale" theme={theme}>
                                <input required value={form.nom_complet} onChange={e => setForm({...form, nom_complet: e.target.value})} placeholder="Ex: Société ABC" style={inputStyle(theme)} />
                            </FormGroup>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <FormGroup label="Type de Tiers" theme={theme}>
                                <select value={form.type_tier} onChange={e => setForm({...form, type_tier: e.target.value})} style={inputStyle(theme)}>
                                    <option value="CLIENT">Client</option>
                                    <option value="FOURNISSEUR">Fournisseur</option>
                                    <option value="EMPLOYE">Employé</option>
                                    <option value="AUTRE">Autre Partenaire</option>
                                </select>
                            </FormGroup>
                        </div>

                        <div className="form-row">
                            <FormGroup label="Email" theme={theme}>
                                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inputStyle(theme)} />
                            </FormGroup>
                            <FormGroup label="Téléphone" theme={theme}>
                                <input type="text" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} style={inputStyle(theme)} />
                            </FormGroup>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                             <FormGroup label="Adresse" theme={theme}>
                                <input type="text" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} style={inputStyle(theme)} />
                            </FormGroup>
                        </div>

                        <div style={{ marginBottom: 30 }}>
                             <div 
                                onClick={() => setForm({...form, assujetti_aib: !form.assujetti_aib})}
                                style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 15, borderRadius: 12, border: `1px solid ${form.assujetti_aib ? '#10b981' : theme.border}`, background: form.assujetti_aib ? 'rgba(16, 185, 129, 0.1)' : theme.inputBg, cursor: 'pointer', transition: 'all 0.2s' }}
                             >
                                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${form.assujetti_aib ? '#10b981' : theme.textMuted}`, background: form.assujetti_aib ? '#10b981' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    {form.assujetti_aib && <motion.div initial={{scale:0}} animate={{scale:1}} style={{color:'white', fontSize:14}}>✓</motion.div>}
                                </div>
                                <span style={{ fontWeight: 600, color: form.assujetti_aib ? '#10b981' : theme.textMuted, fontSize: '0.9rem' }}>Ce tiers est assujetti à l'AIB (Taxe)</span>
                             </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 15 }}>
                            <GlassButton onClick={() => setIsModalOpen(false)} theme={theme}>Annuler</GlassButton>
                            <PrimaryButton type="submit">Enregistrer</PrimaryButton>
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
