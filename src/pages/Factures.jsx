// src/pages/Factures.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* --- ICÔNES SVG --- */
const IconPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IconPDF = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

/* --- STYLES CSS --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  :root {
    --primary: #4f46e5;
    --success: #10b981;
    --danger: #ef4444;
    --bg-page: #f8fafc;
    --text-dark: #0f172a;
    --text-gray: #64748b;
    --border: #e2e8f0;
  }

  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; margin: 0; background: var(--bg-page); color: var(--text-dark); }

  .layout { display: flex; min-height: 100vh; width: 100%; }
  
  .main-area {
    margin-left: 260px;
    padding: 2rem;
    width: 100%;
    transition: all 0.3s ease;
    background: var(--bg-page);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* --- CORRECTIF MOBILE CRITIQUE --- */
  /* Ajout de padding-top pour éviter que le bouton burger ne cache le titre */
  @media (max-width: 900px) {
    .main-area {
      margin-left: 0 !important;
      padding: 1.5rem !important;
      padding-top: 80px !important; /* C'est ici que ça se joue */
      width: 100% !important;
    }
  }

  .dashboard-container {
    width: 100%;
    max-width: 1000px;
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
    color: var(--text-dark);
    line-height: 1.2;
  }
  .header-content p { color: var(--text-gray); font-size: 0.9rem; margin: 0; }

  .btn-create {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95rem;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
    transition: transform 0.1s;
  }
  .btn-create:active { transform: scale(0.98); }

  /* TABLEAU RESPONSIVE */
  .table-card {
    background: white;
    border-radius: 12px;
    border: 1px solid var(--border);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    width: 100%;
    overflow: hidden;
  }
  
  table { width: 100%; border-collapse: collapse; }
  
  th {
    background: #f1f5f9; padding: 1rem; text-align: left;
    font-size: 0.75rem; font-weight: 700; color: var(--text-gray); text-transform: uppercase;
  }
  
  td {
    padding: 1rem; border-bottom: 1px solid var(--border);
    font-size: 0.9rem; color: var(--text-dark);
  }

  .btn-icon {
    background: #f1f5f9; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: var(--text-gray); display: inline-flex;
  }
  .btn-icon:hover { background: #e2e8f0; color: var(--primary); }

  /* MOBILE CARD TRANSFORMATION */
  @media (max-width: 768px) {
    thead { display: none; }
    tr { display: block; border-bottom: 1px solid var(--border); padding: 1rem; }
    tr:last-child { border-bottom: none; }
    td { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border: none; text-align: right; }
    td::before { content: attr(data-label); font-weight: 600; color: var(--text-gray); font-size: 0.85rem; text-transform: uppercase; margin-right: 1rem; }
    
    .header-flex { align-items: flex-start; text-align: left; }
    .btn-create { width: 100%; justify-content: center; }
  }

  @media (min-width: 768px) {
    .header-flex { flex-direction: row; justify-content: space-between; }
  }

  /* MODAL */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
    display: flex; justify-content: center; align-items: center;
    z-index: 9999; padding: 1rem;
  }
  
  .modal-content {
    background: white; width: 100%; max-width: 800px;
    border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    display: flex; flex-direction: column; max-height: 90vh;
  }

  .modal-header {
    padding: 1.25rem; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .modal-title { margin: 0; font-size: 1.2rem; font-weight: 700; }
  
  .modal-body { padding: 1.5rem; overflow-y: auto; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
  .input-group { margin-bottom: 1rem; }
  .label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-gray); }
  .input {
    width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; outline: none;
  }
  .input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

  /* LIGNES FACTURE */
  .lines-container { background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 1rem; }
  .line-item {
    display: grid; grid-template-columns: 1fr; gap: 0.75rem;
    padding-bottom: 1rem; border-bottom: 1px dashed var(--border); margin-bottom: 1rem;
  }
  
  @media (min-width: 600px) {
    .line-item { grid-template-columns: 3fr 1fr 1fr 1fr auto; align-items: center; }
    .form-grid { grid-template-columns: 1fr 1fr; }
  }

  .btn-submit {
    width: 100%; padding: 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 1rem; font-size: 1rem;
  }
`;

export default function Factures() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [factures, setFactures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [clientNom, setClientNom] = useState('');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);

  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchFactures(ste.id);
    }
    setLoading(false);
  }

  async function fetchFactures(entrepriseId) {
    const { data } = await supabase
      .from('factures').select('*')
      .eq('entreprise_id', entrepriseId)
      .order('date_emission', { ascending: false });
    setFactures(data || []);
  }

  const updateLigne = (i, field, val) => {
    const newL = [...lignes];
    newL[i][field] = val;
    setLignes(newL);
  };

  const totalHT = lignes.reduce((acc, l) => acc + (l.quantite * l.prix), 0);

  async function handleSave(e) {
    e.preventDefault();
    if (!entreprise) return;
    try {
      const tva = totalHT * 0.18;
      const ttc = totalHT + tva;
      const { data: fact, error } = await supabase.from('factures').insert([{
        entreprise_id: entreprise.id, 
        numero: `FAC-${Date.now().toString().slice(-6)}`,
        client_nom: clientNom, 
        date_emission: dateEmission,
        total_ht: totalHT, total_tva: tva, total_ttc: ttc, statut: 'VALIDEE'
      }]).select().single();

      if (error) throw error;

      await supabase.from('lignes_facture').insert(lignes.map(l => ({
        facture_id: fact.id, description: l.description, quantite: l.quantite, unite: l.unite, prix_unitaire: l.prix
      })));

      alert("✅ Facture créée !");
      setIsModalOpen(false);
      setClientNom('');
      setLignes([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
      fetchFactures(entreprise.id);
    } catch (err) { alert(err.message); }
  }

  const generatePDF = (f) => {
    const doc = new jsPDF();
    doc.text(`FACTURE: ${f.numero}`, 14, 20);
    doc.setFontSize(10); doc.text(`Client: ${f.client_nom}`, 14, 28);
    autoTable(doc, { startY: 35, head: [['Desc', 'Montant']], body: [['Services', f.total_ttc]] });
    doc.save(`facture_${f.numero}.pdf`);
  };

  if (loading) return <div style={{height:'100vh', display:'grid', placeItems:'center'}}>Chargement...</div>;

  return (
    <div className="layout">
      <style>{styles}</style>
      
      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <main className="main-area">
        <div className="dashboard-container">
          
          {/* HEADER */}
          <div className="header-flex">
            <div className="header-content">
              <h1>Facturation</h1>
              <p>Gérez vos factures clients</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn-create">
              <div style={{width:20, height:20}}><IconPlus /></div> Nouvelle Facture
            </button>
          </div>

          {/* TABLEAU RESPONSIVE */}
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th style={{textAlign:'right'}}>Total TTC</th>
                  <th style={{textAlign:'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {factures.map(fac => (
                  <tr key={fac.id}>
                    <td data-label="Numéro" style={{fontWeight:'bold', color:'var(--primary)'}}>
                      {fac.numero}
                    </td>
                    <td data-label="Date">
                      {new Date(fac.date_emission).toLocaleDateString()}
                    </td>
                    <td data-label="Client" style={{fontWeight:'500'}}>
                      {fac.client_nom}
                    </td>
                    <td data-label="Montant TTC" style={{textAlign:'right', fontWeight:'700', color:'var(--success)'}}>
                      {fac.total_ttc.toLocaleString()} F
                    </td>
                    <td data-label="Action" style={{textAlign:'center'}}>
                      <button onClick={() => generatePDF(fac)} className="btn-icon" title="Télécharger PDF">
                        <div style={{width:18, height:18}}><IconPDF /></div>
                      </button>
                    </td>
                  </tr>
                ))}
                {factures.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign:'center', padding:'3rem', color:'var(--text-gray)'}}>
                      Aucune facture enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Créer une facture</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-gray)'}}>
                <div style={{width:24, height:24}}><IconClose /></div>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="input-group">
                    <label className="label">Client</label>
                    <input className="input" required value={clientNom} onChange={e=>setClientNom(e.target.value)} placeholder="Nom du client" />
                  </div>
                  <div className="input-group">
                    <label className="label">Date</label>
                    <input type="date" className="input" required value={dateEmission} onChange={e=>setDateEmission(e.target.value)} />
                  </div>
                </div>

                <div className="lines-container">
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                    <span className="label">Lignes de facture</span>
                    <button type="button" onClick={()=>setLignes([...lignes, {description:'', quantite:1, unite:'', prix:0}])} style={{color:'var(--primary)', background:'none', border:'none', fontWeight:'bold', cursor:'pointer', fontSize:'0.85rem'}}>
                      + Ajouter ligne
                    </button>
                  </div>

                  {lignes.map((l, i) => (
                    <div key={i} className="line-item">
                      <input className="input" placeholder="Description" value={l.description} onChange={e=>updateLigne(i,'description',e.target.value)} />
                      <input type="number" className="input" placeholder="Qté" value={l.quantite} onChange={e=>updateLigne(i,'quantite',Number(e.target.value))} />
                      <input className="input" placeholder="Unité" value={l.unite} onChange={e=>updateLigne(i,'unite',e.target.value)} />
                      <input type="number" className="input" placeholder="Prix" value={l.prix} onChange={e=>updateLigne(i,'prix',Number(e.target.value))} />
                      {lignes.length > 1 && (
                        <button type="button" onClick={()=>setLignes(lignes.filter((_,idx)=>idx!==i))} style={{color:'var(--danger)', background:'none', border:'none', cursor:'pointer'}}>
                          <div style={{width:20, height:20}}><IconTrash /></div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{textAlign:'right', fontSize:'1.2rem', fontWeight:'bold', marginTop:'1.5rem', color:'var(--text-dark)'}}>
                  Total TTC : <span style={{color:'var(--primary)'}}>{(totalHT * 1.18).toLocaleString()} FCFA</span>
                </div>

                <button type="submit" className="btn-submit">
                  Enregistrer la Facture
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
