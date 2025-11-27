
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

export default function PaiementObligatoirePro() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    // Pour l'effet de suivi de la souris (Spotlight)
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
                alert("Chargement du module de paiement... Veuillez patienter 2 secondes.");
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

    // Gestion du mouvement de souris pour l'effet "Spotlight"
    const handleMouseMove = (e) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <style jsx>{`
                    .loader-container {
                        min-height: 100vh;
                        background: #000;
                        display: flex; align-items: center; justify-content: center;
                        color: white; font-family: 'Inter', sans-serif;
                    }
                    .spinner {
                        width: 50px; height: 50px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-radius: 50%;
                        border-top-color: #f97316;
                        animation: spin 1s ease-in-out infinite;
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="page-wrapper" onMouseMove={handleMouseMove} ref={containerRef}>
            {/* ====== STYLES PRO ====== */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
                * { margin:0; padding:0; box-sizing:border-box; }
                
                :root {
                    --bg-dark: #050505;
                    --glass: rgba(255, 255, 255, 0.05);
                    --border: rgba(255, 255, 255, 0.1);
                    --primary: #f97316;
                    --text: #ffffff;
                }

                body { font-family: 'Inter', sans-serif; background: var(--bg-dark); color: var(--text); overflow-x: hidden; }

                /* Background Effects */
                .page-wrapper {
                    min-height: 100vh;
                    position: relative;
                    padding: 80px 20px;
                    overflow: hidden;
                }
                .bg-orb {
                    position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.4; z-index: 0;
                    animation: float 20s infinite ease-in-out;
                }
                .orb-1 { width: 500px; height: 500px; background: #4f46e5; top: -10%; right: -10%; }
                .orb-2 { width: 400px; height: 400px; background: #db2777; bottom: -10%; left: -10%; animation-delay: -5s; }

                @keyframes float { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-50px)} }

                .container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 2; }

                /* Headers */
                .header-section { text-align: center; margin-bottom: 80px; }
                h1 {
                    font-size: 56px; font-weight: 800; letter-spacing: -2px; margin-bottom: 20px;
                    background: linear-gradient(180deg, #fff, #94a3b8);
                    -webkit-background-clip: text; background-clip: text; color: transparent;
                }
                .subtitle { font-size: 20px; color: #94a3b8; max-width: 600px; margin: 0 auto; line-height: 1.6; }

                /* Grid Layout */
                .plans-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
                    gap: 40px;
                    perspective: 1000px;
                }

                /* Card Design */
                .plan-card {
                    background: var(--glass);
                    border: 1px solid var(--border);
                    border-radius: 32px;
                    padding: 48px 36px;
                    position: relative;
                    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.3s;
                    backdrop-filter: blur(20px);
                    display: flex; flex-direction: column;
                    overflow: hidden;
                }
                
                /* Hover Effects Deskstop Only */
                @media (min-width: 1024px) {
                    .plan-card:hover {
                        transform: translateY(-10px) scale(1.02);
                        background: rgba(255, 255, 255, 0.08);
                        border-color: rgba(255, 255, 255, 0.2);
                        box-shadow: 0 30px 60px rgba(0,0,0,0.5);
                    }
                }

                /* Spotlight overlay inside card */
                .card-spotlight {
                    pointer-events: none;
                    position: absolute; inset: 0;
                    background: radial-gradient(600px circle at var(--x) var(--y), rgba(255,255,255,0.06), transparent 40%);
                    opacity: 0; transition: opacity 0.3s;
                }
                .plans-grid:hover .card-spotlight { opacity: 1; }

                /* Content Styling */
                .badge {
                    position: absolute; top: 20px; right: 20px;
                    background: rgba(249, 115, 22, 0.2); color: #fb923c;
                    border: 1px solid rgba(249, 115, 22, 0.4);
                    padding: 6px 14px; border-radius: 20px;
                    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
                }

                .plan-title { font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 8px; }
                .plan-desc { color: #94a3b8; font-size: 15px; margin-bottom: 30px; min-height: 40px; }

                .price-box { margin-bottom: 40px; display: flex; align-items: baseline; gap: 8px; }
                .currency { font-size: 24px; color: #94a3b8; }
                .amount { font-size: 56px; font-weight: 800; color: #fff; letter-spacing: -2px; }
                .period { color: #64748b; font-size: 16px; }

                .features-list { list-style: none; margin-bottom: 40px; flex-grow: 1; }
                .features-list li {
                    display: flex; align-items: center; gap: 12px;
                    margin-bottom: 16px; color: #cbd5e1; font-size: 15px;
                }
                .check-icon {
                    width: 20px; height: 20px; border-radius: 50%;
                    background: #22c55e; display: flex; align-items: center; justify-content: center;
                    color: #000; font-size: 12px; flex-shrink: 0;
                }

                /* Buttons */
                .cta-btn {
                    width: 100%; padding: 20px; border-radius: 16px; border: none;
                    font-size: 16px; font-weight: 600; cursor: pointer;
                    transition: all 0.3s; position: relative; overflow: hidden;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                }
                .btn-glow {
                    background: #fff; color: #000;
                }
                .btn-glow:hover {
                    box-shadow: 0 0 30px rgba(255,255,255,0.4); transform: scale(1.02);
                }
                
                .btn-outline {
                    background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.2);
                }
                .btn-outline:hover {
                    background: rgba(255,255,255,0.1); border-color: #fff;
                }

                /* Manual Payment Section */
                .manual-section {
                    margin-top: 100px;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px; padding: 40px;
                    text-align: center;
                    max-width: 600px; margin-left: auto; margin-right: auto;
                }
                .phone-chip {
                    display: inline-block; background: #1e293b; color: #fff;
                    padding: 10px 20px; border-radius: 12px; margin: 10px;
                    font-family: monospace; font-size: 18px; border: 1px solid #334155;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    h1 { font-size: 36px; }
                    .plan-card { padding: 32px 24px; }
                    .amount { font-size: 42px; }
                }
            `}</style>

            <div className="bg-orb orb-1"></div>
            <div className="bg-orb orb-2"></div>

            <div className="container">
                <div className="header-section">
                    <h1>Investissez dans votre sérénité</h1>
                    <p className="subtitle">Choisissez la puissance dont vous avez besoin. Changez à tout moment. Transparence totale.</p>
                </div>

                <div className="plans-grid">
                    {plans.map((plan, index) => (
                        <div 
                            key={plan.id} 
                            className="plan-card"
                            style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards` }}
                        >
                            {/* Spotlight effect div */}
                            <div 
                                className="card-spotlight" 
                                style={{ '--x': `${mousePos.x}px`, '--y': `${mousePos.y}px` }}
                            ></div>

                            {plan.prix_mensuel > 0 && <span className="badge">Populaire</span>}

                            <div style={{position:'relative', zIndex:2}}>
                                <h3 className="plan-title">{plan.nom_plan}</h3>
                                <p className="plan-desc">{plan.description}</p>

                                <div className="price-box">
                                    {plan.prix_mensuel === 0 ? (
                                        <span className="amount">Gratuit</span>
                                    ) : (
                                        <>
                                            <span className="amount">{plan.prix_mensuel.toLocaleString()}</span>
                                            <span className="currency">FCFA</span>
                                            <span className="period">/mois</span>
                                        </>
                                    )}
                                </div>

                                <ul className="features-list">
                                    <li>
                                        <div className="check-icon">✓</div>
                                        <span>Jusqu'à {plan.max_utilisateurs} utilisateurs</span>
                                    </li>
                                    <li>
                                        <div className="check-icon">✓</div>
                                        <span>{plan.max_ecritures.toLocaleString()} écritures comptables</span>
                                    </li>
                                    <li>
                                        <div className="check-icon">✓</div>
                                        <span>Support technique {plan.prix_mensuel > 0 ? 'Prioritaire' : 'Standard'}</span>
                                    </li>
                                    <li>
                                        <div className="check-icon">✓</div>
                                        <span>Sauvegarde Cloud Sécurisée</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => handlePayer(plan)}
                                    className={`cta-btn ${plan.prix_mensuel === 0 ? 'btn-outline' : 'btn-glow'}`}
                                >
                                    {plan.prix_mensuel === 0 ? "Commencer gratuitement" : "Choisir ce plan"}
                                    {plan.prix_mensuel > 0 && <span>→</span>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="manual-section">
                    <h3 style={{color:'white', marginBottom:'15px'}}>Besoin d'une assistance paiement ?</h3>
                    <p style={{color:'#94a3b8', marginBottom:'20px'}}>
                        Si vous rencontrez des difficultés, effectuez un dépôt manuel sur ces numéros et contactez le support.
                    </p>
                    <div>
                        <span className="phone-chip">01 47 88 01 43</span>
                        <span className="phone-chip">01 92 87 87 02</span>
                    </div>
                </div>
                
                <style jsx>{`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(40px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        </div>
    );
}