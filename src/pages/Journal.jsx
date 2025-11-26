import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ICÔNES */
const IconPlus = () => <span>＋</span>;
const IconDownload = () => <span>📥</span>;

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

  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      // 1. On charge les comptes
      const plan = await fetchComptes(ste.id);
      
      // 2. ON LANCE LA SYNCHRO AUTOMATIQUE ICI
      await autoSync(ste.id, plan);
      
      // 3. On charge les écritures (qui incluront les nouvelles)
      fetchEcritures(ste.id);
    }
    setLoading(false);
  }

  async function fetchComptes(id) {
    const { data } = await supabase.from('plan_comptable').select('id, code_compte, libelle').eq('entreprise_id', id).order('code_compte');
    setComptes(data || []);
    return data || [];
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

  // --- MOTEUR D'IMPORTATION AUTOMATIQUE ---
  const autoSync = async (entId, currentComptes) => {
    try {
        // A. FACTURES & DÉPENSES
        const { data: factures } = await supabase
            .from('factures')
            .select('*')
            .eq('entreprise_id', entId)
            .eq('est_comptabilise', false);

        if (factures && factures.length > 0) {
            console.log("Synchro : ", factures.length, " factures trouvées.");
            
            for (const fac of factures) {
                const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
                    entreprise_id: entId,
                    date_ecriture: fac.date_emission,
                    libelle: `${fac.type_facture} N°${fac.numero} - ${fac.client_nom}`,
                    journal_code: fac.type_facture === 'VENTE' ? 'VT' : 'AC',
                    facture_liee_id: fac.id
                }]).select().single();

                // Fonction de recherche de compte INTELLIGENTE
                // Si on ne trouve pas le compte exact, on prend le compte d'attente (471)
                const getCpt = (code) => {
                    const found = currentComptes.find(c => c.code_compte.toString().startsWith(code));
                    const fallback = currentComptes.find(c => c.code_compte.toString().startsWith('471'));
                    return found ? found.id : (fallback ? fallback.id : null);
                };

                const lignes = [];
                if (fac.type_facture === 'VENTE') {
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('411'), debit: fac.total_ttc, credit: 0 }); // Client
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('701'), debit: 0, credit: fac.total_ht }); // Vente
                    if(fac.total_tva > 0) lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('443'), debit: 0, credit: fac.total_tva });
                } else {
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('601'), debit: fac.total_ht, credit: 0 }); // Achat
                    if(fac.total_tva > 0) lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('445'), debit: fac.total_tva, credit: 0 });
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('401'), debit: 0, credit: fac.total_ttc }); // Fournisseur
                }

                // Insertion si comptes trouvés
                const validLignes = lignes.filter(l => l.compte_id);
                if (validLignes.length > 0) {
                    await supabase.from('lignes_ecriture').insert(validLignes);
                    await supabase.from('factures').update({ est_comptabilise: true }).eq('id', fac.id);
                }
            }
        }

        // B. PAIES
        const { data: paies } = await supabase.from('fiches_paie').select('*').eq('entreprise_id', entId).eq('est_comptabilise', false);
        if (paies && paies.length > 0) {
             for (const p of paies) {
                const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
                    entreprise_id: entId, date_ecriture: p.date_paie, libelle: `Paie ${p.mois} - ${p.employe_nom}`, journal_code: 'OD'
                }]).select().single();

                const getCpt = (code) => {
                    const found = currentComptes.find(c => c.code_compte.toString().startsWith(code));
                    const fallback = currentComptes.find(c => c.code_compte.toString().startsWith('471'));
                    return found ? found.id : (fallback ? fallback.id : null);
                };

                const lignesPaie = [
                    { ecriture_id: ecriture.id, compte_id: getCpt('661'), debit: p.salaire_brut, credit: 0 },
                    { ecriture_id: ecriture.id, compte_id: getCpt('422'), debit: 0, credit: p.salaire_net }
                ];
                if (p.salaire_brut - p.salaire_net > 0) {
                     lignesPaie.push({ ecriture_id: ecriture.id, compte_id: getCpt('431'), debit: 0, credit: p.salaire_brut - p.salaire_net });
                }
                const validLignes = lignesPaie.filter(l => l.compte_id);
                if (validLignes.length > 0) {
                    await supabase.from('lignes_ecriture').insert(validLignes);
                    await supabase.from('fiches_paie').update({ est_comptabilise: true }).eq('id', p.id);
                }
            }
        }

    } catch (error) {
        console.error("Auto-sync error:", error);
    }
  };

  // --- SAISIE MANUELLE (OD) ---
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
        setForm({ ...form, libelle: '', montant: '' });
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
                    {totalDebit === totalCredit ? "ÉQUILIBRÉ ✅" : "DÉSÉQUILIBRÉ ⚠️"}
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
                    {ecritures.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding:30, color:'#94a3b8'}}>Aucune écriture validée. Créez une facture ou une dépense pour tester.</td></tr>}
                </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2 style={{marginTop:0}}>Saisie Manuelle (OD)</h2>
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
