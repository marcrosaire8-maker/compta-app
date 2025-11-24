// src/pages/AdminSupport.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

/* --- ICÔNES SVG --- */
const IconTicket = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconMail = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;

/* --- CSS STYLES --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  /* CORRECTIF FORCE POUR MOBILE */
  @media (max-width: 900px) {
    main {
      margin-left: 0 !important;
      padding: 1rem !important;
      width: 100% !important;
    }
  }

  * { box-sizing: border-box; }

  .dashboard-wrapper {
    font-family: 'Inter', sans-serif;
    color: #1e293b;
    width: 100%;
    min-height: 100vh;
    padding: 1rem;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: hidden;
  }

  .dashboard-container {
    width: 100%;
    max-width: 900px; /* Plus étroit pour une lecture facile des tickets */
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* HEADER */
  .header-flex {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    text-align: center;
    margin-bottom: 1rem;
  }
  .header-content h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    color: #b91c1c;
    line-height: 1.2;
  }
  .header-content p { color: #64748b; font-size: 0.9rem; margin: 0; }

  .btn-simulate {
    padding: 0.6rem 1rem;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .btn-simulate:hover { background: #f8fafc; border-color: #94a3b8; }

  /* FILTRES */
  .filter-bar {
    display: flex;
    gap: 0.5rem;
    background: #e2e8f0;
    padding: 0.3rem;
    border-radius: 12px;
    width: 100%;
    justify-content: space-between;
  }
  .filter-btn {
    flex: 1;
    padding: 0.6rem;
    border: none;
    border-radius: 9px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: #64748b;
    text-align: center;
  }
  .filter-btn.active {
    background: white;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  /* TICKET LIST */
  .ticket-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  /* TICKET CARD */
  .ticket-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    overflow: hidden;
  }

  /* Indicateur de priorité (Barre à gauche) */
  .priority-stripe {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 5px;
  }

  .ticket-header {
    display: flex;
    flex-direction: column; /* Mobile: empilé */
    gap: 0.5rem;
  }
  .ticket-subject {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .ticket-company {
    font-size: 0.8rem;
    font-weight: 500;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .ticket-date {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .ticket-body {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #334155;
    line-height: 1.5;
    border: 1px solid #f1f5f9;
  }

  .ticket-footer {
    display: flex;
    flex-direction: column; /* Mobile: empilé */
    gap: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #f1f5f9;
  }

  .contact-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  .actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-action {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.8rem;
    border-radius: 6px;
    border: none;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    flex: 1; /* Mobile: boutons pleine largeur */
    justify-content: center;
  }
  .btn-resolve { background: #dcfce7; color: #166534; }
  .btn-delete { background: #f1f5f9; color: #64748b; }

  /* MEDIA DESKTOP */
  @media (min-width: 768px) {
    .dashboard-wrapper { padding: 2rem; }
    .header-flex { flex-direction: row; justify-content: space-between; text-align: left; }
    .filter-bar { width: auto; min-width: 400px; }
    
    .ticket-header { flex-direction: row; justify-content: space-between; align-items: flex-start; }
    .ticket-footer { flex-direction: row; justify-content: space-between; align-items: center; }
    .actions { width: auto; }
    .btn-action { flex: initial; } /* Boutons taille normale sur PC */
  }
`;

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('OUVERT');

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets_support')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setTickets(data || []);
    setLoading(false);
  }

  const handleCloseTicket = async (id) => {
    if (!confirm("Marquer ce ticket comme RÉSOLU ?")) return;
    const { error } = await supabase.from('tickets_support').update({ statut: 'RESOLU' }).eq('id', id);
    if (!error) fetchTickets();
  };

  const handleDeleteTicket = async (id) => {
    if (!confirm("Supprimer définitivement ce ticket ?")) return;
    await supabase.from('tickets_support').delete().eq('id', id);
    fetchTickets();
  };

  const simulateTicket = async () => {
    await supabase.from('tickets_support').insert([{
      email_contact: 'client_test@gmail.com',
      entreprise_nom: 'Boulangerie Test',
      sujet: 'Problème impression PDF',
      description: 'Bonjour, quand je clique sur imprimer facture, rien ne se passe.',
      priorite: 'HAUTE'
    }]);
    fetchTickets();
  };

  const filteredTickets = tickets.filter(t => filterStatus === 'TOUS' || t.statut === filterStatus);

  const getPriorityColor = (p) => {
    if(p === 'HAUTE') return '#ef4444'; // Rouge
    if(p === 'MOYENNE') return '#f59e0b'; // Orange
    return '#10b981'; // Vert
  };

  if (loading) return <div style={{height:'100vh', display:'grid', placeItems:'center', fontFamily:'sans-serif'}}>Chargement...</div>;

  return (
    <div className="dashboard-wrapper">
      <style>{styles}</style>

      <div className="dashboard-container">
        
        {/* HEADER */}
        <div className="header-flex">
          <div className="header-content">
            <h1>Support Technique</h1>
            <p>Gérez les réclamations et bugs signalés.</p>
          </div>
          <button onClick={simulateTicket} className="btn-simulate">
            + Simuler Ticket
          </button>
        </div>

        {/* FILTRES TYPE "SEGMENTED CONTROL" */}
        <div style={{display:'flex', justifyContent:'center'}}>
          <div className="filter-bar">
            <button onClick={() => setFilterStatus('OUVERT')} className={`filter-btn ${filterStatus === 'OUVERT' ? 'active' : ''}`}>En attente</button>
            <button onClick={() => setFilterStatus('RESOLU')} className={`filter-btn ${filterStatus === 'RESOLU' ? 'active' : ''}`}>Résolus</button>
            <button onClick={() => setFilterStatus('TOUS')} className={`filter-btn ${filterStatus === 'TOUS' ? 'active' : ''}`}>Tout</button>
          </div>
        </div>

        {/* LISTE DES TICKETS */}
        <div className="ticket-list">
          {filteredTickets.map(t => (
            <div key={t.id} className="ticket-card">
              {/* Barre de couleur priorité */}
              <div className="priority-stripe" style={{background: getPriorityColor(t.priorite)}}></div>
              
              <div className="ticket-header">
                <div className="ticket-subject">
                  <div style={{width:20, height:20, color:'#b91c1c'}}><IconTicket /></div>
                  {t.sujet}
                  <span className="ticket-company">{t.entreprise_nom}</span>
                </div>
                <div className="ticket-date">
                  {new Date(t.created_at).toLocaleDateString('fr-FR', {day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'})}
                </div>
              </div>

              <div className="ticket-body">
                "{t.description}"
              </div>

              <div className="ticket-footer">
                <div className="contact-info">
                  <span style={{color: getPriorityColor(t.priorite), textTransform:'uppercase', fontSize:'0.75rem'}}>{t.priorite}</span>
                  <a href={`mailto:${t.email_contact}`} style={{color:'#3b82f6', textDecoration:'none', display:'flex', alignItems:'center', gap:5}}>
                    <div style={{width:16, height:16}}><IconMail /></div>
                    {t.email_contact}
                  </a>
                </div>

                <div className="actions">
                  {t.statut !== 'RESOLU' && (
                    <button onClick={() => handleCloseTicket(t.id)} className="btn-action btn-resolve">
                      <div style={{width:16, height:16}}><IconCheck /></div> Résoudre
                    </button>
                  )}
                  <button onClick={() => handleDeleteTicket(t.id)} className="btn-action btn-delete">
                    <div style={{width:16, height:16}}><IconTrash /></div> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTickets.length === 0 && (
            <div style={{textAlign:'center', padding:'3rem', color:'#94a3b8', background:'white', borderRadius:12, border:'1px solid #e2e8f0'}}>
              Aucun ticket dans cette catégorie. Tout va bien ! 🏖️
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
