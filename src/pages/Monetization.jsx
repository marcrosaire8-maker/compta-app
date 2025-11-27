import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useOutletContext } from 'react-router-dom';

/* --- ICONS --- */
const IconPlans = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75l-2.25 1.313M12 21.75V19.5m0-6.75l2.25-1.313M12 12.75l-2.25 1.313M12 12.75V15" /></svg>;
const IconUsers = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const IconEdit = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const IconTrash = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconSun = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;
const IconMoon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>;
const IconPlus = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;

/* --- SPOTLIGHT CARD COMPONENT --- */
const SpotlightCard = ({ children, className = "", style = {}, onClick }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || window.innerWidth < 768) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onClick={onClick}
      className={`spotlight-card ${className}`}
      style={style}
    >
      <div
        className="spotlight-overlay"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, var(--spotlight-color), transparent 40%)`
        }}
      />
      <div className="card-content-wrapper">
        {children}
      </div>
    </div>
  );
};

export default function MonetizationPro() {
  const { companies } = useOutletContext();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({ 
      nom_plan: '', prix_mensuel: 0, max_utilisateurs: 1, max_ecritures: 500, description: '', est_actif: true 
  });

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkMode(true);
    fetchPlans();
  }, []);

  async function fetchPlans() {
    await new Promise(r => setTimeout(r, 600)); // Simu latency
    const { data, error } = await supabase
        .from('plans')
        .select('*, abonnements(count)')
        .order('prix_mensuel', { ascending: true });
    if (error) console.error(error);
    setPlans(data || []);
    setLoading(false);
  }

  const handleGlobalMouseMove = (e) => {
    if (window.innerWidth < 768) return;
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    setMousePos({ x, y });
  };

  // --- GESTION MODAL ---
  const openModal = (plan = null) => {
    if (plan) {
        setEditingPlan(plan);
        setFormData({ ...plan });
    } else {
        setEditingPlan(null);
        setFormData({ nom_plan: '', prix_mensuel: 0, max_utilisateurs: 1, max_ecritures: 500, description: '', est_actif: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...formData, prix_mensuel: Number(formData.prix_mensuel), max_utilisateurs: Number(formData.max_utilisateurs), max_ecritures: Number(formData.max_ecritures) };
    let error;
    if (editingPlan) ({ error } = await supabase.from('plans').update(payload).eq('id', editingPlan.id));
    else ({ error } = await supabase.from('plans').insert([payload]));

    if (error) alert("Erreur : " + error.message);
    else {
        setIsModalOpen(false);
        await fetchPlans();
    }
    setLoading(false);
  };

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer le plan "${nom}" ?`)) return;
    setLoading(true);
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) alert("Impossible de supprimer : Ce plan est utilisé.");
    else await fetchPlans();
    setLoading(false);
  };

  const totalSubscribers = useMemo(() => plans.reduce((acc, p) => acc + (p.abonnements[0]?.count || 0), 0), [plans]);
  const averagePrice = useMemo(() => plans.length > 0 ? plans.reduce((acc, p) => acc + p.prix_mensuel, 0) / plans.length : 0, [plans]);

  if (loading && plans.length === 0) {
    return (
      <div style={{
        height:'100vh', width:'100%', display:'grid', placeItems:'center', 
        background: darkMode ? '#000' : '#F2F2F7', color: darkMode ? '#fff' : '#000'
      }}>Chargement du catalogue...</div>
    );
  }

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleGlobalMouseMove}>
      
      {/* CORRECTION ICI : La balise style est auto-fermante et ne contient PAS de </style> à la fin */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        :root { --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1); }

        .light {
          --bg-main: #F2F2F7; --bg-card: rgba(255, 255, 255, 0.65); --bg-card-hover: rgba(255, 255, 255, 0.85);
          --text-primary: #1D1D1F; --text-secondary: #86868B; --accent: #0071E3; --accent-red: #FF3B30;
          --border: rgba(0, 0, 0, 0.05); --glass-border: rgba(255, 255, 255, 0.4);
          --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05); --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01);
          --spotlight-color: rgba(0,0,0,0.05); --input-bg: rgba(255,255,255,0.5);
        }
        .dark {
          --bg-main: #000000; --bg-card: rgba(28, 28, 30, 0.65); --bg-card-hover: rgba(44, 44, 46, 0.85);
          --text-primary: #F5F5F7; --text-secondary: #86868B; --accent: #2997FF; --accent-red: #FF453A;
          --border: rgba(255, 255, 255, 0.1); --glass-border: rgba(255, 255, 255, 0.15);
          --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.5); --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          --spotlight-color: rgba(255,255,255,0.1); --input-bg: rgba(0,0,0,0.2);
        }

        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; width: 100%; overflow-x: hidden; font-family: 'Inter', sans-serif; background: var(--bg-main); }
        .app-wrapper { min-height: 100vh; width: 100%; position: relative; display: flex; flex-direction: column; align-items: center; overflow-x: hidden; transition: background 0.5s; }

        /* --- BACKGROUND FX --- */
        .bg-mesh, .grid-pattern { position: fixed; inset: 0; pointer-events: none; z-index: 0; width: 100vw; height: 100vh; }
        .bg-mesh { background-image: radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.15), transparent 25%); filter: blur(60px); opacity: 0.8; transition: transform 0.2s linear; }
        .grid-pattern { background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(to right, var(--border) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(circle at center, black 40%, transparent 100%); opacity: 0.3; }

        /* --- LAYOUT --- */
        .dashboard-container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 80px 24px 100px; position: relative; z-index: 10; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; width: 100%; }
        .title-group h1 { font-size: clamp(28px, 5vw, 42px); font-weight: 700; margin: 0; background: linear-gradient(180deg, var(--text-primary) 0%, var(--text-secondary) 150%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .title-group p { color: var(--text-secondary); margin-top: 8px; font-size: 14px; }
        .header-actions { display: flex; gap: 16px; align-items: center; }
        .theme-toggle, .btn-primary { height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; font-weight: 600; }
        .theme-toggle { background: var(--bg-card); border: 1px solid var(--border); width: 44px; color: var(--text-primary); }
        .btn-primary { background: var(--accent); color: white; border: none; padding: 0 20px; gap: 8px; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 113, 227, 0.4); }

        /* --- KPI GRID --- */
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px; width: 100%; }
        .spotlight-card { position: relative; border-radius: 24px; padding: 32px; background: var(--bg-card); backdrop-filter: blur(20px); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; transition: 0.4s; }
        .card-content-wrapper { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
        .card-icon-box { width: 48px; height: 48px; border-radius: 14px; color: white; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
        .card-value { font-size: 36px; font-weight: 700; color: var(--text-primary); }
        .card-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-top: 4px; }

        /* --- PLANS GRID --- */
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; width: 100%; }
        .plan-card { cursor: pointer; }
        .plan-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .plan-name { font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
        .plan-price { font-size: 32px; font-weight: 800; color: var(--accent); }
        .plan-price span { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
        .plan-limits { display: flex; gap: 16px; margin-bottom: 20px; color: var(--text-secondary); font-size: 14px; font-weight: 500; }
        .limit-item { display: flex; align-items: center; gap: 6px; }
        .plan-description { color: var(--text-secondary); font-size: 14px; line-height: 1.5; flex-grow: 1; margin-bottom: 24px; }
        .plan-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 20px; }
        .plan-badge { padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .badge-green { background: rgba(52, 199, 89, 0.15); color: #34C759; }
        .badge-grey { background: rgba(142, 142, 147, 0.15); color: #8E8E93; }
        .plan-actions { display: flex; gap: 8px; }
        .btn-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary); transition: 0.2s; cursor: pointer; }
        .btn-icon:hover { background: var(--bg-card-hover); color: var(--text-primary); border-color: var(--accent); }
        .btn-icon.delete:hover { color: var(--accent-red); border-color: var(--accent-red); }

        /* --- MODAL --- */
        .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; padding: 20px; animation: fadeIn 0.3s ease-out; }
        .modal-content { background: var(--bg-card); backdrop-filter: blur(30px); border: 1px solid var(--glass-border); border-radius: 24px; padding: 32px; width: 100%; max-width: 500px; box-shadow: var(--shadow-xl); animation: slideUp 0.4s var(--ease-out-expo); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .modal-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
        .btn-close { background: none; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; }
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .form-input, .form-textarea { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text-primary); font-family: 'Inter', sans-serif; outline: none; transition: 0.3s; }
        .form-input:focus, .form-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15); }
        .form-row { display: flex; gap: 16px; }
        .checkbox-group { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--input-bg); border-radius: 12px; cursor: pointer; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
        .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--text-primary); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* --- MOBILE --- */
        @media (max-width: 768px) {
            .dashboard-container { padding: 40px 20px 80px; }
            .header { flex-direction: column; align-items: flex-start; gap: 24px; }
            .header-actions { width: 100%; justify-content: space-between; }
            .title-group { width: 100%; } .theme-toggle { order: 2; } .btn-primary { order: 1; flex-grow: 1; }
            .kpi-grid { grid-template-columns: 1fr; gap: 16px; }
            .spotlight-card { padding: 24px; }
            .card-content-wrapper { flex-direction: row; align-items: center; gap: 20px; }
            .card-icon-box { margin-bottom: 0; width: 48px; height: 48px; flex-shrink: 0; }
            .plans-grid { grid-template-columns: 1fr; }
        }
      `}} />

      <div className="bg-mesh" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }} />
      <div className="grid-pattern" style={{ transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)` }} />

      <div className="dashboard-container">
        <header className="header">
          <div className="title-group">
            <h1>Monétisation</h1>
            <p>Gérez votre catalogue d'offres et suivez les performances.</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => openModal()}>
                <IconPlus /> Nouveau Plan
            </button>
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </header>

        {/* KPI GRID */}
        <div className="kpi-grid">
            <SpotlightCard>
                <div className="card-icon-box" style={{ background: 'linear-gradient(135deg, #FF3B30, #FF9500)' }}>
                    <IconPlans />
                </div>
                <div>
                    <div className="card-value">{plans.length}</div>
                    <div className="card-label">Offres au catalogue</div>
                </div>
            </SpotlightCard>
            <SpotlightCard>
                <div className="card-icon-box" style={{ background: 'linear-gradient(135deg, #34C759, #30B0C7)' }}>
                    <IconUsers />
                </div>
                <div>
                    <div className="card-value">{totalSubscribers}</div>
                    <div className="card-label">Abonnements Actifs</div>
                </div>
            </SpotlightCard>
            <SpotlightCard>
                <div className="card-icon-box" style={{ background: 'linear-gradient(135deg, #0071E3, #5E5CE6)' }}>
                    <span style={{fontSize: 24, fontWeight: 800}}>F</span>
                </div>
                <div>
                    <div className="card-value">{averagePrice.toLocaleString(undefined, {maximumFractionDigits:0})} F</div>
                    <div className="card-label">Prix Moyen / Mois</div>
                </div>
            </SpotlightCard>
        </div>

        {/* PLANS GRID */}
        <div className="plans-grid">
            {plans.map((plan) => (
                <SpotlightCard key={plan.id} className="plan-card" onClick={() => openModal(plan)}>
                    <div className="plan-header">
                        <div>
                            <div className="plan-name">{plan.nom_plan}</div>
                            <div className="plan-limits">
                                <div className="limit-item"><IconUsers /> {plan.max_utilisateurs} users</div>
                                <div>•</div>
                                <div>{plan.max_ecritures.toLocaleString()} écritures</div>
                            </div>
                        </div>
                        <div className="plan-price">
                            {plan.prix_mensuel.toLocaleString()} <span>F/mois</span>
                        </div>
                    </div>
                    <p className="plan-description">{plan.description || "Aucune description."}</p>
                    <div className="plan-footer">
                        <div className={`plan-badge ${plan.est_actif ? 'badge-green' : 'badge-grey'}`}>
                            <span style={{width:8, height:8, borderRadius:'50%', background: plan.est_actif ? '#34C759' : '#8E8E93'}} />
                            {plan.est_actif ? 'Visible' : 'Masqué'} ({plan.abonnements[0]?.count || 0} actifs)
                        </div>
                        <div className="plan-actions">
                            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openModal(plan); }}>
                                <IconEdit />
                            </button>
                            <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); handleDelete(plan.id, plan.nom_plan); }}>
                                <IconTrash />
                            </button>
                        </div>
                    </div>
                </SpotlightCard>
            ))}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{editingPlan ? 'Modifier l\'offre' : 'Créer une offre'}</h3>
                    <button className="btn-close" onClick={() => setIsModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Nom de l'offre</label>
                        <input type="text" required className="form-input" placeholder="Ex: Business Pro" value={formData.nom_plan} onChange={e => setFormData({...formData, nom_plan: e.target.value})} />
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{flex:1}}>
                            <label className="form-label">Prix mensuel (FCFA)</label>
                            <input type="number" required className="form-input" placeholder="0" value={formData.prix_mensuel} onChange={e => setFormData({...formData, prix_mensuel: e.target.value})} />
                        </div>
                        <div className="form-group" style={{flex:1}}>
                            <label className="form-label">Utilisateurs max</label>
                            <input type="number" required className="form-input" value={formData.max_utilisateurs} onChange={e => setFormData({...formData, max_utilisateurs: e.target.value})} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Écritures max / mois</label>
                        <input type="number" required className="form-input" value={formData.max_ecritures} onChange={e => setFormData({...formData, max_ecritures: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows="3" placeholder="Arguments de vente..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <label className="checkbox-group">
                        <input type="checkbox" checked={formData.est_actif} onChange={e => setFormData({...formData, est_actif: e.target.checked})} />
                        <span style={{fontSize:14, fontWeight:500}}>Rendre cette offre visible publiquement</span>
                    </label>
                    <div className="modal-footer">
                        <button type="button" className="btn-primary btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                        <button type="submit" className="btn-primary" disabled={loading}>{loading ? '...' : 'Enregistrer'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
