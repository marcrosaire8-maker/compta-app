import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function AdminSidebar({ totalCompanies }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    // État d'ouverture du menu
    const [isOpen, setIsOpen] = useState(false);

    // Actions du menu
    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);
    
    const adminMenuItems = [
        { path: '/admin/overview', label: 'Vue Globale', icon: '🌍' },
        { path: '/admin/gestion', label: 'Utilisateurs', icon: '👥' },
        { path: '/admin/monetization', label: 'Monétisation', icon: '💳' },
        { path: '/admin/plan-modele', label: 'Plan Maître', icon: '📚' },
        { path: '/admin/support', label: 'Support Tickets', icon: '🛟' },
        { path: '/admin/suppressions', label: 'Zone Danger', icon: '❌' }, 
    ];

    const getIsActive = (path) => location.pathname === path;

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate('/login');
    }

    return (
        <>
            {/* 1. BOUTON TOGGLE (Fixe) */}
            <button 
                onClick={toggleMenu}
                style={styles.toggleBtn}
                title="Menu Admin"
            >
                {isOpen ? '✕' : '☰'}
            </button>

            {/* 2. OVERLAY (Fond sombre) */}
            {isOpen && (
                <div onClick={closeMenu} style={styles.overlay}></div>
            )}

            {/* 3. LE TIROIR ADMIN */}
            <aside style={{ 
                ...styles.container,
                left: isOpen ? '0' : '-280px', 
            }}>
                
                {/* EN-TÊTE */}
                <div style={styles.header}>
                    <div>
                        <div style={styles.logoText}>ADMIN CONSOLE</div>
                        <div style={{fontSize: '0.7rem', color: '#fca5a5'}}>Super Administrateur</div>
                    </div>
                    <button onClick={closeMenu} style={{background:'none', border:'none', color:'#aaa', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
                </div>

                {/* STATISTIQUE RAPIDE */}
                <div style={styles.statBox}>
                    <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#fff'}}>{totalCompanies}</div>
                    <div style={{fontSize:'0.7rem', color:'#fca5a5', textTransform:'uppercase'}}>Entreprises Actives</div>
                </div>

                {/* NAVIGATION */}
                <nav style={styles.scrollArea}>
                    {adminMenuItems.map(item => {
                        const active = getIsActive(item.path);
                        return (
                            <Link key={item.path} to={item.path} onClick={closeMenu} style={{
                                ...styles.item,
                                backgroundColor: active ? '#7f1d1d' : 'transparent', // Rouge foncé pour l'actif
                                color: active ? '#fff' : '#e3e3e3',
                                fontWeight: active ? 'bold' : 'normal'
                            }}>
                                <span>{item.icon}</span> {item.label}
                            </Link>
                        )
                    })}
                </nav>
                
                {/* PIED DE PAGE */}
                <div style={styles.footer}>
                     <Link to="/dashboard" onClick={closeMenu} style={styles.backLink}>
                        ⬅ Espace Client
                    </Link>
                    
                     <button 
                        onClick={handleLogout}
                        title="Déconnexion"
                        style={styles.logoutBtn}
                    >
                        ⏻
                    </button>
                </div>
            </aside>
        </>
    );
}

// --- STYLES (Thème Admin Dark/Red) ---
const styles = {
    toggleBtn: {
        position: 'fixed', top: '15px', left: '15px', zIndex: 2000,
        background: '#7f1d1d', // Bouton rouge pour l'admin
        color: 'white', border: 'none', borderRadius: '8px',
        width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
    },
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1500, backdropFilter: 'blur(2px)'
    },
    container: {
        width: '260px', height: '100vh',
        backgroundColor: '#201a1a', // Fond très sombre teinté de rouge
        color: '#e3e3e3',
        display: 'flex', flexDirection: 'column',
        fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
        position: 'fixed', top: 0, zIndex: 1600,
        padding: '10px', boxSizing: 'border-box',
        transition: 'left 0.3s ease-in-out',
        boxShadow: '5px 0 15px rgba(0,0,0,0.5)',
        borderRight: '1px solid #5c1c1c'
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 5px 10px 15px', marginBottom: '20px', marginTop: '40px'
    },
    logoText: { fontSize: '1.1rem', fontWeight: '700', color: '#fca5a5', letterSpacing: '1px' },
    statBox: {
        background: 'rgba(127, 29, 29, 0.3)', borderRadius: '10px', padding: '15px',
        marginBottom: '20px', textAlign: 'center', border: '1px solid #7f1d1d',
        margin: '0 10px'
    },
    scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '5px' },
    item: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 15px', borderRadius: '50px',
        textDecoration: 'none', fontSize: '0.9rem', marginBottom: '4px',
        transition: 'all 0.2s'
    },
    footer: {
        marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #5c1c1c',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '10px'
    },
    backLink: {
        color: '#fca5a5', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold'
    },
    logoutBtn: {
        background: 'none', border: 'none', color: '#e3e3e3', fontSize: '1.2rem', cursor: 'pointer', padding: '10px'
    }
}
