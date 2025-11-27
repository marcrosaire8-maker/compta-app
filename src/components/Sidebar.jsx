import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { SUPER_ADMIN_ID } from '../utils/constants';

/* --- LOGO CLIENT (Style "Gemstone" Bleu/Violet) --- */
const SidebarLogo = () => (
  <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <defs>
      {/* Dégradé Business (Bleu Apple vers Violet) */}
      <linearGradient id="sidebarLogoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0071e3" /> {/* Apple Blue */}
        <stop offset="1" stopColor="#9b51e0" /> {/* Purple */}
      </linearGradient>
      <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Fond Hexagone arrondi */}
    <rect x="4" y="4" width="32" height="32" rx="10" fill="url(#sidebarLogoGradient)" fillOpacity="0.12" />
    
    {/* Chart Graphique */}
    <path 
      d="M12 24C12 24 15 20 18 20C21 20 21 26 24 26C27 26 30 14 30 14" 
      stroke="url(#sidebarLogoGradient)" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Point final */}
    <circle cx="30" cy="14" r="2.5" fill="url(#sidebarLogoGradient)" />
  </svg>
);

/* --- ICONS SVG PREMIUM (Style filaire Apple) --- */
const Icons = {
  Dashboard: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Sales: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
  Bag: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"></path></svg>,
  Users: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Book: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  Chart: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Settings: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Sun: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Moon: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
  Plus: () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Logout: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  FileText: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
};

export default function Sidebar({ entrepriseNom, userRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // États
  const [isOpen, setIsOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'light');

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === SUPER_ADMIN_ID) setIsSuperAdmin(true);
    };
    checkAdminStatus();
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const isDark = theme === 'dark';

  return (
    <>
      <style>{`
        :root {
          /* Palette Dynamique "Glass" */
          --glass-bg: ${isDark ? 'rgba(18, 18, 23, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
          --glass-border: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
          --glass-shine: ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)'};
          
          --text-main: ${isDark ? '#fbfbfd' : '#1d1d1f'};
          --text-muted: ${isDark ? '#86868b' : '#86868b'};
          --text-hover: ${isDark ? '#fff' : '#000'};
          
          --accent: #0071e3; /* Apple Blue */
          --accent-hover: #0077ED;
          --item-hover-bg: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
          --item-active-bg: ${isDark ? 'rgba(0, 113, 227, 0.15)' : 'rgba(0, 113, 227, 0.08)'};
          --item-active-text: ${isDark ? '#2997ff' : '#0071e3'};
          
          --shadow-deep: 0 20px 40px rgba(0,0,0, ${isDark ? '0.6' : '0.1'});
        }

        /* Animation d'entrée en cascade */
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .anim-item {
          opacity: 0;
          animation: fadeSlideIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        /* Délais automatiques pour les 20 premiers éléments */
        ${[...Array(25)].map((_, i) => `.anim-item:nth-child(${i+1}) { animation-delay: ${i * 0.04}s; }`).join('')}

        /* Scrollbar invisible mais fonctionnelle */
        .sidebar-scroll::-webkit-scrollbar { width: 0px; background: transparent; }
        
        /* Items Navigation */
        .nav-link {
          position: relative;
          transition: all 0.3s ease;
        }
        .nav-link:hover {
          background: var(--item-hover-bg);
          transform: translateX(4px);
        }
        .nav-link.active {
          background: var(--item-active-bg);
          color: var(--item-active-text) !important;
          font-weight: 600;
        }
        /* Indicateur actif (petite barre verticale) */
        .nav-link.active::before {
          content: ''; position: absolute; left: 0; top: 15%; bottom: 15%; width: 3px;
          background: var(--accent); border-radius: 0 4px 4px 0;
        }

        /* Bouton "Nouvelle Facture" avec effet 3D subtil */
        .cta-btn {
          background: var(--accent);
          box-shadow: 0 4px 12px ${isDark ? 'rgba(0,113,227,0.4)' : 'rgba(0,113,227,0.25)'};
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cta-btn:hover {
          transform: scale(1.02) translateY(-1px);
          box-shadow: 0 8px 20px ${isDark ? 'rgba(0,113,227,0.6)' : 'rgba(0,113,227,0.4)'};
        }
        .cta-btn:active { transform: scale(0.98); }

        /* Overlay Mobile */
        .glass-overlay {
          backdrop-filter: blur(5px);
          background: rgba(0,0,0,0.3);
          opacity: 0; animation: fadeOnly 0.3s forwards;
        }
        @keyframes fadeOnly { to { opacity: 1; } }

      `}</style>

      {/* --- TOGGLE MOBILE --- */}
      <button 
        onClick={toggleMenu}
        style={{
          position: 'fixed', top: '15px', left: '15px', zIndex: 2000,
          background: 'var(--glass-bg)', color: 'var(--text-main)',
          border: '1px solid var(--glass-border)', borderRadius: '12px',
          width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(15px)', boxShadow: 'var(--shadow-deep)',
          fontSize: '1.4rem', cursor: 'pointer', transition: 'transform 0.2s'
        }}
        className="mobile-toggle"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* --- OVERLAY --- */}
      {isOpen && (
        <div 
          className="glass-overlay"
          onClick={closeMenu}
          style={{ position: 'fixed', inset: 0, zIndex: 1500 }}
        />
      )}

      {/* --- SIDEBAR CONTAINER --- */}
      <aside style={{
        width: '280px', height: '100vh', position: 'fixed', top: 0, left: 0,
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', // L'effet verre magique
        borderRight: '1px solid var(--glass-border)',
        zIndex: 1600, display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(-105%)',
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)', // Animation "Spring" Apple
        padding: '24px 16px', boxSizing: 'border-box',
        color: 'var(--text-main)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }} className="sidebar-desktop">

        {/* LOGO & TITRE */}
        <div style={{ marginBottom: '30px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '12px' }} className="anim-item">
          {/* Logo intégré */}
          <SidebarLogo />
          
          <div>
            <h1 style={{ 
              margin: 0, fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.5px',
              background: `linear-gradient(135deg, ${isDark ? '#fff' : '#000'} 0%, var(--text-muted) 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Compta-SaaS
            </h1>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '700', marginTop: '2px', letterSpacing: '1px' }}>
              EDITION PRO
            </div>
          </div>
        </div>

        {/* BOUTON CREATE NEW */}
        <Link to="/factures" onClick={closeMenu} className="cta-btn anim-item" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          color: '#fff', padding: '14px', borderRadius: '16px',
          textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem',
          marginBottom: '25px'
        }}>
          <Icons.Plus />
          <span>Nouvelle Facture</span>
        </Link>

        {/* MENU SCROLLABLE */}
        <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '5px' }}>
          
          {isSuperAdmin && (
             <div className="anim-item">
                <Link to="/admin/overview" onClick={closeMenu} style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', 
                  borderRadius: '12px', color: '#ff453a', background: 'rgba(255, 69, 58, 0.1)',
                  textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600', border: '1px solid rgba(255, 69, 58, 0.2)'
                }}>
                  ⚠️ Console Admin
                </Link>
             </div>
          )}

          <SectionTitle label="VUE GLOBALE" />
          <NavItem to="/dashboard" label="Tableau de bord" icon={<Icons.Dashboard />} current={location.pathname} onClick={closeMenu} />

          <SectionTitle label="GESTION COMMERCIALE" />
          <NavItem to="/factures" label="Ventes & Factures" icon={<Icons.Sales />} current={location.pathname} onClick={closeMenu} />
          <NavItem to="/depenses" label="Achats & Dépenses" icon={<Icons.Bag />} current={location.pathname} onClick={closeMenu} />
          <NavItem to="/produits" label="Stocks & Services" current={location.pathname} onClick={closeMenu} />
          <NavItem to="/tiers" label="Clients & Fournisseurs" icon={<Icons.Users />} current={location.pathname} onClick={closeMenu} />
          <NavItem to="/paie" label="Gestion Paie (RH)" current={location.pathname} onClick={closeMenu} /> 

          <SectionTitle label="COMPTABILITÉ" />
          <NavItem to="/journal" label="Saisie Journal" icon={<Icons.Book />} current={location.pathname} onClick={closeMenu} />
          <NavItem to="/plan-comptable" label="Plan Comptable" current={location.pathname} onClick={closeMenu} />
          <NavItem to="/reporting" label="Balance & Grand Livre" icon={<Icons.Chart />} current={location.pathname} onClick={closeMenu} />
          <NavItem to="/rapprochement" label="Rapprochement Bancaire" current={location.pathname} onClick={closeMenu} />
          <NavItem to="/immobilisations" label="Immobilisations" current={location.pathname} onClick={closeMenu} />

          <SectionTitle label="ÉTATS & RAPPORTS" />
          <NavItem to="/etats-financiers" label="Bilan & Résultat" icon={<Icons.FileText />} current={location.pathname} onClick={closeMenu} />
          <NavItem to="/editions" label="Éditions Légales" current={location.pathname} onClick={closeMenu} />

          <SectionTitle label="CONFIGURATION" />
          <NavItem to="/parametres" label="Paramètres" icon={<Icons.Settings />} current={location.pathname} onClick={closeMenu} />
          <NavItem to="/support-client" label="Aide & Support" current={location.pathname} onClick={closeMenu} />

        </div>

        {/* FOOTER */}
        <div style={{ 
          marginTop: '10px', paddingTop: '15px', 
          borderTop: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', gap: '15px'
        }} className="anim-item">
          
          {/* Theme Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Apparence</span>
            <button onClick={toggleTheme} style={{
              background: 'var(--item-hover-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '20px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              color: 'var(--text-main)', transition: 'background 0.2s'
            }}>
              {theme === 'light' ? <><Icons.Sun /> <span style={{fontSize:'0.7rem'}}>Clair</span></> : <><Icons.Moon /> <span style={{fontSize:'0.7rem'}}>Sombre</span></>}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: 'var(--item-hover-bg)', borderRadius: '12px' }}>
             <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.8rem', fontWeight:'bold' }}>
               {entrepriseNom ? entrepriseNom.charAt(0).toUpperCase() : 'U'}
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <span style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entrepriseNom || 'Mon Entreprise'}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{userRole || 'Admin'}</span>
             </div>
             <button onClick={handleLogout} title="Déconnexion" style={{
               background: 'transparent', border: 'none', color: 'var(--text-muted)', 
               cursor: 'pointer', padding: '6px', borderRadius: '6px'
             }}>
                <Icons.Logout />
             </button>
          </div>
        </div>

      </aside>
      
      {/* Hack CSS pour Desktop Only */}
      <style>{`
        @media (min-width: 1024px) {
           .sidebar-desktop { transform: translateX(0) !important; }
           .mobile-toggle { display: none !important; }
        }
      `}</style>
    </>
  );
}

// --- COMPOSANTS INTERNES ---

function SectionTitle({ label }) {
  return (
    <div className="anim-item" style={{ 
      fontSize: '0.65rem', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase',
      color: 'var(--text-muted)', marginTop: '24px', marginBottom: '8px', paddingLeft: '12px',
      opacity: 0.8
    }}>
      {label}
    </div>
  )
}

function NavItem({ to, label, icon, current, onClick }) {
  const isActive = current === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`nav-link anim-item ${isActive ? 'active' : ''}`}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 12px', borderRadius: '12px',
        textDecoration: 'none', color: 'var(--text-muted)',
        fontSize: '0.9rem', fontWeight: '500',
        cursor: 'pointer'
      }}
    >
      <span style={{ color: isActive ? 'var(--accent)' : 'inherit', display: 'flex', alignItems: 'center', transition: 'color 0.3s' }}>
        {icon || <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', margin: '7px' }}></span>}
      </span>
      <span>{label}</span>
    </Link>
  )
}
