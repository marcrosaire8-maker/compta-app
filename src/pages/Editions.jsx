// src/pages/Editions.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* --- ICÔNES SVG --- */
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconBox = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconPDF = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const IconRefresh = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;

/* --- STYLES CSS IN-JS --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  /* CORRECTIF CRITIQUE MOBILE */
  @media (max-width: 900px) {
    main {
      margin-left: 0 !important;
      padding: 1rem !important;
      width: 100% !important;
    }
  }

  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }

  /* LAYOUT */
  .layout { display: flex; min-height: 100vh; width: 100%; }
  
  .main-area {
    margin-left: 260px;
    padding: 2rem;
    width: 100%;
    transition: all 0.3s ease;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dashboard-container {
    width: 100%;
    max-width: 1000px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* HEADER */
  .header-content { text-align: center; margin-bottom: 1rem; }
  .header-content h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    color: #0f172a;
    line-height: 1.2;
  }
  .header-content p { color: #64748b; font-size: 0.9rem; margin: 0; }

  /* ONGLETS (Segmented Control) */
  .tabs-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 0.5rem;
  }
  .tabs-container {
    background: #e2e8f0;
    padding: 4px;
    border-radius: 12px;
    display: flex;
    gap: 4px;
    width: 100%;
    max-width: 500px;
  }
  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    color: #64748b;
    background: transparent;
    transition: all 0.2s;
  }
  .tab-btn.active {
    background: white;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  /* CONTROLS CARD */
  .controls-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .controls-header {
    margin-bottom: 1.5rem;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 1rem;
  }
  .controls-header h3 { margin: 0 0 0.25rem 0; font-size: 1.1rem; }
  .controls-header p { margin: 0; color: #64748b; font-size: 0.9rem; }

  .controls-flex {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 150px;
  }
  .label { font-size: 0.85rem; font-weight: 600; color: #64748b; }
  .input {
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.95rem;
    background: #f8fafc;
    width: 100%;
  }
  .input:focus { border-color: #4f46e5; background: white; outline: none; }

  .btn {
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.1s;
  }
  .btn:active { transform: translateY(1px); }
  
  .btn-primary { background: #4f46e5; color: white; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-ghost { background: white; border: 1px solid #cbd5e1; color: #475569; }

  /* TABLE CARD WRAPPER */
  .table-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    overflow: hidden;
  }

  table { width: 100%; border-collapse: collapse; }
  th { background: #f8fafc; padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
  td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #0f172a; }

  /* MOBILE TABLE TRANSFORMATION */
  @media (max-width: 900px) {
    .header-content { text-align: left; }
    .controls-flex { flex-direction: column; align-items: stretch; }
    .input-group { width: 100%; }
    
    thead { display: none; }
    tr { display: block; border-bottom: 1px solid #e2e8f0; padding: 1rem; }
    tr:last-child { border-bottom: none; }
    
    td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border: none;
      text-align: right;
    }
    
    td::before {
      content: attr(data-label);
      font-weight: 600;
      color: #64748b;
      font-size: 0.85rem;
      text-transform: uppercase;
      margin-right: 1rem;
    }

    /* Style spécifique pour journal sur mobile pour éviter l'encombrement */
    .journal-row {
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem;
    }
    .journal-row td { width: 100%; }
  }

  @media (min-width: 900px) {
    .header-content { text-align: left; display: flex; justify-content: space-between; align-items: center; }
  }
`;

export default function Editions() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [activeTab, setActiveTab] = useState('journal');
  
  // Filtres
  const [dateDebut, setDateDebut] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateFin, setDateFin] = useState(`${new Date().getFullYear()}-12-31`);

  // Données
  const [journalData, setJournalData] = useState([]);
  const [inventaireData, setInventaireData] = useState([]);

  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) setEntreprise(ste);
    setLoading(false);
  }

  async function fetchJournal() {
    setLoading(true);
    const { data, error } = await supabase
      .from('lignes_ecriture')
      .select(`debit, credit, ecriture:ecritures_comptables!inner (date_ecriture, libelle, numero_piece:id), compte:plan_comptable!inner (code_compte, libelle)`)
      .eq('plan_comptable.entreprise_id', entreprise.id)
      .gte('ecriture.date_ecriture', dateDebut)
      .lte('ecriture.date_ecriture', dateFin)
      .order('ecriture(date_ecriture)', { ascending: true });

    if (error) console.error(error);
    else setJournalData(data || []);
    setLoading(false);
  }

  async function fetchInventaire() {
    setLoading(true);
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('entreprise_id', entreprise.id)
      .eq('type_produit', 'BIEN')
      .gt('stock_actuel', 0);

    if (error) console.error(error);
    else setInventaireData(data || []);
    setLoading(false);
  }

  const printLivreJournal = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(`LIVRE-JOURNAL`, 14, 20);
    doc.setFontSize(10); doc.text(`Période : ${dateDebut} au ${dateFin}`, 14, 28);

    const rows = journalData.map(L => [
      L.ecriture.date_ecriture,
      L.ecriture.numero_piece?.toString().substring(0, 8),
      L.compte.code_compte,
      L.compte.libelle,
      L.ecriture.libelle,
      L.debit > 0 ? L.debit.toLocaleString() : '',
      L.credit > 0 ? L.credit.toLocaleString() : ''
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Ref', 'Cpt', 'Compte', 'Libellé', 'Débit', 'Crédit']],
      body: rows,
      styles: { fontSize: 8 },
    });
    doc.save('livre_journal.pdf');
  };

  const printInventaire = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(`LIVRE D'INVENTAIRE`, 14, 20);
    doc.setFontSize(10); doc.text(`Arrêté au : ${new Date().toLocaleDateString()}`, 14, 28);

    let totalValeur = 0;
    const rows = inventaireData.map(p => {
      const valeur = p.stock_actuel * p.prix_vente;
      totalValeur += valeur;
      return [p.nom, `${p.stock_actuel} ${p.unite}`, p.prix_vente.toLocaleString(), valeur.toLocaleString()];
    });
    rows.push(['TOTAL', '', '', totalValeur.toLocaleString()]);

    autoTable(doc, { startY: 35, head: [['Désignation', 'Qté', 'PU (Est.)', 'Valeur']], body: rows });
    doc.save('livre_inventaire.pdf');
  };

  if (loading) return <div style={{height:'100vh', display:'grid', placeItems:'center'}}>Chargement...</div>;

  return (
    <div className="layout">
      <style>{styles}</style>
      
      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <main className="main-area">
        <div className="dashboard-container">
          
          <div className="header-content">
            <div>
              <h1>Éditions Légales</h1>
              <p>Générez vos livres comptables obligatoires (PDF).</p>
            </div>
          </div>

          {/* ONGLETS */}
          <div className="tabs-wrapper">
            <div className="tabs-container">
              <button onClick={() => setActiveTab('journal')} className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}>
                <div style={{width:18, height:18}}><IconBook /></div> Livre-Journal
              </button>
              <button onClick={() => setActiveTab('inventaire')} className={`tab-btn ${activeTab === 'inventaire' ? 'active' : ''}`}>
                <div style={{width:18, height:18}}><IconBox /></div> Inventaire
              </button>
            </div>
          </div>

          {/* --- SECTION JOURNAL --- */}
          {activeTab === 'journal' && (
            <div className="dashboard-container">
              
              <div className="controls-card">
                <div className="controls-header">
                  <h3>Paramètres du Journal</h3>
                  <p>Sélectionnez la période à exporter.</p>
                </div>
                <div className="controls-flex">
                  <div className="input-group">
                    <label className="label">Du</label>
                    <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="input" />
                  </div>
                  <div className="input-group">
                    <label className="label">Au</label>
                    <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="input" />
                  </div>
                  <button onClick={fetchJournal} className="btn btn-primary" style={{flex:1}}>
                    <div style={{width:18, height:18}}><IconSearch /></div> Rechercher
                  </button>
                  {journalData.length > 0 && (
                    <button onClick={printLivreJournal} className="btn btn-danger" style={{flex:1}}>
                      <div style={{width:18, height:18}}><IconPDF /></div> Télécharger
                    </button>
                  )}
                </div>
              </div>

              {journalData.length > 0 ? (
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Compte</th>
                        <th>Libellé</th>
                        <th style={{textAlign:'right'}}>Débit</th>
                        <th style={{textAlign:'right'}}>Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journalData.slice(0, 100).map((L, i) => (
                        <tr key={i}>
                          <td data-label="Date">{new Date(L.ecriture.date_ecriture).toLocaleDateString()}</td>
                          <td data-label="Compte">
                            <span style={{fontWeight:'700', color:'#4f46e5'}}>{L.compte.code_compte}</span>
                            <br/><span style={{fontSize:'0.8rem', color:'#64748b'}}>{L.compte.libelle}</span>
                          </td>
                          <td data-label="Libellé">{L.ecriture.libelle}</td>
                          <td data-label="Débit" style={{textAlign:'right', fontFamily:'monospace', fontWeight:'600'}}>
                            {L.debit > 0 ? L.debit.toLocaleString() : '-'}
                          </td>
                          <td data-label="Crédit" style={{textAlign:'right', fontFamily:'monospace', fontWeight:'600'}}>
                            {L.credit > 0 ? L.credit.toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{padding:'1rem', textAlign:'center', color:'#64748b', fontSize:'0.85rem', borderTop:'1px solid #e2e8f0'}}>
                    Affichage des 100 premières lignes. Téléchargez le PDF pour le document complet.
                  </div>
                </div>
              ) : (
                <div style={{textAlign:'center', padding:'3rem', color:'#94a3b8', background:'white', borderRadius:12, border:'1px solid #e2e8f0'}}>
                  Aucune écriture trouvée sur cette période.
                </div>
              )}
            </div>
          )}

          {/* --- SECTION INVENTAIRE --- */}
          {activeTab === 'inventaire' && (
            <div className="dashboard-container">
               <div className="controls-card">
                <div className="controls-header">
                  <h3>Valorisation des Stocks</h3>
                  <p>État du stock à l'instant T (Quantité × Prix Vente Estimé).</p>
                </div>
                <div className="controls-flex">
                   <button onClick={fetchInventaire} className="btn btn-ghost">
                    <div style={{width:18, height:18}}><IconRefresh /></div> Actualiser
                  </button>
                  {inventaireData.length > 0 && (
                    <button onClick={printInventaire} className="btn btn-danger">
                      <div style={{width:18, height:18}}><IconPDF /></div> Télécharger PDF
                    </button>
                  )}
                </div>
              </div>

              {inventaireData.length > 0 ? (
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th>Article</th>
                        <th style={{textAlign:'center'}}>Quantité</th>
                        <th style={{textAlign:'right'}}>P.U. (Est.)</th>
                        <th style={{textAlign:'right'}}>Valeur Totale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventaireData.map((p, i) => (
                        <tr key={i}>
                          <td data-label="Article" style={{fontWeight:'600'}}>{p.nom}</td>
                          <td data-label="Quantité" style={{textAlign:'center'}}>
                            <span style={{background:'#eff6ff', color:'#2563eb', padding:'4px 8px', borderRadius:4, fontSize:'0.85rem', fontWeight:'700'}}>
                              {p.stock_actuel} {p.unite}
                            </span>
                          </td>
                          <td data-label="P.U." style={{textAlign:'right'}}>
                            {p.prix_vente.toLocaleString()}
                          </td>
                          <td data-label="Valeur" style={{textAlign:'right', fontWeight:'700', color:'#10b981'}}>
                            {(p.stock_actuel * p.prix_vente).toLocaleString()} F
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                 <div style={{textAlign:'center', padding:'3rem', color:'#94a3b8', background:'white', borderRadius:12, border:'1px solid #e2e8f0'}}>
                  Aucun stock détecté. Cliquez sur "Actualiser".
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
