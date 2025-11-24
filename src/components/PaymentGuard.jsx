import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

export default function PaymentGuard({ children }) {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkSubscription();
    }, []);

    async function checkSubscription() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Laisser le login gérer ça

        // 1. Trouver l'entreprise
        const { data: ste } = await supabase
            .from('entreprises')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

        if (!ste) {
            // Pas d'entreprise = Pas encore de problème de paiement (il va la créer)
            setIsAuthorized(true);
            setIsLoading(false);
            return;
        }

        // 2. Vérifier l'abonnement
        const { data: sub } = await supabase
            .from('abonnements')
            .select('*, plan:plans(*)')
            .eq('entreprise_id', ste.id)
            .maybeSingle();

        // CAS A : Pas d'abonnement du tout (Nouveau client) -> On le force à choisir ou on lui donne un plan gratuit par défaut
        // Pour l'instant, on bloque s'il n'a rien.
        if (!sub) {
            // Optionnel : Créer un abonnement gratuit auto ici
            navigate('/paiement-requis'); 
            return;
        }

        // CAS B : Abonnement Expiré ou Impayé
        if (sub.statut !== 'ACTIF') {
            navigate('/paiement-requis');
            return;
        }

        // CAS C : Quota dépassé (Limites)
        if (sub.ecritures_conso_mois >= sub.plan.max_ecritures) {
            alert("⚠️ Vous avez atteint la limite d'écritures de votre plan !");
            navigate('/paiement-requis');
            return;
        }

        // Tout est bon
        setIsAuthorized(true);
        setIsLoading(false);
    }

    if (isLoading) return <div style={{padding: 50, textAlign:'center'}}>Vérification de l'abonnement...</div>;

    return isAuthorized ? <>{children}</> : null;
}
