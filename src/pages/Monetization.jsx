import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useOutletContext } from 'react-router-dom';

export default function Monetization() {
    // Récupère le contexte global de l'admin (pour afficher le total d'entreprises par exemple)
    const { companies } = useOutletContext(); 
    
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // États pour le CRUD (Create, Read, Update, Delete)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    
    // Formulaire par défaut
    const [formData, setFormData] = useState({ 
        nom_plan: '', 
        prix_mensuel: 0, 
        max_utilisateurs: 1, 
        max_ecritures: 500, 
        description: '', 
        est_actif: true
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    async function fetchPlans() {
        // On récupère les plans et on compte le nombre d'abonnés actifs pour chacun
        const { data, error } = await supabase
            .from('plans')
            .select('*, abonnements(count)')
            .order('prix_mensuel', { ascending: true });
        
        if (error) console.error(error);
        setPlans(data || []);
        setLoading(false);
    }

    // --- GESTION DU MODAL ---
    const openModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({ ...plan });
        } else {
            setEditingPlan(null);
            setFormData({ 
                nom_plan: '', prix_mensuel: 0, max_utilisateurs: 1, max_ecritures: 500, description: '', est_actif: true 
            });
        }
        setIsModalOpen(true);
    };

    // --- SAUVEGARDE (AJOUT / MODIF) ---
    const handleSave = async (e) => {
        e.preventDefault();
        
        const payload = { 
            ...formData, 
            prix_mensuel: Number(formData.prix_mensuel), 
            max_utilisateurs: Number(formData.max_utilisateurs), 
            max_ecritures: Number(formData.max_ecritures) 
        };

        let error;
        if (editingPlan) {
            ({ error } = await supabase.from('plans').update(payload).eq('id', editingPlan.id));
        } else {
            ({ error } = await supabase.from('plans').insert([payload]));
        }

        if (error) {
            alert("Erreur : " + error.message);
        } else {
            alert("Plan enregistré avec succès !");
            setIsModalOpen(false);
            fetchPlans();
        }
    };
    
    // --- SUPPRESSION ---
    const handleDelete = async (id, nom) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer le plan "${nom}" ?\nCela peut échouer s'il a encore des abonnés.`)) return;
        
        const { error } = await supabase.from('plans').delete().eq('id', id);
        
        if (error) alert("Impossible de supprimer : Ce plan est probablement utilisé par des entreprises.");
        else fetchPlans();
    };

    if (loading) return <div style={{padding: 40, textAlign:'center'}}>Chargement des offres...</div>;

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ color: '#b91c1c', margin: 0 }}>Monétisation & Offres</h1>
                    <p style={{color: '#475569'}}>Gérez le catalogue d'abonnements de la plateforme.</p>
                </div>
                <button onClick={() => openModal()} style={btnStyle('#10b981')}>+ Créer un Plan</button>
            </div>

            {/* LISTE DES PLANS */}
            <div style={cardStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={thStyle}>
                            <th>Nom du Plan</th>
                            <th>Prix / Mois</th>
                            <th>Limites (Users / Écritures)</th>
                            <th>Abonnés Actifs</th>
                            <th>Statut</th>
                            <th style={{textAlign:'right'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(p => (
                            <tr key={p.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                                <td style={{...tdStyle, fontWeight: 'bold'}}>{p.nom_plan}</td>
                                <td style={{...tdStyle, color: '#10b981', fontWeight:'bold'}}>
                                    {p.prix_mensuel.toLocaleString()} F
                                </td>
                                <td style={tdStyle}>
                                    👥 {p.max_utilisateurs} &nbsp;|&nbsp; 📝 {p.max_ecritures.toLocaleString()}
                                </td>
                                <td style={{...tdStyle, textAlign:'center'}}>
                                    <span style={{background:'#e0f2fe', color:'#0369a1', padding:'2px 8px', borderRadius:'10px', fontWeight:'bold'}}>
                                        {p.abonnements[0]?.count || 0}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    {p.est_actif ? '🟢 Visible' : '🔴 Masqué'}
                                </td>
                                <td style={{...tdStyle, textAlign:'right'}}>
                                    <button onClick={() => openModal(p)} style={btnActionStyle('blue')}>Modifier</button>
                                    <button onClick={() => handleDelete(p.id, p.nom_plan)} style={btnActionStyle('red')}>Suppr.</button>
                                </td>
                            </tr>
                        ))}
                        {plans.length === 0 && <tr><td colSpan="6" style={{padding:30, textAlign:'center', color:'#94a3b8'}}>Aucun plan défini.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* MODAL FORMULAIRE */}
            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                            <h3 style={{margin:0, color:'#1e293b'}}>{editingPlan ? 'Modifier' : 'Nouveau'} Plan</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
                        </div>
                        
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            
                            <div>
                                <label style={labelStyle}>Nom de l'offre</label>
                                <input type="text" required placeholder="Ex: PREMIUM" value={formData.nom_plan} onChange={e => setFormData({...formData, nom_plan: e.target.value})} style={inputStyle} />
                            </div>
                            
                            <div style={{display:'flex', gap:'15px'}}>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>Prix (FCFA)</label>
                                    <input type="number" required placeholder="0" value={formData.prix_mensuel} onChange={e => setFormData({...formData, prix_mensuel: e.target.value})} style={inputStyle} />
                                </div>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>Max Utilisateurs</label>
                                    <input type="number" required placeholder="1" value={formData.max_utilisateurs} onChange={e => setFormData({...formData, max_utilisateurs: e.target.value})} style={inputStyle} />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Max Écritures / Mois</label>
                                <input type="number" required placeholder="500" value={formData.max_ecritures} onChange={e => setFormData({...formData, max_ecritures: e.target.value})} style={inputStyle} />
                            </div>

                            <div>
                                <label style={labelStyle}>Description commerciale</label>
                                <textarea placeholder="Idéal pour les PME..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{...inputStyle, height:'80px', fontFamily:'sans-serif'}} />
                            </div>
                            
                            <div style={{display:'flex', alignItems:'center', gap:'10px', background:'#f8fafc', padding:10, borderRadius:6}}>
                                <input type="checkbox" checked={formData.est_actif} onChange={e => setFormData({...formData, est_actif: e.target.checked})} id="actifCheck" />
                                <label htmlFor="actifCheck" style={{margin:0, cursor:'pointer'}}>Rendre ce plan visible aux clients</label>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={btnActionStyle('grey')}>Annuler</button>
                                <button type="submit" style={btnStyle('#3b82f6')}>Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

// --- STYLES ---
const thStyle = { padding: '12px', textAlign: 'left', color: '#1e293b', background: '#f1f5f9', fontWeight: 'bold', fontSize: '0.9rem' };
const tdStyle = { padding: '10px 12px', color: '#475569', fontSize: '0.9rem' };
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom:'30px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };
const labelStyle = { display:'block', marginBottom: 5, fontSize:'0.85rem', fontWeight:'bold', color:'#64748b' };
const btnStyle = (bg) => ({ padding: '10px 20px', background: bg, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' });

const btnActionStyle = (color) => {
    let bgColor, textColor;
    if (color === 'blue') { bgColor = '#dbeafe'; textColor = '#1e40af'; } // Bleu clair
    else if (color === 'red') { bgColor = '#fecaca'; textColor = '#b91c1c'; } // Rouge clair
    else { bgColor = '#f1f5f9'; textColor = '#475569'; }
    return {
        background: bgColor, color: textColor, border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize:'0.8rem', marginLeft: 5
    };
};

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContentStyle = { background: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth:'90%', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };
