// Fichier: src/components/AdminGuard.jsx (VERSION DÉFINITIVE SANS CRASH)

import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { SUPER_ADMIN_ID } from '../utils/constants';

export default function AdminGuard({ children }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user && user.id === SUPER_ADMIN_ID) {
                setIsAuthorized(true); // Autorisé
            } else {
                // Redirection immédiate si non autorisé (ou non connecté)
                navigate('/dashboard', { replace: true });
                // Note: Le 'navigate' est asynchrone, donc le return doit être immédiat.
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [navigate]);

    // État 1: Chargement (doit s'afficher en premier si la page n'est pas blanche)
    if (isLoading) {
        return <div style={{padding: 50, textAlign: 'center', background: '#f8fafc', color: '#1e293b'}}>Vérification des droits d'accès en cours...</div>;
    }

    // État 2: Autorisé (si l'AdminGuard n'a pas déclenché de redirection)
    if (isAuthorized) {
        return <>{children}</>;
    }
    
    // État 3: Non Autorisé (le navigate a pris le relais, on ne rend rien ici)
    return null;
}
