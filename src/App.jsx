import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORTS DES COMPOSANTS PARTAGÉS ---
import Navbar from './components/Navbar';
import PaymentGuard from './components/PaymentGuard';

// --- IMPORT DU LAYOUT ADMIN ---
import AdminLayout from './layouts/AdminLayout'; 

// --- IMPORTS DES PAGES ADMIN ---
import AdminOverview from './pages/AdminOverview';
import GestionSuppression from './pages/GestionSuppression';
import Monetization from './pages/Monetization';
import GestionUtilisateurs from './pages/GestionUtilisateurs';
import AdminSupport from './pages/AdminSupport';
import AdminPlanModele from './pages/AdminPlanModele';

// --- IMPORTS DES PAGES CLIENTS ---
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PaiementObligatoire from './pages/PaiementObligatoire';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import PlanComptable from './pages/PlanComptable';
import Factures from './pages/Factures';
import Depenses from './pages/Depenses';
import Tiers from './pages/Tiers';
import Produits from './pages/Produits';
import Paie from './pages/Paie';
import Parametres from './pages/Parametres';
import EtatsFinanciers from './pages/EtatsFinanciers';
import Reporting from './pages/Reporting';
import Editions from './pages/Editions';
import Rapprochement from './pages/Rapprochement';
import Immobilisations from './pages/Immobilisations';
import SupportClient from './pages/SupportClient'; // <--- NOUVEL IMPORT

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        
        <Routes>
          
          {/* ============================================================
              1. ZONE SUPER ADMIN (PROTÉGÉE PAR ADMIN LAYOUT)
          ============================================================= */}
          <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              
              <Route path="overview" element={<AdminOverview />} />
              <Route path="gestion" element={<GestionUtilisateurs />} /> 
              <Route path="monetization" element={<Monetization />} />
              <Route path="plan-modele" element={<AdminPlanModele />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="suppressions" element={<GestionSuppression />} />
          </Route>
          
          {/* ============================================================
              2. ZONE PUBLIQUE
          ============================================================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/paiement-requis" element={<PaiementObligatoire />} />
          
          {/* ============================================================
              3. ZONE CLIENT (PROTÉGÉE PAR PAYMENT GUARD)
          ============================================================= */}
          
          <Route path="/dashboard" element={<PaymentGuard><Dashboard /></PaymentGuard>} />
          
          {/* Gestion Commerciale & RH */}
          <Route path="/factures" element={<PaymentGuard><Factures /></PaymentGuard>} />
          <Route path="/depenses" element={<PaymentGuard><Depenses /></PaymentGuard>} />
          <Route path="/produits" element={<PaymentGuard><Produits /></PaymentGuard>} />
          <Route path="/tiers" element={<PaymentGuard><Tiers /></PaymentGuard>} />
          <Route path="/paie" element={<PaymentGuard><Paie /></PaymentGuard>} />
          
          {/* Comptabilité & Reporting */}
          <Route path="/journal" element={<PaymentGuard><Journal /></PaymentGuard>} />
          <Route path="/rapprochement" element={<PaymentGuard><Rapprochement /></PaymentGuard>} />
          <Route path="/immobilisations" element={<PaymentGuard><Immobilisations /></PaymentGuard>} />
          <Route path="/plan-comptable" element={<PaymentGuard><PlanComptable /></PaymentGuard>} />
          <Route path="/reporting" element={<PaymentGuard><Reporting /></PaymentGuard>} />
          <Route path="/etats-financiers" element={<PaymentGuard><EtatsFinanciers /></PaymentGuard>} />
          <Route path="/editions" element={<PaymentGuard><Editions /></PaymentGuard>} />
          
          {/* Configuration & Support */}
          <Route path="/parametres" element={<PaymentGuard><Parametres /></PaymentGuard>} />
          <Route path="/support-client" element={<PaymentGuard><SupportClient /></PaymentGuard>} /> {/* <--- NOUVELLE ROUTE */}
          
          {/* Route 404 */}
          <Route path="*" element={
            <div style={{ padding: 50, textAlign: 'center', fontFamily: 'sans-serif' }}>
              <h1 style={{ color: '#e11d48' }}>404 - Page introuvable</h1>
              <p>La page demandée n'existe pas.</p>
              <a href="/dashboard" style={{ color: '#3b82f6', fontWeight: 'bold' }}>Retour au tableau de bord</a>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App;
