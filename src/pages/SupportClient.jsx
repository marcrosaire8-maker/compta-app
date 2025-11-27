import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';

/* --- ICONS --- */
const IconPlus = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const IconMessage = () => <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg>;
const IconClock = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconCheck = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IconSun = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>;
const IconMoon = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>;

export default function SupportUltimate() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [tickets, setTickets] = useState([]);
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Form
  const [form, setForm] = useState({ sujet: '', description: '', priorite: 'MOYENNE' });

  useEffect(() => { initData(); }, []);

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
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (!ste) return;
    setEntreprise(ste);
    await fetchTickets(ste.nom, ste.email_contact);
    setLoading(false);
  }

  async function fetchTickets(nom, email) {
    const { data } = await supabase
      .from('tickets_support')
      .select('*')
      .or(`email_contact.eq.${email},entreprise_nom.eq.${nom}`)
      .order('created_at', { ascending: false });
    setTickets(data || []);
  }

  const submitTicket = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('tickets_support').insert([{
        email_contact: entreprise.email_contact,
        entreprise_nom: entreprise.nom,
        sujet: form.sujet,
        description: form.description,
        priorite: form.priorite,
        statut: 'OUVERT'
      }]);

      if (error) throw error;
      alert("Ticket envoyé !");
      setIsModalOpen(false);
      setForm({ sujet: '', description: '', priorite: 'MOYENNE' });
      fetchTickets(entreprise.nom, entreprise.email_contact);
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{height:'100vh', background:'#000', display:'grid', placeItems:'center', color:'white'}}>Chargement...</div>;

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : 'light'}`} onMouseMove={handleMouseMove}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root { --transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

        .light {
          --bg-main: #f2f2f7; --bg-glass: rgba(255, 255, 255, 0.65); --bg-card: #ffffff;
          --text-primary: #1d1d1f; --text-secondary: #86868b; --border: rgba(0,0,0,0.06);
          --shadow: 0 10px 40px -10px rgba(0,0,0,0.1); 
          --primary: #0ea5e9; /* Support Blue */
          --primary-glow: rgba(14, 165, 233, 0.3);
          --input-bg: #f5f5f7;
        }

        .dark {
          --bg-main: #000000; --bg-glass: rgba(28, 28, 30, 0.65); --bg-card: #1c1c1e;
          --text-primary: #f5f5f7; --text-secondary: #a1a1a6; --border: rgba(255,255,255,0.15);
          --shadow: 0 20px 50px -10px rgba(0,0,0,0.6); 
          --primary: #38bdf8;
          --primary-glow: rgba(56, 189, 248, 0.4);
          --input-bg: #2c2c2e;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: var(--bg-main); transition: background 0.5s ease; }
        .app-wrapper { min-height: 100vh; position: relative; }

        /* --- PARALLAX ORBS --- */
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none; opacity: 0.4; }
        .orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--primary); }
        .orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: #6366f1; }

        /* --- SIDEBAR --- */
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

        .btn-primary { padding: 14px 24px; border-radius: 99px; border: none; background: linear-gradient(135deg, var(--primary), #0284c7); color: white; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 8px 20px var(--primary-glow); transition: var(--transition); display: flex; align-items: center; gap: 8px; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px var(--primary-glow); }

        /* --- TICKET CARDS (Bubbles) --- */
        .tickets-container { display: flex; flex-direction: column; gap: 20px; max-width: 900px; margin: 0 auto; }
        
        .ticket-card {
          background: var(--bg-glass); backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 24px; padding: 24px;
          position: relative; overflow: hidden; transition: 0.3s;
          animation: fadeUp 0.5s ease-out backwards;
        }
        .ticket-card:hover { transform: scale(1.01); border-color: var(--primary); box-shadow: var(--shadow); z-index: 2; }
        .ticket-card::before { content:''; position: absolute; top:0; left:0; width: 6px; height: 100%; background: var(--status-color); }

        .ticket-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .ticket-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 5px; }
        .ticket-meta { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 10px; }
        
        .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: white; }
        .status-OUVERT { background: #f59e0b; }
        .status-EN_COURS { background: #3b82f6; }
        .status-RESOLU { background: #10b981; }

        .ticket-desc { font-size: 15px; line-height: 1.6; color: var(--text-primary); background: rgba(120,120,120,0.05); padding: 15px; border-radius: 16px; }

        /* --- EMPTY STATE --- */
        .empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .empty-icon { color: var(--primary); opacity: 0.5; margin-bottom: 20px; }

        /* --- MODAL --- */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .modal-card { width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; background: var(--bg-card); padding: 40px; border-radius: 32px; box-shadow: 0 30px 80px rgba(0,0,0,0.4); border: 1px solid var(--border); animation: zoomIn 0.3s ease-out; }
        .modal-title { font-size: 26px; font-weight: 800; margin-bottom: 30px; color: var(--text-primary); }

        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .form-input { width: 100%; padding: 16px; border-radius: 16px; border: 1px solid transparent; background: var(--input-bg); color: var(--text-primary); font-size: 16px; outline: none; transition: 0.3s; }
        .form-textarea { width: 100%; padding: 16px; border-radius: 16px; border: 1px solid transparent; background: var(--input-bg); color: var(--text-primary); font-size: 16px; outline: none; transition: 0.3s; min-height: 120px; resize: vertical; }
        .form-input:focus, .form-textarea:focus { border-color: var(--primary); background: var(--bg-card); box-shadow: 0 0 0 4px var(--primary-glow); }

        /* --- MEDIA QUERIES --- */
        @media (max-width: 1024px) {
          .sidebar-wrapper { transform: translateX(-100%); }
          .sidebar-wrapper.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; opacity: 1; }
          main { margin-left: 0; padding: 20px; width: 100%; }
          .btn-menu-mobile { display: block; }
        }

        @media (max-width: 768px) {
          .header-bar { flex-direction: column; align-items: flex-start; gap: 20px; }
          .actions { width: 100%; justify-content: space-between; }
          .ticket-header { flex-direction: column; gap: 10px; }
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
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
              <h1>Assistance</h1>
              <div style={{color:'var(--text-secondary)'}}>Support technique dédié</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <IconSun/> : <IconMoon/>}
            </button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <IconPlus /> Nouveau Ticket
            </button>
          </div>
        </div>

        {/* TICKETS LIST */}
        <div className="tickets-container">
          {tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><IconMessage /></div>
              <h2 style={{fontSize:'24px', marginBottom:'10px'}}>Tout va bien !</h2>
              <p>Aucun ticket ouvert. Si vous avez un problème, nous sommes là.</p>
            </div>
          ) : (
            tickets.map((t, i) => (
              <div 
                key={t.id} 
                className="ticket-card" 
                style={{
                  animationDelay: `${i * 0.1}s`,
                  '--status-color': t.statut === 'RESOLU' ? '#10b981' : t.statut === 'EN_COURS' ? '#3b82f6' : '#f59e0b'
                }}
              >
                <div className="ticket-header">
                  <div>
                    <div className="ticket-title">{t.sujet}</div>
                    <div className="ticket-meta">
                      <IconClock /> {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      <span>• Priorité {t.priorite}</span>
                    </div>
                  </div>
                  <div className={`status-badge status-${t.statut}`}>
                    {t.statut.replace('_', ' ')}
                  </div>
                </div>
                <div className="ticket-desc">
                  {t.description}
                </div>
                {t.statut === 'RESOLU' && (
                  <div style={{marginTop:'15px', color:'var(--success)', fontWeight:'600', fontSize:'14px', display:'flex', alignItems:'center', gap:'5px'}}>
                    <IconCheck /> Problème résolu
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Ouvrir un Ticket</h2>
            <form onSubmit={submitTicket}>
              <div className="form-group">
                <label className="form-label">Sujet</label>
                <input 
                  className="form-input" 
                  placeholder="Ex: Problème d'export PDF..." 
                  value={form.sujet} 
                  onChange={e => setForm({...form, sujet: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description détaillée</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Expliquez nous ce qui se passe..." 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priorité</label>
                <select className="form-input" value={form.priorite} onChange={e => setForm({...form, priorite: e.target.value})}>
                  <option value="BASSE">Basse (Question générale)</option>
                  <option value="MOYENNE">Moyenne (Bug mineur)</option>
                  <option value="HAUTE">Haute (Bloquant)</option>
                </select>
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:'15px', marginTop:'30px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding:'14px 28px', borderRadius:'12px', border:'none', background:'var(--input-bg)', color:'var(--text-primary)', fontWeight:'600', cursor:'pointer'}}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Envoyer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
