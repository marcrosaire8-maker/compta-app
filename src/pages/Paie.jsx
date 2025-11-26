import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ICÔNES */
const IconPlus = () => <span>＋</span>;
const IconPrint = () => <span>🖨️</span>;
const IconCheck = () => <span>✅</span>;

export default function Paie() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [bulletins, setBulletins] = useState([]);
  const [employes, setEmployes] = useState([]);

  // MODAL & FORMULAIRE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    employe_id: '',
    mois: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    salaire_base: 0,
    primes: 0,
    cotisations: 0,
    impots: 0
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
      fetchBulletins(ste.id);
      fetchEmployes(ste.id);
    }
    setLoading(false);
  }

  // 1. Récupérer les bulletins existants
  async function fetchBulletins(id) {
    const { data } = await supabase
      .from('fiches_paie')
      .select('*')
      .eq('entreprise_id', id)
      .order('created_at', { ascending: false });
    setBulletins(data || []);
  }

  // 2. Récupérer la liste des employés (depuis Tiers)
  async function fetchEmployes(id) {
    const { data } = await supabase
      .from('tiers')
      .select('id, nom_complet')
      .eq('entreprise_id', id)
      .eq('type_tier', 'EMPLOYE'); // Filtre important !
    setEmployes(data || []);
  }

  // CALCUL DYNAMIQUE
  const brut = Number(form.salaire_base) + Number(form.primes);
  const net = brut - Number(form.cotisations) - Number(form.impots);

  // --- SAUVEGARDE ---
  async function handleSave(e) {
    e.preventDefault();
    if (!form.employe_id) return alert("Veuillez sélectionner un employé.");

    try {
      // On trouve le nom de l'employé pour le stocker
      const employeChoisi = employes.find(e => e.id === form.employe_id);

      const payload = {
        entreprise_id: entreprise.id,
        employe_id: form.employe_id,
        employe_nom: employeChoisi ? employeChoisi.nom_complet : 'Inconnu',
        mois: form.mois,
        salaire_base: Number(form.salaire_base),
        primes: Number(form.primes),
        cotisations_sociales: Number(form.cotisations),
        impots_revenu: Number(form.impots),
        salaire_net: net
      };

      const { error } = await supabase.from('fiches_paie').insert([payload]);
      if (error) throw error;

      alert("Bulletin créé avec succès !");
      setIsModalOpen(false);
      fetchBulletins(entreprise.id);

    } catch (error) {
      alert("Erreur : " + error.message);
    }
  }

  // --- PDF ---
  const generatePDF = (b) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("BULLETIN DE PAIE", 105, 20, null, null, "center");
    
    doc.setFontSize(10);
    doc.text(`Employeur : ${entreprise.nom}`, 14, 35);
    doc.text(`Employé : ${b.employe_nom}`, 140, 35);
    doc.text(`Période : ${b.mois}`, 14, 45);

    autoTable(doc, {
        startY: 55,
        head: [['Rubrique', 'Gains (+)', 'Retenues (-)']],
        body: [
            ['Salaire de Base', b.salaire_base.toLocaleString(), ''],
            ['Primes & Indemnités', b.primes.toLocaleString(), ''],
            ['Salaire BRUT', b.salaire_brut.toLocaleString(), ''],
            ['Cotisations Sociales', '', b.cotisations_sociales.toLocaleString()],
            ['Impôts (IRPP)', '', b.impots_revenu.toLocaleString()],
        ],
        theme: 'grid'
    });

    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(`NET À PAYER : ${b.salaire_net.toLocaleString()} FCFA`, 140, doc.lastAutoTable.finalY + 15);
    doc.save(`Paie_${b.employe_nom}.pdf`);
  };

  // --- COMPTABILISATION (Bonus) ---
  const comptabiliser = async (b) => {
      if(!confirm("Générer l'écriture comptable pour ce bulletin ?")) return;
      try {
          // Création de l'écriture OD
          const { data: ecriture, error: errH } = await supabase.from('ecritures_comptables').insert([{
              entreprise_id: entreprise.id,
              date_ecriture: b.date_paie,
              libelle: `Paie ${b.mois} - ${b.employe_nom}`,
              journal_code: 'OD'
          }]).select().single();
          
          if(errH) throw errH;

          // Lignes (661 Charge / 422 Dette employé)
          await supabase.from('lignes_ecriture').insert([
              { ecriture_id: ecriture.id, debit: b.salaire_brut, credit: 0, compte_id: null }, // Idéalement, trouver l'ID du compte 661
              { ecriture_id: ecriture.id, debit: 0, credit: b.salaire_net, compte_id: null }  // Idéalement, trouver l'ID du compte 422
          ]);

          // Mettre à jour le statut
          await supabase.from('fiches_paie').update({ est_comptabilise: true }).eq('id', b.id);
          fetchBulletins(entreprise.id);
          alert("Écriture générée dans le Journal !");

      } catch (e) { alert("Erreur: " + e.message); }
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
              <h1>Gestion de la Paie</h1>
              <p>Éditez vos bulletins de salaire simplement</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-blue"><IconPlus/> Nouveau Bulletin</button>
          </div>

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Employé</th>
                  <th className="text-right">Salaire Brut</th>
                  <th className="text-right">Net à Payer</th>
                  <th className="text-center">État</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map(b => (
                  <tr key={b.id}>
                    <td>{b.mois}</td>
                    <td style={{fontWeight:'bold'}}>{b.employe_nom}</td>
                    <td className="text-right">{b.salaire_brut?.toLocaleString()} F</td>
                    <td className="text-right" style={{color:'#10b981', fontWeight:'bold'}}>{b.salaire_net?.toLocaleString()} F</td>
                    <td className="text-center">
                        {b.est_comptabilise ? <span className="badge-ok">Comptabilisé</span> : <span className="badge-wait">En attente</span>}
                    </td>
                    <td className="text-right">
                      <button onClick={() => generatePDF(b)} style={{background:'none', border:'none', cursor:'pointer', marginRight:10}}><IconPrint/></button>
                      {!b.est_comptabilise && <button onClick={() => comptabiliser(b)} style={{background:'none', border:'none', cursor:'pointer', color:'#3b82f6', fontWeight:'bold'}}>Comptabiliser</button>}
                    </td>
                  </tr>
                ))}
                {bulletins.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:30, color:'#94a3b8'}}>Aucun bulletin généré.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Nouveau Bulletin de Paie</h2>
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label>Employé</label>
                    <select value={form.employe_id} onChange={e => setForm({...form, employe_id: e.target.value})} required>
                        <option value="">-- Sélectionner un employé --</option>
                        {employes.map(em => <option key={em.id} value={em.id}>{em.nom_complet}</option>)}
                    </select>
                    {employes.length === 0 && <small style={{color:'red'}}>Aucun employé trouvé. Créez-en un dans la page "Tiers" avec le type EMPLOYE.</small>}
                </div>

                <div className="form-group">
                    <label>Période</label>
                    <input type="text" value={form.mois} onChange={e => setForm({...form, mois: e.target.value})} />
                </div>

                <div style={{background:'#f8fafc', padding:15, borderRadius:8, marginBottom:15}}>
                    <div className="form-group">
                        <label>Salaire de Base</label>
                        <input type="number" value={form.salaire_base} onChange={e => setForm({...form, salaire_base: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Primes & Indemnités</label>
                        <input type="number" value={form.primes} onChange={e => setForm({...form, primes: e.target.value})} />
                    </div>
                    <div style={{textAlign:'right', fontWeight:'bold'}}>Salaire BRUT : {brut.toLocaleString()} FCFA</div>
                </div>

                <div className="form-group">
                    <label>Cotisations sociales (CNSS...)</label>
                    <input type="number" value={form.cotisations} onChange={e => setForm({...form, cotisations: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>Impôts sur le revenu (IRPP)</label>
                    <input type="number" value={form.impots} onChange={e => setForm({...form, impots: e.target.value})} />
                </div>

                <div style={{background:'#dcfce7', padding:15, borderRadius:8, textAlign:'center', marginBottom:20}}>
                    <label style={{color:'#166534'}}>NET À PAYER</label>
                    <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#166534'}}>{net.toLocaleString()} FCFA</div>
                </div>

                <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
                    <button type="button" onClick={() => setIsModalOpen(false)} style={{padding:'10px', background:'#ddd', border:'none', borderRadius:5, cursor:'pointer'}}>Annuler</button>
                    <button type="submit" className="btn btn-red">Créer le bulletin</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Styles CSS Injectés
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
  .page { display: flex; min-height: 100vh; }
  .main { flex: 1; margin-left: 260px; padding: 2rem; }
  .header h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
  .actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .btn { padding: 0.8rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; color: white; }
  .btn-blue { background: #3b82f6; } .btn-red { background: #ef4444; }
  .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 1rem; background: #f1f5f9; color: #64748b; font-size: 0.85rem; text-transform: uppercase; }
  td { padding: 1rem; border-bottom: 1px solid #e2e8f0; }
  .text-right { text-align: right; } .text-center { text-align: center; }
  .badge-ok { background: #dcfce7; color: #166534; padding: 4px 8px; borderRadius: 4px; font-weight: bold; font-size: 0.8rem; }
  .badge-wait { background: #ffedd5; color: #9a3412; padding: 4px 8px; borderRadius: 4px; font-weight: bold; font-size: 0.8rem; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 50; }
  .modal { background: white; padding: 2rem; border-radius: 12px; width: 500px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569; font-size: 0.9rem; }
  input, select { width: 100%; padding: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 1rem; }
`;
