// Fichier : src/layouts/AdminLayout.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, Outlet } from 'react-router-dom';
import { SUPER_ADMIN_ID } from '../utils/constants';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        checkAndFetch();
    }, []);

    const checkAndFetch = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. GARDE DE SÉCURITÉ : Redirection si non Admin
        if (!user || user.id !== SUPER_ADMIN_ID) {
            navigate('/dashboard', { replace: true });
            return; 
        }

        // 2. CHARGEMENT DE DONNÉES (Une seule fois pour tout le segment Admin)
        const { data: entData } = await supabase
            .from('entreprises')
            .select('id, nom, created_at, email_contact, owner_id') // Selection limitée pour l'exemple
            .order('created_at', { ascending: false });

        setCompanies(entData || []);
        setIsLoading(false);
    };

    if (isLoading) {
        return <div style={{ padding: 50, textAlign: 'center', background: '#f8fafc', color: '#1e293b' }}>Vérification des droits d'accès...</div>;
    }
    
    // Le Bilan est affiché si l'AdminGuard a laissé passer (isLoading=false)
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            
            {/* Sidebar : On lui passe le nombre total de compagnies */}
            <AdminSidebar totalCompanies={companies.length} /> 

            {/* Main Content : Le slot où le contenu des pages enfants va s'afficher */}
            <main style={{ marginLeft: '200px', padding: '40px', width: '100%' }}>
                {/* L'Outlet rendra la page enfant (Overview, Gestion, Suppression) et lui passera les données. */}
                <Outlet context={{ companies, SUPER_ADMIN_ID }} /> 
            </main>
        </div>
    );
}
