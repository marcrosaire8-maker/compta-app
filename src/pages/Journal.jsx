import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <--- CORRECTION IMPORT
import * as XLSX from 'xlsx';

/* ICÔNES */
const IconSync = () => <span>⚡</span>;
const IconPlus = () => <span>＋</span>;
const IconDownload = () => <span>📥</span>;

/* STYLES */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
  .page { display: flex; min-height: 100vh; }
  .main { flex: 1; margin-left: 260px; padding: 2rem; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .header h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
  
  .kpi-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
  .kpi-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6; }
  .kpi-label { color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
  .kpi-value { font-size: 1.8rem; font-weight: 800; margin-top: 0.5rem; color: #1e293b; }
  .text-green { color: #166534; } .text-red { color: #991b1b; }

  .actions { display: flex; gap: 10px; }
  .btn { padding: 0.8rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; color: white; font-size: 0.9rem; }
  .btn-blue { background: #3b82f6; } .btn-green { background: #10b981; } 
  .btn-orange { background: #f97316; }

  .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 1rem; background: #f1f5f9; color: #64748b; font-size: 0.8rem; text-transform: uppercase; font-weight: 700; }
  td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #334155; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  
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
  
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    libelle: '',
    compteDebit: '',
    compteCredit: '',
    montant: ''
  });

  useEffect(() => { initData(); }, []);

  async function initData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const ste = await getEntrepriseForUser(user.id, user.email);
        if (ste) {
            setEntreprise(ste);
            const plan = await fetchComptes(ste.id);
            // On peut lancer une synchro auto ici si on veut :
            // await autoSync(ste.id, plan); 
            await fetchEcritures(ste.id);
        }
    } catch (e) {
        console.error("Erreur Init:", e);
    } finally {
        setLoading(false);
    }
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
            tD += l.debit || 0;
            tC += l.credit || 0;
        });
    });
    setTotalDebit(tD);
    setTotalCredit(tC);
  }

  const autoSync = async () => {
    setSyncing(true);
    let count = 0;
    try {
        const { data: factures } = await supabase.from('factures').select('*').eq('entreprise_id', entreprise.id).eq('est_comptabilise', false);

        if (factures && factures.length > 0) {
            for (const fac of factures) {
                const { data: ecriture } = await supabase.from('ecritures_comptables').insert([{
                    entreprise_id: entreprise.id,
                    date_ecriture: fac.date_emission,
                    libelle: `${fac.type_facture} N°${fac.numero} - ${fac.client_nom}`,
                    journal_code: fac.type_facture === 'VENTE' ? 'VT' : 'AC',
                    facture_liee_id: fac.id
                }]).select().single();

                const getCpt = (code) => {
                    const found = comptes.find(c => c.code_compte.toString().startsWith(code));
                    const fallback = comptes.find(c => c.code_compte.toString().startsWith('471'));
                    return found ? found.id : (fallback ? fallback.id : null);
                };

                const lignes = [];
                if (fac.type_facture === 'VENTE') {
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('411'), debit: fac.total_ttc, credit: 0 }); 
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('701'), debit: 0, credit: fac.total_ht });
                    if(fac.total_tva > 0) lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('443'), debit: 0, credit: fac.total_tva });
                } else {
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('601'), debit: fac.total_ht, credit: 0 }); 
                    if(fac.total_tva > 0) lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('445'), debit: fac.total_tva, credit: 0 });
                    lignes.push({ ecriture_id: ecriture.id, compte_id: getCpt('401'), debit: 0, credit: fac.total_ttc }); 
                }

                const validLignes = lignes.filter(l => l.compte_id);
                if (validLignes.length > 0) {
                    await supabase.from('lignes_ecriture').insert(validLignes);
                    await supabase.from('factures').update({ est_comptabilise: true }).eq('id', fac.id);
                    count++;
                }
            }
        }
        alert(`${count} opérations synchronisées !`);
        fetchEcritures(entreprise.id);
    } catch (error) {
        alert("Erreur : " + error.message);
    } finally {
        setSyncing(false);
    }
  };

  // --- EXPORTS CORRIGÉS ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Journal - ${entreprise?.nom}`, 14, 20);
    
    const rows = [];
    ecritures.forEach(e => {
        e.lignes_ecriture.forEach(l => {
            rows.push([
                e.date_ecriture, 
                e.journal_code, 
                e.libelle, 
                l.plan_comptable?.code_compte, 
                l.debit > 0 ? l.debit : '', 
                l.credit > 0 ? l.credit : ''
            ]);
        });
    });

    // CORRECTION ICI : autoTable(doc, ...)
    autoTable(doc, {
        startY: 30,
        head: [['Date', 'Jnl', 'Libellé', 'Cpt', 'Débit', 'Crédit']],
        body: rows,
    });
    doc.save('journal.pdf');
  };

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Chargement...</div>;

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />
        <div className="main">
          <div className="header">
            <div><h1>Journal Comptable</h1><p>Centralisation des opérations</p></div>
            <div className="actions">
                <button onClick={autoSync} disabled={syncing} className="btn btn-orange">{syncing ? "..." : <><IconSync/> Synchro</>}</button>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-blue"><IconPlus/> Saisie Manuelle</button>
                <button onClick={exportPDF} className="btn btn-green"><IconDownload/> PDF</button>
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
                    {totalDebit === totalCredit ? "ÉQUILIBRÉ" : "ERREUR"}
                </div>
            </div>
          </div>

          <div className="table-container">
            <table>
                <thead><tr><th>Date</th><th>Jnl</th><th>Libellé</th><th>Compte</th><th>Intitulé</th><th className="text-right">Débit</th><th className="text-right">Crédit</th></tr></thead>
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
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
