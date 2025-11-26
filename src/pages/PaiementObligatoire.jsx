import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

export default function PaiementObligatoire() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();

        const script = document.createElement('script');
        script.src = "https://cdn.kkiapay.me/k.js";
        script.async = true;
        document.body.appendChild(script);

        const successHandler = (response) => {
            console.log("Paiement réussi :", response.detail);
            activerAbonnement(response.detail.amount);
        };

        window.addEventListener('payment:success', successHandler);

        return () => {
            window.removeEventListener('payment:success', successHandler);
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('plans')
            .select('*')
            .eq('est_actif', true)
            .order('prix_mensuel', { ascending: true });
        setPlans(data || []);
        setLoading(false);
    };

    const handlePayer = (plan) => {
        localStorage.setItem('selected_plan_id', plan.id);

        if (plan.prix_mensuel === 0) {
            activerAbonnement(0, plan.id);
        } else {
            if (window.openKkiapayWidget) {
                window.openKkiapayWidget({
                    amount: plan.prix_mensuel,
                    api_key: "c0341e41bbf34befe73fbe912c5453c06416a8d6",
                    sandbox: true,
                    email: "client@email.com",
                    theme: "#f97316",
                });
            } else {
                alert("Le module de paiement charge encore. Réessayez dans 2 secondes.");
            }
        }
    };

    const activerAbonnement = async (montantPaye, planIdDirect = null) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: ste } = await supabase
                .from('entreprises')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            const finalPlanId = planIdDirect || localStorage.getItem('selected_plan_id');
            if (ste && finalPlanId) {
                await supabase
                    .from('abonnements')
                    .upsert({
                        entreprise_id: ste.id,
                        plan_id: finalPlanId,
                        date_debut: new Date(),
                        statut: 'ACTIF',
                        ecritures_conso_mois: 0
                    }, { onConflict: 'entreprise_id' });

                alert("Félicitations ! Votre abonnement est activé.");
                navigate('/dashboard');
            }
        } catch (error) {
            console.error("Erreur activation:", error);
            alert("Erreur lors de l'activation. Contactez le support.");
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.4rem',
                fontFamily: 'Satoshi, sans-serif'
            }}>
                Chargement des offres...
            </div>
        );
    }

    return (
        <>
            {/* ====== DESIGN PREMIUM 2025 – 100% RESPONSIVE ====== */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@400;500;700;900&display=swap');
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family: 'Satoshi', sans-serif; }

                .paiement-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 70%);
                    color: white;
                    padding: 80px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .container {
                    max-width: 1200px;
                    width: 100%;
                    text-align: center;
                }

                h1 {
                    font-size: 48px;
                    font-weight: 900;
                    background: linear-gradient(90deg, #f97316, #fbbf24);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    margin-bottom: 16px;
                }

                .subtitle {
                    font-size: 20px;
                    color: #cbd5e1;
                    margin-bottom: 60px;
                    max-width: 700px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .plans-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 32px;
                    margin-bottom: 80px;
                }

                .plan-card {
                    background: white;
                    color: #0f172a;
                    border-radius: 28px;
                    padding: 40px 32px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.4s;
                }
                .plan-card:hover {
                    transform: translateY(-12px);
                }

                .popular-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #f97316;
                    color: white;
                    padding: 8px 24px;
                    font-weight: 800;
                    font-size: 14px;
                    border-bottom-left-radius: 16px;
                }

                .plan-name {
                    font-size: 28px;
                    font-weight: 900;
                    margin: 16px 0;
                    color: #0f172a;
                }

                .price {
                    font-size: 48px;
                    font-weight: 900;
                    color: #f97316;
                    margin: 20px 0;
                }
                .price span {
                    font-size: 18px;
                    color: #64748b;
                    font-weight: normal;
                }

                .features {
                    text-align: left;
                    margin: 30px 0;
                    flex: 1;
                }
                .features li {
                    padding: 12px 0;
                    border-bottom: 1px dashed #e2e8f0;
                    font-size: 16px;
                }
                .features li strong { color: #0f172a; }

                .btn-plan {
                    width: 100%;
                    padding: 18px;
                    border: none;
                    border-radius: 16px;
                    font-size: 18px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.3s;
                    margin-top: 20px;
                }
                .btn-paid {
                    background: linear-gradient(135deg, #1e293b, #0f172a);
                    color: white;
                }
                .btn-free {
                    background: #94a3b8;
                    color: white;
                }
                .btn-plan:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
                }

                .manual-payment {
                    background: rgba(255,255,255,0.08);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    padding: 40px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .manual-numbers {
                    display: flex;
                    justify-content: center;
                    gap: 24px;
                    flex-wrap: wrap;
                    margin-top: 20px;
                }
                .number {
                    background: white;
                    color: #0f172a;
                    padding: 16px 32px;
                    border-radius: 16px;
                    font-weight: 900;
                    font-size: 20px;
                }

                @media (max-width: 768px) {
                    h1 { font-size: 36px; }
                    .subtitle { font-size: 18px; }
                    .plan-card { padding: 32px 24px; }
                    .price { font-size: 40px; }
                }
            `}</style>

            <div className="paiement-page">
                <div className="container">
                    <h1>Choisissez votre abonnement</h1>
                    <p className="subtitle">
                        Paiement instantané et sécurisé par Mobile Money, Carte Bancaire ou virement manuel.
                    </p>

                    <div className="plans-grid">
                        {plans.map(plan => (
                            <div key={plan.id} className="plan-card">
                                {plan.prix_mensuel > 0 && <div className="popular-badge">LE PLUS CHOISI</div>}
                                
                                <h3 className="plan-name">{plan.nom_plan}</h3>
                                
                                <div className="price">
                                    {plan.prix_mensuel === 0 ? 'GRATUIT' : plan.prix_mensuel.toLocaleString() + ' F'}
                                    {plan.prix_mensuel > 0 && <span> / mois</span>}
                                </div>

                                <p style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '24px' }}>
                                    {plan.description}
                                </p>

                                <ul className="features">
                                    <li>Utilisateurs max : <strong>{plan.max_utilisateurs}</strong></li>
                                    <li>Écritures / mois : <strong>{plan.max_ecritures.toLocaleString()}</strong></li>
                                    <li>Support prioritaire 24/7</li>
                                    <li>Factures & déclarations automatiques</li>
                                </ul>

                                <button
                                    onClick={() => handlePayer(plan)}
                                    className={`btn-plan ${plan.prix_mensuel === 0 ? 'btn-free' : 'btn-paid'}`}
                                >
                                    {plan.prix_mensuel === 0 ? "Activer gratuitement" : "Payer & Démarrer"}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="manual-payment">
                        <h3 style={{ color: '#38bdf8', marginBottom: '16px' }}>
                            Paiement manuel (en cas de besoin)
                        </h3>
                        <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>
                            Effectuez votre paiement sur l’un des numéros suivants, puis contactez-nous sur WhatsApp :
                        </p>
                        <div className="manual-numbers">
                            <div className="number">01 47 88 01 43</div>
                            <div className="number">01 92 87 87 02</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
