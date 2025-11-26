import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ICÔNES */
const IconSync = () => <span>⚡</span>; // Éclair pour la vitesse
const IconPlus = () => <span>＋</span>;
const IconDownload = () => <span>📥</span>;

/* STYLES CSS */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
  .page { display: flex; min-height: 100vh; }
  .main { flex: 1; margin-left: 260px; padding: 2rem; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .header h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
  
  /* KPI */
  .kpi-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
  .kpi-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6; }
  .kpi-label { color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
  .kpi-value { font-size: 1.8rem; font-weight: 800; margin-top: 0.5rem; color: #1e293b; }
  .text-green { color: #166534; } .text-red { color: #991b1b; }

  /* ACTIONS */
  .actions { display: flex; gap: 10px; }
  .btn { padding: 0.8rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; color: white; font-size: 0.9rem; }
  .btn-blue { background: #3b82f6; } .btn-green { background: #10b981; } 
  .btn-orange { background: #f97316; animation: pulse 2s infinite; }
  
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); } 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); } }

  /* TABLEAU */
  .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 1rem; background: #f1f5f9; color: #64748b; font-size: 0.8rem; text-transform: uppercase; font-weight: 700; }
  td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #334155; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  
  /* MODAL */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 50; }
  .modal { background: white; padding: 2rem; border-radius: 12px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
  .input-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569; font-size: 0.9rem; }
  input, select { width: 100%; padding: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; }
`;

export default function Journal() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [ecritures, setEcritures] = useState([]);
  const [comptes, setComptes] = useState([]);
  
  // Stats
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  // Modal Saisie Manuelle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    libelle: '',
    compteDebit: '',
    compteCredit: '',
    montant: ''
  });

  const [syncing, setSyncing] = useState(false);

  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      await fetchComptes(ste.id); // On attend les comptes avant de charger
      fetchEcritures(ste.id);
    }
    setLoading(false);
  }

  async function fetchComptes(id) {
    const { data } = await supabase.from('plan_comptable').select('id, code_compte, libelle').eq('entreprise_id', id).order('code_compte');
    setComptes(data || []);
  }

  async function fetchEcritures(id) {
    const { data } = await supabase
      .from('ecritures_comptables')
      .select(`
        id, date_ecriture, libelle, journal_code,
        lignes_ecriture ( id, debit, credit, compte_id, plan_comptable (code_compte, libelle) )
      `)
      .eq('entreprise_id', id)
      .order('date_ecriture', { ascending: false });
    
    const allEcritures = data || [];
    setEcritures(allEcritures);

    // Calcul totaux
    let tD = 0, tC = 0;
    allEcritures.forEach(e => {
        e.lignes_ecriture.forEach(l => {
            tD += l.debit;
            tC += l.credit;
        });
    });
    setTotalDebit(tD);
    setTotalCredit(tC);
  }

  // --- 🚀 LE MOTEUR D'IMPORTATION UNIFIÉ ---
  const syncTout = async () => {
    setSyncing(true);
    let count = 0;

    try {
        // --- 1. IMPORTER LES FACTURES (VENTES & ACHATS) ---
        const { data: factures } = await supabase
            .from('factures')
            .select('*')
            .eq('entreprise_id', entreprise.id)
            .eq('est_comptabilise', false);

        if (factures) {
            for (const fac of factures) {
                // Créer l'écriture
                const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
                    entreprise_id: entreprise.id,
                    date_ecriture: fac.date_emission,
                    libelle: `${fac.type_facture} N°${fac.numero} - ${fac.client_nom}`,
                    journal_code: fac.type_facture === 'VENTE' ? 'VT' : 'AC',
                    facture_liee_id: fac.id
                }]).select().single();

                // Trouver les IDs de comptes (Helper)
                const getCpt = (code) => comptes.find(c => c.code_compte.toString().startsWith(code))?.id;
                
                const lignes = [];
                if (fac.type_facture === 'VENTE') {
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('411'), debit: fac.total_ttc, credit: 0 }); // Client
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('701'), debit: 0, credit: fac.total_ht }); // Vente
                    if(fac.total_tva > 0) lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('443'), debit: 0, credit: fac.total_tva }); // TVA
                } else {
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('601'), debit: fac.total_ht, credit: 0 }); // Achat
                    if(fac.total_tva > 0) lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('445'), debit: fac.total_tva, credit: 0 }); // TVA
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('401'), debit: 0, credit: fac.total_ttc }); // Fournisseur
                }

                const validLignes = lignes.filter(l => l.compte_id);
                if (validLignes.length > 0) {
                    await supabase.from('lignes_ecriture').insert(validLignes);
                    await supabase.from('factures').update({ est_comptabilise: true }).eq('id', fac.id);
                    count++;
                }
            }
        }

        // --- 2. IMPORTER LES PAIES (NOUVEAU) ---
        const { data: paies } = await supabase
            .from('fiches_paie')
            .select('*')
            .eq('entreprise_id', entreprise.id)
            .eq('est_comptabilise', false);

        if (paies) {
            for (const p of paies) {
                const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
                    entreprise_id: entreprise.id,
                    date_ecriture: p.date_paie,
                    libelle: `Paie ${p.mois} - ${p.employe_nom || 'Salarié'}`,
                    journal_code: 'OD'
                }]).select().single();

                const getCpt = (code) => comptes.find(c => c.code_compte.toString().startsWith(code))?.id;

                // 661 (Charge) / 422 (Net à payer)
                const lignesPaie = [
                    { ecriture_id: ecriture.id, compte_id: getCpt('661'), debit: p.salaire_brut, credit: 0 },
                    { ecriture_id: ecriture.id, compte_id: getCpt('422'), debit: 0, credit: p.salaire_net }
                ];
                // Si écart (cotisations), on met dans 431 (Sécu) pour équilibrer
                const diff = p.salaire_brut - p.salaire_net;
                if (diff > 0) {
                     lignesPaie.push({ ecriture_id: ecriture.id, compte_id: getCpt('431'), debit: 0, credit: diff });
                }

                const validLignes = lignesPaie.filter(l => l.compte_id);
                if (validLignes.length > 0) {
                    await supabase.from('lignes_ecriture').insert(validLignes);
                    await supabase.from('fiches_paie').update({ est_comptabilise: true }).eq('id', p.id);
                    count++;
                }
            }
        }

        if (count > 0) {
            alert(`${count} nouvelles opérations ont été intégrées au journal !`);
            fetchEcritures(entreprise.id);
        } else {
            alert("Aucune nouvelle opération à synchroniser.");
        }

    } catch (error) {
        alert("Erreur de synchro : " + error.message);
    } finally {
        setSyncing(false);
    }
  };

  // --- SAISIE MANUELLE ---
  const handleManualSave = async (e) => {
    e.preventDefault();
    try {
        const { data: head, error: errH } = await supabase.from('ecritures_comptables').insert([{
            entreprise_id: entreprise.id, date_ecriture: form.date, libelle: form.libelle, journal_code: 'OD'
        }]).select().single();
        if (errH) throw errH;

        await supabase.from('lignes_ecriture').insert([
            { ecriture_id: head.id, compte_id: form.compteDebit, debit: form.montant, credit: 0 },
            { ecriture_id: head.id, compte_id: form.compteCredit, debit: 0, credit: form.montant }
        ]);

        alert("Écriture validée !");
        setIsModalOpen(false);
        fetchEcritures(entreprise.id);
    } catch (err) { alert(err.message); }
  };

  // --- EXPORTS ---
  const exportExcel = () => {
      const flatData = [];
      ecritures.forEach(e => {
          e.lignes_ecriture.forEach(l => {
              flatData.push({
                  Date: e.date_ecriture, Jnl: e.journal_code, Pièce: e.libelle,
                  Compte: l.plan_comptable?.code_compte, Intitulé: l.plan_comptable?.libelle,
                  Débit: l.debit, Crédit: l.credit
              });
          });
      });
      const ws = XLSX.utils.json_to_sheet(flatData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Journal");
      XLSX.writeFile(wb, `Journal_${entreprise.nom}.xlsx`);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />
        
        <div className="main">
          <div className="header">
            <div>
                <h1>Journal Comptable</h1>
                <p>Centralisation automatique des opérations</p>
            </div>
            <div className="actions">
                <button onClick={syncTout} disabled={syncing} className="btn btn-orange">
                    {syncing ? "Traitement..." : <><IconSync/> TOUT SYNCHRONISER</>}
                </button>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-blue"><IconPlus/> Saisie Manuelle</button>
                <button onClick={exportExcel} className="btn btn-green"><IconDownload/> Excel</button>
            </div>
          </div>

          <div className="kpi-row">
            <div className="kpi-card" style={{borderLeftColor: '#10b981'}}>
                <div className="kpi-label">Total Débit</div>
                <div className="kpi-value text-green">{totalDebit.toLocaleString()} F</div>
            </div>
            <div className="kpi-card" style={{borderLeftColor: '#ef4444'}}>
                <div className="kpi-label">Total Crédit</div>
                <div className="kpi-value text-red">{totalCredit.toLocaleString()} F</div>
            </div>
            <div className="kpi-card" style={{borderLeftColor: totalDebit === totalCredit ? '#10b981' : '#dc2626'}}>
                <div className="kpi-label">État</div>
                <div className="kpi-value" style={{color: totalDebit === totalCredit ? '#10b981' : '#dc2626'}}>
                    {totalDebit === totalCredit ? "ÉQUILIBRÉ ✅" : "ERREUR ⚠️"}
                </div>
            </div>
          </div>

          <div className="table-container">
            <table>
                <thead>
                    <tr><th>Date</th><th>Jnl</th><th>Libellé</th><th>Compte</th><th>Intitulé</th><th className="text-right">Débit</th><th className="text-right">Crédit</th></tr>
                </thead>
                <tbody>
                    {ecritures.map(e => (
                        e.lignes_ecriture.map((l, idx) => (
                            <tr key={l.id} style={{background: idx===0 && e.lignes_ecriture.length > 1 ? '#fafafa' : 'white'}}>
                                <td>{idx === 0 ? <strong>{e.date_ecriture}</strong> : ''}</td>
                                <td>{idx === 0 ? <span style={{background:'#e2e8f0', padding:'2px 6px', borderRadius:4, fontSize:'0.7rem'}}>{e.journal_code}</span> : ''}</td>
                                <td>{idx === 0 ? e.libelle : ''}</td>
                                <td className="font-bold">{l.plan_comptable?.code_compte}</td>
                                <td>{l.plan_comptable?.libelle}</td>
                                <td className="text-right">{l.debit > 0 ? l.debit.toLocaleString() : '-'}</td>
                                <td className="text-right">{l.credit > 0 ? l.credit.toLocaleString() : '-'}</td>
                            </tr>
                        ))
                    ))}
                    {ecritures.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding:30, color:'#94a3b8'}}>Journal vide. Cliquez sur "Tout Synchroniser".</td></tr>}
                </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL SAISIE MANUELLE */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2 style={{marginTop:0}}>Saisie Manuelle (OD)</h2>
                <p style={{color:'#64748b', fontSize:'0.9rem', marginBottom:20}}>Pour Capital, TVA, Emprunts...</p>
                <form onSubmit={handleManualSave}>
                    <div className="input-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
                    <div className="input-group"><label>Libellé</label><input type="text" value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} placeholder="Ex: Capital Social" required /></div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15}}>
                        <div className="input-group"><label>Cpt Débit</label><select value={form.compteDebit} onChange={e => setForm({...form, compteDebit: e.target.value})} required><option value="">Choisir...</option>{comptes.map(c => <option key={c.id} value={c.id}>{c.code_compte} - {c.libelle}</option>)}</select></div>
                        <div className="input-group"><label>Cpt Crédit</label><select value={form.compteCredit} onChange={e => setForm({...form, compteCredit: e.target.value})} required><option value="">Choisir...</option>{comptes.map(c => <option key={c.id} value={c.id}>{c.code_compte} - {c.libelle}</option>)}</select></div>
                    </div>
                    <div className="input-group"><label>Montant</label><input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} required /></div>
                    <button type="submit" className="btn btn-blue" style={{width:'100%', justifyContent:'center', marginTop:10}}>Valider</button>
                </form>
            </div>
        </div>
      )}
    </>
  );
}
