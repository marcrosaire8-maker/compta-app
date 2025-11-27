import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// --- LE NOUVEAU LOGO (Visible, Dégradé, Premium) ---
const LogoGemstone = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-gem">
    <defs>
      {/* Dégradé "Cyber Blue" Apple style */}
      <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0071e3" /> {/* Bleu */}
        <stop offset="1" stopColor="#9b51e0" /> {/* Violet subtil */}
      </linearGradient>
      {/* Effet d'ombre portée interne pour la profondeur 3D */}
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Forme de fond : Hexagone arrondi (Stabilité) */}
    <rect x="4" y="4" width="32" height="32" rx="10" fill="url(#logoGradient)" fillOpacity="0.15" className="logo-bg"/>
    
    {/* Symbole Central : Graphique de croissance + "S" stylisé */}
    <path 
      d="M12 24C12 24 15 20 18 20C21 20 21 26 24 26C27 26 30 14 30 14" 
      stroke="url(#logoGradient)" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="logo-chart"
    />
    
    {/* Point final (Objectif atteint) */}
    <circle cx="30" cy="14" r="2.5" fill="url(#logoGradient)" className="logo-dot" />
  </svg>
);

// --- ICONES UTILITAIRES ---
const SunIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('public-theme') || 'light');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-public-theme', theme);
    localStorage.setItem('public-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const publicPages = ['/', '/login'];
  if (!publicPages.includes(location.pathname)) return null;

  const isLoginPage = location.pathname === '/login';
  const isDark = theme === 'dark';

  return (
    <>
      <style>{`
        :root {
          --nav-bg-glass: ${isDark ? 'rgba(5, 5, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
          --nav-text: ${isDark ? '#ffffff' : '#1d1d1f'};
          --nav-accent: #0071e3;
          --nav-border: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
        }

        /* --- ANIMATIONS --- */
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes drawLine {
          from { stroke-dasharray: 20; stroke-dashoffset: 20; }
          to { stroke-dasharray: 20; stroke-dashoffset: 0; }
        }
        
        @keyframes pulseDot {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* --- NAVBAR CONTAINER --- */
        .apple-nav {
          position: fixed; top: 0; left: 0; right: 0;
          z-index: 1000;
          padding: ${scrolled ? '10px 5%' : '18px 5%'};
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: ${scrolled ? 'var(--nav-bg-glass)' : 'transparent'};
          backdrop-filter: ${scrolled ? 'blur(20px) saturate(180%)' : 'none'};
          -webkit-backdrop-filter: ${scrolled ? 'blur(20px) saturate(180%)' : 'none'};
          border-bottom: 1px solid ${scrolled ? 'var(--nav-border)' : 'transparent'};
          animation: slideDown 0.8s ease-out;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        /* --- LOGO STYLES --- */
        .brand-container {
          display: flex; align-items: center; gap: 12px;
          text-decoration: none; color: var(--nav-text);
          cursor: pointer;
        }

        /* Interaction sur le logo */
        .logo-gem { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .brand-container:hover .logo-gem { transform: scale(1.1) rotate(5deg); }
        
        /* Animation du tracé (chart) dans le logo */
        .logo-chart {
          stroke-dasharray: 30; stroke-dashoffset: 0;
          transition: stroke-dashoffset 1s ease;
        }
        .brand-container:hover .logo-chart {
          animation: drawLine 1s infinite alternate;
        }
        
        /* Point pulsant */
        .logo-dot { transform-origin: center; animation: pulseDot 3s infinite ease-in-out; }

        .brand-text {
          font-size: 1.4rem; font-weight: 700; letter-spacing: -0.5px;
          background: linear-gradient(90deg, ${isDark ? '#fff' : '#000'}, var(--nav-text));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        /* --- MENUS & BOUTONS --- */
        .nav-link-item {
          color: var(--nav-text); text-decoration: none; font-size: 0.95rem; font-weight: 500;
          padding: 8px 16px; border-radius: 20px; transition: all 0.2s; opacity: 0.8;
        }
        .nav-link-item:hover { opacity: 1; background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; }

        .cta-button {
          background: var(--nav-accent); color: white;
          padding: 10px 24px; border-radius: 99px;
          text-decoration: none; font-weight: 600; font-size: 0.9rem;
          box-shadow: 0 4px 15px rgba(0, 113, 227, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(0, 113, 227, 0.5);
        }

        /* --- MOBILE --- */
        .mobile-toggle { display: none; background: none; border: none; color: var(--nav-text); cursor: pointer; }
        .desktop-menu { display: flex; align-items: center; gap: 20px; }
        
        @media (max-width: 768px) {
          .desktop-menu { display: none; }
          .mobile-toggle { display: block; }
        }

        .mobile-overlay {
          position: fixed; inset: 0; background: var(--nav-bg-glass);
          backdrop-filter: blur(40px); z-index: 2000;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px;
          opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        .mobile-overlay.open { opacity: 1; pointer-events: auto; }
      `}</style>

      {/* BARRE DE NAVIGATION */}
      <nav className="apple-nav">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* LOGO & TITRE */}
          <Link to="/" className="brand-container">
            <LogoGemstone />
            <span className="brand-text">Compta-SaaS</span>
          </Link>

          {/* MENU BUREAU */}
          <div className="desktop-menu">
            {!isLoginPage && <Link to="/" className="nav-link-item">Accueil</Link>}
            
            <button onClick={toggleTheme} title="Changer le thème" style={{ 
              background: 'transparent', border: '1px solid var(--nav-border)', 
              borderRadius: '50%', width: '40px', height: '40px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--nav-text)', transition: 'background 0.2s'
            }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {!isLoginPage && (
              <Link to="/login" className="cta-button">
                Espace Client
              </Link>
            )}
          </div>

          {/* MENU MOBILE TOGGLE */}
          <button className="mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* MENU MOBILE PLEIN ÉCRAN */}
      <div className={`mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}>
        <button onClick={() => setMobileMenuOpen(false)} style={{ position: 'absolute', top: '30px', right: '30px', background: 'none', border: 'none', color: 'var(--nav-text)', transform: 'scale(1.5)', cursor: 'pointer' }}>
          <CloseIcon />
        </button>

        <Link to="/" onClick={() => setMobileMenuOpen(false)} className="brand-container" style={{ transform: 'scale(1.5)' }}>
           <LogoGemstone />
        </Link>
        
        <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.5rem', color: 'var(--nav-text)', textDecoration: 'none', fontWeight: '600' }}>
            Accueil
          </Link>
          
          <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', color: 'var(--nav-text)', background: 'none', border: 'none', cursor: 'pointer' }}>
             {isDark ? 'Mode Clair' : 'Mode Sombre'} {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {!isLoginPage && (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="cta-button" style={{ fontSize: '1.1rem', padding: '15px 50px', marginTop: '20px' }}>
              Accès Client
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
