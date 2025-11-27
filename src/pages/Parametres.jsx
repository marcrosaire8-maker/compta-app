import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';

/* --- ICONS --- */
const IconSettings = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const IconUsers = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const IconCalendar = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
const IconSun = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>;
const IconMoon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>;
const IconTrash = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;

/* --- HOOK TILT --- */
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
      const rotateX = ((y - centerY) / centerY) * -1.5;
      const rotateY = ((x - centerX) / centerX) * 1.5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.005, 1.005, 1.005)`;
    };
    const handleLeave = () => card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
    return () => { card.removeEventListener('mousemove', handleMove); card.removeEventListener('mouseleave', handleLeave); };
  }, [active]);
  return ref;
};

const TiltCard = ({ children, className, style }) => {
  const tiltRef = useTilt(true);
  return <div ref={tiltRef} className={className} style={style}>{children}</div>;
};

export default function ParametresUltimate() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [exercices, setExercices] = useState([]);
  const [membres, setMembres] = useState([]);
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('general'); // general, team, fiscal

  // Forms
  const [companyForm, setCompanyForm] = useState({ nom: '', email: '' });
  const [updating, setUpdating] = useState(false);
  const [newExo, setNewExo] = useState({
    libelle: `Exercice ${new Date().getFullYear()}`,
    date_debut: `${new Date().getFullYear()}-01-01`,
    date_fin: `${new Date().getFullYear()}-12-31`
  });
  const [newMember, setNewMember] = useState({ email: '', role: 'LECTEUR' });

  useEffect(() => {
    const handleResize = () => { if(window.innerWidth > 1024) setIsMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    initData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ste } = await supabase.from('entreprises').select('*').eq('owner_id', user.id).maybeSingle();
    if (!ste) return;

    setEntreprise(ste);
    setCompanyForm({ nom: ste.nom, email: ste.email_contact || '' });
    await Promise.all([fetchExercices(ste.id), fetchMembres(ste.id)]);
    setLoading(false);
  }

  async function fetchExercices(id) {
    const { data } = await supabase.from('exercices').select('*').eq('entreprise_id', id).order('date_debut', { ascending: false });
    setExercices(data || []);
  }

  async function fetchMembres(id) {
    const { data } = await supabase.from('membres_entreprise').select('*').eq('entreprise_id', id);
    setMembres(data || []);
  }

  const updateEntreprise = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { error } = await supabase.from('entreprises').update({ nom: companyForm.nom, email_contact: companyForm.email }).eq('id', entreprise.id);
      if (error) throw error;
      alert("Mis à jour !");
    } catch (err) { alert("Erreur : " + err.message); } 
    finally { setUpdating(false); }
  };

  const handleAddExercice = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('exercices').insert([{ entreprise_id: entreprise.id, ...newExo }]);
    if (error) alert("Erreur : " + error.message);
    else {
      alert("Exercice créé !");
      fetchExercices(entreprise.id);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('membres_entreprise').insert([{ entreprise_id: entreprise.id, ...newMember }]);
      if (error) throw error;
      alert("Membre ajouté !");
      setNewMember({ email: '', role: 'LECTEUR' });
      fetchMembres(entreprise.id);
    } catch (err) { alert("Erreur : " + err.message); }
  };

  const handleRemoveMember = async (id) => {
    if (confirm("Retirer ce membre ?")) {
      await supabase.from('membres_entreprise').delete().eq('id', id);
      fetchMembres(entreprise.id);
    }
  };

  if (loading) return <div style={{height:'100vh', background:'#000', color:'white', display:'flex', justifyContent:'center', alignItems:'center'}}>Chargement...</div>;

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root { --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

        .light {
          --bg-main: #f2f2f7; --bg-glass: rgba(255, 255, 255, 0.65); --bg-card: #ffffff;
          --text-primary: #1d1d1f; --text-secondary: #86868b; --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); 
          --primary: #ef4444; /* Red for Settings/Danger Zone feels */
          --primary-glow: rgba(239, 68, 68, 0.3);
          --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000; --bg-glass: rgba(28, 28, 30, 0.65); --bg-card: #1c1c1e;
          --text-primary: #f5f5f7; --text-secondary: #a1a1a6; --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6); 
          --primary: #f87171;
          --primary-glow: rgba(248, 113, 113, 0.4);
          --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }
        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- PARALLAX ORBS --- */
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--primary); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #f59e0b; } /* Amber */

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

        /* --- TABS --- */
        .tabs-container { display: flex; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto; }
        .tab-btn { padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: 600; color: var(--text-secondary); transition: 0.3s; display: flex; align-items: center; gap: 8px; border: none; background: transparent; }
        .tab-btn.active { background: var(--bg-glass); color: var(--text-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .tab-btn:hover:not(.active) { color: var(--text-primary); background: rgba(255,255,255,0.05); }

        /* --- BENTO GRID --- */
        .bento-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; animation: fadeUp 0.6s ease-out; }
        
        .glass-card { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 24px; padding: 30px; transition: 0.3s; overflow: hidden; position: relative; }
        .glass-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow); }

        .card-title { font-size: 18px; fontWeight: 700; color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .card-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; }

        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 13px; font-weight: 600; }
        .form-input { width: 100%; padding: 14px; border-radius: 14px; border: 1px solid transparent; background: var(--input-bg); color: var(--text-primary); outline: none; transition: 0.3s; }
        .form-input:focus { border-color: var(--primary); background: var(--bg-card); box-shadow: 0 0 0 4px var(--primary-glow); }

        .btn-primary { width: 100%; padding: 14px; border-radius: 14px; border: none; background: var(--primary); color: white; font-weight: 700; cursor: pointer; transition: 0.3s; box-shadow: 0 8px 20px var(--primary-glow); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px var(--primary-glow); }

        /* --- LISTS --- */
        .list-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--border); }
        .list-item:last-child { border-bottom: none; }
        .list-main { font-weight: 600; color: var(--text-primary); }
        .list-sub { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
        .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .badge-blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
        .badge-purple { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }

        /* --- RESPONSIVE --- */
        @media (max-width: 1024px) {
          .sidebar-wrapper { transform: translateX(-100%); }
          .sidebar-wrapper.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; opacity: 1; }
          main { margin-left: 0; padding: 20px; width: 100%; }
          .btn-menu-mobile { display: block; }
          .bento-grid { grid-template-columns: 1fr; }
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
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
              <h1>Paramètres</h1>
              <div style={{color:'var(--text-secondary)'}}>Configuration du système</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <IconSun/> : <IconMoon/>}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            <IconSettings /> Général
          </button>
          <button className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
            <IconUsers /> Équipe
          </button>
          <button className={`tab-btn ${activeTab === 'fiscal' ? 'active' : ''}`} onClick={() => setActiveTab('fiscal')}>
            <IconCalendar /> Exercices
          </button>
        </div>

        {/* CONTENT: GENERAL */}
        {activeTab === 'general' && (
          <div className="bento-grid">
            <TiltCard className="glass-card">
              <div className="card-title"><div className="card-icon"><IconSettings/></div> Mon Entreprise</div>
              <form onSubmit={updateEntreprise}>
                <div className="form-group">
                  <label className="form-label">Nom de l'entreprise</label>
                  <input className="form-input" value={companyForm.nom} onChange={e => setCompanyForm({...companyForm, nom: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email de contact</label>
                  <input className="form-input" type="email" value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary" disabled={updating}>{updating ? 'Enregistrement...' : 'Sauvegarder'}</button>
              </form>
            </TiltCard>
            
            <TiltCard className="glass-card" style={{background:'rgba(239, 68, 68, 0.05)', borderColor:'rgba(239, 68, 68, 0.2)'}}>
              <div className="card-title" style={{color:'var(--primary)'}}>Zone de Danger</div>
              <p style={{color:'var(--text-secondary)', fontSize:'14px', marginBottom:'20px'}}>
                La suppression de l'entreprise est irréversible et effacera toutes les données comptables associées.
              </p>
              <button style={{width:'100%', padding:'14px', borderRadius:'14px', border:'1px solid var(--primary)', background:'transparent', color:'var(--primary)', fontWeight:'700', cursor:'pointer'}}>
                Supprimer l'entreprise
              </button>
            </TiltCard>
          </div>
        )}

        {/* CONTENT: TEAM */}
        {activeTab === 'team' && (
          <div className="bento-grid">
            <TiltCard className="glass-card">
              <div className="card-title"><div className="card-icon"><IconUsers/></div> Inviter un collaborateur</div>
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" required placeholder="collegue@entreprise.com" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rôle</label>
                  <select className="form-input" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}>
                    <option value="LECTEUR">Observateur</option>
                    <option value="COMPTABLE">Comptable</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">Envoyer l'invitation</button>
              </form>
            </TiltCard>

            <TiltCard className="glass-card">
              <div className="card-title">Membres actifs</div>
              <div>
                {membres.map(m => (
                  <div key={m.id} className="list-item">
                    <div>
                      <div className="list-main">{m.email}</div>
                      <div className="list-sub">Ajouté le {new Date(m.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <span className={`badge ${m.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`}>{m.role}</span>
                      {m.email !== entreprise.email_contact && (
                        <button onClick={() => handleRemoveMember(m.id)} style={{display:'block', marginTop:'5px', border:'none', background:'none', color:'var(--primary)', fontSize:'12px', cursor:'pointer', width:'100%', textAlign:'right'}}>Retirer</button>
                      )}
                    </div>
                  </div>
                ))}
                {membres.length === 0 && <div style={{textAlign:'center', color:'var(--text-secondary)', padding:'20px'}}>Aucun membre</div>}
              </div>
            </TiltCard>
          </div>
        )}

        {/* CONTENT: FISCAL */}
        {activeTab === 'fiscal' && (
          <div className="bento-grid">
            <TiltCard className="glass-card">
              <div className="card-title"><div className="card-icon"><IconCalendar/></div> Nouvel Exercice</div>
              <form onSubmit={handleAddExercice}>
                <div className="form-group">
                  <label className="form-label">Libellé</label>
                  <input className="form-input" value={newExo.libelle} onChange={e => setNewExo({...newExo, libelle: e.target.value})} />
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                  <div className="form-group">
                    <label className="form-label">Début</label>
                    <input type="date" className="form-input" value={newExo.date_debut} onChange={e => setNewExo({...newExo, date_debut: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fin</label>
                    <input type="date" className="form-input" value={newExo.date_fin} onChange={e => setNewExo({...newExo, date_fin: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn-primary">Créer</button>
              </form>
            </TiltCard>

            <TiltCard className="glass-card">
              <div className="card-title">Historique</div>
              {exercices.map(ex => (
                <div key={ex.id} className="list-item">
                  <div>
                    <div className="list-main">{ex.libelle}</div>
                    <div className="list-sub">{new Date(ex.date_debut).toLocaleDateString()} → {new Date(ex.date_fin).toLocaleDateString()}</div>
                  </div>
                  <div>
                    {ex.est_cloture ? (
                      <span className="badge" style={{background:'rgba(239, 68, 68, 0.1)', color:'var(--primary)'}}>Clôturé</span>
                    ) : (
                      <span className="badge badge-blue">En cours</span>
                    )}
                  </div>
                </div>
              ))}
            </TiltCard>
          </div>
        )}

      </main>
    </div>
  );
}
