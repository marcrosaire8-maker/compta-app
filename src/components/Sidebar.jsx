import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { SUPER_ADMIN_ID } from '../utils/constants';

export default function Sidebar({ entrepriseNom, userRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // État pour le menu tiroir (Drawer)
  const [isOpen, setIsOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === SUPER_ADMIN_ID) {
        setIsSuperAdmin(true);
      }
    };
    checkAdminStatus();
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <>
      {/* 1. BOUTON TOGGLE (Fixe en haut à gauche) */}
      <button 
        onClick={toggleMenu}
        style={styles.toggleBtn}
        title="Ouvrir/Fermer le menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* 2. OVERLAY (Fond sombre) */}
      {isOpen && <div onClick={closeMenu} style={styles.overlay}></div>}

      {/* 3. LA SIDEBAR COMPLETE */}
      <aside style={{ ...styles.container, left: isOpen ? '0' : '-280px' }}>
        
        <div style={styles.header}>
          <span style={styles.logoText}>Compta-SaaS</span>
          <button onClick={closeMenu} style={{background:'none', border:'none', color:'#aaa', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
        </div>

        <Link to="/factures" onClick={closeMenu} style={styles.newBtn}>
          <span style={{ fontSize: '1.2rem' }}>＋</span>
          <span>Nouvelle Facture</span>
        </Link>

        {/* LIEN ADMIN (Visible uniquement pour toi) */}
        {isSuperAdmin && (
            <Link to="/admin/overview" onClick={closeMenu} style={{ ...styles.item, color: '#fca5a5', border: '1px solid #7f1d1d', marginBottom: 15 }}>
                ⚠️ Console Admin
            </Link>
        )}

        {/* --- MENU COMPLET --- */}
        <div style={styles.scrollArea}>
          
          <SectionTitle label="Tableau de bord" />
          <MenuItem to="/dashboard" label="Vue d'ensemble" current={location.pathname} onClick={closeMenu} />

          <SectionTitle label="Gestion Commerciale" />
          <MenuItem to="/factures" label="Ventes (Factures)" current={location.pathname} onClick={closeMenu} />
          <MenuItem to="/depenses" label="Achats (Dépenses)" current={location.pathname} onClick={closeMenu} />
          <MenuItem to="/produits" label="Stocks & Services" current={location.pathname} onClick={closeMenu} />
          <MenuItem to="/tiers" label="Clients & Fournisseurs" current={location.pathname} onClick={closeMenu} />
          <MenuItem to="/paie" label="Gestion Paie (RH)" current={location.pathname} onClick={closeMenu} />

          <SectionTitle label="Comptabilité" />
          <MenuItem to="/journal" label="Saisie Journal" current={location.pathname} onClick={closeMenu} />
          <MenuItem to="/plan-comptable" label="Plan Comptable" current={location.pathname} onClick={closeMenu} /> {/* AJOUTÉ */}
          <MenuItem to="/reporting" label="Balance & Grand Livre" current={location.pathname} onClick={closeMenu} /> {/* AJOUTÉ */}
          <MenuItem to="/rapprochement" label="Rapprochement Bancaire" current={location.pathname} onClick={closeMenu} />
          <MenuItem to="/immobilisations" label="Immobilisations" current={location.pathname} onClick={closeMenu} />
          
          <SectionTitle label="États & Rapports" />
          <MenuItem to="/etats-financiers" label="Bilan & Résultat" current={location.pathname} onClick={closeMenu} />
          <MenuItem to="/editions" label="Éditions Légales" current={location.pathname} onClick={closeMenu} />

          <SectionTitle label="Configuration" />
          <MenuItem to="/parametres" label="Paramètres" current={location.pathname} onClick={closeMenu} />
          <MenuItem to="/support-client" label="Aide & Support" current={location.pathname} onClick={closeMenu} />

        </div>

        <div style={styles.footer}>
          <div style={styles.userInfo}>
              <div style={{fontWeight:'bold'}}>{entrepriseNom || '...'}</div>
              <div style={{fontSize:'0.75rem', opacity:0.7}}>{userRole || 'Utilisateur'}</div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Déconnexion">⏻</button>
        </div>

      </aside>
    </>
  );
}

// --- SOUS-COMPOSANTS ---
function MenuItem({ to, label, current, onClick }) {
  const isActive = current === to;
  return (
    <Link to={to} onClick={onClick} style={{ 
        ...styles.item, 
        backgroundColor: isActive ? '#004a77' : 'transparent',
        color: isActive ? '#c2e7ff' : '#e3e3e3',
        fontWeight: isActive ? 'bold' : 'normal'
    }}>
      {label}
    </Link>
  )
}

function SectionTitle({ label }) {
    return <div style={styles.sectionTitle}>{label}</div>
}

// --- STYLES ---
const styles = {
    toggleBtn: { position: 'fixed', top: '15px', left: '15px', zIndex: 2000, background: '#1e1f20', color: 'white', border: '1px solid #3c4043', borderRadius: '8px', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1500, backdropFilter: 'blur(2px)' },
    container: { width: '260px', height: '100vh', backgroundColor: '#1e1f20', color: '#e3e3e3', display: 'flex', flexDirection: 'column', fontFamily: '"Google Sans", Roboto, Arial, sans-serif', position: 'fixed', top: 0, zIndex: 1600, padding: '10px', boxSizing: 'border-box', transition: 'left 0.3s ease-in-out', boxShadow: '5px 0 15px rgba(0,0,0,0.5)' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 5px 10px 15px', marginBottom: '20px', marginTop: '40px' },
    logoText: { fontSize: '1.3rem', fontWeight: '500', letterSpacing: '-0.5px' },
    newBtn: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#282a2c', color: '#e3e3e3', padding: '12px 20px', borderRadius: '15px', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem', marginBottom: '20px', margin: '0 10px 20px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' },
    scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '5px' },
    sectionTitle: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#8e918f', margin: '15px 0 5px 15px', fontWeight: '600' },
    item: { display: 'block', padding: '10px 15px', borderRadius: '50px', textDecoration: 'none', color: '#e3e3e3', fontSize: '0.9rem', marginBottom: '2px', transition: 'background 0.2s' },
    footer: { marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #3c4043', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '10px' },
    userInfo: { display: 'flex', flexDirection: 'column' },
    logoutBtn: { background: 'none', border: 'none', color: '#e3e3e3', fontSize: '1.2rem', cursor: 'pointer', padding: '10px' }
}
