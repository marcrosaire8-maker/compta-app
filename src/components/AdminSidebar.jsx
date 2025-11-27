import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

/* --- LOGO ADMIN (Version Rouge "Power") --- */
const AdminLogo = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <defs>
      {/* Dégradé Rouge Admin pour correspondre au thème */}
      <linearGradient id="adminLogoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ff3b30" /> {/* Apple Red */}
        <stop offset="1" stopColor="#ff2d55" /> {/* Deep Rose */}
      </linearGradient>
      <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Fond Hexagone arrondi */}
    <rect x="4" y="4" width="32" height="32" rx="10" fill="url(#adminLogoGradient)" fillOpacity="0.15" />
    
    {/* Chart Graphique */}
    <path 
      d="M12 24C12 24 15 20 18 20C21 20 21 26 24 26C27 26 30 14 30 14" 
      stroke="url(#adminLogoGradient)" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Point final */}
    <circle cx="30" cy="14" r="2.5" fill="url(#adminLogoGradient)" />
  </svg>
);

/* --- ICONS SVG (Style Technique/Admin) --- */
const Icons = {
  Overview: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
  Users: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Money: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  MasterPlan: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
  Support: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>,
  Danger: () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  Back: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  Logout: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Sun: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Moon: () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
};

export default function AdminSidebar({ totalCompanies }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    // États
    const [isOpen, setIsOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('admin-theme') || 'light');

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    useEffect(() => {
        document.body.setAttribute('data-admin-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('admin-theme', newTheme);
    };

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate('/login');
    }

    const isDark = theme === 'dark';
    const activeRed = '#ff3b30'; // Apple Red

    return (
        <>
            <style>{`
                :root {
                    /* Palette Admin Dynamique */
                    --adm-glass-bg: ${isDark ? 'rgba(20, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
                    --adm-glass-border: ${isDark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(0, 0, 0, 0.08)'};
                    
                    --adm-text-main: ${isDark ? '#fff' : '#1d1d1f'};
                    --adm-text-muted: ${isDark ? '#ff9a9e' : '#86868b'};
                    
                    --adm-accent: ${activeRed};
                    --adm-hover-bg: ${isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)'};
                    
                    --adm-shadow: 0 15px 40px rgba(0,0,0, ${isDark ? '0.7' : '0.15'});
                }

                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(255, 59, 48, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
                }

                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(-15px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .adm-anim-item {
                    opacity: 0;
                    animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                ${[...Array(10)].map((_, i) => `.adm-anim-item:nth-child(${i+1}) { animation-delay: ${i * 0.05}s; }`).join('')}

                .adm-nav-link {
                    position: relative;
                    transition: all 0.2s ease;
                }
                .adm-nav-link:hover {
                    background: var(--adm-hover-bg);
                    transform: scale(1.02);
                }
                .adm-nav-link.active {
                    background: linear-gradient(90deg, var(--adm-accent), #ff2d55);
                    color: white !important;
                    box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
                }
                
                .stat-glass-box {
                    background: ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,59,48,0.05)'};
                    border: 1px solid var(--adm-glass-border);
                    backdrop-filter: blur(10px);
                }
            `}</style>

            {/* TOGGLE BUTTON MOBILE */}
            <button 
                onClick={toggleMenu}
                style={{
                    position: 'fixed', top: '15px', left: '15px', zIndex: 2000,
                    background: 'var(--adm-glass-bg)', color: 'var(--adm-accent)',
                    border: '1px solid var(--adm-glass-border)', borderRadius: '12px',
                    width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(20px)', boxShadow: 'var(--adm-shadow)',
                    fontSize: '1.2rem', cursor: 'pointer', transition: 'transform 0.2s'
                }}
                className="mobile-toggle-adm"
            >
                {isOpen ? '✕' : '☰'}
            </button>

            {/* OVERLAY */}
            {isOpen && <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1500 }} />}

            {/* SIDEBAR MAIN */}
            <aside style={{
                width: '280px', height: '100vh', position: 'fixed', top: 0, left: 0,
                backgroundColor: 'var(--adm-glass-bg)',
                backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                borderRight: '1px solid var(--adm-glass-border)',
                zIndex: 1600, display: 'flex', flexDirection: 'column',
                transform: isOpen ? 'translateX(0)' : 'translateX(-105%)',
                transition: 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)',
                padding: '24px 16px', boxSizing: 'border-box',
                color: 'var(--adm-text-main)',
                fontFamily: '-apple-system, system-ui, sans-serif'
            }} className="sidebar-desktop-adm">

                {/* HEADER AVEC LOGO INTÉGRÉ */}
                <div style={{ marginBottom: '25px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '15px' }} className="adm-anim-item">
                    {/* Le Logo Rouge */}
                    <AdminLogo />
                    
                    {/* Les Textes */}
                    <div>
                        <div style={{ 
                            fontSize: '0.65rem', fontWeight: '800', letterSpacing: '2px', 
                            color: 'var(--adm-accent)', textTransform: 'uppercase', marginBottom: '2px'
                        }}>
                            Super Admin
                        </div>
                        <h1 style={{ 
                            margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px',
                            background: `linear-gradient(135deg, var(--adm-text-main) 0%, var(--adm-text-muted) 100%)`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                            Console
                        </h1>
                    </div>
                </div>

                {/* KPI CARD (ANIMATED) */}
                <div className="stat-glass-box adm-anim-item" style={{ 
                    borderRadius: '16px', padding: '16px', marginBottom: '30px',
                    display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        background: activeRed, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', fontWeight: 'bold',
                        animation: 'pulse-red 2s infinite'
                    }}>
                        {totalCompanies}
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>Entreprises</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--adm-text-muted)' }}>Actives en temps réel</div>
                    </div>
                    <div style={{ 
                        position: 'absolute', right: '-10px', top: '-10px', width: '60px', height: '60px', 
                        borderRadius: '50%', background: activeRed, opacity: 0.1, filter: 'blur(20px)' 
                    }} />
                </div>

                {/* NAVIGATION */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <SectionTitle label="SURVEILLANCE" />
                    <AdminItem to="/admin/overview" label="Vue Globale" icon={<Icons.Overview />} current={location.pathname} onClick={closeMenu} />
                    <AdminItem to="/admin/gestion" label="Utilisateurs" icon={<Icons.Users />} current={location.pathname} onClick={closeMenu} />
                    
                    <SectionTitle label="BUSINESS" />
                    <AdminItem to="/admin/monetization" label="Monétisation" icon={<Icons.Money />} current={location.pathname} onClick={closeMenu} />
                    <AdminItem to="/admin/plan-modele" label="Plan Maître" icon={<Icons.MasterPlan />} current={location.pathname} onClick={closeMenu} />
                    
                    <SectionTitle label="MAINTENANCE" />
                    <AdminItem to="/admin/support" label="Support Tickets" icon={<Icons.Support />} current={location.pathname} onClick={closeMenu} />
                    <AdminItem to="/admin/suppressions" label="Zone Danger" icon={<Icons.Danger />} current={location.pathname} onClick={closeMenu} isDanger={true} />
                </nav>

                {/* FOOTER */}
                <div style={{ 
                    marginTop: '20px', paddingTop: '20px', 
                    borderTop: '1px solid var(--adm-glass-border)',
                    display: 'flex', flexDirection: 'column', gap: '10px' 
                }} className="adm-anim-item">
                    
                    <Link to="/dashboard" onClick={closeMenu} style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px',
                        textDecoration: 'none', color: 'var(--adm-text-muted)', fontSize: '0.85rem',
                        padding: '8px', borderRadius: '8px', transition: 'color 0.2s'
                    }}>
                        <Icons.Back />
                        <span>Retour Espace Client</span>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={toggleTheme} style={{
                            background: 'transparent', border: '1px solid var(--adm-glass-border)',
                            borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-text-main)'
                        }}>
                            {theme === 'light' ? <Icons.Sun /> : <Icons.Moon />}
                        </button>

                        <button onClick={handleLogout} title="Déconnexion Sécurisée" style={{
                            background: 'rgba(255, 59, 48, 0.1)', border: 'none',
                            borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
                            color: activeRed, fontWeight: '600', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <Icons.Logout /> Déconnexion
                        </button>
                    </div>
                </div>

            </aside>

            {/* CSS DESKTOP HACK */}
            <style>{`
                @media (min-width: 1024px) {
                    .sidebar-desktop-adm { transform: translateX(0) !important; }
                    .mobile-toggle-adm { display: none !important; }
                }
            `}</style>
        </>
    );
}

// --- SOUS-COMPOSANTS ---

function SectionTitle({ label }) {
    return (
        <div className="adm-anim-item" style={{ 
            fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1px', 
            color: 'var(--adm-text-muted)', marginTop: '15px', marginBottom: '5px', paddingLeft: '12px', opacity: 0.6
        }}>
            {label}
        </div>
    )
}

function AdminItem({ to, label, icon, current, onClick, isDanger }) {
    const isActive = current === to;
    const dangerStyle = isDanger ? { color: isActive ? '#fff' : '#ff3b30' } : {};
    return (
        <Link 
            to={to} 
            onClick={onClick} 
            className={`adm-nav-link adm-anim-item ${isActive ? 'active' : ''}`}
            style={{ 
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '12px',
                textDecoration: 'none', color: 'var(--adm-text-muted)',
                fontSize: '0.9rem', fontWeight: '600',
                cursor: 'pointer',
                ...dangerStyle
            }}
        >
            <span style={{ 
                color: isActive ? '#fff' : (isDanger ? '#ff3b30' : 'inherit'), 
                opacity: isActive ? 1 : 0.8,
                display: 'flex'
            }}>
                {icon}
            </span>
            <span style={{ color: isActive ? '#fff' : 'inherit' }}>{label}</span>
        </Link>
    )
}
