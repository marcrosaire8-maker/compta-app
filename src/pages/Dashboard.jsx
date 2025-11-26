import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [stats, setStats] = useState({ ca: 0, depenses: 0, tresorerie: 0, marge: 0 });
  const [graphData, setGraphData] = useState([]);
  const [repartitionData, setRepartitionData] = useState([]);
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
    // Factures → CA + Dépenses
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

    // Trésorerie depuis le plan comptable (comptes 5xxxx)
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

    // Graphique mensuel
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

    // Pie chart
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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Satoshi, sans-serif', color: '#475569'
      }}>
        <div style={{
          width: 80, height: 80,
          border: '6px solid #e2e8f0',
          borderTopColor: '#f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 24
        }}></div>
        <p style={{ fontSize: 24, fontWeight: 600 }}>Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@400;500;700;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Satoshi', sans-serif; background: #f8fafc; color: #1e293b; }

        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
        }
        main {
          flex: 1;
          padding: 40px;
          margin-left: 260px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 50px;
        }
        .header h1 {
          font-size: 44px;
          font-weight: 900;
          background: linear-gradient(90deg, #f97316, #fb923c);
          -webkit-background-clip: text;
          color: transparent;
        }
        .header p {
          color: #64748b;
          font-size: 19px;
          margin-top: 10px;
        }
        .guide-btn {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          border: none;
          padding: 16px 36px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 17px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(139,92,246,0.3);
          transition: all 0.3s;
        }
        .guide-btn:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(139,92,246,0.4); }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          margin-bottom: 60px;
        }
        .kpi-card {
          background: white;
          padding: 36px;
          border-radius: 28px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
          position: relative;
          overflow: hidden;
          transition: transform 0.4s ease;
        }
        .kpi-card:hover { transform: translateY(-12px); }
        .kpi-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 8px;
          background: var(--color);
          border-radius: 28px 28px 0 0;
        }
        .kpi-icon {
          position: absolute;
          top: -20px;
          right: -20px;
          font-size: 110px;
          opacity: 0.06;
          color: #1e293b;
        }
        .kpi-title {
          font-size: 15px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .kpi-value {
          font-size: 44px;
          font-weight: 900;
          color: #1e293b;
          margin: 8px 0;
        }
        .kpi-sub {
          font-size: 16px;
          color: #64748b;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
        }
        .chart-card {
          background: white;
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }
        .chart-title {
          font-size: 26px;
          font-weight: 900;
          color: #1e293b;
          margin-bottom: 32px;
        }

        .setup-card {
          background: white;
          max-width: 560px;
          margin: 120px auto;
          padding: 70px 50px;
          border-radius: 40px;
          text-align: center;
          box-shadow: 0 30px 80px rgba(0,0,0,0.12);
          border: 1px solid #e2e8f0;
        }
        .setup-card h2 {
          font-size: 42px;
          background: linear-gradient(90deg, #f97316, #fb923c);
          -webkit-background-clip: text;
          color: transparent;
          margin-bottom: 16px;
        }

        .modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .modal-content {
          background: white;
          border-radius: 36px;
          padding: 50px;
          max-width: 620px;
          width: 90%;
          box-shadow: 0 40px 100px rgba(0,0,0,0.2);
        }
        .modal h2 {
          font-size: 34px;
          margin-bottom: 36px;
          color: #1e293b;
          text-align: center;
        }
        .step {
          display: flex;
          gap: 24px;
          margin-bottom: 28px;
          align-items: flex-start;
        }
        .step-num {
          background: linear-gradient(135deg, #f97316, #fb923c);
          color: white;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 22px;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          main { margin-left: 0; padding: 20px; }
          .charts-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .header { flex-direction: column; text-align: center; gap: 24px; }
          .header h1 { font-size: 38px; }
        }
      `}</style>

      <div className="dashboard-layout">
        <Sidebar entrepriseNom={entreprise?.nom || 'Mon Entreprise'} userRole={entreprise?.role} />

        <main>
          {entreprise ? (
            <>
              {/* Header */}
              <div className="header">
                <div>
                  <h1>Tableau de Bord</h1>
                  <p>Bienvenue, {entreprise.nom} • Vos finances en un coup d’œil</p>
                </div>
                <button onClick={() => setShowGuide(true)} className="guide-btn">
                  Guide de Démarrage
                </button>
              </div>

              {/* KPI */}
              <div className="kpi-grid">
                <div className="kpi-card" style={{ "--color": "#3b82f6" }}>
                  <div className="kpi-icon">Money</div>
                  <div className="kpi-title">Chiffre d'affaires</div>
                  <div className="kpi-value">{stats.ca.toLocaleString()} F</div>
                  <div className="kpi-sub">Ventes facturées TTC</div>
                </div>

                <div className="kpi-card" style={{ "--color": "#ef4444" }}>
                  <div className="kpi-icon">Expenses</div>
                  <div className="kpi-title">Dépenses</div>
                  <div className="kpi-value">{stats.depenses.toLocaleString()} F</div>
                  <div className="kpi-sub">Achats & charges</div>
                </div>

                <div className="kpi-card" style={{ "--color": "#10b981" }}>
                  <div className="kpi-icon">Bank</div>
                  <div className="kpi-title">Trésorerie</div>
                  <div className="kpi-value">{stats.tresorerie.toLocaleString()} F</div>
                  <div className="kpi-sub">Banque + Caisse réelle</div>
                </div>

                <div className="kpi-card" style={{ "--color": "#8b5cf6" }}>
                  <div className="kpi-icon">Chart</div>
                  <div className="kpi-title">Marge nette</div>
                  <div className="kpi-value">{stats.marge.toFixed(1)} %</div>
                  <div className="kpi-sub">Rentabilité globale</div>
                </div>
              </div>

              {/* Graphiques */}
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Évolution mensuelle {new Date().getFullYear()}</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={graphData}>
                      <defs>
                        <linearGradient id="ventes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="depenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f87171" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#f87171" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip formatter={(v) => v.toLocaleString() + ' F'} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="Ventes" stroke="#3b82f6" fill="url(#ventes)" strokeWidth={4} />
                      <Area type="monotone" dataKey="Depenses" stroke="#f87171" fill="url(#depenses)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Répartition du résultat</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={repartitionData}
                        cx="50%" cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {repartitionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => v.toLocaleString() + ' F'} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="setup-card">
              <h2>Créez votre entreprise</h2>
              <p style={{ color: '#64748b', fontSize: '19px', margin: '20px 0 40px' }}>
                Commencez en 10 secondes • Tout est prêt pour vous
              </p>
              <form onSubmit={handleCreateEntreprise}>
                <input
                  type="text"
                  placeholder="Nom de votre entreprise"
                  value={newSteName}
                  onChange={(e) => setNewSteName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '20px', borderRadius: '20px', border: '2px solid #e2e8f0', fontSize: '18px', marginBottom: '24px' }}
                />
                <button
                  type="submit"
                  disabled={creating}
                  style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', fontSize: '19px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(249,115,22,0.3)' }}
                >
                  {creating ? 'Création en cours...' : 'Activer mon espace'}
                </button>
              </form>
            </div>
          )}

          {/* Modal Guide */}
          {showGuide && (
            <div className="modal" onClick={() => setShowGuide(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Guide de Démarrage Rapide</h2>
                <div className="step">
                  <div className="step-num">1</div>
                  <div>
                    <strong>Importez le plan comptable OHADA</strong>
                    <p style={{ color: '#64748b', marginTop: '6px' }}>Paramètres → Plan Comptable → "Importer SYSCOHADA"</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">2</div>
                  <div>
                    <strong>Ajoutez vos clients & fournisseurs</strong>
                    <p style={{ color: '#64748b', marginTop: '6px' }}>Menu "Tiers" → Nouveau</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">3</div>
                  <div>
                    <strong>Facturez et enregistrez vos dépenses</strong>
                    <p style={{ color: '#64748b', marginTop: '6px' }}>Tout se met à jour automatiquement ici</p>
                  </div>
                </div>
                <button onClick={() => setShowGuide(false)} style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #f97316, #fb923c)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', fontSize: '19px', marginTop: '20px' }}>
                  C’est parti !
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
