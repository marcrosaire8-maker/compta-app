// src/pages/Immobilisations.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';

/* --- ICÔNE + --- */
const IconPlus = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

/* --- STYLE IDENTIQUE À TOUT LE BACKOFFICE --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { margin:0; background:#f8fafc; }
  
  .page-wrapper { font-family: 'Inter', sans-serif; color: #1e293b; min-height: 100vh; background: #f8fafc; display: flex; }
  .main-content { flex: 1; padding: 1.5rem; margin-left: 260px; width: calc(100% - 260px); }
  @media (max-width: 900px) {
    .main-content { margin-left: 0; width: 100%; padding: 1rem; padding-top: 80px; }
  }

  .header h1 { font-size: 1.8rem; font-weight: 800; color: #b91c1c; margin: 0 0 .5rem 0; }
  .header p { color: #64748b; margin: 0; font-size: .95rem; }

  .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .btn-primary {
    background:#3b82f6; color:white; border:none; padding:.75rem 1.5rem; border-radius:8px;
    font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:.5rem;
  }
  .btn-primary:hover { background:#2563eb; }

  .card { background:white; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.05); overflow:hidden; }
  .card-header { padding:1.25rem 1.5rem; border-bottom:1px solid #e2e8f0; background:#f8fafc; }
  .card-header h3 { margin:0; font-size:1.1rem; font-weight:700; color:#1e293b; }

  .table-wrapper { width:100%; overflow-x:auto; }
  table { width:100%; border-collapse:collapse; }
  th { background:#f1f5f9; padding:1rem; text-align:left; font-size:.8rem; font-weight:700; color:#64748b; text-transform:uppercase; }
  td { padding:1rem; border-bottom:1px solid #f1f5f9; color:#334155; }
  .text-right { text-align:right; }
  .font-bold { font-weight:700; }
  .text-green { color:#166534; }
  .text-red { color:#991b1b; }

  @media (max-width:900px){
    thead{display:none;}
    tr{display:block; background:white; margin-bottom:1rem; border:1px solid #e2e8f0; border-radius:12px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,.05);}
    td{display:flex; justify-content:space-between; padding:.6rem 0; border:none;}
    td::before{content:attr(data-label); font-weight:600; color:#64748b; text-transform:uppercase; font-size:.8rem;}
  }

  /* Modal */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:1000;}
  .modal-content{background:white;padding:2rem;border-radius:12px;width:90%;max-width:560px;box-shadow:0 20px 40px rgba(0,0,0,.15);}
  .modal-title{font-size:1.4rem;font-weight:700;color:#1e293b;margin:0 0 1.5rem 0;padding-bottom:.75rem;border-bottom:1px solid #e2e8f0;}
  .form-group{margin-bottom:1.2rem;}
  .form-label{display:block;margin-bottom:.5rem;font-weight:600;color:#475569;font-size:.9rem;}
  .form-input{width:100%;padding:.75rem;border:1px solid #cbd5e1;border-radius:8px;font-size:.95rem;}
  .form-row{display:grid;grid-template-columns:2fr 1fr;gap:1rem;}
  .modal-footer{display:flex;justify-content:flex-end;gap:1rem;margin-top:2rem;}
  .btn-cancel,.btn-save{padding:.75rem 1.5rem;border:none;border-radius:8px;cursor:pointer;font-weight:600;}
  .btn-cancel{background:#f1f5f9;color:#475569;}
  .btn-save{background:#3b82f6;color:white;}
`;

export default function Immobilisations() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [actifs, setActifs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    designation: '',
    date_acquisition: new Date().toISOString().split('T')[0],
    valeur_origine: '',
    duree_mois: 60
  });

  useEffect(() => {
    initData();
  }, []);

  // CORRIGÉ : on utilise supabase.auth.getUser()
  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchImmobilisations(ste.id);
    }
    setLoading(false);
  }

  async function fetchImmobilisations(entrepriseId) {
    const { data } = await supabase
      .from('tableau_amortissement')
      .select('*')
      .eq('entreprise_id', entrepriseId)
      .order('date_acquisition', { ascending: false });

    setActifs(data || []);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!entreprise) return;

    const valeur = Number(formData.valeur_origine);
    if (!valeur || valeur <= 0) {
      alert('Veuillez entrer une valeur d’acquisition valide');
      return;
    }

    const payload = {
      entreprise_id: entreprise.id,
      designation: formData.designation.trim(),
      date_acquisition: formData.date_acquisition,
      valeur_origine: valeur,
      duree_mois: Number(formData.duree_mois),
      valeur_nette_comptable: valeur,   // CORRIGÉ (pas de faute de frappe)
      amortissement_cumule: 0
    };

    const { error } = await supabase.from('tableau_amortissement').insert([payload]);

    if (error) {
      alert('Erreur : ' + error.message);
    } else {
      alert('Immobilisation enregistrée avec succès !');
      setIsModalOpen(false);
      setFormData({ designation: '', date_acquisition: new Date().toISOString().split('T')[0], valeur_origine: '', duree_mois: 60 });
      fetchImmobilisations(entreprise.id);
    }
  }

  if (loading) {
    return <div style={{height:'100vh',display:'grid',placeItems:'center',fontSize:'1.2rem'}}>Chargement…</div>;
  }

  return (
    <div className="page-wrapper">
      <style>{styles}</style>
      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <div className="main-content">
        <div className="header-actions">
          <div className="header">
            <h1>Immobilisations</h1>
            <p>Gestion du patrimoine et tableau d’amortissement</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <div style={{width:20,height:20}}><IconPlus /></div>
            Nouvel actif
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Actifs immobilisés ({actifs.length})</h3>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th>Date d'acquisition</th>
                  <th>Durée</th>
                  <th>Valeur d'origine</th>
                  <th>Amort. cumulé</th>
                  <th className="text-right">VNC</th>
                </tr>
              </thead>
              <tbody>
                {actifs.map(actif => (
                  <tr key={actif.id}>
                    <td data-label="Désignation" className="font-bold">{actif.designation}</td>
                    <td data-label="Date">{new Date(actif.date_acquisition).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Durée">{actif.duree_mois} mois</td>
                    <td data-label="Valeur origine">{Number(actif.valeur_origine).toLocaleString()} F</td>
                    <td data-label="Amort. cumulé">
                      {Number(actif.amortissement_cumule || 0).toLocaleString()} F
                    </td>
                    <td data-label="VNC" className={`text-right font-bold ${actif.valeur_nette_comptable > 0 ? 'text-green' : 'text-red'}`}>
                      {Number(actif.valeur_nette_comptable || 0).toLocaleString()} F
                    </td>
                  </tr>
                ))}
                {actifs.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>
                      Aucune immobilisation enregistrée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Nouvelle Immobilisation</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Désignation de l’actif</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder='Ex: MacBook Pro 16", Véhicule utilitaire...'
                  value={formData.designation}
                  onChange={e => setFormData({...formData, designation: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date d’acquisition</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.date_acquisition}
                  onChange={e => setFormData({...formData, date_acquisition: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Valeur d’acquisition (FCFA)</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    min="1"
                    placeholder="2500000"
                    value={formData.valeur_origine}
                    onChange={e => setFormData({...formData, valeur_origine: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Durée (mois)</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    min="1"
                    value={formData.duree_mois}
                    onChange={e => setFormData({...formData, duree_mois: e.target.value})}
                  />
                  <small style={{color:'#94a3b8',fontSize:'.8rem'}}>60 mois = 5 ans</small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn-save">Enregistrer l’actif</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
