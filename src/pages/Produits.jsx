// src/pages/Produits.jsx
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
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

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
  .card{background:white;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 10px 30px -8px rgba(0,0,0,.08);overflow:hidden}
  .search-bar{background:#fef2f2;padding:1rem 1.5rem;border-radius:16px;display:flex;gap:1rem;align-items:center;margin-bottom:2rem}
  .search-input{flex:1;padding:.9rem 1.2rem;border:1px solid #fca5a5;border-radius:12px;outline:none;font-size:1rem;background:white}
  .search-input:focus{border-color:#dc2626}
  table{width:100%;border-collapse:collapse}
  th{background:#fef2f2;padding:1rem;text-align:left;font-size:.8rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px}
  td{padding:1rem;border-bottom:1px solid #fee2e2;color:#334155}
  .text-right{text-align:right}
  .text-center{text-align:center}
  .badge-bien{background:#d1fae5;color:#166534;padding:6px 12px;border-radius:20px;font-size:0.8rem;font-weight:700}
  .badge-service{background:#ede9fe;color:#7c3aed;padding:6px 12px;border-radius:20px;font-size:0.8rem;font-weight:700}
  .stock-low{color:#dc2626 !important;font-weight:700}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem}
  .modal{background:white;border-radius:24px;width:100%;max-width:640px;max-height:90vh;overflow:hidden;box-shadow:0 30px 80px -20px rgba(220,38,38,.4)}
  .modal-header{padding:1.5rem 2rem;background:#fef2f2;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #fee2e2}
  .modal-title{margin:0;font-size:1.6rem;font-weight:800;color:#991b1b}
  .modal-body{padding:2rem;overflow-y:auto}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
  .form-group{margin-bottom:1.5rem}
  label{display:block;margin-bottom:.5rem;font-weight:600;color:#475569;font-size:.95rem}
  input,select{padding:.9rem 1.2rem;border:1px solid #cbd5e1;border-radius:12px;font-size:1rem;width:100%;outline:none;transition:.3s}
  input:focus,select:focus{border-color:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,.1)}
  .stock-block{background:#fff7ed;padding:1.5rem;border-radius:16px;margin-top:1rem}
`;

export default function Produits() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [produits, setProduits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nom: '',
    type_produit: 'BIEN',
    prix_vente: 0,
    stock_actuel: 0,
    unite: 'unité',
    seuil_alerte: 5
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ste = await getEntrepriseForUser(user.id, user.email);
      if (!ste) return;
      setEntreprise(ste);
      fetchProduits(ste.id);
      setLoading(false);
    })();
  }, []);

  async function fetchProduits(id) {
    const { data } = await supabase
      .from('produits')
      .select('*')
      .eq('entreprise_id', id)
      .order('nom', { ascending: true });
    setProduits(data || []);
  }

  const filtered = produits.filter(p =>
    p.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportExcel = () => {
    const data = filtered.map(p => ({
      'Article': p.nom,
      'Type': p.type_produit,
      'Prix de vente': p.prix_vente,
      'Stock actuel': p.type_produit === 'BIEN' ? p.stock_actuel : '-',
      'Unité': p.unite,
      'Seuil alerte': p.seuil_alerte
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogue");
    XLSX.writeFile(wb, `Catalogue_${entreprise.nom.replace(/ /g, '_')}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Catalogue Produits & Services - ${entreprise.nom}`, 14, 20);
    autoTable(doc, {
      startY: 35,
      head: [['Article', 'Type', 'Prix HT', 'Stock']],
      body: filtered.map(p => [
        p.nom,
        p.type_produit,
        `${Number(p.prix_vente).toLocaleString()} F`,
        p.type_produit === 'BIEN' ? `${p.stock_actuel} ${p.unite}` : '—'
      ]),
      theme: 'grid'
    });
    doc.save(`Catalogue_${entreprise.nom}.pdf`);
  };

  const saveProduit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        entreprise_id: entreprise.id,
        prix_vente: Number(form.prix_vente),
        stock_actuel: form.type_produit === 'BIEN' ? Number(form.stock_actuel) : 0,
        seuil_alerte: form.type_produit === 'BIEN' ? Number(form.seuil_alerte) : null
      };

      if (editing) {
        await supabase.from('produits').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('produits').insert([payload]);
      }

      setOpen(false);
      setEditing(null);
      setForm({ nom: '', type_produit: 'BIEN', prix_vente: 0, stock_actuel: 0, unite: 'unité', seuil_alerte: 5 });
      fetchProduits(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const deleteProduit = async (id) => {
    if (!confirm("Supprimer cet article du catalogue ?")) return;
    await supabase.from('produits').delete().eq('id', id);
    fetchProduits(entreprise.id);
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
              <h1>Stocks & Services</h1>
              <p>Gérez votre catalogue de produits et prestations</p>
            </div>
            <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
              <button onClick={() => { setEditing(null); setForm({nom:'',type_produit:'BIEN',prix_vente:0,stock_actuel:0,unite:'unité',seuil_alerte:5}); setOpen(true); }} className="btn btn-blue">
                <IconPlus /> Nouvel article
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
              placeholder="Rechercher un produit ou service..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Article / Service</th>
                  <th>Type</th>
                  <th className="text-right">Prix de vente</th>
                  <th className="text-center">Stock</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:600}}>{p.nom}</td>
                    <td>
                      <span className={p.type_produit === 'SERVICE' ? 'badge-service' : 'badge-bien'}>
                        {p.type_produit === 'SERVICE' ? 'Service' : 'Produit'}
                      </span>
                    </td>
                    <td className="text-right" style={{fontWeight:600}}>
                      {Number(p.prix_vente).toLocaleString()} F
                    </td>
                    <td className="text-center">
                      {p.type_produit === 'BIEN' ? (
                        <span className={p.stock_actuel <= p.seuil_alerte ? 'stock-low' : ''}>
                          {p.stock_actuel} {p.unite}
                          {p.stock_actuel <= p.seuil_alerte && <IconAlert />}
                        </span>
                      ) : (
                        <span style={{color:'#94a3b8'}}>—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button onClick={() => { setEditing(p); setForm(p); setOpen(true); }}
                        style={{background:'none',border:'none',cursor:'pointer',marginRight:8}}>
                        <IconEdit />
                      </button>
                      <button onClick={() => deleteProduit(p.id)}
                        style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444'}}>
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}>
                    {produits.length === 0 ? 'Aucun article dans le catalogue' : 'Aucun résultat pour cette recherche'}
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
                {editing ? 'Modifier l\'article' : 'Nouvel article ou service'}
              </div>
              <button onClick={() => setOpen(false)} style={{background:'none',border:'none',cursor:'pointer'}}>
                <IconClose />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveProduit}>
                <div className="grid">
                  <div className="form-group">
                    <label>Nom de l'article</label>
                    <input type="text" required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Ex: Riz parfumé 25kg" />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={form.type_produit} onChange={e => setForm({...form, type_produit: e.target.value})}>
                      <option value="BIEN">Produit (en stock)</option>
                      <option value="SERVICE">Service (prestation)</option>
                    </select>
                  </div>
                </div>

                <div className="grid">
                  <div className="form-group">
                    <label>Prix de vente HT</label>
                    <input type="number" required min="0" value={form.prix_vente} onChange={e => setForm({...form, prix_vente: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Unité</label>
                    <input type="text" value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} list="units" placeholder="unité, kg, sac..." />
                    <datalist id="units">
                      <option value="unité" />
                      <option value="pièce" />
                      <option value="kg" />
                      <option value="sac" />
                      <option value="litre" />
                      <option value="boîte" />
                    </datalist>
                  </div>
                </div>

                {form.type_produit === 'BIEN' && (
                  <div className="stock-block">
                    <div className="grid">
                      <div className="form-group">
                        <label>Stock initial</label>
                        <input type="number" min="0" value={form.stock_actuel} onChange={e => setForm({...form, stock_actuel: Number(e.target.value)})} />
                      </div>
                      <div className="form-group">
                        <label>Seuil d'alerte (stock bas)</label>
                        <input type="number" min="0" value={form.seuil_alerte} onChange={e => setForm({...form, seuil_alerte: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{marginTop:'2rem',textAlign:'right'}}>
                  <button type="submit" className="btn">
                    {editing ? 'Mettre à jour' : 'Ajouter au catalogue'}
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
