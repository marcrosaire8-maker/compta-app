// src/pages/Rapprochement.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';

/* ICÔNES */
const IconBank = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M3 14h18M3 18h18M7 6h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg>;
const IconCheck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>;
const IconLink = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IconClose = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>;

/* STYLES PREMIUM ROUGE + RESPONSIVITÉ FORCÉE */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box}body{margin:0;font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b}
  .page{display:flex;min-height:100vh}
  .main{flex:1;margin-left:260px;padding:2rem;transition:all .4s}
  @media(max-width:1024px){.main{margin-left:0;padding:1.5rem;padding-top:90px}}
  .header h1{font-size:2.2rem;font-weight:900;background:linear-gradient(90deg,#dc2626,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 .5rem}
  .header p{color:#64748b;margin:0;font-size:1rem}
  .select-wrapper{background:#fef2f2;padding:1.5rem;border-radius:16px;margin-bottom:2rem;display:flex;flex-wrap:wrap;gap:1rem;align-items:end}
  .select-wrapper label{display:block;margin-bottom:.5rem;font-weight:600;color:#475569;font-size:.95rem}
  select{padding:.8rem 1rem;border:1px solid #fca5a5;border-radius:12px;outline:none;background:white;font-weight:600;width:100%}
  select:focus{border-color:#dc2626}
  .stats{display:flex;gap:1rem;margin-top:.5rem;flex-wrap:wrap}
  .stat{background:#fef2f2;padding:1rem 1.2rem;border-radius:12px;flex:1;min-width:120px;text-align:center}
  .stat strong{font-size:1.6rem;display:block;color:#dc2626}
  .match-btn-fixed{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:999;background:#3b82f6;color:white;padding:1rem 2rem;border-radius:50px;font-weight:800;box-shadow:0 10px 30px rgba(59,130,246,.5);display:flex;align-items:center;gap:10px;font-size:1.1rem}
  @media(max-width:640px){.match-btn-fixed{bottom:10px;padding:1rem 1.5rem;font-size:1rem}}
  .split{display:grid;grid-template-columns:1fr 1fr;gap:2rem;height:calc(100vh - 380px);min-height:500px}
  @media(max-width:1024px){.split{grid-template-columns:1fr;gap:1.5rem;height:auto}}
  .panel{overflow-y:auto;background:#fafafa;border-radius:16px;padding:1.5rem;border:2px dashed #cbd5e1}
  .panel-header{background:#dcfce7;padding:1rem 1.5rem;border-radius:12px;margin-bottom:1rem;text-align:center;font-weight:800;color:#166534;display:flex;align-items:center;justify-content:center;gap:.5rem}
  .panel-header.bank{background:#e0f2fe;color:#0369a1}
  .line{display:flex;flex-wrap:wrap;gap:.8rem;align-items:center;padding:1rem;background:white;border-radius:12px;margin-bottom:1rem;box-shadow:0 4px 12px rgba(0,0,0,.05);transition:all .3s;cursor:pointer;border-left:5px solid}
  .line:hover{transform:translateY(-4px);box-shadow:0 10px 25px rgba(0,0,0,.1)}
  .line.debit{border-left-color:#ef4444}
  .line.credit{border-left-color:#10b981}
  .line.selected{background:#fee2e2 !important;border-left-color:#dc2626 !important}
  .line-date{font-weight:800;color:#64748b;min-width:90px}
  .line-libelle{flex:1;font-weight:600;font-size:.95rem}
  .line-amount{text-align:right;font-weight:900;min-width:110px;font-size:1rem}
  .empty{text-align:center;padding:4rem;color:#94a3b8;font-size:1.1rem}
  .mobile-only{display:none}
  @media(max-width:640px){
    .mobile-only{display:block}
    .line{padding:1.2rem;font-size:1rem}
    .line-date,.line-amount{font-size:1rem}
    .line-libelle{font-size:1.05rem}
  }
`;

export default function Rapprochement() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [comptes5, setComptes5] = useState([]);
  const [selectedCompte, setSelectedCompte] = useState('');
  const [comptaLines, setComptaLines] = useState([]);
  const [bankLines, setBankLines] = useState([]);
  const [selectedCompta, setSelectedCompta] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ste = await getEntrepriseForUser(user.id, user.email);
      if (!ste) return;
      setEntreprise(ste);
      await fetchComptes5(ste.id);
      setLoading(false);
    })();
  }, []);

  async function fetchComptes5(entrepriseId) {
    const { data } = await supabase
      .from('plan_comptable')
      .select('id, code_compte, libelle')
      .eq('entreprise_id', entrepriseId)
      .ilike('code_compte', '5%')
      .order('code_compte');
    setComptes5(data || []);
    if (data?.length > 0) {
      setSelectedCompte(data[0].id);
      fetchUnreconciled(data[0].id, entrepriseId);
    }
  }

  async function fetchUnreconciled(compteId, entrepriseId) {
    const [comptaRes, bankRes] = await Promise.all([
      supabase
        .from('lignes_ecriture')
        .select('*, ecriture:ecritures_comptables(date_ecriture, libelle)')
        .eq('compte_id', compteId)
        .eq('est_rapproche', false),
      supabase
        .from('releves_bancaires')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .eq('est_pointe', false)
        .order('date_releve', { ascending: false })
    ]);

    setComptaLines(comptaRes.data || []);
    setBankLines(bankRes.data || []);
    setSelectedCompta(null);
    setSelectedBank(null);
  }

  const handleMatch = async () => {
    if (!selectedCompta || !selectedBank) {
      alert("Sélectionnez une ligne dans chaque colonne");
      return;
    }

    if (Math.abs(Math.abs(selectedCompta.debit - selectedCompta.credit) - Math.abs(selectedBank.montant)) > 1) {
      if (!confirm(`Montants différents\nCompta : ${Math.abs(selectedCompta.debit - selectedCompta.credit).toLocaleString()} F\nBanque : ${Math.abs(selectedBank.montant).toLocaleString()} F\n\nRapprocher quand même ?`)) {
        return;
      }
    }

    if (!confirm("Confirmer le rapprochement ?")) return;

    try {
      await Promise.all([
        supabase.from('lignes_ecriture').update({ est_rapproche: true }).eq('id', selectedCompta.id),
        supabase.from('releves_bancaires').update({ est_pointe: true, ecriture_liee_id: selectedCompta.id }).eq('id', selectedBank.id)
      ]);

      alert("Rapprochement effectué !");
      fetchUnreconciled(selectedCompte, entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  if (loading) return <div style={{height:'100vh',display:'grid',placeItems:'center',fontSize:'2rem'}}>Chargement…</div>;

  const canMatch = selectedCompta && selectedBank;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="page">
        <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

        <div className="main">
          <div className="header">
            <h1>Rapprochement Bancaire</h1>
            <p>Pointez vos écritures avec votre relevé bancaire</p>
          </div>

          <div className="select-wrapper">
            <div style={{flex:1}}>
              <label>Compte de trésorerie</label>
              <select value={selectedCompte} onChange={e => {setSelectedCompte(e.target.value); fetchUnreconciled(e.target.value, entreprise.id);}}>
                {comptes5.map(c => (
                  <option key={c.id} value={c.id}>{c.code_compte} - {c.libelle}</option>
                ))}
              </select>
            </div>
            <div className="stats">
              <div className="stat">
                <strong>{comptaLines.length}</strong>
                <div>Écritures</div>
              </div>
              <div className="stat">
                <strong>{bankLines.length}</strong>
                <div>Lignes banque</div>
              </div>
            </div>
          </div>

          <div className="split">
            {/* COMPTABILITÉ */}
            <div className="panel">
              <div className="panel-header">
                <IconBank /> Journal Comptable
              </div>
              {comptaLines.length === 0 ? (
                <div className="empty">Toutes les écritures sont rapprochées</div>
              ) : (
                comptaLines.map(L => {
                  const montant = L.debit > 0 ? L.debit : -L.credit;
                  return (
                    <div
                      key={L.id}
                      className={`line ${L.debit > 0 ? 'debit' : 'credit'} ${selectedCompta?.id === L.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCompta(L)}
                    >
                      <div className="line-date">{new Date(L.ecriture.date_ecriture).toLocaleDateString('fr')}</div>
                      <div className="line-libelle">{L.ecriture.libelle}</div>
                      <div className="line-amount">{montant.toLocaleString()} F</div>
                      {selectedCompta?.id === L.id && <IconCheck />}
                    </div>
                  );
                })
              )}
            </div>

            {/* BANQUE */}
            <div className="panel">
              <div className="panel-header bank">
                Relevé Bancaire
              </div>
              {bankLines.length === 0 ? (
                <div className="empty">Aucun mouvement non pointé</div>
              ) : (
                bankLines.map(B => (
                  <div
                    key={B.id}
                    className={`line ${B.montant > 0 ? 'credit' : 'debit'} ${selectedBank?.id === B.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBank(B)}
                  >
                    <div className="line-date">{new Date(B.date_releve).toLocaleDateString('fr')}</div>
                    <div className="line-libelle">{B.libelle_banque}</div>
                    <div className="line-amount">{Math.abs(B.montant).toLocaleString()} F</div>
                    {selectedBank?.id === B.id && <IconCheck />}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BOUTON FIXE SUR MOBILE */}
          {canMatch && (
            <button onClick={handleMatch} className="match-btn-fixed">
              <IconLink /> Confirmer le rapprochement
            </button>
          )}

          <div style={{marginTop:'2rem',textAlign:'center',color:'#64748b',fontSize:'0.9rem',padding:'0 1rem'}}>
            <p className="mobile-only" style={{fontWeight:600,color:'#dc2626'}}>
              Touchez une ligne dans chaque colonne puis appuyez sur le bouton bleu en bas
            </p>
            <p className="mobile-only">Astuce : vous pouvez zoomer pour plus de confort</p>
          </div>
        </div>
      </div>
    </>
  );
}
