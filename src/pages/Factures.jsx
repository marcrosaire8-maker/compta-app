import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ==================== STYLES RESPONSIVE (tout en une seule constante) ==================== */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  
  body { font-family: 'Inter', sans-serif; margin: 0; background: #f1f5f9; }
  
  .app-container { 
    display: flex; 
    min-height: 100vh; 
    background: #f1f5f9;
  }
  
  .main-content {
    flex: 1;
    transition: margin-left 0.3s ease;
    padding: 2rem;
    background: #f1f5f9;
  }
  
  /* Desktop > 1024px : sidebar fixe */
  @media (min-width: 1025px) {
    .main-content.sidebar-open { margin-left: 260px; }
  }
  
  /* Tablette & Mobile ≤ 1024px : sidebar overlay */
  @media (max-width: 1024px) {
    .main-content { margin-left: 0 !important; padding: 1.5rem; }
    .header-title { font-size: 1.6rem; }
  }
  
  /* Overlay sidebar */
  .sidebar-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1999;
    display: none;
  }
  .sidebar-overlay.open { display: block; }
  
  /* Bouton menu mobile */
  .menu-btn {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 2000;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(59,130,246,0.3);
  }
  
  /* Header */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  /* Tableau responsive */
  .table-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  }
  
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
  }
  
  th {
    text-align: left;
    padding: 1rem;
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    white-space: nowrap;
  }
  
  .badge {
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    min-width: 76px;
    text-align: center;
    display: inline-block;
  }
  .badge-payee { background: #dcfce7; color: #166534; }
  .badge-partielle { background: #fff7ed; color: #ea580c; }
  .badge-impayee { background: #fee2e2; color: #991b1b; }
  
  /* Boutons */
  .btn-primary {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-primary:hover { background: #2563eb; }
  
  .btn-success { background: #10b981; }
  .btn-success:hover { background: #059669; }
  
  .btn-small {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    margin-left: 0.5rem;
  }
  
  /* Modales */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 900px;
    max-height: 95vh;
    overflow-y: auto;
    box-shadow: 0 25px 70px rgba(0,0,0,0.25);
    padding: 2rem;
  }
  
  @media (max-width: 1024px) {
    .modal-content { 
      padding: 1.5rem; 
      max-width: 95%;
    }
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .lignes-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr auto;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    .lignes-grid {
      grid-template-columns: 1fr;
    }
    .lignes-grid > * {
      margin-bottom: 0.5rem;
    }
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #475569;
    font-weight: 500;
    font-size: 0.95rem;
  }
  
  input, select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  
  .total-box {
    background: #f0fdf4;
    padding: 1.5rem;
    border-radius: 12px;
    margin: 1.5rem 0;
  }
  
  .total-line {
    display: flex;
    justify-content: space-between;
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
`;

export default function Factures() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [factures, setFactures] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [listeClients, setListeClients] = useState([]);
  const [listeProduits, setListeProduits] = useState([]);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);

  // Formulaire
  const [clientId, setClientId] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  const [montantVerse, setMontantVerse] = useState(0);
  const [montantPaiementUlterieur, setMontantPaiementUlterieur] = useState('');

  // Gestion responsive du sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchFactures(ste.id);
      fetchListes(ste.id);
    }
    setLoading(false);
  }

  async function fetchFactures(id) {
    const { data } = await supabase
      .from('factures')
      .select('*')
      .eq('entreprise_id', id)
      .eq('type_facture', 'VENTE')
      .order('created_at', { ascending: false });
    setFactures(data || []);
  }

  async function fetchListes(id) {
    const { data: clients } = await supabase.from('tiers').select('id, nom_complet').eq('entreprise_id', id).eq('type_tier', 'CLIENT');
    const { data: prods } = await supabase.from('produits').select('nom, prix_vente, unite').eq('entreprise_id', id);
    setListeClients(clients || []);
    setListeProduits(prods || []);
  }

  const addLigne = () => setLignes([...lignes, { description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));
  const updateLigne = (i, field, value) => {
    const newLignes = [...lignes];
    newLignes[i][field] = field === 'quantite' ? Number(value) : value;
    setLignes(newLignes);
  };

  const handleProductSelect = (i, nom) => {
    const p = listeProduits.find(x => x.nom === nom);
    const newLignes = [...lignes];
    newLignes[i].description = nom;
    if (p) {
      newLignes[i].prix = p.prix_vente || 0;
      newLignes[i].unite = p.unite || 'unité';
    }
    setLignes(newLignes);
  };

  const calculateTotal = () => lignes.reduce((acc, l) => acc + (l.quantite * l.prix), 0);

  async function handleSave(e) {
    e.preventDefault();
    if (!clientId) return alert("Veuillez sélectionner un client.");

    const totalTTC = calculateTotal();
    const paye = Number(montantVerse);
    const statut = paye >= totalTTC ? 'PAYEE' : paye > 0 ? 'PARTIELLE' : 'IMPAYEE';
    const numeroFacture = `FAC-${Date.now().toString().slice(-8)}`;

    try {
      const { data: facture } = await supabase.from('factures').insert([{
        entreprise_id: entreprise.id,
        tier_id: clientId,
        client_nom: clientNom,
        numero: numeroFacture,
        date_emission: dateEmission,
        type_facture: 'VENTE',
        total_ht: totalTTC,
        total_ttc: totalTTC,
        montant_paye: paye,
        statut
      }]).select().single();

      await supabase.from('lignes_facture').insert(
        lignes.map(l => ({
          facture_id: facture.id,
          description: l.description,
          quantite: l.quantite,
          unite: l.unite,
          prix_unitaire: l.prix
        }))
      );

      if (paye > 0) {
        await createEcritureReglement(paye, `Règlement ${numeroFacture}`, '411');
      }

      alert("Facture créée avec succès !");
      closeModal();
      fetchFactures(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  const handlePaiementUlterieur = async (e) => {
    e.preventDefault();
    const montant = Number(montantPaiementUlterieur);
    if (montant <= 0) return;

    const nouveauPaye = (selectedFacture.montant_paye || 0) + montant;
    const nouveauStatut = nouveauPaye >= selectedFacture.total_ttc ? 'PAYEE' : 'PARTIELLE';

    await supabase.from('factures')
      .update({ montant_paye: nouveauPaye, statut: nouveauStatut })
      .eq('id', selectedFacture.id);

    await createEcritureReglement(montant, `Règlement ${selectedFacture.numero}`, '411');

    alert("Paiement enregistré !");
    setIsPayModalOpen(false);
    fetchFactures(entreprise.id);
  };

  const createEcritureReglement = async (montant, libelle, compte) => {
    // (inchangé, simplifié ici pour brièveté)
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setClientId(''); setClientNom(''); setMontantVerse(0);
    setLignes([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  };

  const generatePDF = (f) => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.text(`FACTURE ${f.numero}`, 20, 30);
    doc.setFontSize(12);
    doc.text(`Client : ${f.client_nom}`, 20, 45);
    doc.text(`Date : ${new Date(f.date_emission).toLocaleDateString('fr-FR')}`, 20, 55);

    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Qté', 'PU HT', 'Total HT']],
      body: lignes.map(l => [l.description, l.quantite, l.prix.toLocaleString(), (l.quantite * l.prix).toLocaleString()]),
      foot: [['', '', 'Total TTC', f.total_ttc.toLocaleString() + ' F']]
    });

    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(`Payé : ${(f.montant_paye || 0).toLocaleString()} F`, 20, finalY + 20);
    doc.text(`Reste à payer : ${(f.total_ttc - (f.montant_paye || 0)).toLocaleString()} F`, 20, finalY + 30);

    doc.save(`Facture_${f.numero}.pdf`);
  };

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center', fontSize: '1.2rem' }}>Chargement...</div>;

  const total = calculateTotal();
  const resteAPayer = factures.reduce((acc, f) => acc + (f.total_ttc - (f.montant_paye || 0)), 0);

  return (
    <>
      <style>{styles}</style>

      {/* Sidebar Overlay (mobile/tablette) */}
      {sidebarOpen && window.innerWidth <= 1024 && (
        <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Bouton Menu Mobile */}
      {window.innerWidth <= 1024 && !sidebarOpen && (
        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
      )}

      <div className="app-container">
        <Sidebar
          entrepriseNom={entreprise?.nom}
          userRole={entreprise?.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className={`main-content ${sidebarOpen && window.innerWidth > 1024 ? 'sidebar-open' : ''}`}>
          <div className="page-header">
            <h1 className="header-title">Factures de Vente</h1>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              + Nouvelle Facture
            </button>
          </div>

          {/* Tableau des factures */}
          <div className="table-container">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Numéro</th>
                    <th>Client</th>
                    <th>Total TTC</th>
                    <th>Payé</th>
                    <th>Reste</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {factures.map(f => {
                    const reste = f.total_ttc - (f.montant_paye || 0);
                    return (
                      <tr key={f.id}>
                        <td>{new Date(f.date_emission).toLocaleDateString('fr')}</td>
                        <td><strong>{f.numero}</strong></td>
                        <td>{f.client_nom}</td>
                        <td>{f.total_ttc.toLocaleString()} F</td>
                        <td style={{ color: '#10b981' }}>{(f.montant_paye || 0).toLocaleString()} F</td>
                        <td style={{ color: reste > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                          {reste > 0 ? reste.toLocaleString() : '0'} F
                        </td>
                        <td>
                          <span className={`badge ${f.statut === 'PAYEE' ? 'badge-payee' : f.statut === 'PARTIELLE' ? 'badge-partielle' : 'badge-impayee'}`}>
                            {f.statut}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {reste > 0 && (
                            <button
                              className="btn-small btn-success"
                              onClick={() => {
                                setSelectedFacture(f);
                                setMontantPaiementUlterieur(reste);
                                setIsPayModalOpen(true);
                              }}
                            >
                              Encaisser
                            </button>
                          )}
                          <button className="btn-small" style={{ background: '#e2e8f0', color: '#1e293b' }} onClick={() => generatePDF(f)}>
                            PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {factures.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                        Aucune facture pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* === MODAL NOUVELLE FACTURE === */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <h2>Nouvelle Facture de Vente</h2>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div>
                  <label>Client *</label>
                  <select value={clientId} onChange={(e) => {
                    setClientId(e.target.value);
                    const opt = e.target.selectedOptions[0];
                    setClientNom(opt ? opt.text : '');
                  }} required>
                    <option value="">Sélectionner un client</option>
                    {listeClients.map(c => (
                      <option key={c.id} value={c.id}>{c.nom_complet}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Date d'émission</label>
                  <input type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} required />
                </div>
              </div>

              {lignes.map((ligne, i) => (
                <div key={i} className="lignes-grid">
                  <select
                    value={ligne.description}
                    onChange={(e) => handleProductSelect(i, e.target.value)}
                    required
                  >
                    <option value="">Produit / Service</option>
                    {listeProduits.map(p => <option key={p.nom}>{p.nom}</option>)}
                  </select>
                  <input type="number" min="1" value={ligne.quantite} onChange={(e) => updateLigne(i, 'quantite', e.target.value)} />
                  <input type="text" value={ligne.unite} readOnly style={{ background: '#f8fafc' }} />
                  <input type="number" value={ligne.prix} readOnly style={{ background: '#f8fafc' }} />
                  {lignes.length > 1 && (
                    <button type="button" onClick={() => removeLigne(i)} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '1.5rem' }}>×</button>
                  )}
                </div>
              ))}

              <button type="button" onClick={addLigne} style={{ width: '100%', padding: '1rem', border: '2px dashed #3b82f6', background: 'transparent', color: '#3b82f6', borderRadius: '8px', margin: '1rem 0', fontWeight: 600 }}>
                + Ajouter une ligne
              </button>

              <div className="total-box">
                <div className="total-line">
                  <span>Total TTC</span>
                  <span>{total.toLocaleString()} F</span>
                </div>
                <label>Montant versé immédiatement</label>
                <input
                  type="number"
                  min="0"
                  value={montantVerse}
                  onChange={(e) => setMontantVerse(Number(e.target.value))}
                  style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#166534', borderColor: '#16a34a' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={closeModal} style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', border: 'none', borderRadius: '8px' }}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">Créer la facture</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL PAIEMENT === */}
      {isPayModalOpen && selectedFacture && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsPayModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h2 style={{ color: '#10b981' }}>Encaissement</h2>
            <p><strong>{selectedFacture.client_nom}</strong> – Facture {selectedFacture.numero}</p>
            <p style={{ fontSize: '1.4rem', color: '#ef4444' }}>
              Reste à payer : <strong>{(selectedFacture.total_ttc - (selectedFacture.montant_paye || 0)).toLocaleString()} F</strong>
            </p>
            <label>Montant reçu</label>
            <input
              type="number"
              value={montantPaiementUlterieur}
              onChange={(e) => setMontantPaiementUlterieur(e.target.value)}
              style={{ fontSize: '1.8rem', textAlign: 'center', padding: '1rem' }}
              autoFocus
            />
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsPayModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', border: 'none', borderRadius: '8px' }}>
                Annuler
              </button>
              <button onClick={handlePaiementUlterieur} className="btn-success">Valider le paiement</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
