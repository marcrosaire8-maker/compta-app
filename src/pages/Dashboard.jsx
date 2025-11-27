import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DashboardAppleStyle() {
  const navigate = useNavigate();
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [stats, setStats] = useState({ ca: 0, depenses: 0, tresorerie: 0, marge: 0 });
  const [graphData, setGraphData] = useState([]);
  const [repartitionData, setRepartitionData] = useState([]);
  
  // UI States
  const [showGuide, setShowGuide] = useState(false);
  const [newSteName, setNewSteName] = useState('');
  const [creating, setCreating] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // Mode Sombre/Clair
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => { checkUser(); }, []);

  // Gestion de la souris pour l'effet Parallaxe subtil
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    // On normalise entre -1 et 1
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

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
    // ... (Logique identique à ton code original pour charger les données) ...
    const { data: factures } = await supabase
      .from('factures')
      .select('type_facture, total_ttc, date_emission')
      .eq('entreprise_id', entrepriseId)
      .order('date_emission', { ascending: true });

    let caTotal = 0, depensesTotal = 0;
    factures?.forEach(f => {
      if (f.type_facture === 'VENTE') caTotal += f.total_ttc;
      if (f.type_facture === 'ACHAT') depensesTotal += f.total_ttc;
    });

    const { data: lignes } = await supabase
      .from('lignes_ecriture')
      .select('debit, credit, compte:plan_comptable!inner(code_compte)')
      .eq('plan_comptable.entreprise_id', entrepriseId);

    let treso = 0;
    lignes?.forEach(l => {
      if (l.compte.code_compte.toString().startsWith('5')) {
        treso += (l.debit - l.credit);
      }
    });

    const moisNoms = ["Jan", "Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];
    const currentYear = new Date().getFullYear();
    const monthlyStats = moisNoms.map(name => ({ name, Ventes: 0, Depenses: 0 }));

    factures?.forEach(f => {
      const d = new Date(f.date_emission);
      if (d.getFullYear() === currentYear) {
        const mois = d.getMonth();
        if (f.type_facture === 'VENTE') monthlyStats[mois].Ventes += f.total_ttc;
        if (f.type_facture === 'ACHAT') monthlyStats[mois].Depenses += f.total_ttc;
      }
    });

    const pieData = [
      { name: 'Bénéfice', value: Math.max(0, caTotal - depensesTotal), color: '#10b981' },
      { name: 'Dépenses', value: depensesTotal, color: '#f87171' },
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

  async function handleCreateEntreprise(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('entreprises').insert([{
        nom: newSteName,
        owner_id: user.id,
        email_contact: user.email
      }]);
      window.location.reload();
    } catch (error) {
      alert("Erreur : " + error.message);
    } finally {
      setCreating(false);
    }
  }

  // --- RENDER ---

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#000' : '#fff' }}>
        Chargement...
      </div>
    );
  }

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;800&display=swap');
        
        :root {
          --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* THÈMES VARIABLES */
        .light {
          --bg-main: #f2f2f7; /* Apple Light Gray */
          --bg-glass: rgba(255, 255, 255, 0.65);
          --bg-card: #ffffff;
          --text-primary: #1d1d1f;
          --text-secondary: #86868b;
          --border: rgba(0,0,0,0.05);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
          --accent-grad: linear-gradient(135deg, #007AFF, #5856D6);
          --chart-grid: #e5e5ea;
        }

        .dark {
          --bg-main: #000000;
          --bg-glass: rgba(28, 28, 30, 0.65);
          --bg-card: #1c1c1e;
          --text-primary: #f5f5f7;
          --text-secondary: #a1a1a6;
          --border: rgba(255,255,255,0.1);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.5);
          --accent-grad: linear-gradient(135deg, #0A84FF, #5E5CE6);
          --chart-grid: #333;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; }

        .app-wrapper {
          display: flex;
          min-height: 100vh;
          background: var(--bg-main);
          color: var(--text-primary);
          transition: background 0.5s ease;
          position: relative;
          z-index: 1;
        }

        /* BACKGROUND ORBS (PARALLAX) */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          z-index: -1;
          opacity: 0.4;
          transition: transform 0.1s linear;
        }
        .orb-1 {
          top: -10%; left: -10%; width: 50vw; height: 50vw;
          background: #3b82f6;
        }
        .orb-2 {
          bottom: -10%; right: -10%; width: 40vw; height: 40vw;
          background: #f97316;
        }

        /* MAIN CONTENT */
        main {
          flex: 1;
          padding: 40px;
          margin-left: 260px; /* Sidebar width */
          position: relative;
        }

        /* HEADER */
        .top-bar {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 50px;
          animation: slideDown 0.8s ease-out;
        }
        h1 {
          font-size: 48px; font-weight: 800; letter-spacing: -1px;
          background: var(--text-primary);
          -webkit-background-clip: text; color: transparent; /* Fallback */
          color: var(--text-primary);
        }
        .subtitle { color: var(--text-secondary); font-size: 18px; margin-top: 5px; }

        /* THEME TOGGLE */
        .theme-switch {
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 10px 20px;
          border-radius: 99px;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-primary);
          display: flex; align-items: center; gap: 8px;
          box-shadow: var(--shadow);
          transition: var(--transition);
        }
        .theme-switch:hover { transform: scale(1.05); }

        /* BENTO GRID */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: auto auto; /* KPI row, Charts row */
          gap: 24px;
        }

        /* CARDS */
        .card {
          background: var(--bg-glass);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid var(--border);
          border-radius: 32px;
          padding: 32px;
          box-shadow: var(--shadow);
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }
        .card:hover {
          transform: translateY(-5px) scale(1.01);
          border-color: rgba(120, 120, 120, 0.3);
        }

        /* KPI Specifics */
        .kpi-card {
          grid-column: span 1;
          display: flex; flex-direction: column; justify-content: space-between;
          height: 200px;
          animation: fadeUp 0.6s ease-out backwards;
        }
        .kpi-label { font-size: 14px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
        .kpi-val { font-size: 36px; font-weight: 800; margin: 10px 0; letter-spacing: -1px; }
        .kpi-trend { font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
        
        .trend-up { color: #34c759; } /* Apple Green */
        .trend-down { color: #ff3b30; } /* Apple Red */

        /* Charts Specifics */
        .big-chart {
          grid-column: span 3;
          height: 450px;
          animation: fadeUp 0.6s ease-out 0.2s backwards;
        }
        .pie-chart {
          grid-column: span 1;
          height: 450px;
          animation: fadeUp 0.6s ease-out 0.3s backwards;
          display: flex; flex-direction: column; alignItems: center; justifyContent: center;
        }

        .chart-header { margin-bottom: 20px; font-size: 20px; font-weight: 700; }

        /* ANIMATIONS */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* RESPONSIVE */
        @media (max-width: 1200px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .kpi-card { grid-column: span 1; }
          .big-chart { grid-column: span 2; }
          .pie-chart { grid-column: span 2; }
        }
        @media (max-width: 1024px) {
           main { margin-left: 0; }
        }
        @media (max-width: 768px) {
          .bento-grid { display: flex; flex-direction: column; }
          .big-chart, .pie-chart, .kpi-card { height: auto; min-height: 200px; }
          h1 { font-size: 32px; }
        }
      `}</style>

      {/* --- PARALLAX ORBS --- */}
      <div className="orb orb-1" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}></div>
      <div className="orb orb-2" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}></div>

      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <main>
        {entreprise ? (
          <>
            <div className="top-bar">
              <div>
                <h1>Dashboard</h1>
                <p className="subtitle">Vue d'ensemble financière • {entreprise.nom}</p>
              </div>
              <button className="theme-switch" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            </div>

            <div className="bento-grid">
              {/* KPI 1: CA */}
              <div className="card kpi-card" style={{animationDelay:'0.05s'}}>
                <div className="kpi-label">Chiffre d'Affaires</div>
                <div className="kpi-val">{stats.ca.toLocaleString()} F</div>
                <div className="kpi-trend trend-up">
                  ↑ Performance
                </div>
                {/* Visual Icon background opacity */}
                <div style={{position:'absolute', right:'-20px', bottom:'-20px', fontSize:'100px', opacity:0.05, transform:'rotate(-15deg)'}}>💰</div>
              </div>

              {/* KPI 2: Dépenses */}
              <div className="card kpi-card" style={{animationDelay:'0.1s'}}>
                <div className="kpi-label">Dépenses Totales</div>
                <div className="kpi-val">{stats.depenses.toLocaleString()} F</div>
                <div className="kpi-trend trend-down">
                  ↘ Contrôle des coûts
                </div>
                 <div style={{position:'absolute', right:'-20px', bottom:'-20px', fontSize:'100px', opacity:0.05, transform:'rotate(-15deg)'}}>📉</div>
              </div>

              {/* KPI 3: Trésorerie */}
              <div className="card kpi-card" style={{animationDelay:'0.15s'}}>
                <div className="kpi-label">Trésorerie Nette</div>
                <div className="kpi-val" style={{color: stats.tresorerie < 0 ? '#ff3b30' : 'inherit'}}>{stats.tresorerie.toLocaleString()} F</div>
                <div className="kpi-trend trend-up">
                  Disponibilités
                </div>
                 <div style={{position:'absolute', right:'-20px', bottom:'-20px', fontSize:'100px', opacity:0.05, transform:'rotate(-15deg)'}}>🏦</div>
              </div>

              {/* KPI 4: Marge */}
              <div className="card kpi-card" style={{animationDelay:'0.2s'}}>
                <div className="kpi-label">Marge Bénéficiaire</div>
                <div className="kpi-val">{stats.marge.toFixed(1)} %</div>
                <div className="kpi-trend" style={{color: '#0A84FF'}}>
                  Ratio de rentabilité
                </div>
                 <div style={{position:'absolute', right:'-20px', bottom:'-20px', fontSize:'100px', opacity:0.05, transform:'rotate(-15deg)'}}>📊</div>
              </div>

              {/* BIG CHART */}
              <div className="card big-chart">
                <h3 className="chart-header">Flux de Trésorerie {new Date().getFullYear()}</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={graphData}>
                    <defs>
                      <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff3b30" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="Ventes" stroke="#007AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorVentes)" />
                    <Area type="monotone" dataKey="Depenses" stroke="#ff3b30" strokeWidth={3} fillOpacity={1} fill="url(#colorDepenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* PIE CHART */}
              <div className="card pie-chart">
                <h3 className="chart-header">Répartition</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={repartitionData}
                      cx="50%" cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {repartitionData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{textAlign:'center', marginTop:'10px', color:'var(--text-secondary)', fontSize:'14px'}}>
                   Ratio Dépenses / Bénéfice
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{maxWidth:'500px', margin:'100px auto', textAlign:'center'}}>
            <h2 style={{fontSize:'32px', marginBottom:'20px'}}>Bienvenue 👋</h2>
            <p style={{color:'var(--text-secondary)', marginBottom:'30px'}}>Configurez votre espace en quelques secondes.</p>
            <form onSubmit={handleCreateEntreprise}>
              <input
                type="text"
                placeholder="Nom de l'entreprise"
                value={newSteName}
                onChange={(e) => setNewSteName(e.target.value)}
                style={{
                  width:'100%', padding:'15px', borderRadius:'12px', border:'1px solid var(--border)',
                  background:'var(--bg-main)', color:'var(--text-primary)', marginBottom:'20px', fontSize:'16px'
                }}
              />
              <button 
                type="submit" 
                disabled={creating}
                style={{
                  width:'100%', padding:'15px', borderRadius:'12px', border:'none',
                  background:'var(--text-primary)', color:'var(--bg-main)', fontWeight:'700', fontSize:'16px', cursor:'pointer'
                }}
              >
                {creating ? 'Création...' : 'Démarrer'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}