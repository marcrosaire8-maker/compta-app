// src/pages/Journal.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* --- ICÔNES --- */
const IconPdf = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5m-7.5 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const IconExcel = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15v4m6-6v6m6-4v4m6-6v6M3 11h18M3 6h18M3 3h18v4H3V3z" /></svg>;

/* --- STYLE IDENTIQUE À TOUT LE BACKOFFICE --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { margin:0; background:#f8fafc; }

  .page-wrapper { font-family: 'Inter', sans-serif; color:#1e293b; min-height:100vh; background:#f8fafc; display:flex; }
  .main-content { flex:1; padding:1.5rem; margin-left:260px; width:calc(100% - 260px); }
  @media (max-width:900px) {
    .main-content { margin-left:0; width:100%; padding:1rem; padding-top:80px; }
  }

  .header h1 { font-size:1.9rem; font-weight:800; color:#b91c1c; margin:0 0 .5rem 0; }
  .header p { color:#64748b; margin:0; font-size:.95rem; }

  .header-actions { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
  .export-buttons { display:flex; gap:1rem; }
  .btn-export {
    padding:.75rem 1.2rem; border:none; border-radius:8px; font-weight:700; cursor:pointer;
    display:inline-flex; align-items:center; gap:.5rem; color:white;
  }
  .btn-pdf { background:#ef4444; }
  .btn-excel { background:#10b981; }

  .card { background:white; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.05); overflow:hidden; margin-bottom:1.5rem; }
  .card-header { padding:1.25rem 1.5rem; border-bottom:1px solid #e2e8f0; background:#f8fafc; }
  .card-header h3 { margin:0; font-size:1.1rem; font-weight:700; color:#1e293b; }

  .form-grid {
    display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; align-items:end;
    padding:1.5rem;
  }
  .form-group { display:flex; flex-direction:column; }
  .form-label { margin-bottom:.5rem; font-size:.9rem; color:#475569; font-weight:600; }
  .form-input, .form-select {
    padding:.75rem; border:1px solid #cbd5e1; border-radius:8px; font-size:.95rem;
  }
  .btn-submit {
    background:#3b82f6; color:white; border:none; padding:.75rem 1.5rem; border-radius:8px;
    font-weight:700; cursor:pointer; height:48px;
  }

  .table-wrapper { width:100%; overflow-x:auto; }
  table { width:100%; border-collapse:collapse; }
  th {
    background:#f1f5f9; padding:1rem; text-align:left; font-size:.8rem; font-weight:700;
    color:#64748b; text-transform:uppercase;
  }
  td { padding:1rem; border-bottom:1px solid #f1f5f9; color:#334155; }
  .text-right { text-align:right; }
  .text-green { color:#166534; }
  .text-red { color:#991b1b; }

  @media (max-width:900px) {
    .form-grid { grid-template-columns:1fr; }
    thead { display:none; }
    tr {
      display:block; background:white; margin-bottom:1rem; border:1px solid #e2e8f0;
      border-radius:12px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,.05);
    }
    td {
      display:flex; justify-content:space-between; padding:.5rem 0; border:none;
    }
    td::before {
      content:attr(data-label); font-weight:600; color:#64748b; text-transform:uppercase; font-size:.8rem;
    }
  }
`;

export default function Journal() {
  const [loading, setLoading] = useState(true);
  const [ecritures, setEcritures] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [entreprise, setEntreprise] = useState(null);
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
    if (!user) { setLoading(false); return; }

    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchComptes(ste.id);
      fetchEcritures(ste.id);
    }
    setLoading(false);
  }

  async function fetchComptes(entrepriseId) {
    const { data } = await supabase
      .from('plan_comptable')
      .select('id, code_compte, libelle')
      .eq('entreprise_id', entrepriseId)
      .order('code_compte');
    setComptes(data || []);
  }

  async function fetchEcritures(entrepriseId) {
    const { data } = await supabase
      .from('ecritures_comptables')
      .select(`
        id, date_ecriture, libelle, journal_code,
        lignes_ecriture (
          id, debit, credit, compte_id,
          plan_comptable (code_compte, libelle)
        )
      `)
      .eq('entreprise_id', entrepriseId)
      .order('date_ecriture', { ascending: false });
    setEcritures(data || []);
  }

  const exportToExcel = () => {
    const rows = [];
    ecritures.forEach(e => {
      e.lignes_ecriture.forEach(l => {
        rows.push({
          Date: e.date_ecriture,
          Libellé: e.libelle,
          Compte: l.plan_comptable?.code_compte || '',
          Intitulé: l.plan_comptable?.libelle || '',
          Débit: l.debit > 0 ? l.debit : '',
          Crédit: l.credit > 0 ? l.credit : ''
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Journal");
    XLSX.writeFile(wb, `Journal_${entreprise?.nom || 'Compta'}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Journal des opérations - ${entreprise?.nom || ''}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);

    const rows = [];
    ecritures.forEach(e => {
      e.lignes_ecriture.forEach(l => {
        rows.push([
          e.date_ecriture,
          e.libelle,
          l.plan_comptable?.code_compte || '',
          l.plan_comptable?.libelle || '',
          l.debit > 0 ? l.debit.toLocaleString() : '',
          l.credit > 0 ? l.credit.toLocaleString() : ''
        ]);
      });
    });

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Libellé', 'Compte', 'Intitulé', 'Débit', 'Crédit']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [241, 245, 249] }
    });
    doc.save(`Journal_${entreprise?.nom || 'Compta'}.pdf`);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!entreprise) return alert("Entreprise non trouvée");

    const montant = Number(form.montant);
    if (!montant || montant <= 0) return alert("Montant invalide");

    try {
      const { data: header, error: err1 } = await supabase
        .from('ecritures_comptables')
        .insert([{
          entreprise_id: entreprise.id,
          date_ecriture: form.date,
          libelle: form.libelle,
          journal_code: 'OD'
        }])
        .select()
        .single();

      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from('lignes_ecriture')
        .insert([
          { ecriture_id: header.id, compte_id: form.compteDebit, debit: montant, credit: 0 },
          { ecriture_id: header.id, compte_id: form.compteCredit, debit: 0, credit: montant }
        ]);

      if (err2) throw err2;

      alert("Écriture enregistrée avec succès !");
      setForm({ ...form, libelle: '', montant: '', compteDebit: '', compteCredit: '' });
      fetchEcritures(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  if (loading) {
    return <div style={{height:'100vh',display:'grid',placeItems:'center',fontSize:'1.2rem'}}>Chargement du journal...</div>;
  }

  return (
    <div className="page-wrapper">
      <style>{styles}</style>
      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <div className="main-content">
        <div className="header-actions">
          <div className="header">
            <h1>Journal de Saisie</h1>
            <p>Enregistrement des opérations comptables</p>
          </div>
          <div className="export-buttons">
            <button onClick={exportToPDF} className="btn-export btn-pdf">
              <div style={{width:20,height:20}}><IconPdf /></div>
              PDF
            </button>
            <button onClick={exportToExcel} className="btn-export btn-excel">
              <div style={{width:20,height:20}}><IconExcel /></div>
              Excel
            </button>
          </div>
        </div>

        {/* Formulaire de saisie */}
        <div className="card">
          <div className="card-header">
            <h3>Nouvelle écriture</h3>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="form-group" style={{gridColumn: 'span 2'}}>
              <label className="form-label">Libellé</label>
              <input type="text" className="form-input" required placeholder="Ex: Achat de matériel informatique" value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Compte Débit</label>
              <select className="form-select" required value={form.compteDebit} onChange={e => setForm({...form, compteDebit: e.target.value})}>
                <option value="">Choisir...</option>
                {comptes.map(c => <option key={c.id} value={c.id}>{c.code_compte} - {c.libelle}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Compte Crédit</label>
              <select className="form-select" required value={form.compteCredit} onChange={e => setForm({...form, compteCredit: e.target.value})}>
                <option value="">Choisir...</option>
                {comptes.map(c => <option key={c.id} value={c.id}>{c.code_compte} - {c.libelle}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Montant (F CFA)</label>
              <input type="number" className="form-input" required min="1" placeholder="500000" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} />
            </div>
            <button type="submit" className="btn-submit">Enregistrer</button>
          </form>
        </div>

        {/* Tableau du journal */}
        <div className="card">
          <div className="card-header">
            <h3>Journal des opérations ({ecritures.flatMap(e => e.lignes_ecriture).length} lignes)</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Libellé</th>
                  <th>Compte</th>
                  <th>Intitulé</th>
                  <th className="text-right">Débit</th>
                  <th className="text-right">Crédit</th>
                </tr>
              </thead>
              <tbody>
                {ecritures.map(ecriture => (
                  ecriture.lignes_ecriture.map((ligne, idx) => (
                    <tr key={ligne.id}>
                      <td data-label="Date">{idx === 0 ? new Date(ecriture.date_ecriture).toLocaleDateString('fr-FR') : ''}</td>
                      <td data-label="Libellé">{idx === 0 ? ecriture.libelle : ''}</td>
                      <td data-label="Compte" className="font-bold">{ligne.plan_comptable?.code_compte}</td>
                      <td data-label="Intitulé">{ligne.plan_comptable?.libelle}</td>
                      <td data-label="Débit" className="text-right text-green">
                        {ligne.debit > 0 ? Number(ligne.debit).toLocaleString() : ''}
                      </td>
                      <td data-label="Crédit" className="text-right text-red">
                        {ligne.credit > 0 ? Number(ligne.credit).toLocaleString() : ''}
                      </td>
                    </tr>
                  ))
                ))}
                {ecritures.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{textAlign:'center', padding:'3rem', color:'#94a3b8'}}>
                      Aucune écriture enregistrée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
