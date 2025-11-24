// src/pages/Parametres.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import Sidebar from '../components/Sidebar';

/* ICÔNES */
const IconEdit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6"/></svg>;
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>;

/* STYLES PREMIUM ROUGE */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box}body{margin:0;font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b}
  .page{display:flex;min-height:100vh}
  .main{flex:1;margin-left:260px;padding:2.5rem;transition:all .4s}
  @media(max-width:1024px){.main{margin-left:0;padding:1.5rem;padding-top:90px}}
  .header h1{font-size:2.4rem;font-weight:900;background:linear-gradient(90deg,#dc2626,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 .5rem}
  .header p{color:#64748b;margin:0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:3rem}
  @media(max-width:768px){.grid{grid-template-columns:1fr}}
  .card{background:white;border-radius:18px;padding:2rem;border:1px solid #e2e8f0;box-shadow:0 10px 30px -8px rgba(0,0,0,.08);overflow:hidden}
  .card-header{padding-bottom:1rem;border-bottom:1px solid #fee2e2;margin-bottom:1.5rem}
  .card-title{font-size:1.4rem;font-weight:800;color:#991b1b;margin:0;display:flex;align-items:center;gap:.6rem}
  .form-group{margin-bottom:1.2rem}
  label{display:block;margin-bottom:.5rem;font-weight:600;color:#475569;font-size:.95rem}
  input,select{padding:.9rem 1.2rem;border:1px solid #cbd5e1;border-radius:12px;font-size:1rem;width:100%;outline:none;transition:.3s}
  input:focus,select:focus{border-color:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,.1)}
  .btn{background:#dc2626;color:white;border:none;padding:.9rem 1.8rem;border-radius:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:.6rem;box-shadow:0 8px 20px rgba(220,38,38,.3);transition:.3s}
  .btn:hover{background:#b91c1c;transform:translateY(-2px)}
  .btn-small{background:#64748b;padding:6px 12px;border-radius:8px;font-size:0.85rem}
  .btn-success{background:#10b981}
  .badge{background:#fee2e2;color:#991b1b;padding:6px 12px;border-radius:20px;font-size:0.8rem;font-weight:700}
  .badge-admin{background:#ede9fe;color:#7c3aed}
  .badge-compta{background:#d1fae5;color:#059669}
  table{width:100%;border-collapse:collapse;margin-top:1.5rem}
  th{background:#fef2f2;padding:1rem;text-align:left;font-size:.8rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px}
  td{padding:1rem;border-bottom:1px solid #fee2e2;color:#334155}
  .text-right{text-align:right}
`;

export default function Parametres() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [exercices, setExercices] = useState([]);
  const [membres, setMembres] = useState([]);

  const [companyForm, setCompanyForm] = useState({ nom: '', email: '' });
  const [updating, setUpdating] = useState(false);

  const [newExo, setNewExo] = useState({
    libelle: `Exercice ${new Date().getFullYear()}`,
    date_debut: `${new Date().getFullYear()}-01-01`,
    date_fin: `${new Date().getFullYear()}-12-31`
  });

  const [newMember, setNewMember] = useState({ email: '', role: 'LECTEUR' });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ste } = await supabase
        .from('entreprises')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!ste) return;

      setEntreprise(ste);
      setCompanyForm({ nom: ste.nom, email: ste.email_contact || '' });

      await Promise.all([
        fetchExercices(ste.id),
        fetchMembres(ste.id)
      ]);

      setLoading(false);
    })();
  }, []);

  async function fetchExercices(id) {
    const { data } = await supabase
      .from('exercices')
      .select('*')
      .eq('entreprise_id', id)
      .order('date_debut', { ascending: false });
    setExercices(data || []);
  }

  async function fetchMembres(id) {
    const { data } = await supabase
      .from('membres_entreprise')
      .select('*')
      .eq('entreprise_id', id);
    setMembres(data || []);
  }

  const updateEntreprise = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('entreprises')
        .update({
          nom: companyForm.nom,
          email_contact: companyForm.email
        })
        .eq('id', entreprise.id);

      if (error) throw error;
      alert("Informations mises à jour !");
      window.location.reload();
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddExercice = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('exercices')
      .insert([{ entreprise_id: entreprise.id, ...newExo }]);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      alert("Exercice créé !");
      fetchExercices(entreprise.id);
      setNewExo({
        libelle: `Exercice ${new Date().getFullYear() + 1}`,
        date_debut: `${new Date().getFullYear() + 1}-01-01`,
        date_fin: `${new Date().getFullYear() + 1}-12-31`
      });
    }
  };

  const toggleCloture = async (id, actuel) => {
    if (!confirm(actuel ? "Rouvrir cet exercice ?" : "Clôturer cet exercice ?")) return;
    await supabase.from('exercices').update({ est_cloture: !actuel }).eq('id', id);
    fetchExercices(entreprise.id);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('membres_entreprise')
        .insert([{ entreprise_id: entreprise.id, email: newMember.email, role: newMember.role }]);

      if (error) {
        if (error.code === '23505') throw new Error("Cet utilisateur est déjà dans l'équipe.");
        throw error;
      }

      alert("Membre ajouté avec succès !");
      setNewMember({ email: '', role: 'LECTEUR' });
      fetchMembres(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const handleRemoveMember = async (id) => {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    await supabase.from('membres_entreprise').delete().eq('id', id);
    fetchMembres(entreprise.id);
  };

  if (loading) return <div style={{height:'100vh',display:'grid',placeItems:'center',fontSize:'2rem'}}>Chargement…</div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="page">
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

        <div className="main">
          <div className="header">
            <h1>Paramètres</h1>
            <p>Gestion de votre entreprise, exercices comptables et équipe</p>
          </div>

          <div className="grid">
            {/* ENTREPRISE */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><IconEdit /> Mon Entreprise</div>
              </div>
              <form onSubmit={updateEntreprise}>
                <div className="form-group">
                  <label>Nom de l'entreprise</label>
                  <input type="text" required value={companyForm.nom} onChange={e => setCompanyForm({...companyForm, nom: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email de contact</label>
                  <input type="email" value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} />
                </div>
                <button type="submit" disabled={updating} className="btn btn-success">
                  {updating ? 'Mise à jour...' : 'Enregistrer les modifications'}
                </button>
              </form>
            </div>

            {/* NOUVEL EXERCICE */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Nouvel exercice comptable</div>
              </div>
              <form onSubmit={handleAddExercice}>
                <div className="form-group">
                  <label>Libellé</label>
                  <input type="text" required value={newExo.libelle} onChange={e => setNewExo({...newExo, libelle: e.target.value})} />
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                  <div className="form-group">
                    <label>Date de début</label>
                    <input type="date" required value={newExo.date_debut} onChange={e => setNewExo({...newExo, date_debut: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Date de fin</label>
                    <input type="date" required value={newExo.date_fin} onChange={e => setNewExo({...newExo, date_fin: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn">Créer l'exercice</button>
              </form>
            </div>
          </div>

          {/* GESTION ÉQUIPE */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Gestion de l'équipe</div>
            </div>

            <form onSubmit={handleAddMember} style={{display:'grid', gridTemplateColumns:'3fr 1.5fr auto', gap:'1rem', marginBottom:'2rem', alignItems:'end'}}>
              <div className="form-group">
                <label>Email du collaborateur</label>
                <input type="email" required placeholder="comptable@entreprise.com" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Rôle</label>
                <select value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}>
                  <option value="LECTEUR">Observateur</option>
                  <option value="COMPTABLE">Comptable</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <button type="submit" className="btn" style={{height:'52px'}}>+ Inviter</button>
            </form>

            <table>
              <thead>
                <tr>
                  <th>Collaborateur</th>
                  <th>Rôle</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {membres.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{fontWeight:600}}>{m.email}</div>
                      {m.email === entreprise.email_contact && 
                        <span style={{fontSize:'0.75rem', background:'#e0f2fe', color:'#0369a1', padding:'4px 8px', borderRadius:'6px'}}>Propriétaire</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${m.role === 'ADMIN' ? 'badge-admin' : m.role === 'COMPTABLE' ? 'badge-compta' : ''}`}>
                        {m.role === 'ADMIN' ? 'Administrateur' : m.role === 'COMPTABLE' ? 'Comptable' : 'Observateur'}
                      </span>
                    </td>
                    <td className="text-right">
                      {m.email !== entreprise.email_contact && (
                        <button onClick={() => handleRemoveMember(m.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer'}}>
                          <IconTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {membres.length === 0 && (
                  <tr><td colSpan={3} style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>Aucun collaborateur invité</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Liste des exercices (bonus) */}
          {exercices.length > 0 && (
            <div className="card" style={{marginTop:'2rem'}}>
              <div className="card-header">
                <div className="card-title">Exercices comptables</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Libellé</th>
                    <th>Période</th>
                    <th>Statut</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exercices.map(exo => (
                    <tr key={exo.id}>
                      <td>{exo.libelle}</td>
                      <td>{new Date(exo.date_debut).toLocaleDateString('fr')} → {new Date(exo.date_fin).toLocaleDateString('fr')}</td>
                      <td>
                        {exo.est_cloture ? 
                          <span style={{color:'#dc2626',fontWeight:700}}>Clôturé</span> : 
                          <span style={{color:'#16a34a',fontWeight:700}}>En cours</span>
                        }
                      </td>
                      <td className="text-right">
                        <button onClick={() => toggleCloture(exo.id, exo.est_cloture)} className="btn-small" style={{background: exo.est_cloture ? '#16a34a' : '#dc2626'}}>
                          {exo.est_cloture ? 'Rouvrir' : 'Clôturer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
