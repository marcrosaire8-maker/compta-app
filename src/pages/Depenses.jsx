import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Depenses() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [depenses, setDepenses] = useState([]);
  
  // --- LISTE DES FOURNISSEURS (Connectée à la BDD) ---
  const [listeFournisseurs, setListeFournisseurs] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Formulaire
  const [fournisseurId, setFournisseurId] = useState('');   // ID pour le lien technique
  const [fournisseurNom, setFournisseurNom] = useState(''); // Nom pour l'affichage
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  
  // Lignes de dépense
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);

  useEffect(() => {
    initData();
  }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchDepenses(ste.id);
      fetchFournisseurs(ste.id); // <--- On charge les fournisseurs
    }
    setLoading(false);
  }

  // 1. Charger l'historique des dépenses (Factures type ACHAT)
  async function fetchDepenses(entrepriseId) {
    const { data } = await supabase
      .from('factures')
      .select('*')
      .eq('entreprise_id', entrepriseId)
      .eq('type_facture', 'ACHAT') // Filtre essentiel
      .order('date_emission', { ascending: false });
    setDepenses(data || []);
  }

  // 2. Charger la liste des FOURNISSEURS depuis l'annuaire
  async function fetchFournisseurs(entrepriseId) {
    const { data } = await supabase
      .from('tiers')
      .select('id, nom_complet')
      .eq('entreprise_id', entrepriseId)
      .eq('type_tier', 'FOURNISSEUR') // On ne veut que les fournisseurs
      .order('nom_complet');
    setListeFournisseurs(data || []);
  }

  // --- GESTION FORMULAIRE ---

  // Sélection du fournisseur dans la liste
  const handleFournisseurSelect = (e) => {
      const id = e.target.value;
      const fourn = listeFournisseurs.find(f => f.id === id);
      setFournisseurId(id);
      setFournisseurNom(fourn ? fourn.nom_complet : '');
  };

  const addLigne = () => setLignes([...lignes, { description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  
  const updateLigne = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index][field] = value;
    setLignes(newLignes);
  };

  const removeLigne = (index) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const calculateTotal = () => lignes.reduce((acc, l) => acc + (l.quantite * l.prix), 0);

  // --- SAUVEGARDE ---
  async function handleSave(e) {
    e.preventDefault();
    if (!fournisseurId) return alert("Veuillez sélectionner un fournisseur.");

    try {
      const totalHT = calculateTotal();
      // Note : Sur les dépenses, la TVA est souvent déjà incluse ou différente, 
      // ici on garde une logique simple TTC = HT pour la saisie rapide, 
      // ou on applique 18% si c'est la règle. Disons TTC = HT pour simplifier la saisie de ticket.
      const totalTTC = totalHT; 

      // Génération numéro ACH-TIMESTAMP
      const numeroFacture = `ACH-${Date.now().toString().slice(-6)}`;

      // 1. Créer l'en-tête Facture (Type ACHAT)
      const { data: facture, error: errFact } = await supabase
        .from('factures')
        .insert([{
          entreprise_id: entreprise.id,
          tier_id: fournisseurId,      // Lien technique
          client_nom: fournisseurNom,  // Nom affiché (ici c'est le fournisseur)
          numero: numeroFacture,
          date_emission: dateEmission,
          type_facture: 'ACHAT',       // <--- IMPORTANT
          statut: 'PAYEE',             // Une dépense est souvent payée comptant
          total_ht: totalHT,
          total_ttc: totalTTC
        }])
        .select()
        .single();

      if (errFact) throw errFact;

      // 2. Créer les lignes
      const lignesToInsert = lignes.map(l => ({
        facture_id: facture.id,
        description: l.description,
        quantite: l.quantite,
        unite: l.unite,
        prix_unitaire: l.prix
      }));

      const { error: errLignes } = await supabase.from('lignes_facture').insert(lignesToInsert);
      if (errLignes) throw errLignes;

      alert("Dépense enregistrée !");
      setIsModalOpen(false);
      
      // Reset
      setFournisseurId('');
      setFournisseurNom('');
      setLignes([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
      fetchDepenses(entreprise.id);

    } catch (error) {
      alert("Erreur : " + error.message);
    }
  }

  // --- PDF (Bon de Dépense) ---
  const generatePDF = (facture) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(entreprise?.nom || 'Entreprise', 14, 22);
    doc.setFontSize(12); doc.text("BON DE DÉPENSE", 150, 22);
    doc.setFontSize(10); doc.text(`N° ${facture.numero}`, 150, 28);
    doc.text(`Date : ${facture.date_emission}`, 150, 34);

    doc.text(`Fournisseur : ${facture.client_nom}`, 14, 45);

    autoTable(doc, {
        startY: 55,
        head: [['Description', 'Montant Total']],
        body: [['Détails de la dépense', `${facture.total_ttc.toLocaleString()} F`]], // Simplifié pour l'historique
    });

    doc.text(`Total Payé : ${facture.total_ttc.toLocaleString()} FCFA`, 140, doc.lastAutoTable.finalY + 10);
    doc.save(`Depense_${facture.numero}.pdf`);
  };

  if (loading) return <div style={{padding: 50, textAlign:'center'}}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <div style={{ marginLeft: '260px', padding: '30px', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e293b' }}>Mes Dépenses</h1>
            <p style={{ color: '#64748b' }}>Saisissez vos achats fournisseurs (Eau, Loyer, Marchandises...)</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={btnStyle('#ef4444')}>
            - Nouvelle Dépense
          </button>
        </div>

        {/* TABLEAU DES DÉPENSES */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={thStyle}>Numéro</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Fournisseur</th>
                <th style={{...thStyle, textAlign:'right'}}>Montant TTC</th>
                <th style={{...thStyle, textAlign:'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {depenses.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{...tdStyle, color:'#64748b', fontSize:'0.9rem'}}>{d.numero}</td>
                  <td style={tdStyle}>{d.date_emission}</td>
                  <td style={{...tdStyle, fontWeight:'bold'}}>{d.client_nom}</td>
                  <td style={{...tdStyle, textAlign:'right', fontWeight:'bold', color:'#ef4444'}}>
                    - {d.total_ttc.toLocaleString()} F
                  </td>
                  <td style={{...tdStyle, textAlign:'right'}}>
                    <button onClick={() => generatePDF(d)} style={{cursor:'pointer', border:'none', background:'#e2e8f0', padding:'5px 10px', borderRadius:4}}>🖨️ PDF</button>
                  </td>
                </tr>
              ))}
               {depenses.length === 0 && <tr><td colSpan="5" style={{padding: 30, textAlign: 'center', color: '#94a3b8'}}>Aucune dépense enregistrée.</td></tr>}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL DE SAISIE */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '10px', width: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, color:'#ef4444' }}>Saisir une Dépense</h2>
            
            <form onSubmit={handleSave}>
              {/* EN-TÊTE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Fournisseur</label>
                  {/* LISTE DÉROULANTE FOURNISSEURS */}
                  <select 
                    value={fournisseurId} 
                    onChange={handleFournisseurSelect} 
                    style={inputStyle} 
                    required
                  >
                    <option value="">-- Choisir un fournisseur --</option>
                    {listeFournisseurs.map((f, i) => (
                        <option key={i} value={f.id}>{f.nom_complet}</option>
                    ))}
                  </select>
                  {listeFournisseurs.length === 0 && <small style={{color:'red'}}>Aucun fournisseur. Ajoutez-en dans "Clients / Fourniss."</small>}
                </div>
                <div>
                  <label style={labelStyle}>Date Facture</label>
                  <input type="date" required value={dateEmission} onChange={e => setDateEmission(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* LIGNES */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: '10px', marginBottom: '5px', fontWeight: 'bold', color: '#64748b', fontSize: '0.9rem' }}>
                <span>Description (ex: Loyer, Essence)</span><span>Qté</span><span>Unité</span><span>Prix Total</span><span></span>
              </div>

              {lignes.map((l, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  
                  <input 
                    type="text" 
                    placeholder="Quoi ?" 
                    value={l.description} 
                    onChange={e => updateLigne(idx, 'description', e.target.value)} 
                    style={inputStyle} 
                    required
                  />

                  <input type="number" placeholder="1" min="1" value={l.quantite} onChange={e => updateLigne(idx, 'quantite', Number(e.target.value))} style={inputStyle} />
                  <input type="text" placeholder="U" value={l.unite} onChange={e => updateLigne(idx, 'unite', e.target.value)} style={inputStyle} />
                  <input type="number" placeholder="Prix" value={l.prix} onChange={e => updateLigne(idx, 'prix', Number(e.target.value))} style={inputStyle} required />
                  
                  {lignes.length > 1 && <button type="button" onClick={() => removeLigne(idx)} style={{color:'red', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>X</button>}
                </div>
              ))}
              
              <button type="button" onClick={addLigne} style={{ marginBottom: '20px', background: '#f1f5f9', border: '1px dashed #cbd5e1', padding: '8px', width: '100%', cursor: 'pointer' }}>+ Ajouter une ligne</button>

              <div style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>
                Total à payer : {calculateTotal().toLocaleString()} FCFA
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', border: '1px solid #ddd', background: 'white', borderRadius: '5px', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const btnStyle = (bg) => ({ padding: '10px 20px', background: bg, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' })
const thStyle = { padding: '12px 15px', textAlign: 'left', color: '#64748b', fontWeight: '600', background: '#f8fafc' }
const tdStyle = { padding: '12px 15px', color: '#334155' }
const labelStyle = { display: 'block', marginBottom: 5, fontSize: '0.9rem', color: '#64748b' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }
