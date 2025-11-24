// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import { motion, useScroll, useTransform } from 'framer-motion';

// === ICÔNES SVG PRO ===
const IconMoney = () => (
  <svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 6C17.663 6 6 17.663 6 32s11.663 26 26 26 26-11.663 26-26S46.337 6 32 6zm0 48c-12.15 0-22-9.85-22-22s9.85-22 22-22 22 9.85 22 22-9.85 22-22 22z"/><circle cx="32" cy="32" r="12"/><path d="M32 20v24M20 32h24"/></svg>
);
const IconExpense = () => (
  <svg viewBox="0 0 64 64" fill="currentColor"><path d="M58 10H6a2 2 0 0 0-2 2v40a2 2 0 0 0 2 2h52a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2zM8 14h48v36H8z"/><rect x="16" y="22" width="32" height="8"/><rect x="16" y="36" width="24" height="6"/></svg>
);
const IconBank = () => (
  <svg viewBox="0 0 64 64" fill="currentColor"><path d="M54 14H10a2 2 0 0 0-2 2v32a2 2 0 0 0 2 2h44a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2zM10 16h44v8H10zm0 12h8v16h-8zm12 16h24V28H22z"/><path d="M32 36v12"/></svg>
);

// === STYLES PREMIUM (cohérent avec ton backoffice + effet wow) ===
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  :root {
    --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --muted: #64748b;
    --primary: #4f46e5; --success: #10b981; --danger: #ef4444; --accent: #7c3aed;
    --border: #e2e8f0; --radius: 18px; --shadow: 0 10px 30px -8px rgba(0,0,0,0.1);
  }
  * { box-sizing: border-box; }
  body { margin:0; font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); }

  .dashboard-wrapper { min-height:100vh; position:relative; overflow:hidden; background:var(--bg); }
  .parallax-bg {
    position:fixed; inset:0; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    opacity:0.08; z-index:-2;
  }
  .parallax-layer {
    position:fixed; inset:0;
    background:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><circle cx="60" cy="60" r="40" fill="none" stroke="%23667eea" stroke-width="1" opacity="0.06"/></svg>') repeat;
    background-size:100px; z-index:-1;
  }

  .main-content {
    margin-left:260px; padding:2.5rem; min-height:100vh;
    transition:margin-left .4s ease;
  }
  @media (max-width:1024px) {
    .main-content { margin-left:0; padding:1.5rem; padding-top:90px; }
  }

  .header h1 {
    font-size:clamp(2.2rem,6vw,3.2rem); font-weight:900; margin:0;
    background:linear-gradient(90deg,#1e293b,#4f46e5,#7c3aed);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  }
  .header p { color:var(--muted); font-size:1.1rem; margin:0.5rem 0 0; }

  .stats-grid {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
    gap:2rem; margin:3rem 0;
  }
  .stat-card {
    background:var(--card); border-radius:var(--radius); padding:2rem;
    border:1px solid var(--border); box-shadow:var(--shadow);
    position:relative; overflow:hidden; transition:all .4s ease;
  }
  .stat-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:5px;
    background:linear-gradient(90deg,var(--primary),var(--success));
    transform:translateX(-100%); transition:transform .6s ease;
  }
  .stat-card:hover { transform:translateY(-12px); box-shadow:0 25px 50px -12px rgba(79,70,229,.25); }
  .stat-card:hover::before { transform:translateX(0); }

  .stat-title { font-size:.95rem; text-transform:uppercase; letter-spacing:1px; color:var(--muted); margin-bottom:.75rem; }
  .stat-value { font-size:2.6rem; font-weight:900; margin:0; }
  .stat-icon { font-size:4rem; opacity:0.15; position:absolute; right:1rem; bottom:1rem; }

  .health-card {
    background:var(--card); border-radius:var(--radius); padding:2rem;
    border:1px solid var(--border); box-shadow:var(--shadow);
  }
  .progress-container { margin-top:1rem; }
  .progress-bar {
    height:16px; border-radius:8px; background:linear-gradient(90deg,var(--success),#34d399);
    position:relative; overflow:hidden; transition:width 1.8s ease;
  }
  .progress-bar::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);
    animation:shimmer 2.5s infinite;
  }
  @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

  .modal-overlay {
    position:fixed; inset:0; background:rgba(15,23,42,.85); backdrop-filter:blur(12px);
    display:flex; align-items:center; justify-content:center; z-index:9999; padding:1rem;
  }
  .modal-content {
    background:white; border-radius:24px; padding:3rem; max-width:600px; width:100%;
    box-shadow:0 30px 80px -20px rgba(0,0,0,.4);
  }
  .create-card {
    background:var(--card); border-radius:var(--radius); padding:3rem;
    border:1px solid var(--border); box-shadow:var(--shadow); text-align:center;
  }
`;

// === COMPOSANT PRINCIPAL ===
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [stats, setStats] = useState({ ca: 0, depenses: 0, tresorerie: 0 });
  const [newSteName, setNewSteName] = useState('');
  const [creating, setCreating] = useState(false);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -250]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -120]);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      await calculerStats(ste.id);
    }
    setLoading(false);
  }

  async function calculerStats(id) {
    let ca = 0, dep = 0, treso = 0;

    // Factures
    const { data: factures } = await supabase.from('factures').select('type_facture,total_ttc').eq('entreprise_id', id);
    factures?.forEach(f => {
      if (f.type_facture === 'VENTE') ca += f.total_ttc;
      if (f.type_facture === 'ACHAT') dep += f.total_ttc;
    });

    // Trésorerie (comptes 5xxxx)
    const { data: lignes } = await supabase
      .from('lignes_ecriture')
      .select('debit,credit,plan_comptable!inner(code_compte)')
      .eq('plan_comptable.entreprise_id', id);

    lignes?.forEach(l => {
      if (l.plan_comptable?.code_compte?.toString().startsWith('5')) {
        treso += (l.debit - l.credit);
      }
    });

    setStats({ ca, depenses: dep, tresorerie: treso });
  }

  async function createEntreprise(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('entreprises').insert([
        { nom: newSteName.trim(), owner_id: user.id, email_contact: user.email }
      ]);
      alert('Entreprise créée avec succès !');
      window.location.reload();
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div style={{height:'100vh',display:'grid',placeItems:'center',background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',fontSize:'2rem'}}>Chargement…</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <style>{styles}</style>
      <motion.div className="parallax-bg" style={{ y: y1 }} />
      <motion.div className="parallax-layer" style={{ y: y2 }} />

      <Sidebar entrepriseNom={entreprise?.nom || 'Mon espace'} userRole={entreprise?.role} />

      <main className="main-content">
        {entreprise ? (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1.5rem',marginBottom:'3rem'}}>
              <div>
                <h1>Tableau de Bord</h1>
                <p>Bienvenue chez <strong style={{color:'#4f46e5'}}>{entreprise.nom}</strong></p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowGuide(true)}
                style={{padding:'1rem 2rem',background:'linear-gradient(90deg,#4f46e5,#7c3aed)',color:'white',border:'none',borderRadius:'14px',fontWeight:700,cursor:'pointer'}}
              >
                Guide de Démarrage
              </motion.button>
            </div>

            <div className="stats-grid">
              <motion.div whileHover={{ y: -10 }} className="stat-card">
                <div className="stat-title">Chiffre d'Affaires</div>
                <div className="stat-value" style={{color:'#10b981'}}>{stats.ca.toLocaleString()} F</div>
                <div className="stat-icon"><IconMoney /></div>
              </motion.div>
              <motion.div whileHover={{ y: -10 }} className="stat-card">
                <div className="stat-title">Dépenses</div>
                <div className="stat-value" style={{color:'#ef4444'}}>{stats.depenses.toLocaleString()} F</div>
                <div className="stat-icon"><IconExpense /></div>
              </motion.div>
              <motion.div whileHover={{ y: -10 }} className="stat-card">
                <div className="stat-title">Trésorerie</div>
                <div className="stat-value" style={{color:'#4f46e5'}}>{stats.tresorerie.toLocaleString()} F</div>
                <div className="stat-icon"><IconBank /></div>
              </motion.div>
            </div>

            <motion.div className="health-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <h3 style={{margin:'0 0 1.5rem',fontSize:'1.4rem'}}>Santé financière</h3>
              <div style={{display:'flex',alignItems:'center',gap:'2rem'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'.95rem',color:'var(--muted)',marginBottom:'.75rem'}}>Marge nette estimée</div>
                  <div style={{height:16,background:'#f1f5f9',borderRadius:8,overflow:'hidden'}}>
                    <div className="progress-bar" style={{width: `${stats.ca > 0 ? Math.max(0, Math.min(100, ((stats.ca - stats.depenses) / stats.ca) * 100)) : 0}%`}} />
                  </div>
                </div>
                <div style={{fontSize:'2.4rem',fontWeight:900,color:'#10b981'}}>
                  {stats.ca > 0 ? (((stats.ca - stats.depenses) / stats.ca) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div className="create-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120 }}>
            <h2 style={{fontSize:'2.6rem',background:'linear-gradient(90deg,#4f46e5,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',margin:'0 0 1rem'}}>
              Créez votre entreprise
            </h2>
            <p style={{color:'var(--muted)',fontSize:'1.2rem',margin:'1.5rem 0 2.5rem'}}>Commencez en 10 secondes</p>
            <form onSubmit={createEntreprise}>
              <input
                type="text" required placeholder="Nom de votre entreprise (ex: Ma Boutique SARL)"
                value={newSteName} onChange={e => setNewSteName(e.target.value)}
                style={{width:'100%',padding:'1.2rem 1.6rem',fontSize:'1.1rem',borderRadius:'14px',border:'1px solid var(--border)',marginBottom:'1.5rem'}}
              />
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={creating}
                style={{width:'100%',padding:'1.2rem',background:'linear-gradient(90deg,#4f46e5,#7c3aed)',color:'white',border:'none',borderRadius:'14px',fontWeight:800,fontSize:'1.2rem',cursor:'pointer'}}
              >
                {creating ? 'Création...' : 'Activer mon espace comptable'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </main>

      {/* Guide Modal */}
      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h2 style={{fontSize:'2.4rem',textAlign:'center',marginBottom:'2rem'}}>Bienvenue !</h2>
            {[
              "Configurer votre plan comptable OHADA",
              "Ajouter vos premiers clients & fournisseurs",
              "Émettre votre première facture",
              "Suivre votre trésorerie en temps réel"
            ].map((t, i) => (
              <div key={i} style={{display:'flex',gap:'1.5rem',alignItems:'center',marginBottom:'1.8rem'}}>
                <div style={{background:'#e0e7ff',color:'#4f46e5',width:56,height:56,borderRadius:16,display:'grid',placeItems:'center',fontWeight:900,fontSize:'1.4rem'}}>
                  {i + 1}
                </div>
                <div style={{fontSize:'1.25rem',fontWeight:600}}>{t}</div>
              </div>
            ))}
            <div style={{textAlign:'right',marginTop:'3rem'}}>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowGuide(false)}
                style={{padding:'1rem 2.5rem',background:'linear-gradient(90deg,#4f46e5,#7c3aed)',color:'white',border:'none',borderRadius:'14px',fontWeight:700,fontSize:'1.1rem',cursor:'pointer'}}
              >
                C’est parti !
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
