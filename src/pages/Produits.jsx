import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ICÔNES SIMPLIFIÉES */
const IconPlus = () => <span>＋</span>;
const IconEdit = () => <span>✏️</span>;
const IconTrash = () => <span>🗑️</span>;
const IconDownload = () => <span>📥</span>;
const IconClose = () => <span>✕</span>;
const IconAlert = () => <span style={{color:'red'}}>⚠️</span>;

/* STYLES CSS (Injectés) */
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
  input, select { width: 100%; padding: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 1rem; box-sizing: border-box; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 1rem; background: #f1f5f9; color: #64748b; font-size: 0.85rem; text-transform: uppercase; }
  td { padding: 1rem; border-bottom: 1px solid #e2e8f0; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 50; }
  .modal { background: white; padding: 2rem; border-radius: 12px; width: 500px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
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
    initData();
  }, []);

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
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('entreprise_id', id)
      .order('nom', { ascending: true });
      
    if (error) console.error("Erreur fetch:", error);
    setProduits(data || []);
  }

  // --- SAUVEGARDE (CORRIGÉE) ---
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

      let error;

      if (editing) {
        const res = await supabase.from('produits').update(payload).eq('id', editing.id);
        error = res.error;
      } else {
        const res = await supabase.from('produits').insert([payload]);
        error = res.error;
      }

      if (error) throw error; // Si erreur SQL, on saute au catch

      // Succès
      setOpen(false);
      setEditing(null);
      setForm({ nom: '', type_produit: 'BIEN', prix_vente: 0, stock_actuel: 0, unite: 'unité', seuil_alerte: 5 });
      fetchProduits(entreprise.id);
      alert("Enregistré avec succès !");

    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement : " + err.message);
    }
  };

  const deleteProduit = async (id) => {
    if (!confirm("Supprimer cet article ?")) return;
    const { error } = await supabase.from('produits').delete().eq('id', id);
    if (error) alert("Erreur suppression: " + error.message);
    else fetchProduits(entreprise.id);
  };

  // --- EXPORTS ---
  const filtered = produits.filter(p => p.nom.toLowerCase().includes(searchTerm.toLowerCase()));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogue");
    XLSX.writeFile(wb, "Catalogue.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Catalogue - ${entreprise?.nom}`, 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Article', 'Type', 'Prix', 'Stock']],
      body: filtered.map(p => [p.nom, p.type_produit, p.prix_vente, p.stock_actuel])
    });
    doc.save('catalogue.pdf');
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
              <h1>Stocks & Services</h1>
              <p>Gérez votre catalogue</p>
            </div>
            <div style={{display:'flex', gap: 10}}>
                <button onClick={() => { setEditing(null); setOpen(true); }} className="btn btn-blue"><IconPlus/> Nouveau</button>
                <button onClick={exportPDF} className="btn btn-red"><IconDownload/> PDF</button>
                <button onClick={exportExcel} className="btn btn-green"><IconDownload/> Excel</button>
            </div>
          </div>

          <input 
            className="search-input" 
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Article</th><th>Type</th><th style={{textAlign:'right'}}>Prix</th><th style={{textAlign:'center'}}>Stock</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:'bold'}}>{p.nom}</td>
                    <td><span style={{background: p.type_produit==='BIEN'?'#dcfce7':'#ede9fe', padding:'4px 8px', borderRadius:'10px', fontSize:'0.8rem', fontWeight:'bold', color: p.type_produit==='BIEN'?'#166534':'#7c3aed'}}>{p.type_produit}</span></td>
                    <td style={{textAlign:'right'}}>{p.prix_vente.toLocaleString()} F</td>
                    <td style={{textAlign:'center'}}>
                        {p.type_produit === 'BIEN' ? (
                            <span style={{color: p.stock_actuel <= p.seuil_alerte ? 'red' : 'inherit', fontWeight: p.stock_actuel <= p.seuil_alerte ? 'bold' : 'normal'}}>
                                {p.stock_actuel} {p.unite} {p.stock_actuel <= p.seuil_alerte && <IconAlert/>}
                            </span>
                        ) : '-'}
                    </td>
                    <td style={{textAlign:'right'}}>
                      <button onClick={() => {setEditing(p); setForm(p); setOpen(true)}} style={{border:'none', background:'none', cursor:'pointer', marginRight:10}}><IconEdit/></button>
                      <button onClick={() => deleteProduit(p.id)} style={{border:'none', background:'none', cursor:'pointer', color:'red'}}><IconTrash/></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding: 20, color:'#94a3b8'}}>Aucun article</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 20}}>
                <h2 style={{margin:0}}>{editing ? 'Modifier' : 'Nouvel Article'}</h2>
                <button onClick={() => setOpen(false)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}}>✕</button>
            </div>
            
            <form onSubmit={saveProduit}>
                <label>Nom</label>
                <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 15}}>
                    <div>
                        <label>Type</label>
                        <select value={form.type_produit} onChange={e => setForm({...form, type_produit: e.target.value})}>
                            <option value="BIEN">Produit (Stocké)</option>
                            <option value="SERVICE">Service</option>
                        </select>
                    </div>
                    <div>
                        <label>Prix de Vente</label>
                        <input type="number" value={form.prix_vente} onChange={e => setForm({...form, prix_vente: e.target.value})} required />
                    </div>
                </div>

                <label>Unité (kg, sac, heure...)</label>
                <input value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} />

                {form.type_produit === 'BIEN' && (
                    <div style={{background:'#fff7ed', padding: 15, borderRadius: 8, marginBottom: 15}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 15}}>
                            <div>
                                <label>Stock Initial</label>
                                <input type="number" value={form.stock_actuel} onChange={e => setForm({...form, stock_actuel: e.target.value})} />
                            </div>
                            <div>
                                <label>Alerte si moins de</label>
                                <input type="number" value={form.seuil_alerte} onChange={e => setForm({...form, seuil_alerte: e.target.value})} />
                            </div>
                        </div>
                    </div>
                )}

                <button type="submit" className="btn btn-blue" style={{width:'100%', justifyContent:'center'}}>Enregistrer</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
