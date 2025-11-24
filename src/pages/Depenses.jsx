// src/pages/Depenses.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ICÔNES SVG */
const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const IconPDF = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5m-7.5 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const IconTrash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const IconClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* STYLES */
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
  .card{background:white;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 10px 30px -8px rgba(0,0,0,.08);overflow:hidden}
  .card-header{padding:1.5rem 2rem;background:#fef2f2;border-bottom:1px solid #fee2e2}
  .card-header h3{margin:0;color:#991b1b;font-weight:700}
  table{width:100%;border-collapse:collapse}
  th{background:#fef2f2;padding:1rem;text-align:left;font-size:.8rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px}
  td{padding:1rem;border-bottom:1px solid #fee2e2;color:#334155}
  .text-right{text-align:right}
  .text-red{color:#dc2626;font-weight:700}
  @media(max-width:768px){
    thead{display:none}
    tr{display:block;background:white;margin-bottom:1rem;border:1px solid #fee2e2;border-radius:16px;padding:1rem;box-shadow:0 4px 12px rgba(220,38,38,.08)}
    td{display:flex;justify-content:space-between;padding:.5rem 0;border:none}
    td::before{content:attr(data-label);font-weight:600;color:#991b1b;text-transform:uppercase;font-size:.8rem}
  }
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem}
  .modal{background:white;border-radius:24px;width:100%;max-width:720px;max-height:90vh;overflow:hidden;box-shadow:0 30px 80px -20px rgba(220,38,38,.4)}
  .modal-header{padding:1.5rem 2rem;background:#fef2f2;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #fee2e2}
  .modal-title{margin:0;font-size:1.6rem;font-weight:800;color:#991b1b}
  .modal-body{padding:2rem;overflow-y:auto}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem}
  .group{display:flex;flex-direction:column}
  label{margin-bottom:.5rem;font-weight:600;color:#475569;font-size:.95rem}
  input{padding:.9rem 1.2rem;border:1px solid #cbd5e1;border-radius:12px;font-size:1rem;outline:none;transition:.3s}
  input:focus{border-color:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,.1)}
  .lines{background:#fef2f2;border:2px dashed #fca5a5;border-radius:16px;padding:1.5rem;margin:1.5rem 0}
  .line{display:grid;grid-template-columns:3fr 1fr 1fr 1fr auto;gap:1rem;align-items:center;margin-bottom:1rem}
  @media(max-width:640px){.line{grid-template-columns:1fr}.grid{grid-template-columns:1fr}}
  .total{text-align:right;font-size:1.5rem;font-weight:800;color:#991b1b;margin:1.5rem 0}
  .submit{width:100%;padding:1.1rem;background:#dc2626;color:white;border:none;border-radius:14px;font-weight:800;cursor:pointer}
`;

export default function Depenses() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [depenses, setDepenses] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [open, setOpen] = useState(false);

  const [fournisseur, setFournisseur] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ste = await getEntrepriseForUser(user.id, user.email);
      if (!ste) return;

      setEntreprise(ste);

      const [factRes, fourRes] = await Promise.all([
        supabase.from('factures').select('*').eq('entreprise_id', ste.id).eq('type_facture', 'ACHAT').order('date_emission', { ascending: false }),
        supabase.from('tiers').select('nom_complet').eq('entreprise_id', ste.id).eq('type_tier', 'FOURNISSEUR')
      ]);

      setDepenses(factRes.data || []);
      setFournisseurs(fourRes.data || []);
      setLoading(false);
    })();
  }, []);

  const totalHT = lignes.reduce((a, l) => a + l.quantite * l.prix, 0);
  const tva = totalHT * 0.18;
  const totalTTC = totalHT + tva;

  const ajouterLigne = () => setLignes([...lignes, { description: '', quantite: 1, unite: '', prix: 0 }]);
  const supprimerLigne = i => setLignes(lignes.filter((_, idx) => idx !== i));
  const majLigne = (i, champ, val) => {
    const newL = [...lignes];
    newL[i][champ] = (champ === 'quantite' || champ === 'prix') ? Number(val) || 0 : val;
    setLignes(newL);
  };

  const sauver = async e => {
    e.preventDefault();
    if (!fournisseur.trim()) return alert('Fournisseur requis');

    try {
      const { data: fac, error: err1 } = await supabase
        .from('factures')
        .insert({
          entreprise_id: entreprise.id,
          type_facture: 'ACHAT',
          numero: `ACH-${Date.now().toString().slice(-6)}`,
          client_nom: fournisseur.trim(),
          date_emission: date,
          total_ht: totalHT,
          total_tva: tva,
          total_ttc: totalTTC,
          statut: 'VALIDEE'
        })
        .select()
        .single();

      if (err1) throw err1;

      const lignesOk = lignes.filter(l => l.description.trim() && l.prix > 0);
      if (lignesOk.length > 0) {
        const { error: err2 } = await supabase.from('lignes_facture').insert(
          lignesOk.map(l => ({
            facture_id: fac.id,
            description: l.description,
            quantite: l.quantite,
            unite: l.unite,
            prix_unitaire: l.prix
          }))
        );
        if (err2) throw err2;
      }

      alert('Dépense enregistrée avec succès !');
      setOpen(false);
      setFournisseur('');
      setLignes([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);

      const { data } = await supabase
        .from('factures')
        .select('*')
        .eq('entreprise_id', entreprise.id)
        .eq('type_facture', 'ACHAT')
        .order('date_emission', { ascending: false });
      setDepenses(data || []);
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const pdf = f => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`DÉPENSE - ${f.numero}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Fournisseur : ${f.client_nom}`, 14, 30);
    doc.text(`Date : ${new Date(f.date_emission).toLocaleDateString('fr-FR')}`, 14, 38);
    doc.text(`Total TTC : ${f.total_ttc.toLocaleString()} FCFA`, 14, 46);

    autoTable(doc, {
      startY: 60,
      head: [['Description', 'Qté', 'Unité', 'PU HT', 'Total HT']],
      body: lignes.map(l => [l.description || '-', l.quantite, l.unite, l.prix.toLocaleString(), (l.quantite * l.prix).toLocaleString()])
    });
    doc.save(`depense_${f.numero}.pdf`);
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
              <h1>Mes Dépenses</h1>
              <p>Suivi des achats et factures fournisseurs</p>
            </div>
            <button className="btn" onClick={() => setOpen(true)}>
              <IconPlus /> Nouvelle dépense
            </button>
          </div>

          <div className="card">
            <div className="card-header"><h3>Dépenses ({depenses.length})</h3></div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fournisseur</th>
                  <th>Réf</th>
                  <th className="text-right">TTC</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {depenses.map(f => (
                  <tr key={f.id}>
                    <td data-label="Date">{new Date(f.date_emission).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Fournisseur">{f.client_nom}</td>
                    <td data-label="Réf">#{f.numero}</td>
                    <td data-label="TTC" className="text-right text-red">{f.total_ttc.toLocaleString()} F</td>
                    <td>
                      <button onClick={() => pdf(f)} style={{background:'#fef2f2',border:'none',borderRadius:'8px',padding:'8px',cursor:'pointer'}}>
                        <IconPDF />
                      </button>
                    </td>
                  </tr>
                ))}
                {depenses.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>Aucune dépense enregistrée</td></tr>
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
              <div className="modal-title">Nouvelle dépense</div>
              <button onClick={() => setOpen(false)} style={{background:'none',border:'none',cursor:'pointer'}}><IconClose /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={sauver}>
                <div className="grid">
                  <div className="group">
                    <label>Fournisseur</label>
                    <input required list="fournisseurs" value={fournisseur} onChange={e => setFournisseur(e.target.value)} placeholder="Ex: Orange, Total…" />
                    <datalist id="fournisseurs">
                      {fournisseurs.map((f, i) => <option key={i} value={f.nom_complet} />)}
                    </datalist>
                  </div>
                  <div className="group">
                    <label>Date</label>
                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>

                <div className="lines">
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem',fontWeight:'600'}}>
                    <span>Détail des achats</span>
                    <button type="button" onClick={ajouterLigne} style={{color:'#dc2626',background:'none',border:'none',fontWeight:'bold'}}>+ Ajouter une ligne</button>
                  </div>

                  {lignes.map((l, i) => (
                    <div key={i} className="line">
                      <input placeholder="Description" value={l.description} onChange={e => majLigne(i,'description',e.target.value)} />
                      <input type="number" placeholder="Qté" value={l.quantite} onChange={e => majLigne(i,'quantite',e.target.value)} />
                      <input placeholder="Unité" value={l.unite} onChange={e => majLigne(i,'unite',e.target.value)} />
                      <input type="number" placeholder="Prix HT" value={l.prix} onChange={e => majLigne(i,'prix',e.target.value)} />
                      {lignes.length > 1 && (
                        <button type="button" onClick={() => supprimerLigne(i)} style={{color:'#dc2626',background:'none',border:'none'}}>
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="total">
                  Total TTC : {totalTTC.toLocaleString()} FCFA
                  <small style={{display:'block',color:'#64748b',fontSize:'.9rem'}}>
                    HT : {totalHT.toLocaleString()} F + TVA 18% : {tva.toLocaleString()} F
                  </small>
                </div>

                <button type="submit" className="submit">Enregistrer la dépense</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
