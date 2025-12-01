import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';

// Animations & Icons
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Plus, Download, Edit, Trash2, 
  AlertTriangle, BookOpen, Sun, Moon, X, Layers 
} from 'lucide-react';

// --- CONFIG ANIMATION ---
const containerVar = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVar = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function Produits() {
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Data State
  const [entreprise, setEntreprise] = useState(null);
  const [produits, setProduits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [valeurStock, setValeurStock] = useState(0);
  
  // UI State
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [form, setForm] = useState({
    nom: '', quantite: 0, prix_achat: 0, prix_vente: 0, unite: 'unité', seuil_alerte: 5, type_produit: 'BIEN'
  });

  // --- THEME ENGINE ---
  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    card: darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    inputBg: darkMode ? 'rgba(15, 23, 42, 0.5)' : '#fff',
    accent: '#3b82f6'
  };

  useEffect(() => { initData(); }, []);

  // --- LOGIQUE METIER (IDENTIQUE) ---
  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchProduits(ste.id);
    }
    setLoading(false);
  }

  async function fetchProduits(id) {
    const { data } = await supabase.from('produits').select('*').eq('entreprise_id', id).order('nom', { ascending: true });
    setProduits(data || []);
    const val = (data || []).reduce((acc, p) => acc + (p.type_produit === 'BIEN' ? (p.stock_actuel * p.prix_achat) : 0), 0);
    setValeurStock(val);
  }

  const comptabiliserStock = async () => {
      if (valeurStock === 0) return alert("Votre stock est vide ou n'a pas de valeur d'achat.");
      if (!confirm(`Voulez-vous mettre à jour la valeur du stock au Bilan (${valeurStock.toLocaleString()} F) ?`)) return;
      try {
          const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
              entreprise_id: entreprise.id, date_ecriture: new Date(), libelle: 'Régularisation Valeur Stock (Inventaire)', journal_code: 'OD'
          }]).select().single();

          const { data: plan } = await supabase.from('plan_comptable').select('id, code_compte').eq('entreprise_id', entreprise.id);
          const findId = (code) => plan.find(c => c.code_compte.startsWith(code))?.id;
          const idStock = findId('311'); 
          const idVar = findId('603');   

          if (idStock && idVar) {
              await supabase.from('lignes_ecriture').insert([
                  { ecriture_id: ecriture.id, compte_id: idStock, debit: valeurStock, credit: 0 },
                  { ecriture_id: ecriture.id, compte_id: idVar, debit: 0, credit: valeurStock }
              ]);
              alert("Succès ! La valeur du stock est maintenant dans votre Bilan.");
          } else { alert("Erreur: Comptes 311 ou 603 manquants."); }
      } catch (e) { alert("Erreur: " + e.message); }
  };

  const saveProduit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        entreprise_id: entreprise.id, nom: form.nom, stock_actuel: Number(form.quantite),
        prix_achat: Number(form.prix_achat), prix_vente: Number(form.prix_vente), unite: form.unite,
        seuil_alerte: Number(form.seuil_alerte), type_produit: form.type_produit
      };
      if (editing) await supabase.from('produits').update(payload).eq('id', editing.id);
      else await supabase.from('produits').insert([payload]);
      setOpen(false); resetForm(); fetchProduits(entreprise.id);
    } catch (err) { alert("Erreur : " + err.message); }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ nom: '', quantite: 0, prix_achat: 0, prix_vente: 0, unite: 'unité', seuil_alerte: 5, type_produit: 'BIEN' });
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ nom: p.nom, quantite: p.stock_actuel, prix_achat: p.prix_achat || 0, prix_vente: p.prix_vente, unite: p.unite, seuil_alerte: p.seuil_alerte, type_produit: p.type_produit || 'BIEN' });
    setOpen(true);
  };

  const deleteProduit = async (id) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from('produits').delete().eq('id', id);
    fetchProduits(entreprise.id);
  };

  const exportExcel = () => {
    const data = filtered.map(p => ({ 'Nom': p.nom, 'Stock': p.stock_actuel, 'Unité': p.unite, 'Prix Achat': p.prix_achat, 'Prix Vente': p.prix_vente, 'Valeur': p.stock_actuel * p.prix_achat }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, "Stock.xlsx");
  };

  const filtered = produits.filter(p => p.nom.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background: theme.bg, color: theme.text}}>Chargement de l'inventaire...</div>;

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

            /* Grille Produit (Tableau Desktop) */
            .product-grid {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 80px;
                align-items: center;
                gap: 10px;
            }

            .mobile-label { display: none; }
            .header-controls { display: flex; gap: 12px; align-items: center; }
            .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
            .mobile-hide { display: inline; }

            /* MEDIA QUERIES */
            @media (max-width: 1024px) {
                .responsive-main { margin-left: 0; }
            }

            @media (max-width: 768px) {
                .page-header { flex-direction: column; align-items: flex-start; }
                .header-controls { width: 100%; justify-content: space-between; }
                .mobile-hide { display: none; }
                
                /* Transformation Tableau -> Cartes */
                .table-header { display: none !important; }
                
                .product-card {
                    display: flex !important;
                    flex-direction: column;
                    align-items: flex-start !important;
                    gap: 12px !important;
                    padding: 20px !important;
                }

                .product-card > div {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: left !important;
                    border-bottom: 1px dashed ${theme.border};
                    padding-bottom: 8px;
                }
                .product-card > div:last-child { border-bottom: none; padding-bottom: 0; }

                .mobile-label { 
                    display: inline-block; 
                    font-weight: 600; 
                    color: ${theme.textMuted}; 
                    font-size: 0.85rem;
                }
            }
        `}</style>

        {/* BACKGROUND PARALLAX EFFECTS */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <motion.div animate={{ x: [0, 80, 0], y: [0, -50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ position:'absolute', top:'-10%', right:'-10%', width:'600px', height:'600px', borderRadius:'50%', background: darkMode ? 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }} />
            <motion.div animate={{ x: [0, -60, 0], y: [0, 60, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ position:'absolute', bottom:'10%', left:'-5%', width:'500px', height:'500px', borderRadius:'50%', background: darkMode ? 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }} />
        </div>

        <div style={{ display: 'flex', position: 'relative', zIndex: 10 }}>
            <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} darkMode={darkMode} />
            
            <main className="responsive-main">
                
                {/* HEADER */}
                <header className="page-header">
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Inventaire
                        </h1>
                        <p style={{ color: theme.textMuted, marginTop: 5, fontSize: '1.05rem' }}>Gérez vos produits, services et valorisation.</p>
                    </div>
                    <div className="header-controls">
                        <GlassButton onClick={() => setDarkMode(!darkMode)} theme={theme} icon>
                            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                        </GlassButton>
                        <GlassButton onClick={exportExcel} theme={theme}>
                            <Download size={18}/> <span className="mobile-hide">Excel</span>
                        </GlassButton>
                        <PrimaryButton onClick={() => { resetForm(); setOpen(true); }}>
                            <Plus size={20} strokeWidth={3}/> <span>Nouveau</span>
                        </PrimaryButton>
                    </div>
                </header>

                {/* KPI CARD */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', 
                        borderRadius: 20, padding: 25, marginBottom: 30, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
                        boxShadow: '0 15px 30px -5px rgba(249, 115, 22, 0.3)'
                    }}
                >
                    <div>
                        <div style={{ display:'flex', alignItems:'center', gap: 10, opacity: 0.9, marginBottom: 5 }}>
                            <Layers size={20} /> Valeur du Stock
                        </div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{valeurStock.toLocaleString()} <span style={{fontSize:'1rem'}}>F CFA</span></div>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={comptabiliserStock}
                        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 20px', borderRadius: 12, color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <BookOpen size={18}/> Comptabiliser
                    </motion.button>
                </motion.div>

                {/* SEARCH BAR */}
                <div style={{ marginBottom: 30, position:'relative', maxWidth: 400 }}>
                    <Search size={18} style={{ position:'absolute', left: 15, top: '50%', transform:'translateY(-50%)', color: theme.textMuted }} />
                    <input 
                        type="text" 
                        placeholder="Rechercher un produit..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: 16, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, outline:'none', backdropFilter: 'blur(10px)', fontSize: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}
                    />
                </div>

                {/* PRODUCT LIST */}
                <motion.div variants={containerVar} initial="hidden" animate="show" style={{ display: 'grid', gap: 15 }}>
                    
                    {/* Header Columns (Desktop Only) */}
                    <div className="product-grid table-header" style={{ padding: '0 20px', color: theme.textMuted, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <div>Article</div>
                        <div style={{textAlign:'center'}}>Stock</div>
                        <div>Unité</div>
                        <div style={{textAlign:'right'}}>Coût</div>
                        <div style={{textAlign:'right'}}>Vente</div>
                        <div style={{textAlign:'center'}}>Marge</div>
                        <div style={{textAlign:'right'}}>Actions</div>
                    </div>

                    {filtered.map(p => {
                        const marge = p.prix_vente - p.prix_achat;
                        const isLow = p.type_produit === 'BIEN' && p.stock_actuel <= p.seuil_alerte;
                        return (
                            <motion.div 
                                key={p.id} variants={itemVar} whileHover={{ scale: 1.01, x: 5 }}
                                className="product-grid product-card"
                                style={{ 
                                    background: theme.card, padding: '15px 20px', borderRadius: 16, 
                                    border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <div style={{ display:'flex', flexDirection:'column' }}>
                                    <span className="mobile-label">Nom</span>
                                    <div>
                                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{p.nom}</span>
                                        {p.type_produit === 'SERVICE' && <span style={{ fontSize: '0.7rem', color: theme.accent, background: `${theme.accent}15`, width: 'fit-content', padding: '2px 6px', borderRadius: 6, marginLeft: 8 }}>Service</span>}
                                    </div>
                                </div>
                                
                                <div style={{ textAlign: 'center' }}>
                                    <span className="mobile-label">Stock</span>
                                    {p.type_produit === 'BIEN' ? (
                                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: 5, color: isLow ? '#ef4444' : theme.text, fontWeight: 700 }}>
                                            {p.stock_actuel} {isLow && <AlertTriangle size={14} />}
                                        </div>
                                    ) : <span style={{opacity:0.3}}>-</span>}
                                </div>

                                <div style={{ color: theme.textMuted, fontSize: '0.9rem' }}>
                                    <span className="mobile-label">Unité</span>
                                    {p.unite}
                                </div>
                                
                                <div style={{ textAlign: 'right', color: theme.textMuted }}>
                                    <span className="mobile-label">Prix Achat</span>
                                    {p.prix_achat?.toLocaleString()}
                                </div>
                                
                                <div style={{ textAlign: 'right', fontWeight: 700 }}>
                                    <span className="mobile-label">Prix Vente</span>
                                    {p.prix_vente?.toLocaleString()} <span style={{fontSize:'0.7em', opacity:0.5}}>F</span>
                                </div>
                                
                                <div style={{ textAlign: 'center' }}>
                                    <span className="mobile-label">Marge</span>
                                    {marge > 0 ? (
                                        <span style={{ color: '#10b981', background: '#dcfce7', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>+{marge.toLocaleString()}</span>
                                    ) : <span style={{opacity:0.3}}>-</span>}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <span className="mobile-label"></span>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => handleEdit(p)} style={{ color: theme.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}><Edit size={16}/></button>
                                        <button onClick={() => deleteProduit(p.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}

                    {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>
                            <Package size={50} style={{ opacity: 0.2, marginBottom: 15 }} />
                            <p>Aucun produit ne correspond à votre recherche.</p>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>

        {/* --- MODAL --- */}
        <AnimatePresence>
        {open && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 10 }}>
                <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
                    style={{ background: theme.bg, width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, padding: 30, border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #3b82f6, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {editing ? 'Modifier le Produit' : 'Nouveau Produit'}
                        </h2>
                        <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted }}><X /></button>
                    </div>

                    <form onSubmit={saveProduit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
                            <FormGroup label="Nom du produit" theme={theme}>
                                <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Ex: Ciment" style={inputStyle(theme)} />
                            </FormGroup>
                            <FormGroup label="Type" theme={theme}>
                                <select value={form.type_produit} onChange={e => setForm({...form, type_produit: e.target.value})} style={inputStyle(theme)}>
                                    <option value="BIEN">Produit Stocké</option>
                                    <option value="SERVICE">Service</option>
                                </select>
                            </FormGroup>
                        </div>

                        {form.type_produit === 'BIEN' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20, marginBottom: 20 }}>
                                <FormGroup label="Stock Actuel" theme={theme}>
                                    <input type="number" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} style={inputStyle(theme)} />
                                </FormGroup>
                                <FormGroup label="Seuil d'alerte" theme={theme}>
                                    <input type="number" value={form.seuil_alerte} onChange={e => setForm({...form, seuil_alerte: e.target.value})} style={inputStyle(theme)} />
                                </FormGroup>
                            </div>
                        )}

                        <div style={{ marginBottom: 20 }}>
                            <FormGroup label="Unité de mesure" theme={theme}>
                                <input type="text" required value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} placeholder="kg, litre, unité..." style={inputStyle(theme)} />
                            </FormGroup>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20, marginBottom: 30 }}>
                            <FormGroup label="Prix d'Achat (Coût)" theme={theme}>
                                <div style={{position:'relative'}}>
                                    <input type="number" required value={form.prix_achat} onChange={e => setForm({...form, prix_achat: e.target.value})} style={inputStyle(theme)} />
                                    <span style={{position:'absolute', right:10, top:12, color: theme.textMuted, fontSize:'0.8rem'}}>F CFA</span>
                                </div>
                            </FormGroup>
                            <FormGroup label="Prix de Vente" theme={theme}>
                                <div style={{position:'relative'}}>
                                    <input type="number" required value={form.prix_vente} onChange={e => setForm({...form, prix_vente: e.target.value})} style={{...inputStyle(theme), fontWeight:'bold'}} />
                                    <span style={{position:'absolute', right:10, top:12, color: theme.textMuted, fontSize:'0.8rem'}}>F CFA</span>
                                </div>
                            </FormGroup>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 15 }}>
                            <GlassButton onClick={() => setOpen(false)} theme={theme}>Annuler</GlassButton>
                            <PrimaryButton type="submit">{editing ? 'Mettre à jour' : 'Enregistrer'}</PrimaryButton>
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
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)' }}
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
            style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, padding: icon ? '10px' : '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(10px)' }}
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
