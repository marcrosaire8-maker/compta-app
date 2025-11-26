import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie 
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  
  // --- DONNÉES ---
  const [stats, setStats] = useState({ ca: 0, depenses: 0, tresorerie: 0, marge: 0 });
  const [graphData, setGraphData] = useState([]); // Données pour les courbes
  const [repartitionData, setRepartitionData] = useState([]); // Données pour le camembert
  
  // --- MODALES ---
  const [showGuide, setShowGuide] = useState(false);
  const [newSteName, setNewSteName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { checkUser(); }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      await loadAllData(ste.id);
    }
    setLoading(false);
  }

  async function loadAllData(entrepriseId) {
    // 1. Récupérer TOUTES les factures pour les stats et les graphes
    const { data: factures } = await supabase
      .from('factures')
      .select('type_facture, total_ttc, date_emission')
      .eq('entreprise_id', entrepriseId)
      .order('date_emission', { ascending: true });

    // --- CALCUL KPI GLOBAUX ---
    let caTotal = 0, depensesTotal = 0;
    if (factures) {
      factures.forEach(f => {
        if (f.type_facture === 'VENTE') caTotal += f.total_ttc;
        if (f.type_facture === 'ACHAT') depensesTotal += f.total_ttc;
      });
    }

    // --- CALCUL TRÉSORERIE ---
    const { data: lignes } = await supabase
      .from('lignes_ecriture')
      .select('debit, credit, compte:plan_comptable!inner(code_compte)')
      .eq('plan_comptable.entreprise_id', entrepriseId);

    let treso = 0;
    lignes?.forEach(l => {
      if (l.compte.code_compte.toString().startsWith('5')) treso += (l.debit - l.credit);
    });

    // --- PRÉPARATION DONNÉES GRAPHIQUE (ÉVOLUTION MENSUELLE) ---
    const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const currentYear = new Date().getFullYear();
    
    // On initialise les 12 mois à 0
    const monthlyStats = Array(12).fill(0).map((_, i) => ({ 
      name: moisNoms[i], Ventes: 0, Depenses: 0 
    }));

    factures?.forEach(f => {
      const d = new Date(f.date_emission);
      if (d.getFullYear() === currentYear) {
        const moisIndex = d.getMonth();
        if (f.type_facture === 'VENTE') monthlyStats[moisIndex].Ventes += f.total_ttc;
        if (f.type_facture === 'ACHAT') monthlyStats[moisIndex].Depenses += f.total_ttc;
      }
    });

    // --- DONNÉES CAMEMBERT (Répartition simple) ---
    const pieData = [
      { name: 'Bénéfice Brut', value: Math.max(0, caTotal - depensesTotal), color: '#10b981' },
      { name: 'Dépenses', value: depensesTotal, color: '#ef4444' },
    ];

    setStats({
      ca: caTotal,
      depenses: depensesTotal,
      tresorerie: treso,
      marge: caTotal > 0 ? ((caTotal - depensesTotal) / caTotal) * 100 : 0
    });
    setGraphData(monthlyStats);
    setRepartitionData(pieData);
  }

  // --- ACTIONS ---
  async function handleCreateEntreprise(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée.");
      const { error } = await supabase.from('entreprises').insert([{ nom: newSteName, owner_id: user.id, email_contact: user.email }]);
      if (error) throw error;
      window.location.reload();
    } catch (error) { alert("Erreur : " + error.message); } 
    finally { setCreating(false); }
  }

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Chargement de vos données...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      
      <Sidebar entrepriseNom={entreprise?.nom || '...'} userRole={entreprise?.role} />

      <main style={{ marginLeft: '260px', padding: '40px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        
        {entreprise ? (
          <>
            {/* EN-TÊTE */}
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem', fontWeight: '800' }}>Tableau de Bord</h1>
                <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Vos performances en temps réel</p>
              </div>
              <button onClick={() => setShowGuide(true)} style={styles.guideBtn}>
                <span>🚀</span> Guide de Démarrage
              </button>
            </header>

            {/* --- 1. WIDGETS KPI (Cartes du haut) --- */}
            <div style={styles.gridKpi}>
                <KpiCard title="Chiffre d'Affaires" value={stats.ca} icon="💰" color="#3b82f6" sub="Total Facturé TTC" />
                <KpiCard title="Dépenses" value={stats.depenses} icon="💸" color="#ef4444" sub="Achats & Frais" />
                <KpiCard title="Trésorerie" value={stats.tresorerie} icon="🏦" color="#10b981" sub="Disponible (Banque+Caisse)" />
                <KpiCard title="Marge Nette" value={`${stats.marge.toFixed(1)}%`} icon="📈" color="#8b5cf6" sub="Ratio de rentabilité" isPercent />
            </div>

            {/* --- 2. GRAPHIQUES (Le cœur visuel) --- */}
            <div style={styles.gridCharts}>
                
                {/* GRAPHIQUE PRINCIPAL : COURBES D'ÉVOLUTION */}
                <div style={styles.chartCardLarge}>
                    <h3 style={styles.chartTitle}>Évolution Financière (Année en cours)</h3>
                    <div style={{ height: 300, width: '100%' }}>
                        <ResponsiveContainer>
                            <AreaChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                                <Tooltip contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}} />
                                <Legend />
                                <Area type="monotone" dataKey="Ventes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVentes)" strokeWidth={3} />
                                <Area type="monotone" dataKey="Depenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorDep)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRAPHIQUE SECONDAIRE : RÉPARTITION (CAMEMBERT) */}
                <div style={styles.chartCardSmall}>
                    <h3 style={styles.chartTitle}>Répartition Résultat</h3>
                    <div style={{ height: 300, width: '100%', display:'flex', justifyContent:'center' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={repartitionData}
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {repartitionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{textAlign:'center', marginTop:-20, color:'#64748b', fontSize:'0.9rem'}}>
                        Vue simplifiée (Produits vs Charges)
                    </div>
                </div>

            </div>

          </>
        ) : (
          <div style={styles.repairContainer}>
            <h2 style={{ color: '#e11d48' }}>Initialisation Requise</h2>
            <p style={{ color: '#64748b', marginBottom: 20 }}>Configurez votre entreprise pour accéder aux graphiques.</p>
            <form onSubmit={handleCreateEntreprise} style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <input type="text" placeholder="Nom de votre entreprise" value={newSteName} onChange={e => setNewSteName(e.target.value)} required style={styles.input} />
              <button type="submit" disabled={creating} style={styles.createBtn}>{creating ? '...' : 'Activer'}</button>
            </form>
          </div>
        )}
      </main>

      {/* MODAL GUIDE */}
      {showGuide && (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                <h2 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: 15 }}>🚀 Guide de Démarrage</h2>
                <div style={{ margin: '20px 0' }}>
                    <Step n="1" t="Plan Comptable" d="Allez dans 'Plan Comptable' > 'Importer le modèle OHADA'." />
                    <Step n="2" t="Tiers" d="Créez vos Clients et Fournisseurs." />
                    <Step n="3" t="Opérations" d="Utilisez 'Factures' pour vendre et 'Dépenses' pour acheter." />
                </div>
                <button onClick={() => setShowGuide(false)} style={styles.closeBtn}>Compris !</button>
            </div>
        </div>
      )}
    </div>
  )
}

// --- COMPOSANTS DESIGN ---
function KpiCard({ title, value, icon, color, sub, isPercent }) {
    return (
        <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderBottom: `4px solid ${color}`, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:-10, top:-10, fontSize:'5rem', opacity:0.05, color: 'black' }}>{icon}</div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform:'uppercase' }}>{title}</p>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>
                {typeof value === 'number' && !isPercent ? value.toLocaleString() : value} {isPercent ? '' : 'F'}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: color, fontWeight: '500' }}>{sub}</p>
        </div>
    )
}

function Step({ n, t, d }) {
    return (
        <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
            <div style={{ background: '#eff6ff', color: '#3b82f6', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>{n}</div>
            <div><div style={{ fontWeight: 'bold', color: '#1e293b' }}>{t}</div><div style={{ fontSize: '0.9rem', color: '#64748b' }}>{d}</div></div>
        </div>
    )
}

// --- STYLES CSS-IN-JS ---
const styles = {
    guideBtn: { padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)', display:'flex', gap:10 },
    gridKpi: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginBottom: '40px' },
    gridCharts: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' },
    chartCardLarge: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
    chartCardSmall: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
    chartTitle: { marginTop: 0, marginBottom: 20, color: '#334155', fontSize: '1.1rem' },
    repairContainer: { maxWidth: '500px', margin: '100px auto', background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 10, boxSizing: 'border-box' },
    createBtn: { padding: '12px', width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modal: { background: 'white', padding: '40px', borderRadius: '16px', width: '600px', maxWidth: '90%' },
    closeBtn: { padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: 20, width:'100%' }
};
