// src/pages/PaiementObligatoire.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const PaiementObligatoire = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('est_actif', true)
      .order('prix_mensuel', { ascending: true });

    setPlans(data || []);
  };

  const handleSubscribe = async (plan) => {
    if (loading) return;

    const confirmation = window.confirm(
      `CONFIRMATION DE PAIEMENT\n\n` +
      `Plan sélectionné : ${plan.nom_plan}\n` +
      `Montant : ${plan.prix_mensuel.toLocaleString()} FCFA / mois\n\n` +
      `Avez-vous effectué le transfert Mobile Money vers l'un des numéros suivants ?\n\n` +
      `01 47 88 01 43   ou   01 92 87 87 02\n\n` +
      `Cliquez sur OK uniquement si le paiement a été effectué.\n\n` +
      `Votre accès sera activé immédiatement après validation.`
    );

    if (!confirmation) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data: entreprise } = await supabase
        .from('entreprises')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!entreprise) throw new Error("Aucune entreprise trouvée");

      const { error } = await supabase
        .from('abonnements')
        .upsert({
          entreprise_id: entreprise.id,
          plan_id: plan.id,
          date_debut: new Date().toISOString(),
          statut: 'ACTIF',
          ecritures_conso_mois: 0
        }, { onConflict: 'entreprise_id' });

      if (error) throw error;

      // Succès
      alert(`Félicitations !\n\nVotre abonnement "${plan.nom_plan}" est activé.\nAccès complet débloqué !`);
      navigate('/dashboard');
    } catch (err) {
      alert("Erreur : " + err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#0f172a; color:white; min-height:100vh; }
        .container { max-width:1200px; margin:0 auto; padding:40px 20px; text-align:center; }
        .header h1 { font-size:3rem; font-weight:900; background:linear-gradient(90deg,#ef4444,#dc2626); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:16px; }
        .header p { font-size:1.2rem; color:#94a3b8; max-width:700px; margin:0 auto 50px; line-height:1.6; }
        .plans-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:30px; margin-bottom:60px; }
        .card {
          background:white; color:#1e293b; border-radius:20px; padding:35px 25px; position:relative; overflow:hidden;
          box-shadow:0 20px 40px rgba(0,0,0,.3); transition:all .4s; border:2px solid transparent;
        }
        .card:hover { transform:translateY(-12px); box-shadow:0 30px 60px rgba(59,130,246,.4); }
        .popular { border-color:#3b82f6 !important; }
        .ribbon {
          position:absolute; top:0; right:0; background:#3b82f6; color:white; padding:8px 20px; font-size:0.8rem;
          font-weight:700; border-bottom-left-radius:12px; clip-path:polygon(0 0,100% 0,100% 100%,0 100%,20% 50%);
        }
        .plan-name { font-size:1.6rem; font-weight:800; margin:10px 0; color:#1e293b; }
        .price { font-size:3rem; font-weight:900; color:#3b82f6; margin:20px 0; }
        .price span { font-size:1.2rem; color:#64748b; font-weight:500; }
        .features { text-align:left; margin:30px 0; }
        .features li { padding:10px 0; border-bottom:1px dashed #e2e8f0; font-size:0.95rem; }
        .features li strong { color:#1e293b; }
        .btn {
          width:100%; padding:16px; background:#1e293b; color:white; border:none; border-radius:12px;
          font-size:1.1rem; font-weight:700; cursor:pointer; transition:all .3s; margin-top:20px;
        }
        .btn:hover { background:#3b82f6; transform:scale(1.03); }
        .btn-popular { background:#3b82f6 !important; }
        .payment-box {
          background:linear-gradient(135deg,#1e293b,#0f172a); padding:40px; border-radius:20px;
          border:1px solid #334155; max-width:800px; margin:0 auto;
        }
        .numbers {
          display:flex; justify-content:center; gap:30px; flex-wrap:wrap; margin:25px 0;
        }
        .number-box {
          background:white; color:#1e293b; padding:16px 32px; border-radius:14px; font-size:1.4rem;
          font-weight:900; display:flex; align-items:center; gap:12px; box-shadow:0 10px 30px rgba(0,0,0,.3);
        }
        .footer-note { font-size:0.9rem; color:#64748b; margin-top:20px; }
        @media(max-width:768px){
          .header h1{font-size:2.4rem}
          .number-box{font-size:1.2rem;padding:14px 24px}
        }
      `}</style>

      <div className="container">
        <div className="header">
          <h1>Accès Restreint</h1>
          <p>
            Votre période d'essai est terminée ou vous avez dépassé les limites gratuites.<br />
            Choisissez un abonnement pour continuer à utiliser toutes les fonctionnalités.
          </p>
        </div>

        <div className="plans-grid">
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className={`card ${plan.prix_mensuel > 15000 ? 'popular' : ''}`}
              style={{ animationDelay: `${i * 0.2}s`, animation: 'fadeInUp 0.6s ease backwards' }}
            >
              {plan.prix_mensuel > 15000 && <div className="ribbon">LE PLUS POPULAIRE</div>}
              
              <h3 className="plan-name">{plan.nom_plan}</h3>
              
              <div className="price">
                {plan.prix_mensuel === 0 ? 'GRATUIT' : plan.prix_mensuel.toLocaleString()}
                {plan.prix_mensuel > 0 && <span> FCFA / mois</span>}
              </div>

              <p style={{ color: '#64748b', fontStyle: 'italic', margin: '15px 0' }}>
                {plan.description}
              </p>

              <ul className="features">
                <li>Jusqu'à <strong>{plan.max_utilisateurs} utilisateur{plan.max_utilisateurs > 1 ? 's' : ''}</strong></li>
                <li><strong>{plan.max_ecritures.toLocaleString()}</strong> écritures comptables / mois</li>
                <li>Support technique prioritaire</li>
                <li>Export PDF & Excel</li>
                <li>Facturation & paie incluse</li>
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loading}
                className={`btn ${plan.prix_mensuel > 15000 ? 'btn-popular' : ''}`}
              >
                {loading ? 'Validation...' : `Choisir ${plan.nom_plan}`}
              </button>
            </div>
          ))}
        </div>

        <div className="payment-box">
          <h3 style={{ color: '#38bdf8', marginBottom: '20px', fontSize: '1.6rem' }}>
            Comment payer ?
          </h3>
          <p style={{ color: '#cbd5e1', marginBottom: '25px' }}>
            Effectuez votre paiement par Mobile Money sur l’un des numéros suivants :
          </p>

          <div className="numbers">
            <div className="number-box">
              <span>01 47 88 01 43</span>
            </div>
            <div className="number-box">
              <span>01 92 87 87 02</span>
            </div>
          </div>

          <p className="footer-note">
            Une fois le paiement effectué, cliquez simplement sur le bouton du plan choisi.<br />
            Votre compte sera activé instantanément.
          </p>
        </div>

        <div style={{ marginTop: '50px', color: '#64748b', fontSize: '0.9rem' }}>
          Besoin d’aide ? Contactez-nous au <strong>01 47 88 01 43</strong>
        </div>
      </div>
    </>
  );
};

export default PaiementObligatoire;
