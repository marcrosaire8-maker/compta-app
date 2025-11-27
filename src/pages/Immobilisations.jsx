import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';

/* --- ICONS --- */
const IconPlus = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const IconCube = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>;
const IconSun = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>;
const IconMoon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>;

/* --- 3D TILT HOOK --- */
const useTilt = (active) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const card = ref.current;
    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -2; // Max 2deg rotation
      const rotateY = ((x - centerX) / centerX) * 2;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    };
    const handleLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };
    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
    return () => {
      card.removeEventListener('mousemove', handleMove);
      card.removeEventListener('mouseleave', handleLeave);
    };
  }, [active]);
  return ref;
};

const TiltCard = ({ children, className }) => {
  const tiltRef = useTilt(true);
  return <div ref={tiltRef} className={className}>{children}</div>;
};

export default function ImmobilisationsUltimate() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [actifs, setActifs] = useState([]);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Form Data
  const [formData, setFormData] = useState({
    designation: '',
    date_acquisition: new Date().toISOString().split('T')[0],
    valeur_origine: '',
    duree_mois: 60
  });

  useEffect(() => { initData(); }, []);

  // Parallaxe Mouse Tracker
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchImmobilisations(ste.id);
    }
    setLoading(false);
  }

  async function fetchImmobilisations(entrepriseId) {
    const { data } = await supabase
      .from('tableau_amortissement')
      .select('*')
      .eq('entreprise_id', entrepriseId)
      .order('date_acquisition', { ascending: false });
    setActifs(data || []);
  }

  async function handleSave(e) {
    e.preventDefault();
    const valeur = Number(formData.valeur_origine);
    if (!valeur || valeur <= 0) return alert('Valeur invalide');

    const payload = {
      entreprise_id: entreprise.id,
      designation: formData.designation.trim(),
      date_acquisition: formData.date_acquisition,
      valeur_origine: valeur,
      duree_mois: Number(formData.duree_mois),
      valeur_nette_comptable: valeur,
      amortissement_cumule: 0
    };

    const { error } = await supabase.from('tableau_amortissement').insert([payload]);
    if (error) alert('Erreur : ' + error.message);
    else {
      alert('Actif enregistré !');
      setIsModalOpen(false);
      setFormData({ designation: '', date_acquisition: new Date().toISOString().split('T')[0], valeur_origine: '', duree_mois: 60 });
      fetchImmobilisations(entreprise.id);
    }
  }

  if (loading) return <div style={{height:'100vh', background:'#000', color:'white', display:'grid', placeItems:'center'}}>Chargement...</div>;

  // Calculs Totaux
  const totalValeur = actifs.reduce((acc, a) => acc + Number(a.valeur_origine), 0);
  const totalVNC = actifs.reduce((acc, a) => acc + Number(a.valeur_nette_comptable), 0);

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root { --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

        .light {
          --bg-main: #f2f2f7; --bg-glass: rgba(255, 255, 255, 0.65); --bg-card: #ffffff;
          --text-primary: #1d1d1f; --text-secondary: #86868b; --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); 
          --accent: #8b5cf6; /* Violet/Purple for Assets */
          --accent-glow: rgba(139, 92, 246, 0.3);
          --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000; --bg-glass: rgba(28, 28, 30, 0.65); --bg-card: #1c1c1e;
          --text-primary: #f5f5f7; --text-secondary: #a1a1a6; --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6); 
          --accent: #a78bfa;
          --accent-glow: rgba(167, 139, 250, 0.4);
          --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }
        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- PARALLAX ORBS --- */
        .orb { position: fixed; border-radius: 50%; filter: blur(120px); z-index: 0; pointer-events: none; opacity: 0.4; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--accent); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #ec4899; } /* Pink */

        /* --- LAYOUT --- */
        .sidebar-wrapper { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 50; transition: transform 0.3s ease; }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40; display: none; opacity: 0; transition: opacity 0.3s; }
        main { min-height: 100vh; padding: 40px; margin-left: 260px; position: relative; z-index: 1; transition: margin-left 0.3s ease; }

        /* --- HEADER --- */
        .header-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; animation: slideDown 0.8s ease-out; }
        .header-content h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%); -webkit-background-clip: text; color: transparent; }
        .actions { display: flex; gap: 12px; align-items: center; }

        .btn-menu-mobile { display: none; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-size: 24px; padding: 8px 12px; border-radius: 12px; cursor: pointer; }
        .btn-theme { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: var(--transition); box-shadow: var(--shadow); color: var(--text-primary); }
        .btn-theme:hover { transform: scale(1.1); }

        .btn-primary { padding: 14px 24px; border-radius: 99px; border: none; background: linear-gradient(135deg, var(--accent), #7c3aed); color: white; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 8px 20px var(--accent-glow); transition: var(--transition); display: flex; align-items: center; gap: 8px; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px var(--accent-glow); }

        /* --- HERO CARD (Total Stats) --- */
        .hero-stats { 
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; 
          animation: fadeUp 0.6s ease-out;
        }
        .stat-box {
          background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border);
          border-radius: 24px; padding: 30px; position: relative; overflow: hidden;
          transition: 0.2s;
        }
        .stat-box:hover { transform: translateY(-5px); border-color: var(--accent); }
        .stat-label { text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 10px; }
        .stat-val { font-size: 36px; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; }
        .stat-icon { position: absolute; right: -10px; bottom: -10px; font-size: 100px; opacity: 0.05; color: var(--text-primary); transform: rotate(-15deg); }

        /* --- ASSET LIST (Smart Cards) --- */
        .assets-grid { display: flex; flex-direction: column; gap: 16px; }
        
        .grid-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr 1.5fr; gap: 20px; padding: 0 24px; margin-bottom: 5px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; }

        .asset-card {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr 1.5fr; gap: 20px; align-items: center;
          background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border);
          border-radius: 20px; padding: 20px 24px; transition: var(--transition);
          animation: fadeSlide 0.5s ease-out backwards;
        }
        .asset-card:hover { transform: scale(1.01); background: var(--bg-card); border-color: var(--accent); z-index: 2; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

        .cell-name { font-weight: 700; font-size: 15px; color: var(--text-primary); display: flex; align-items: center; gap: 12px; }
        .icon-box { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, var(--accent), #c084fc); color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px var(--accent-glow); }
        .cell-sub { color: var(--text-secondary); font-size: 13px; }
        .cell-val { font-weight: 600; color: var(--text-primary); text-align: right; }
        .cell-vnc { font-weight: 800; color: var(--accent); text-align: right; font-size: 16px; }

        /* --- MODAL --- */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .modal-card { width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; background: var(--bg-card); padding: 40px; border-radius: 32px; box-shadow: 0 30px 80px rgba(0,0,0,0.4); border: 1px solid var(--border); animation: zoomIn 0.3s ease-out; }
        .modal-title { font-size: 26px; font-weight: 800; margin-bottom: 30px; color: var(--text-primary); }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .input-group label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .input-field { width: 100%; padding: 16px; border-radius: 16px; border: 1px solid transparent; background: var(--input-bg); color: var(--text-primary); font-size: 16px; outline: none; transition: 0.3s; }
        .input-field:focus { border-color: var(--accent); background: var(--bg-card); box-shadow: 0 0 0 4px var(--accent-glow); }

        /* --- RESPONSIVE --- */
        @media (max-width: 1024px) {
          .sidebar-wrapper { transform: translateX(-100%); }
          .sidebar-wrapper.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; opacity: 1; }
          main { margin-left: 0; padding: 20px; width: 100%; }
          .btn-menu-mobile { display: block; }
        }

        @media (max-width: 768px) {
          .header-bar { flex-direction: column; align-items: flex-start; gap: 15px; }
          .actions { width: 100%; justify-content: space-between; }
          .hero-stats { grid-template-columns: 1fr; gap: 15px; }
          
          /* Card Transformation */
          .grid-header { display: none; }
          .asset-card { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px; position: relative; }
          .cell-name { width: 100%; font-size: 18px; }
          .info-row { display: flex; justify-content: space-between; width: 100%; font-size: 14px; padding-bottom: 8px; border-bottom: 1px dashed var(--border); }
          .info-row span:first-child { color: var(--text-secondary); }
          .cell-val, .cell-vnc { text-align: right; }
          
          /* Form */
          .form-grid { grid-template-columns: 1fr; }
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* OVERLAY & SIDEBAR */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />
      </div>

      {/* PARALLAX ORBS */}
      <div className="orb orb-1" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}></div>
      <div className="orb orb-2" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}></div>

      <main>
        {/* HEADER */}
        <div className="header-bar">
          <div style={{display:'flex', alignItems:'center', gap:'15px', width:'100%'}}>
            <button className="btn-menu-mobile" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <div className="header-content">
              <h1>Patrimoine</h1>
              <div style={{color:'var(--text-secondary)'}}>Gestion des actifs immobilisés</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <IconSun /> : <IconMoon />}
            </button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <IconPlus /> Nouvel Actif
            </button>
          </div>
        </div>

        {/* HERO STATS */}
        <div className="hero-stats">
          <TiltCard className="stat-box">
            <div className="stat-label">Valeur d'Acquisition Totale</div>
            <div className="stat-val">{totalValeur.toLocaleString()} F</div>
            <div className="stat-icon">💰</div>
          </TiltCard>
          <TiltCard className="stat-box">
            <div className="stat-label">Valeur Nette Comptable (VNC)</div>
            <div className="stat-val" style={{color:'var(--accent)'}}>{totalVNC.toLocaleString()} F</div>
            <div className="stat-icon">📉</div>
          </TiltCard>
        </div>

        {/* LISTE DES ACTIFS */}
        <div className="assets-grid">
          <div className="grid-header">
            <div>Désignation</div>
            <div>Acquis le</div>
            <div>Durée</div>
            <div style={{textAlign:'right'}}>Valeur Origine</div>
            <div style={{textAlign:'right'}}>VNC Actuelle</div>
          </div>

          {actifs.length === 0 && (
            <div style={{textAlign:'center', padding:'4rem', color:'var(--text-secondary)', background:'var(--bg-glass)', borderRadius:'20px'}}>
              Aucune immobilisation. Ajoutez votre matériel, véhicules, etc.
            </div>
          )}

          {actifs.map((a, i) => (
            <div key={a.id} className="asset-card" style={{animationDelay: `${i * 0.05}s`}}>
              
              {/* DESKTOP: GRID / MOBILE: FLEX COLUMN */}
              
              <div className="cell-name">
                <div className="icon-box"><IconCube /></div>
                {a.designation}
              </div>

              {/* Helper Wrapper for Mobile layout logic */}
              <div className="info-row">
                <span>Date</span>
                <span className="cell-sub">{new Date(a.date_acquisition).toLocaleDateString('fr-FR')}</span>
              </div>

              <div className="info-row">
                <span>Durée</span>
                <span className="cell-sub">{a.duree_mois} mois</span>
              </div>

              <div className="info-row">
                <span>Valeur Origine</span>
                <span className="cell-val">{Number(a.valeur_origine).toLocaleString()} F</span>
              </div>

              <div className="info-row" style={{border:0}}>
                <span>VNC</span>
                <span className="cell-vnc">{Number(a.valeur_nette_comptable).toLocaleString()} F</span>
              </div>

            </div>
          ))}
        </div>
      </main>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Ajouter un Actif</h2>
            <form onSubmit={handleSave}>
              <div className="input-group" style={{marginBottom:'20px'}}>
                <label>Désignation</label>
                <input 
                  className="input-field" 
                  placeholder="Ex: Ordinateur Dell XPS" 
                  value={formData.designation} 
                  onChange={e => setFormData({...formData, designation: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Date d'acquisition</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={formData.date_acquisition} 
                    onChange={e => setFormData({...formData, date_acquisition: e.target.value})} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Durée (Mois)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.duree_mois} 
                    onChange={e => setFormData({...formData, duree_mois: e.target.value})} 
                    placeholder="60" 
                    required 
                  />
                </div>
              </div>

              <div className="input-group" style={{marginBottom:'30px'}}>
                <label>Valeur d'achat (FCFA)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formData.valeur_origine} 
                  onChange={e => setFormData({...formData, valeur_origine: e.target.value})} 
                  placeholder="500000" 
                  required 
                />
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:'15px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding:'14px 28px', borderRadius:'12px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', fontWeight:'600', cursor:'pointer'}}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
