// src/pages/Reporting.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ICÔNES */
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>;
const IconDownload = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7l-5 5-5-5m5-7v12"/></svg>;

/* STYLES PREMIUM ROUGE + RESPONSIVE 100% */
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
  .btn-blue{background:#3b82f6}
  .btn-gray{background:#64748b}
  .card{background:white;border-radius:18px;padding:2rem;border:1px solid #e2e8f0;box-shadow:0 10px 30px -8px rgba(0,0,0,.08);overflow:hidden}
  .filter-bar{background:#fef2f2;padding:1.5rem;border-radius:16px;margin-bottom:2rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
  .filter-bar label{font-weight:600;color:#475569;margin-right:.5rem}
  select{padding:.9rem 1.2rem;border:1px solid #fca5a5;border-radius:12px;outline:none;background:white;font-weight:600}
  select:focus{border-color:#dc2626}
  table{width:100%;border-collapse:separate;border-spacing:0}
  th{background:#fef2f2;padding:1.2rem 1rem;text-align:left;font-size:.85rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px}
  td{padding:1rem;border-bottom:1px solid #fee2e2;color:#334155}
  .text-right{text-align:right}
  .solde-pos{color:#166534 !important;font-weight:800}
  .solde-neg{color:#dc2626 !important;font-weight:800}
  .action-btn{background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:6px;font-size:.85rem}
  .action-btn:hover{background:#1d4ed8}
  .total-row{background:#f8fafc !important;font-weight:900}
  .total-row td{color:#1e293b !important}
  @media(max-width:768px){
    th,td{padding:.8rem .6rem;font-size:.9rem}
    .filter-bar{flex-direction:column;align-items:stretch}
    .actions{flex-direction:column;align-items:stretch}
    .btn{width:100%;justify-content:center}
  }
`;

export default function Reporting() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [balance, setBalance] = useState([]);
  const [grandLivre, setGrandLivre] = useState(null);
  const [filterClasse, setFilterClasse] = useState('all');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ste = await getEntrepriseForUser(user.id, user.email);
      if (!ste) return;
      setEntreprise(ste);
      await calculerBalance(ste.id);
      setLoading(false);
    })();
  }, []);

  async function calculerBalance(entrepriseId) {
    const { data: lignes } = await supabase
      .from('lignes_ecriture')
      .select(`
        id, debit, credit,
        ecriture:ecritures_comptables (date_ecriture, libelle, journal_code),
        compte:plan_comptable!inner (id, code_compte, libelle)
      `)
      .eq('plan_comptable.entreprise_id', entrepriseId);

    if (!lignes) return;

    const map = {};
    lignes.forEach(L => {
      const c = L.compte;
      if (!map[c.id]) {
        map[c.id] = {
          id: c.id,
          code: c.code_compte,
          libelle: c.libelle,
          cumulDebit: 0,
          cumulCredit: 0,
          mouvements: []
        };
      }
      map[c.id].cumulDebit += L.debit;
      map[c.id].cumulCredit += L.credit;
      map[c.id].mouvements.push({
        date: L.ecriture.date_ecriture,
        journal: L.ecriture.journal_code,
        libelle: L.ecriture.libelle,
        debit: L.debit,
        credit: L.credit
      });
    });

    const result = Object.values(map)
      .sort((a, b) => a.code.localeCompare(b.code));

    setBalance(result);
  }

  const voirGrandLivre = (compte) => {
    const copie = { ...compte };
    copie.mouvements.sort((a, b) => new Date(b.date) - new Date(a.date));
    setGrandLivre(copie);
  };

  const exportBalancePDF = () => {
    const doc = new jsPDF('l');
    doc.setFontSize(20);
    doc.text(`Balance Générale - ${entreprise.nom}`, 14, 20);

    const rows = balance
      .filter(c => filterClasse === 'all' || c.code.startsWith(filterClasse))
      .map(c => [
        c.code,
        c.libelle,
        c.cumulDebit.toLocaleString(),
        c.cumulCredit.toLocaleString(),
        (c.cumulDebit - c.cumulCredit).toLocaleString()
      ]);

    autoTable(doc, {
      startY: 35,
      head: [['Compte', 'Intitulé', 'Débit', 'Crédit', 'Solde']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 38, 38] }
    });

    doc.save(`Balance_${entreprise.nom}.pdf`);
  };

  if (loading) return <div style={{height:'100vh',display:'grid',placeItems:'center',fontSize:'2rem'}}>Chargement…</div>;

  const filteredBalance = balance.filter(c =>
    filterClasse === 'all' || c.code.startsWith(filterClasse)
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="page">
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

        <div className="main">
          <div className="actions">
            <div className="header">
              <h1>{grandLivre ? `Grand Livre : ${grandLivre.code} - ${grandLivre.libelle}` : 'Balance Générale'}</h1>
              <p>{grandLivre ? 'Détail complet des mouvements du compte' : 'Vue d’ensemble de tous les comptes'}</p>
            </div>

            <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
              {grandLivre ? (
                <button onClick={() => setGrandLivre(null)} className="btn btn-gray">
                  <IconArrowLeft /> Retour à la Balance
                </button>
              ) : (
                <button onClick={exportBalancePDF} className="btn" style={{background:'#ef4444'}}>
                  <IconDownload /> PDF Balance
                </button>
              )}
            </div>
          </div>

          {!grandLivre && (
            <div className="filter-bar">
              <div>
                <label>Afficher :</label>
                <select value={filterClasse} onChange={e => setFilterClasse(e.target.value)}>
                  <option value="all">Toutes les classes</option>
                  <option value="1">Classe 1 - Capitaux propres</option>
                  <option value="2">Classe 2 - Immobilisations</option>
                  <option value="3">Classe 3 - Stocks</option>
                  <option value="4">Classe 4 - Tiers</option>
                  <option value="5">Classe 5 - Trésorerie</option>
                  <option value="6">Classe 6 - Charges</option>
                  <option value="7">Classe 7 - Produits</option>
                </select>
              </div>
              <div style={{color:'#dc2626',fontWeight:700}}>
                {filteredBalance.length} compte(s) affiché(s)
              </div>
            </div>
          )}

          <div className="card">
            <table>
              <thead>
                <tr>
                  {!grandLivre && (
                    <>
                      <th>Compte</th>
                      <th>Intitulé</th>
                      <th className="text-right">Débit</th>
                      <th className="text-right">Crédit</th>
                      <th className="text-right">Solde</th>
                      <th className="text-right">Action</th>
                    </>
                  )}
                  {grandLivre && (
                    <>
                      <th>Date</th>
                      <th>Jnl</th>
                      <th>Libellé écriture</th>
                      <th className="text-right">Débit</th>
                      <th className="text-right">Crédit</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {!grandLivre && filteredBalance.map(c => {
                  const solde = c.cumulDebit - c.cumulCredit;
                  return (
                    <tr key={c.id}>
                      <td style={{fontWeight:700}}>{c.code}</td>
                      <td>{c.libelle}</td>
                      <td className="text-right" style={{color:'#94a3b8'}}>{c.cumulDebit.toLocaleString()}</td>
                      <td className="text-right" style={{color:'#94a3b8'}}>{c.cumulCredit.toLocaleString()}</td>
                      <td className={`text-right ${solde >= 0 ? 'solde-pos' : 'solde-neg'}`}>
                        {Math.abs(solde).toLocaleString()} F {solde >= 0 ? 'D' : 'C'}
                      </td>
                      <td className="text-right">
                        <button onClick={() => voirGrandLivre(c)} className="action-btn">
                          <IconEye /> Détail
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {grandLivre && grandLivre.mouvements.map((m, i) => (
                  <tr key={i}>
                    <td>{new Date(m.date).toLocaleDateString('fr')}</td>
                    <td style={{fontWeight:700,color:'#dc2626'}}>{m.journal}</td>
                    <td>{m.libelle}</td>
                    <td className="text-right">{m.debit > 0 ? m.debit.toLocaleString() : '-'}</td>
                    <td className="text-right">{m.credit > 0 ? m.credit.toLocaleString() : '-'}</td>
                  </tr>
                ))}

                {grandLivre && (
                  <tr className="total-row">
                    <td colSpan="3" className="text-right">TOTAL {grandLivre.code}</td>
                    <td className="text-right solde-pos">{grandLivre.cumulDebit.toLocaleString()}</td>
                    <td className="text-right solde-neg">{grandLivre.cumulCredit.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
