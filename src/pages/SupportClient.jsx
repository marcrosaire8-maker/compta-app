// src/pages/SupportClient.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';

/* ICÔNES */
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const IconMessage = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconClock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconClose = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>;

/* STYLES PREMIUM ROUGE + RESPONSIVE FORCÉE */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box}body{margin:0;font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b}
  .page{display:flex;min-height:100vh}
  .main{flex:1;margin-left:260px;padding:2.5rem;transition:all .4s}
  @media(max-width:1024px){.main{margin-left:0;padding:1.5rem;padding-top:90px}}
  .header h1{font-size:2.4rem;font-weight:900;background:linear-gradient(90deg,#dc2626,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 .5rem}
  .header p{color:#64748b;margin:0}
  .actions{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1.5rem;margin-bottom:2.5rem}
  .btn{background:#dc2626;color:white;border:none;padding:.9rem 1.8rem;border-radius:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:.6rem;box-shadow:0 8px 20px rgba(220,38,38,.3);transition:.3s}
  .btn:hover{background:#b91c1c;transform:translateY(-2px)}
  .btn-blue{background:#3b82f6}
  .card{background:white;border-radius:18px;padding:2rem;border:1px solid #e2e8f0;box-shadow:0 10px 30px -8px rgba(0,0,0,.08);overflow:hidden}
  .ticket-list{display:grid;gap:1.8rem}
  .ticket{background:white;border-radius:16px;padding:1.8rem;box-shadow:0 8px 25px rgba(0,0,0,.06);border-left:6px solid;transition:all .3s;position:relative;overflow:hidden}
  .ticket:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(0,0,0,.12)}
  .ticket-header{display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;flex-wrap:wrap;gap:1rem}
  .ticket-title{margin:0;font-size:1.4rem;font-weight:800;color:#1e293b}
  .status-badge{padding:6px 14px;border-radius:20px;font-size:0.8rem;font-weight:800;color:white}
  .status-ouvert{background:#f59e0b}
  .status-en_cours{background:#3b82f6}
  .status-resolu{background:#10b981}
  .priority-badge{padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;color:white;margin-left:.5rem}
  .priority-basse{background:#94a3b8}
  .priority-moyenne{background:#f59e0b}
  .priority-haute{background:#dc2626}
  .ticket-desc{color:#475569;line-height:1.6;margin:1rem 0;font-size:1rem}
  .ticket-meta{display:flex;align-items:center;gap:1.5rem;font-size:0.9rem;color:#94a3b8;flex-wrap:wrap}
  .empty-state{text-align:center;padding:5rem 2rem;color:#94a3b8;background:white;border-radius:18px;border:2px dashed #cbd5e1}
  .empty-state h3{font-size:1.8rem;margin-bottom:1rem}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem}
  .modal{background:white;border-radius:24px;width:100%;max-width:600px;max-height:90vh;overflow:hidden;box-shadow:0 30px 80px -20px rgba(220,38,38,.4)}
  .modal-header{padding:1.5rem 2rem;background:#fef2f2;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #fee2e2}
  .modal-title{margin:0;font-size:1.6rem;font-weight:800;color:#991b1b}
  .modal-body{padding:2rem;overflow-y:auto}
  .form-group{margin-bottom:1.5rem}
  label{display:block;margin-bottom:.5rem;font-weight:600;color:#475569;font-size:.95rem}
  input,textarea,select{padding:.9rem 1.2rem;border:1px solid #cbd5e1;border-radius:12px;font-size:1rem;width:100%;outline:none;transition:.3s;resize:vertical}
  input:focus,textarea:focus,select:focus{border-color:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,.1)}
  @media(max-width:640px){
    .ticket-header{flex-direction:column;align-items:start}
    .ticket-meta{flex-direction:column;gap:.5rem;align-items:start}
  }
`;

export default function SupportClient() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    sujet: '',
    description: '',
    priorite: 'MOYENNE'
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ste = await getEntrepriseForUser(user.id, user.email);
      if (!ste) return;
      setEntreprise(ste);
      await fetchTickets(ste.nom, ste.email_contact);
      setLoading(false);
    })();
  }, []);

  async function fetchTickets(nom, email) {
    const { data } = await supabase
      .from('tickets_support')
      .select('*')
      .or(`email_contact.eq.${email},entreprise_nom.eq.${nom}`)
      .order('created_at', { ascending: false });
    setTickets(data || []);
  }

  const submitTicket = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('tickets_support').insert([{
        email_contact: entreprise.email_contact,
        entreprise_nom: entreprise.nom,
        sujet: form.sujet,
        description: form.description,
        priorite: form.priorite,
        statut: 'OUVERT'
      }]);

      if (error) throw error;

      alert("Ticket envoyé avec succès ! Nous vous répondons sous 24h");
      setOpen(false);
      setForm({ sujet: '', description: '', priorite: 'MOYENNE' });
      fetchTickets(entreprise.nom, entreprise.email_contact);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const getStatusClass = (s) => {
    if (s === 'RESOLU') return 'status-resolu';
    if (s === 'EN_COURS') return 'status-en_cours';
    return 'status-ouvert';
  };

  const getPriorityClass = (p) => {
    if (p === 'HAUTE') return 'priority-haute';
    if (p === 'MOYENNE') return 'priority-moyenne';
    return 'priority-basse';
  };

  if (loading) return <div style={{height:'100vh',display:'grid',placeItems:'center',fontSize:'2rem'}}>Chargement…</div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="page">
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

        <div className="main">
          <div className="actions">
            <div className="header">
              <h1>Aide & Support</h1>
              <p>Nous sommes là pour vous aider 24/7</p>
            </div>
            <button onClick={() => setOpen(true)} className="btn btn-blue">
              <IconPlus /> Nouveau ticket
            </button>
          </div>

          <div className="card">
            {tickets.length === 0 ? (
              <div className="empty-state">
                <IconMessage />
                <h3>Aucun ticket pour le moment</h3>
                <p>Vous n’avez encore ouvert aucune demande de support.</p>
                <button onClick={() => setOpen(true)} className="btn" style={{marginTop:'1rem'}}>
                  <IconPlus /> Ouvrir mon premier ticket
                </button>
              </div>
            ) : (
              <div className="ticket-list">
                {tickets.map(t => (
                  <div key={t.id} className="ticket" style={{borderLeftColor: t.statut === 'RESOLU' ? '#10b981' : t.statut === 'EN_COURS' ? '#3b82f6' : '#f59e0b'}}>
                    <div className="ticket-header">
                      <h3 className="ticket-title">{t.sujet}</h3>
                      <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                        <span className={`status-badge ${getStatusClass(t.statut)}`}>
                          {t.statut === 'OUVERT' ? 'En attente' : t.statut === 'EN_COURS' ? 'En cours' : 'Résolu'}
                        </span>
                        <span className={`priority-badge ${getPriorityClass(t.priorite)}`}>
                          {t.priorite === 'HAUTE' ? <IconAlert /> : t.priorite === 'MOYENNE' ? <IconClock /> : ''} {t.priorite}
                        </span>
                      </div>
                    </div>
                    <p className="ticket-desc">{t.description}</p>
                    <div className="ticket-meta">
                      <span>Envoyé le {new Date(t.created_at).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      {t.updated_at && t.updated_at !== t.created_at && (
                        <span>Dernière mise à jour : {new Date(t.updated_at).toLocaleDateString('fr')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NOUVEAU TICKET */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                Ouvrir un nouveau ticket
              </div>
              <button onClick={() => setOpen(false)} style={{background:'none',border:'none',cursor:'pointer'}}>
                <IconClose />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitTicket}>
                <div className="form-group">
                  <label>Sujet du problème</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Impossible d'exporter la balance en PDF"
                    value={form.sujet}
                    onChange={e => setForm({...form, sujet: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Description détaillée</label>
                  <textarea
                    rows="6"
                    required
                    placeholder="Décrivez le plus précisément possible votre problème, les étapes pour le reproduire, et joignez des captures d'écran si possible..."
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Niveau de priorité</label>
                  <select value={form.priorite} onChange={e => setForm({...form, priorite: e.target.value})}>
                    <option value="BASSE">Basse - Suggestion ou question</option>
                    <option value="MOYENNE">Moyenne - Problème mineur</option>
                    <option value="HAUTE">Haute - Blocage critique</option>
                  </select>
                </div>
                <div style={{marginTop:'2rem',textAlign:'right'}}>
                  <button type="submit" className="btn btn-blue">
                    Envoyer le ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
