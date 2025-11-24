// src/pages/Paie.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ICÔNES */
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const IconPrint = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7m0 0v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6m0 0h12"/></svg>;
const IconCheck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>;
const IconClose = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>;

/* STYLES PREMIUM ROUGE (identique à Dépenses) */
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
  .btn-small{background:#3b82f6;padding:6px 12px;border-radius:8px;font-size:0.85rem}
  .card{background:white;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 10px 30px -8px rgba(0,0,0,.08);overflow:hidden}
  .card-header{padding:1.5rem 2rem;background:#fef2f2;border-bottom:1px solid #fee2e2}
  .card-header h3{margin:0;color:#991b1b;font-weight:700}
  table{width:100%;border-collapse:collapse}
  th{background:#fef2f2;padding:1rem;text-align:left;font-size:.8rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px}
  td{padding:1rem;border-bottom:1px solid #fee2e2;color:#334155}
  .text-right{text-align:right}
  .text-green{color:#166534;font-weight:700}
  .badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:6px;font-size:0.8rem}
  .badge-red{background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:6px;font-size:0.8rem}
  @media(max-width:768px){
    thead{display:none}
    tr{display:block;background:white;margin-bottom:1rem;border:1px solid #fee2e2;border-radius:16px;padding:1rem;box-shadow:0 4px 12px rgba(220,38,38,.08)}
    td{display:flex;justify-content:space-between;padding:.5rem 0;border:none}
    td::before{content:attr(data-label);font-weight:600;color:#991b1b;text-transform:uppercase;font-size:.8rem}
  }
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem}
  .modal{background:white;border-radius:24px;width:100%;max-width:640px;max-height:90vh;overflow:hidden;box-shadow:0 30px 80px -20px rgba(220,38,38,.4)}
  .modal-header{padding:1.5rem 2rem;background:#fef2f2;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #fee2e2}
  .modal-title{margin:0;font-size:1.6rem;font-weight:800;color:#991b1b}
  .modal-body{padding:2rem;overflow-y:auto}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem}
  .group{display:flex;flex-direction:column}
  label{margin-bottom:.5rem;font-weight:600;color:#475569;font-size:.95rem}
  input,select{padding:.9rem 1.2rem;border:1px solid #cbd5e1;border-radius:12px;font-size:1rem;outline:none;transition:.3s}
  input:focus,select:focus{border-color:#dc2626;box-shadow:0 0 0 4px rgba(220,38,38,.1)}
  .block{background:#fef2f2;padding:1.5rem;border-radius:16px;margin:1.5rem 0}
  .total-net{text-align:center;background:#dcfce7;padding:1.5rem;border-radius:16px}
  .total-net div:first-child{color:#166534;font-size:1rem}
  .total-net div:last-child{font-size:2rem;font-weight:900;color:#166534}
`;

export default function Paie() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [bulletins, setBulletins] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    employe_id: '',
    mois: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    date_paie: new Date().toISOString().split('T')[0],
    salaire_base: 0,
    primes: 0,
    cotisations: 0,
    impots: 0
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ste = await getEntrepriseForUser(user.id, user.email);
      if (!ste) return;
      setEntreprise(ste);
      await Promise.all([fetchBulletins(ste.id), fetchEmployes(ste.id)]);
      setLoading(false);
    })();
  }, []);

  async function fetchBulletins(id) {
    const { data } = await supabase
      .from('fiches_paie')
      .select('*, employe:tiers(nom_complet)')
      .eq('entreprise_id', id)
      .order('date_paie', { ascending: false });
    setBulletins(data || []);
  }

  async function fetchEmployes(id) {
    const { data } = await supabase
      .from('tiers')
      .select('id, nom_complet')
      .eq('entreprise_id', id)
      .eq('type_tier', 'EMPLOYE');
    setEmployes(data || []);
  }

  const salaireBrut = Number(form.salaire_base) + Number(form.primes);
  const salaireNet = salaireBrut - Number(form.cotisations) - Number(form.impots);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employe_id) return alert("Choisissez un employé");

    try {
      const { error } = await supabase.from('fiches_paie').insert([{
        entreprise_id: entreprise.id,
        employe_id: form.employe_id,
        mois: form.mois,
        date_paie: form.date_paie,
        salaire_base: Number(form.salaire_base),
        primes: Number(form.primes),
        salaire_brut: salaireBrut,
        cotisations_sociales: Number(form.cotisations),
        impots_revenu: Number(form.impots),
        salaire_net: salaireNet,
        est_comptabilise: false
      }]);

      if (error) throw error;

      alert("Bulletin de paie créé !");
      setOpen(false);
      setForm({ employe_id: '', mois: form.mois, date_paie: form.date_paie, salaire_base: 0, primes: 0, cotisations: 0, impots: 0 });
      fetchBulletins(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const comptabiliser = async (b) => {
    if (!confirm(`Comptabiliser la paie de ${b.employe.nom_complet} ?`)) return;

    try {
      const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
        entreprise_id: entreprise.id,
        date_ecriture: b.date_paie,
        libelle: `Paie ${b.mois} - ${b.employe.nom_complet}`,
        journal_code: 'OD'
      }]).select().single();

      const totalDeductions = b.cotisations_sociales + b.impots_revenu;

      await supabase.from('lignes_ecriture').insert([
        { ecriture_id: ecriture.id, compte_id: await getCompte('661'), debit: b.salaire_brut, credit: 0 },
        { ecriture_id: ecriture.id, compte_id: await getCompte('422'), debit:  b.salaire_net, credit: 0 },
        { ecriture_id: ecriture.id, compte_id: await getCompte('431'), debit: 0, credit: totalDeductions }
      ]);

      await supabase.from('fiches_paie').update({ est_comptabilise: true }).eq('id', b.id);
      alert("Écriture comptable générée !");
      fetchBulletins(entreprise.id);
    } catch (err) {
      alert("Erreur compta : " + err.message);
    }
  };

  const getCompte = async (code) => {
    const { data } = await supabase.from('plan_comptable')
      .select('id').eq('entreprise_id', entreprise.id).ilike('code_compte', `${code}%`).limit(1).single();
    return data?.id || 1; // fallback
  };

  const printBulletin = (b) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("BULLETIN DE PAIE", 105, 25, null, null, 'center');
    doc.setFontSize(11);
    doc.text(`Employeur : ${entreprise.nom}`, 14, 40);
    doc.text(`Employé : ${b.employe.nom_complet}`, 14, 48);
    doc.text(`Période : ${b.mois}`, 14, 56);

    autoTable(doc, {
      startY: 70,
      head: [['Rubrique', 'Montant']],
      body: [
        ['Salaire de base', `${b.salaire_base.toLocaleString()} F`],
        ['Primes', `${b.primes.toLocaleString()} F`],
        ['Salaire BRUT', `${b.salaire_brut.toLocaleString()} F`],
        ['Cotisations sociales', `${b.cotisations_sociales.toLocaleString()} F`],
        ['Impôts sur revenu', `${b.impots_revenu.toLocaleString()} F`],
        ['NET À PAYER', `${b.salaire_net.toLocaleString()} F`],
      ],
      theme: 'grid'
    });

    doc.setFontSize(16);
    doc.setTextColor(22, 101, 52);
    doc.text(`NET À PAYER : ${b.salaire_net.toLocaleString()} FCFA`, 105, doc.lastAutoTable.finalY + 20, null, null, 'center');

    doc.save(`Bulletin_${b.employe.nom_complet.replace(/ /g, '_')}_${b.mois}.pdf`);
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
              <h1>Gestion de la Paie</h1>
              <p>Création et suivi des bulletins de salaire</p>
            </div>
            <button className="btn" onClick={() => setOpen(true)}>
              <IconPlus /> Nouveau bulletin
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Bulletins de paie ({bulletins.length})</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Employé</th>
                  <th>Brut</th>
                  <th className="text-right">Net</th>
                  <th>Compta</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map(b => (
                  <tr key={b.id}>
                    <td data-label="Mois">{b.mois}</td>
                    <td data-label="Employé" style={{fontWeight:600}}>{b.employe?.nom_complet || 'Inconnu'}</td>
                    <td data-label="Brut">{b.salaire_brut?.toLocaleString()} F</td>
                    <td data-label="Net" className="text-right text-green">{b.salaire_net?.toLocaleString()} F</td>
                    <td data-label="Compta">
                      {b.est_comptabilise ? 
                        <span className="badge-green">Comptabilisé</span> : 
                        <span className="badge-red">En attente</span>
                      }
                    </td>
                    <td className="text-right">
                      <button onClick={() => printBulletin(b)} style={{background:'none',border:'none',cursor:'pointer',marginRight:8}}>
                        <IconPrint />
                      </button>
                      {!b.est_comptabilise && (
                        <button onClick={() => comptabiliser(b)} className="btn-small">
                          <IconCheck /> Comptabiliser
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {bulletins.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}>Aucun bulletin de paie</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL NOUVEAU BULLETIN */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Nouveau bulletin de paie</div>
              <button onClick={() => setOpen(false)} style={{background:'none',border:'none',cursor:'pointer'}}><IconClose /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="grid">
                  <div className="group">
                    <label>Employé</label>
                    <select required value={form.employe_id} onChange={e => setForm({...form, employe_id: e.target.value})}>
                      <option value="">Sélectionner...</option>
                      {employes.map(e => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}
                    </select>
                  </div>
                  <div className="group">
                    <label>Période</label>
                    <input type="text" value={form.mois} onChange={e => setForm({...form, mois: e.target.value})} placeholder="ex: Mars 2025" />
                  </div>
                </div>

                <div className="block">
                  <div className="group">
                    <label>Salaire de base</label>
                    <input type="number" value={form.salaire_base} onChange={e => setForm({...form, salaire_base: e.target.value})} placeholder="0" />
                  </div>
                  <div className="group">
                    <label>Primes & indemnités</label>
                    <input type="number" value={form.primes} onChange={e => setForm({...form, primes: e.target.value})} placeholder="0" />
                  </div>
                  <div style={{textAlign:'right',fontWeight:'bold',marginTop:10}}>
                    Salaire BRUT : {salaireBrut.toLocaleString()} FCFA
                  </div>
                </div>

                <div className="block" style={{background:'#fff7ed'}}>
                  <div className="group">
                    <label>Cotisations sociales (CNSS...)</label>
                    <input type="number" value={form.cotisations} onChange={e => setForm({...form, cotisations: e.target.value})} placeholder="0" />
                  </div>
                  <div className="group">
                    <label>Impôts sur le revenu (IRPP)</label>
                    <input type="number" value={form.impots} onChange={e => setForm({...form, impots: e.target.value})} placeholder="0" />
                  </div>
                </div>

                <div className="total-net">
                  <div>NET À PAYER</div>
                  <div>{salaireNet.toLocaleString()} FCFA</div>
                </div>

                <div style={{marginTop:'2rem',textAlign:'right'}}>
                  <button type="submit" className="btn">Créer le bulletin</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
