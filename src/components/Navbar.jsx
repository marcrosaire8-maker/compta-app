import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation(); 

  // Liste des pages publiques où la barre du haut doit s'afficher
  const publicPages = ['/', '/login'];

  // Si on n'est PAS sur une page publique (donc on est sur le Dashboard),
  // on retourne "null", ce qui veut dire : NE RIEN AFFICHER.
  if (!publicPages.includes(location.pathname)) {
    return null;
  }

  // --- LE RESTE DU CODE EST POUR LE MONDE PUBLIC ---
  const isLoginPage = location.pathname === '/login';
  const isHomePage = location.pathname === '/';

  return (
    <nav style={{ 
      padding: '15px 30px', 
      background: '#1e293b', 
      color: 'white', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Logo */}
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>
        Compta-SaaS
      </Link>

      {/* Menu Public */}
      {!isLoginPage && (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {!isHomePage && (
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              Accueil
            </Link>
          )}
          <Link to="/login" style={{ 
            background: '#3498db', 
            padding: '8px 15px', 
            borderRadius: '5px', 
            color: 'white', 
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}>
            Connexion / Inscription
          </Link>
        </div>
      )}
    </nav>
  );
}
