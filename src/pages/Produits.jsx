import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ICÔNES */
const IconPlus = () => <span>＋</span>;
const IconEdit = () => <span>✏️</span>;
const IconTrash = () => <span>🗑️</span>;
const IconDownload = () => <span>📥</span>;
const IconClose = () => <span>✕</span>;
const IconAlert = () => <span style={{color:'#dc2626'}}>⚠️</span>;

/* STYLES CSS */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
  .page { display: flex; min-height: 100vh; }
  .main { flex: 1; margin-left: 260px; padding: 2rem; }
  .header h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
  .actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .btn { padding: 0.8rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; color: white; }
  .btn-blue { background: #3b82f6; } .btn-red { background: #ef4444; } .btn-green { background: #10b981; }
  .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  
  /* TABLEAU */
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 1rem; background: #f1f5f9; color: #64748b; font-size: 0.85rem; text-transform: uppercase; }
  td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.95rem; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  
  /* MODAL */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 50; }
  .modal { background: white; padding: 2rem; border-radius: 12px; width: 550px; max-width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569; font-size: 0.9rem; }
  input, select { width: 100%; padding: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 1rem; }
  input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
  
  /* INDICATEURS */
  .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
  .badge-marge { background: #ecfdf5; color: #059669; }
`;

export default function Produits() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [produits, setProduits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // FORMULAIRE MIS À JOUR
  const [form, setForm] = useState({
    nom: '',
    quantite: 0,      // Stock
    prix_achat: 0,    // Prix d'unité (Coût)
    prix_vente: 0,    // Prix de vente
    unite: 'unité',
    seuil_alerte: 5
  });

  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchProduits(ste.id);
    }
    setLoading(false);
  }

  async function fetchProduits(id) {
    const { data } = await supabase
      .from('produits')
      .select('*')
      .eq('entreprise_id', id)
      .order('nom', { ascending: true });
    setProduits(data || []);
  }

  // --- SAUVEGARDE ---
  const saveProduit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        entreprise_id: entreprise.id,
        nom: form.nom,
        stock_actuel: Number(form.quantite), // Mappé vers stock_actuel en BDD
        prix_achat: Number(form.prix_achat),
        prix_vente: Number(form.prix_vente),
        unite: form.unite,
        seuil_alerte: Number(form.seuil_alerte),
        type_produit: 'BIEN' // Par défaut pour gérer le stock
      };

      if (editing) {
        await supabase.from('produits').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('produits').insert([payload]);
      }

      setOpen(false);
      resetForm();
      fetchProduits(entreprise.id);
      alert("Enregistré avec succès !");
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ nom: '', quantite: 0, prix_achat: 0, prix_vente: 0, unite: 'unité', seuil_alerte: 5 });
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({
      nom: p.nom,
      quantite: p.stock_actuel,
      prix_achat: p.prix_achat || 0,
      prix_vente: p.prix_vente,
      unite: p.unite,
      seuil_alerte: p.seuil_alerte
    });
    setOpen(true);
  };

  const deleteProduit = async (id) => {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from('produits').delete().eq('id', id);
    fetchProduits(entreprise.id);
  };

  // --- EXPORTS ---
  const filtered = produits.filter(p => p.nom.toLowerCase().includes(searchTerm.toLowerCase()));

  const exportExcel = () => {
    const data = filtered.map(p => ({
      'Nom': p.nom,
      'Quantité': p.stock_actuel,
      'Unité': p.unite,
      'Prix Achat': p.prix_achat,
      'Prix Vente': p.prix_vente,
      'Valeur Stock': p.stock_actuel * p.prix_achat
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, "Stock.xlsx");
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />
        
        <div className="main">
          <div className="actions">
            <div className="header">
              <h1>Gestion du Stock</h1>
              <p>Suivez vos quantités et vos marges</p>
            </div>
            <div style={{display:'flex', gap: 10}}>
                <button onClick={() => { resetForm(); setOpen(true); }} className="btn btn-blue"><IconPlus/> Ajouter Produit</button>
                <button onClick={exportExcel} className="btn btn-green"><IconDownload/> Excel</button>
            </div>
          </div>

          <input className="search-input" placeholder="🔍 Rechercher un produit..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'20px', border:'1px solid #ddd', borderRadius:'8px'}} />

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Nom du Produit</th>
                  <th className="text-center">Quantité</th>
                  <th>Unité</th>
                  <th className="text-right">Prix Achat</th>
                  <th className="text-right">Prix Vente</th>
                  <th className="text-center">Marge</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const marge = p.prix_vente - p.prix_achat;
                  return (
                    <tr key={p.id}>
                      <td className="font-bold" style={{color:'#334155'}}>{p.nom}</td>
                      
                      {/* Colonne Quantité avec alerte */}
                      <td className="text-center">
                        <span style={{
                            fontWeight: 'bold', 
                            color: p.stock_actuel <= p.seuil_alerte ? '#dc2626' : '#1e293b'
                        }}>
                            {p.stock_actuel}
                        </span>
                        {p.stock_actuel <= p.seuil_alerte && <span style={{marginLeft:5}}><IconAlert/></span>}
                      </td>
                      
                      <td style={{color:'#64748b'}}>{p.unite}</td>
                      <td className="text-right">{p.prix_achat?.toLocaleString()} F</td>
                      <td className="text-right font-bold">{p.prix_vente?.toLocaleString()} F</td>
                      
                      {/* Colonne Marge */}
                      <td className="text-center">
                        {marge > 0 && <span className="badge badge-marge">+{marge.toLocaleString()} F</span>}
                      </td>

                      <td className="text-right">
                        <button onClick={() => handleEdit(p)} style={{border:'none', background:'none', cursor:'pointer', marginRight:10}}><IconEdit/></button>
                        <button onClick={() => deleteProduit(p.id)} style={{border:'none', background:'none', cursor:'pointer', color:'red'}}><IconTrash/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{textAlign:'center', padding:30, color:'#94a3b8'}}>Aucun produit trouvé.</div>}
          </div>
        </div>
      </div>

      {/* MODAL D'AJOUT / MODIFICATION */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 20}}>
                <h2 style={{margin:0, color:'#1e293b'}}>{editing ? 'Modifier le produit' : 'Nouveau Produit'}</h2>
                <button onClick={() => setOpen(false)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}}><IconClose/></button>
            </div>
            
            <form onSubmit={saveProduit}>
                <div className="form-group">
                    <label>Nom du produit</label>
                    <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Ex: Sac de Riz" />
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Quantité (Stock)</label>
                        <input type="number" required value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Unité</label>
                        <input type="text" required value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} list="unites" placeholder="kg, pièce..." />
                        <datalist id="unites">
                            <option value="unité"/><option value="kg"/><option value="litre"/><option value="carton"/><option value="sac"/>
                        </datalist>
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Prix d'achat (Coût unitaire)</label>
                        <input type="number" required value={form.prix_achat} onChange={e => setForm({...form, prix_achat: e.target.value})} placeholder="0" />
                    </div>
                    <div className="form-group">
                        <label>Prix de vente</label>
                        <input type="number" required value={form.prix_vente} onChange={e => setForm({...form, prix_vente: e.target.value})} placeholder="0" />
                    </div>
                </div>

                <div className="form-group">
                    <label>Seuil d'alerte (Stock bas)</label>
                    <input type="number" value={form.seuil_alerte} onChange={e => setForm({...form, seuil_alerte: e.target.value})} />
                    <small style={{color:'#94a3b8'}}>Vous verrez une alerte si le stock descend sous ce nombre.</small>
                </div>

                <div style={{display:'flex', justifyContent:'flex-end', gap: 10, marginTop: 20}}>
                    <button type="button" onClick={() => setOpen(false)} style={{padding:'10px 20px', borderRadius:6, border:'1px solid #ddd', background:'white', cursor:'pointer'}}>Annuler</button>
                    <button type="submit" className="btn btn-blue">Enregistrer</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
