import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-container">
      
      {/* SECTION HERO : L'ACCROCHE */}
      <header className="hero">
        <span className="ohada-badge">✅ Conforme SYSCOHADA Révisé</span>
        <h1>
          La Comptabilité <span className="highlight">Intelligente</span><br />
          pour l'Afrique de demain.
        </h1>
        <p>
          Gérez vos comptes, votre facturation et votre paie sur une plateforme unique, 
          sécurisée et multi-entreprises. Conçue pour simplifier votre croissance.
        </p>
        
        {/* --- CORRECTION ICI : On redirige vers la connexion --- */}
        <Link to="/login" className="cta-button">
          Commencer maintenant ➔
        </Link>
        {/* ----------------------------------------------------- */}
        
      </header>

      {/* SECTION FONCTIONNALITÉS */}
      <section className="features">
        <div className="section-title">
          <h2>Tout ce dont vous avez besoin</h2>
          <p>Une suite d'outils puissants pour piloter votre entreprise.</p>
        </div>

        <div className="grid">
          {/* Carte 1 */}
          <div className="card">
            <span className="icon">📊</span>
            <h3>Comptabilité Générale</h3>
            <p>
              Saisie simplifiée, journaux automatisés et génération des états financiers 
              en un clic. Respect strict des normes comptables.
            </p>
          </div>

          {/* Carte 2 */}
          <div className="card">
            <span className="icon">🧾</span>
            <h3>Facturation Intégrée</h3>
            <p>
              Créez des devis et factures professionnels. Transformez-les en écritures 
              comptables automatiquement sans resaisie.
            </p>
          </div>

          {/* Carte 3 */}
          <div className="card">
            <span className="icon">🏢</span>
            <h3>Multi-Entreprises</h3>
            <p>
              Gérez plusieurs sociétés depuis un seul compte. Idéal pour les groupes 
              et les cabinets d'expertise comptable.
            </p>
          </div>

          {/* Carte 4 */}
          <div className="card">
            <span className="icon">🔒</span>
            <h3>Sécurité Maximale</h3>
            <p>
              Vos données sont chiffrées, sauvegardées et archivées selon les 
              exigences légales. Inaltérabilité garantie.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer style={{ textAlign: 'center', padding: '40px', background: '#1e293b', color: 'white' }}>
        <p>&copy; 2024 Compta-SaaS. Tous droits réservés.</p>
      </footer>

    </div>
  );
}
