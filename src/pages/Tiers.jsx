// src/pages/Tiers.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ICÔNES */
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const IconEdit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6"/></svg>;
const IconDownload = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7l-5 5-5-5m5-7v12"/></svg>;
const IconClose = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>;
const IconMail = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconPhone = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;

/* STYLES PREMIUM ROUGE + RESPONSIVE 100% */
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
  .btn-green{background:#10b981}
  .card{background:white;border-radius:18px;padding:2rem;border:1px solid #e2e8f0;box-shadow:0 10px 30px -8px rgba(0,0,0,.08);overflow:hidden}
  .filters{background:#fef2f2;padding:1.5rem;border-radius:16px;margin-bottom:2rem;display:flex;gap:1rem;flex-wrap:wrap;align-items:center}
  .search-input{flex:1;min-width:250px;padding:.9rem 1.2rem;border:1px solid #fca5a5;border-radius:12px;outline:none;background:white;font-size:1rem}
  .search-input:focus{border-color:#dc2626}
  select{padding:.9rem 1.2rem;border:1px solid #fca5a5;border-radius:12px;outline:none;background:white;font-weight:600}
  select:focus{border-color:#dc2626}
  table{width:100%;border-collapse:separate;border-spacing:0}
  th{background:#fef2f2;padding:1.2rem 1rem;text-align:left;font-size:.85rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px}
  td{padding:1rem;border-bottom:1px solid #fee2e2;color:#334155}
  .badge-client{background:#d1fae5;color:#166534}
  .badge-fournisseur{background:#ffedd5;color:#9a3412}
  .badge-employe{background:#dbeafe;color:#1e40af}
  .badge-autre{background:#e0e7ff;color:#4c1d95}
  .badge{padding:6px 12px;border-radius:20px;font-size:0.8rem;font-weight:700}
  .contact-info{display:flex;flex-direction:column;gap:.4rem;font-size:.95rem;color:#64748b}
  .contact-info svg{color:#94a3b8}
  .action-btn{background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;transition:.3s}
  .action-btn:hover{background:#fee2e2}
  .action-btn.delete:hover{background:#fecaca;color:#dc2626}
  .empty{text-align:center;padding:4rem;color:#94a3b8}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem}
  .modal{background:white;border-radius:24px;width:100%;max-width:640px;max-height:90vh;overflow:hidden;box-shadow:0 30px 80px -20px rgba(220,38,38,.4)}
  .modal-header{padding:1.5rem 2rem;background:#fef2f2;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #fee2e2}
  .modal-title{margin:0;font-size:1.6rem;font-weight:800;color:#991b1b}
  .modal-body{padding:2rem;overflow-y:auto}
  .grid{display:grid;grid-template-columns:2fr 1fr;gap:1.5rem}
  .form-group{margin-bottom:1.5rem}
  label{display:block;margin-bottom:.5rem;font-weight:600;color:#475569;font-size:.95rem}
  input,select{padding:.9rem 1.2rem;border:1px solid #cbd5e1;border-radius:12px;font-size:1rem;width:100%;outline:none;transition:.3s}
  input:focus,select:focus{border-color:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,.1)}
  @media(max-width:768px){
    .grid{grid-template-columns:1fr}
    .filters{flex-direction:column;align-items:stretch}
    .search-input{min-width:auto}
  }
`;

export default function Tiers() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TOUS');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nom_complet: '',
    type_tier: 'CLIENT',
    email: '',
    telephone: '',
    adresse: ''
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ste = await getEntrepriseForUser(user.id, user.email);
      if (!ste) return;
      setEntreprise(ste);
      fetchTiers(ste.id);
      setLoading(false);
    })();
  }, []);

  async function fetchTiers(id) {
    const { data } = await supabase
      .from('tiers')
      .select('*')
      .eq('entreprise_id', id)
      .order('nom_complet');
    setTiers(data || []);
  }

  const filtered = tiers.filter(t => {
    const matchSearch = t.nom_complet.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'TOUS' || t.type_tier === filterType;
    return matchSearch && matchType;
  });

  const saveTier = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, entreprise_id: entreprise.id };
      if (editing) {
        await supabase.from('tiers').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('tiers').insert([payload]);
      }
      setOpen(false);
      setEditing(null);
      setForm({ nom_complet: '', type_tier: 'CLIENT', email: '', telephone: '', adresse: '' });
      fetchTiers(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const deleteTier = async (id) => {
    if (!confirm("Supprimer définitivement ce contact ?")) return;
    await supabase.from('tiers').delete().eq('id', id);
    fetchTiers(entreprise.id);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Annuaire Tiers - ${entreprise.nom}`, 14, 20);
    autoTable(doc, {
      startY: 35,
      head: [['Nom', 'Type', 'Email', 'Téléphone', 'Adresse']],
      body: filtered.map(t => [t.nom_complet, t.type_tier, t.email || '-', t.telephone || '-', t.adresse || '-']),
      theme: 'grid'
    });
    doc.save(`Tiers_${entreprise.nom}.pdf`);
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
              <h1>Clients & Fournisseurs</h1>
              <p>Gérez votre carnet d’adresses professionnel</p>
            </div>
            <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
              <button onClick={() => { setEditing(null); setForm({nom_complet:'',type_tier:'CLIENT',email:'',telephone:'',adresse:''}); setOpen(true); }} className="btn btn-blue">
                <IconPlus /> Nouveau contact
              </button>
              <button onClick={exportPDF} className="btn" style={{background:'#ef4444'}}>
                <IconDownload /> PDF
              </button>
            </div>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Rechercher un contact..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="TOUS">Tous les contacts</option>
              <option value="CLIENT">Clients uniquement</option>
              <option value="FOURNISSEUR">Fournisseurs uniquement</option>
              <option value="EMPLOYE">Employés</option>
              <option value="AUTRE">Autres</option>
            </select>
            <div style={{color:'#dc2626',fontWeight:700,marginLeft:'auto'}}>
              {filtered.length} contact{filtered.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Nom complet</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Adresse</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td style={{fontWeight:700}}>{t.nom_complet}</td>
                    <td>
                      <span className={`badge badge-${t.type_tier.toLowerCase()}`}>
                        {t.type_tier === 'EMPLOYE' ? 'Employé' : t.type_tier}
                      </span>
                    </td>
                    <td>
                      <div className="contact-info">
                        {t.email && <div style={{display:'flex',alignItems:'center',gap:8}}><IconMail /> {t.email}</div>}
                        {t.telephone && <div style={{display:'flex',alignItems:'center',gap:8}}><IconPhone /> {t.telephone}</div>}
                        {!t.email && !t.telephone && <span style={{color:'#94a3b8'}}>Aucun contact</span>}
                      </div>
                    </td>
                    <td>{t.adresse || <span style={{color:'#94a3b8'}}>Non renseignée</span>}</td>
                    <td style={{textAlign:'right'}}>
                      <button onClick={() => { setEditing(t); setForm(t); setOpen(true); }} className="action-btn">
                        <IconEdit />
                      </button>
                      <button onClick={() => deleteTier(t.id)} className="action-btn delete">
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="5" className="empty">
                    {tiers.length === 0 ? 'Aucun contact enregistré' : 'Aucun contact ne correspond à votre recherche'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editing ? 'Modifier le contact' : 'Nouveau contact'}
              </div>
              <button onClick={() => setOpen(false)} style={{background:'none',border:'none',cursor:'pointer'}}>
                <IconClose />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveTier}>
                <div className="grid">
                  <div className="form-group">
                    <label>Nom complet</label>
                    <input type="text" required value={form.nom_complet} onChange={e => setForm({...form, nom_complet: e.target.value})} placeholder="Ex: Société Dupont SARL" />
                  </div>
                  <div className="form-group">
                    <label>Type de contact</label>
                    <select value={form.type_tier} onChange={e => setForm({...form, type_tier: e.target.value})}>
                      <option value="CLIENT">Client</option>
                      <option value="FOURNISSEUR">Fournisseur</option>
                      <option value="EMPLOYE">Employé</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contact@exemple.com" />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input type="text" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="+225 01 02 03 04 05" />
                </div>
                <div className="form-group">
                  <label>Adresse complète</label>
                  <input type="text" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="Rue, Ville, Pays" />
                </div>
                <div style={{marginTop:'2rem',textAlign:'right'}}>
                  <button type="submit" className="btn btn-blue">
                    {editing ? 'Mettre à jour' : 'Ajouter au carnet'}
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
