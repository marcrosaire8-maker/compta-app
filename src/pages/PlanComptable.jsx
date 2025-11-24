// src/pages/PlanComptable.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ICÔNES */
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const IconEdit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6"/></svg>;
const IconDownload = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7l-5 5-5-5m5-7v12"/></svg>;
const IconClose = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>;

/* STYLES PREMIUM ROUGE */
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
  .btn-purple{background:#8b5cf6}
  .card{background:white;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 10px 30px -8px rgba(0,0,0,.08);overflow:hidden}
  .card-header{padding:1.5rem 2rem;background:#fef2f2;border-bottom:1px solid #fee2e2}
  .card-header h3{margin:0;color:#991b1b;font-weight:700}
  .search-bar{background:#fef2f2;padding:1rem;border-radius:16px;display:flex;gap:1rem;align-items:center;margin-bottom:2rem}
  .search-input{flex:1;padding:.9rem 1.2rem;border:1px solid #fca5a5;border-radius:12px;outline:none;font-size:1rem}
  .search-input:focus{border-color:#dc2626}
  select{padding:.9rem 1.2rem;border:1px solid #cbd5e1;border-radius:12px;outline:none}
  table{width:100%;border-collapse:collapse}
  th{background:#fef2f2;padding:1rem;text-align:left;font-size:.8rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px}
  td{padding:1rem;border-bottom:1px solid #fee2e2;color:#334155}
  .text-right{text-align:right}
  .badge{background:#fee2e2;color:#991b1b;padding:6px 12px;border-radius:20px;font-size:0.8rem;font-weight:700}
  .badge-actif{background:#d1fae5;color:#166534}
  .badge-passif{background:#bfdbfe;color:#1d4ed8}
  .badge-charge{background:#fecaca;color:#991b1b}
  .badge-produit{background:#fef3c7;color:#92400e}
  .empty-state{text-align:center;padding:4rem 2rem;color:#94a3b8}
  .empty-state h3{font-size:1.6rem;margin-bottom:1rem}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem}
  .modal{background:white;border-radius:24px;width:100%;max-width:560px;max-height:90vh;overflow:hidden;box-shadow:0 30px 80px -20px rgba(220,38,38,.4)}
  .modal-header{padding:1.5rem 2rem;background:#fef2f2;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #fee2e2}
  .modal-title{margin:0;font-size:1.6rem;font-weight:800;color:#991b1b}
  .modal-body{padding:2rem}
  .form-group{margin-bottom:1.5rem}
  label{display:block;margin-bottom:.5rem;font-weight:600;color:#475569;font-size:.95rem}
  input,select{padding:.9rem 1.2rem;border:1px solid #cbd5e1;border-radius:12px;font-size:1rem;width:100%;outline:none;transition:.3s}
  input:focus,select:focus{border-color:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,.1)}
`;

export default function PlanComptable() {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [comptes, setComptes] = useState([]);
  const [entreprise, setEntreprise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClasse, setFilterClasse] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', libelle: '', type: 'ACTIF' });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ste = await getEntrepriseForUser(user.id, user.email);
      if (!ste) return;
      setEntreprise(ste);
      fetchComptes(ste.id);
      setLoading(false);
    })();
  }, []);

  async function fetchComptes(id) {
    const { data } = await supabase
      .from('plan_comptable')
      .select('*')
      .eq('entreprise_id', id)
      .order('code_compte', { ascending: true });
    setComptes(data || []);
  }

  async function importOHADA() {
    if (!confirm("Importer le plan comptable OHADA complet ?\nCela ajoutera tous les comptes standards.")) return;
    setImporting(true);
    try {
      const { data: modele } = await supabase.from('modele_plan_ohada').select('*');
      if (!modele?.length) throw new Error("Modèle OHADA introuvable");

      const toInsert = modele.map(m => ({
        entreprise_id: entreprise.id,
        code_compte: m.code_compte,
        libelle: m.libelle,
        type_compte: m.type_compte
      }));

      const { error } = await supabase.from('plan_comptable').insert(toInsert);
      if (error) throw error;

      alert("Plan OHADA importé avec succès !");
      fetchComptes(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setImporting(false);
    }
  }

  const filtered = comptes.filter(c => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = c.libelle.toLowerCase().includes(search) || c.code_compte.includes(searchTerm);
    const matchesClasse = filterClasse === 'all' || c.code_compte.startsWith(filterClasse);
    return matchesSearch && matchesClasse;
  });

  const exportExcel = () => {
    const data = filtered.map(c => ({ Code: c.code_compte, Libellé: c.libelle, Type: c.type_compte }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan Comptable");
    XLSX.writeFile(wb, `Plan_Comptable_${entreprise.nom}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Plan Comptable - ${entreprise.nom}`, 14, 20);
    autoTable(doc, {
      startY: 35,
      head: [['Code', 'Libellé', 'Type']],
      body: filtered.map(c => [c.code_compte, c.libelle, c.type_compte]),
      theme: 'grid'
    });
    doc.save(`Plan_Comptable_${entreprise.nom}.pdf`);
  };

  const saveCompte = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        entreprise_id: entreprise.id,
        code_compte: form.code,
        libelle: form.libelle,
        type_compte: form.type
      };

      if (editing) {
        await supabase.from('plan_comptable').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('plan_comptable').insert([payload]);
      }

      setOpen(false);
      setEditing(null);
      setForm({ code: '', libelle: '', type: 'ACTIF' });
      fetchComptes(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const deleteCompte = async (id) => {
    if (!confirm("Supprimer définitivement ce compte ?")) return;
    await supabase.from('plan_comptable').delete().eq('id', id);
    fetchComptes(entreprise.id);
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
              <h1>Plan Comptable</h1>
              <p>Gestion complète des comptes OHADA</p>
            </div>
            <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
              <button onClick={() => { setEditing(null); setForm({code:'',libelle:'',type:'ACTIF'}); setOpen(true); }} className="btn btn-blue">
                <IconPlus /> Ajouter un compte
              </button>
              <button onClick={exportPDF} className="btn" style={{background:'#ef4444'}}>
                <IconDownload /> PDF
              </button>
              <button onClick={exportExcel} className="btn btn-green">
                <IconDownload /> Excel
              </button>
            </div>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher un compte..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select value={filterClasse} onChange={e => setFilterClasse(e.target.value)}>
              <option value="all">Toutes les classes</option>
              {[1,2,3,4,5,6,7].map(n => (
                <option key={n} value={n}>Classe {n}</option>
              ))}
            </select>
          </div>

          <div className="card">
            {comptes.length === 0 ? (
              <div className="empty-state">
                <h3>Aucun compte configuré</h3>
                <p>Importez le plan comptable OHADA en un clic !</p>
                <button onClick={importOHADA} disabled={importing} className="btn btn-purple" style={{fontSize:'1.2rem',padding:'1rem 2rem'}}>
                  {importing ? 'Installation en cours...' : 'Installer le Plan OHADA Complet'}
                </button>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Libellé</th>
                    <th>Type</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td style={{fontWeight:700,color:'#1e293b'}}>{c.code_compte}</td>
                      <td>{c.libelle}</td>
                      <td>
                        <span className={`badge ${
                          c.type_compte === 'ACTIF' ? 'badge-actif' :
                          c.type_compte === 'PASSIF' ? 'badge-passif' :
                          c.type_compte === 'CHARGE' ? 'badge-charge' :
                          'badge-produit'
                        }`}>
                          {c.type_compte}
                        </span>
                      </td>
                      <td className="text-right">
                        <button onClick={() => { setEditing(c); setForm({code:c.code_compte, libelle:c.libelle, type:c.type_compte}); setOpen(true); }}
                          style={{background:'none',border:'none',cursor:'pointer',marginRight:12}}>
                          <IconEdit />
                        </button>
                        <button onClick={() => deleteCompte(c.id)}
                          style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444'}}>
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editing ? 'Modifier le compte' : 'Nouveau compte'}
              </div>
              <button onClick={() => setOpen(false)} style={{background:'none',border:'none',cursor:'pointer'}}>
                <IconClose />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveCompte}>
                <div className="form-group">
                  <label>Code compte</label>
                  <input type="text" required value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="Ex: 601000" />
                </div>
                <div className="form-group">
                  <label>Libellé</label>
                  <input type="text" required value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} placeholder="Ex: Achats de marchandises" />
                </div>
                <div className="form-group">
                  <label>Type de compte</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="ACTIF">ACTIF</option>
                    <option value="PASSIF">PASSIF</option>
                    <option value="CHARGE">CHARGE</option>
                    <option value="PRODUIT">PRODUIT</option>
                  </select>
                </div>
                <div style={{marginTop:'2rem',textAlign:'right'}}>
                  <button type="submit" className="btn">
                    {editing ? 'Mettre à jour' : 'Créer le compte'}
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
