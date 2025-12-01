import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';

/* --- ICONS --- */
const IconBank = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"/></svg>;
const IconFile = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>;
const IconLink = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>;
const IconPlus = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>;

export default function RapprochementUltimate() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [comptes5, setComptes5] = useState([]); // Comptes de trésorerie (Classe 5)
  
  // Selection
  const [selectedCompte, setSelectedCompte] = useState('');
  const [comptaLines, setComptaLines] = useState([]);
  const [bankLines, setBankLines] = useState([]);
  
  const [selectedCompta, setSelectedCompta] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

  // Modal Ajout Relevé
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [newBankLine, setNewBankLine] = useState({ date: new Date().toISOString().split('T')[0], libelle: '', montant: '' });

  // UI
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => { initData(); }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({ x: (clientX / innerWidth) * 2 - 1, y: (clientY / innerHeight) * 2 - 1 });
  };

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      await fetchComptes5(ste.id);
    }
    setLoading(false);
  }

  // Récupérer uniquement les comptes de Banque/Caisse (Classe 5)
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
    // 1. Écritures Comptables NON Rapprochées pour ce compte
    const { data: cData } = await supabase
        .from('lignes_ecriture')
        .select('*, ecriture:ecritures_comptables(date_ecriture, libelle)')
        .eq('compte_id', compteId)
        .eq('est_rapproche', false) // Seulement ce qui n'est pas pointé
        .order('id', { ascending: false });

    // 2. Lignes Bancaires NON Pointées
    const { data: bData } = await supabase
        .from('releves_bancaires')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .eq('est_pointe', false)
        .order('date_releve', { ascending: false });

    setComptaLines(cData || []);
    setBankLines(bData || []);
    setSelectedCompta(null);
    setSelectedBank(null);
  }

  // --- ACTION : RAPPROCHER ---
  const handleMatch = async () => {
    if (!selectedCompta || !selectedBank) return;

    const montantCompta = selectedCompta.debit > 0 ? selectedCompta.debit : -selectedCompta.credit;
    const montantBanque = Number(selectedBank.montant);

    // Vérification du montant (avec petite tolérance)
    if (Math.abs(montantCompta - montantBanque) > 5) {
      if (!confirm(`Écart de montant détecté !\nCompta : ${montantCompta}\nBanque : ${montantBanque}\nRapprocher quand même ?`)) return;
    }

    try {
      // 1. Marquer l'écriture comptable comme rapprochée
      await supabase.from('lignes_ecriture').update({ est_rapproche: true }).eq('id', selectedCompta.id);
      
      // 2. Marquer la ligne bancaire comme pointée et liée
      await supabase.from('releves_bancaires').update({ est_pointe: true, ecriture_liee_id: selectedCompta.id }).eq('id', selectedBank.id);

      fetchUnreconciled(selectedCompte, entreprise.id);
      alert("Rapprochement effectué ! ✅");
    } catch (err) { alert(err.message); }
  };

  // --- ACTION : AJOUTER LIGNE BANCAIRE ---
  const handleAddBankLine = async (e) => {
      e.preventDefault();
      try {
          await supabase.from('releves_bancaires').insert([{
              entreprise_id: entreprise.id,
              date_releve: newBankLine.date,
              libelle_banque: newBankLine.libelle,
              montant: Number(newBankLine.montant),
              est_pointe: false
          }]);
          setIsBankModalOpen(false);
          setNewBankLine({ date: new Date().toISOString().split('T')[0], libelle: '', montant: '' });
          fetchUnreconciled(selectedCompte, entreprise.id);
      } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{height:'100vh', background:'#000', color:'white', display:'grid', placeItems:'center'}}>Chargement...</div>;

  return (
    <div className="app-wrapper" onMouseMove={handleMouseMove}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
        
        .app-wrapper { min-height: 100vh; position: relative; overflow-x: hidden; }
        
        /* SIDEBAR & LAYOUT */
        .sidebar-wrapper { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 50; }
        main { min-height: 100vh; padding: 40px; margin-left: 260px; position: relative; z-index: 1; }
        
        @media (max-width: 1024px) { 
            .sidebar-wrapper { display: none; } /* Simplifié pour l'exemple */
            main { margin-left: 0; }
        }

        /* HEADER */
        .header-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
        .header-content h1 { font-size: 2rem; font-weight: 800; margin: 0; color: #1e293b; }
        
        /* SELECTEUR DE COMPTE (STYLE CARTE) */
        .account-card {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: white; border-radius: 20px; padding: 20px; margin-bottom: 30px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); display: flex; justify-content: space-between; align-items: center;
        }
        .card-select { background: transparent; border: none; color: white; font-size: 1.2rem; font-weight: 700; width: 100%; outline: none; cursor: pointer; }
        .card-select option { color: #1e293b; }

        /* SPLIT VIEW */
        .split-view { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: calc(100vh - 250px); }
        .panel { background: white; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .panel-header { padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: #475569; }
        .list-content { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; }

        /* CARTES DE TRANSACTION */
        .trans-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; cursor: pointer; transition: all 0.2s;
        }
        .trans-card:hover { transform: translateY(-2px); border-color: #3b82f6; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1); }
        .trans-card.selected { border-color: #3b82f6; background: #eff6ff; box-shadow: 0 0 0 2px #3b82f6; }
        
        .trans-top { display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; margin-bottom: 5px; }
        .trans-main { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 0.9rem; }
        .amount-pos { color: #166534; } .amount-neg { color: #1e293b; }

        /* BOUTON FLOTTANT */
        .fab-container { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 100; }
        .btn-match {
          background: #3b82f6; color: white; border: none; padding: 12px 30px; border-radius: 50px;
          font-weight: 700; font-size: 1rem; cursor: pointer; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.4);
          display: flex; align-items: center; gap: 10px; transition: transform 0.2s;
        }
        .btn-match:hover { transform: scale(1.05); }

        /* MODAL */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 200; }
        .modal { background: white; padding: 30px; border-radius: 16px; width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; }
        .input-field { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
        .btn-save { width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 10px; }
      `}</style>

      <div className="sidebar-wrapper"><Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} /></div>

      <main>
        <div className="header-bar">
          <div className="header-content">
            <h1>Rapprochement Bancaire</h1>
            <div style={{color:'#64748b'}}>Pointez vos écritures avec votre relevé réel</div>
          </div>
        </div>

        {/* SELECTEUR DE COMPTE */}
        <div className="account-card">
          <div style={{flex:1}}>
            <label style={{fontSize:'0.75rem', textTransform:'uppercase', opacity:0.7}}>Compte à rapprocher</label>
            <select className="card-select" value={selectedCompte} onChange={e => {setSelectedCompte(e.target.value); fetchUnreconciled(e.target.value, entreprise.id);}}>
              {comptes5.map(c => <option key={c.id} value={c.id}>{c.code_compte} - {c.libelle}</option>)}
            </select>
          </div>
        </div>

        {/* SPLIT VIEW */}
        <div className="split-view">
          
          {/* GAUCHE : COMPTABILITÉ (Ce que le logiciel a généré) */}
          <div className="panel">
            <div className="panel-header">
              <span><IconFile/> Écritures (Logiciel)</span>
              <span style={{background:'#e2e8f0', padding:'2px 8px', borderRadius:'10px', fontSize:'0.8rem'}}>{comptaLines.length}</span>
            </div>
            <div className="list-content">
              {comptaLines.map(L => {
                const montant = L.debit > 0 ? L.debit : -L.credit;
                return (
                  <div key={L.id} className={`trans-card ${selectedCompta?.id === L.id ? 'selected' : ''}`} onClick={() => setSelectedCompta(L)}>
                    <div className="trans-top">
                      <span>{new Date(L.ecriture.date_ecriture).toLocaleDateString()}</span>
                      <span>REF: {L.ecriture.libelle.substring(0, 20)}...</span>
                    </div>
                    <div className="trans-main">
                      <span>{L.ecriture.libelle}</span>
                      <span className={montant > 0 ? 'amount-pos' : 'amount-neg'}>{montant.toLocaleString()} F</span>
                    </div>
                  </div>
                );
              })}
              {comptaLines.length === 0 && <div style={{textAlign:'center', color:'#94a3b8', marginTop:20}}>Tout est pointé !</div>}
            </div>
          </div>

          {/* DROITE : BANQUE (Ce que tu importes ou saisis) */}
          <div className="panel">
            <div className="panel-header">
              <span><IconBank/> Relevé (Banque)</span>
              <button onClick={() => setIsBankModalOpen(true)} style={{border:'none', background:'none', cursor:'pointer', color:'#3b82f6'}} title="Ajouter ligne relevé"><IconPlus/></button>
            </div>
            <div className="list-content">
              {bankLines.map(B => (
                <div key={B.id} className={`trans-card ${selectedBank?.id === B.id ? 'selected' : ''}`} onClick={() => setSelectedBank(B)}>
                  <div className="trans-top">
                    <span>{new Date(B.date_releve).toLocaleDateString()}</span>
                  </div>
                  <div className="trans-main">
                    <span>{B.libelle_banque}</span>
                    <span className={B.montant > 0 ? 'amount-pos' : 'amount-neg'}>{Number(B.montant).toLocaleString()} F</span>
                  </div>
                </div>
              ))}
              {bankLines.length === 0 && (
                  <div style={{textAlign:'center', color:'#94a3b8', marginTop:20}}>
                      <p>Aucune ligne.</p>
                      <button onClick={() => setIsBankModalOpen(true)} style={{color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>+ Saisir une ligne du relevé</button>
                  </div>
              )}
            </div>
          </div>

        </div>

        {/* BOUTON ACTION RAPPROCHER */}
        {selectedCompta && selectedBank && (
          <div className="fab-container">
            <button className="btn-match" onClick={handleMatch}>
              <IconLink /> Valider le rapprochement
            </button>
          </div>
        )}

      </main>

      {/* MODAL AJOUT LIGNE BANCAIRE */}
      {isBankModalOpen && (
          <div className="modal-overlay" onClick={() => setIsBankModalOpen(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                  <h2 style={{marginTop:0, color:'#1e293b'}}>Saisie Relevé Bancaire</h2>
                  <p style={{fontSize:'0.9rem', color:'#64748b', marginBottom:'20px'}}>Copiez ici une ligne de votre relevé papier/appli.</p>
                  <form onSubmit={handleAddBankLine}>
                      <div className="input-group">
                          <label>Date</label>
                          <input type="date" className="input-field" value={newBankLine.date} onChange={e => setNewBankLine({...newBankLine, date: e.target.value})} required />
                      </div>
                      <div className="input-group">
                          <label>Libellé (Ex: Virement Client X)</label>
                          <input type="text" className="input-field" value={newBankLine.libelle} onChange={e => setNewBankLine({...newBankLine, libelle: e.target.value})} required />
                      </div>
                      <div className="input-group">
                          <label>Montant (Positif=Entrée, Négatif=Sortie)</label>
                          <input type="number" className="input-field" value={newBankLine.montant} onChange={e => setNewBankLine({...newBankLine, montant: e.target.value})} placeholder="-5000 ou 10000" required />
                      </div>
                      <button type="submit" className="btn-save">Ajouter</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
