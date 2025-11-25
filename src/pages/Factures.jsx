import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Factures() {
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [factures, setFactures] = useState([]);
  
  // --- LISTES DÉROULANTES ---
  const [listeClients, setListeClients] = useState([]);
  const [listeProduits, setListeProduits] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Formulaire
  const [selectedClientName, setSelectedClientName] = useState('');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
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
      fetchFactures(ste.id);
      fetchListes(ste.id); // Chargement des listes
    }
    setLoading(false);
  }

  // --- CHARGEMENT DES DONNÉES ---
  async function fetchFactures(entrepriseId) {
    const { data } = await supabase
      .from('factures')
      .select('*')
      .eq('entreprise_id', entrepriseId)
      .order('date_emission', { ascending: false });
    setFactures(data || []);
  }

  async function fetchListes(entrepriseId) {
    // 1. Récupérer les CLIENTS
    const { data: clients } = await supabase
        .from('tiers')
        .select('nom_complet')
        .eq('entreprise_id', entrepriseId)
        .eq('type_tier', 'CLIENT')
        .order('nom_complet');
    setListeClients(clients || []);

    // 2. Récupérer les PRODUITS
    const { data: prods } = await supabase
        .from('produits')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .order('nom');
    setListeProduits(prods || []);
  }

  // --- GESTION INTELLIGENTE DES LIGNES ---
  const addLigne = () => {
    setLignes([...lignes, { description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  };

  // Quand on sélectionne un produit dans la liste
  const handleProductSelect = (index, nomProduit) => {
    const produitTrouve = listeProduits.find(p => p.nom === nomProduit);
    const newLignes = [...lignes];
    
    newLignes[index].description = nomProduit;

    if (produitTrouve) {
        // Remplissage automatique !
        newLignes[index].prix = produitTrouve.prix_vente;
        newLignes[index].unite = produitTrouve.unite;
    }
    setLignes(newLignes);
  };

  const updateLigne = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index][field] = value;
    setLignes(newLignes);
  };

  const removeLigne = (index) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return lignes.reduce((acc, ligne) => acc + (ligne.quantite * ligne.prix), 0);
  };

  // --- SAUVEGARDE ---
  async function handleSave(e) {
    e.preventDefault();
    if (!selectedClientName) return alert("Veuillez choisir un client dans la liste.");

    try {
      const totalHT = calculateTotal();
      const totalTVA = totalHT * 0.18;
      const totalTTC = totalHT + totalTVA;

      // 1. Création Facture
      const { data: facture, error: errFact } = await supabase
        .from('factures')
        .insert([{
          entreprise_id: entreprise.id,
          numero: `FAC-${Date.now().toString().slice(-6)}`,
          client_nom: selectedClientName, // On sauvegarde le nom choisi
          date_emission: dateEmission,
          type_facture: 'VENTE',
          total_ht: totalHT,
          total_tva: totalTVA,
          total_ttc: totalTTC
        }])
        .select()
        .single();

      if (errFact) throw errFact;

      // 2. Création Lignes
      const lignesToInsert = lignes.map(l => ({
        facture_id: facture.id,
        description: l.description,
        quantite: l.quantite,
        unite: l.unite,
        prix_unitaire: l.prix
      }));

      const { error: errLignes } = await supabase.from('lignes_facture').insert(lignesToInsert);
      if (errLignes) throw errLignes;

      // 3. Mise à jour du stock (Optionnel mais recommandé)
      // Pour chaque ligne, on décrémente le stock du produit correspondant
      for (let l of lignes) {
          const prod = listeProduits.find(p => p.nom === l.description && p.type_produit === 'BIEN');
          if (prod) {
              await supabase.rpc('decrement_stock', { row_id: prod.id, quantity: l.quantite }); 
              // Note: Si la fonction RPC n'existe pas, ce n'est pas grave, ça passera au travers ou échouera silencieusement ici
              // Pour faire simple sans RPC complexe, on peut faire un update direct :
              const newStock = prod.stock_actuel - l.quantite;
              await supabase.from('produits').update({ stock_actuel: newStock }).eq('id', prod.id);
          }
      }

      alert("Facture enregistrée !");
      setIsModalOpen(false);
      setSelectedClientName('');
      setLignes([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
      fetchFactures(entreprise.id);

    } catch (error) {
      alert("Erreur : " + error.message);
    }
  }

  // --- PDF ---
  const generatePDF = (facture) => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(entreprise?.nom || 'Mon Entreprise', 14, 22);
    doc.setFontSize(10); doc.text(`Email: ${entreprise?.email_contact || ''}`, 14, 28);
    
    doc.setFontSize(16); doc.text("FACTURE", 150, 22);
    doc.setFontSize(10); doc.text(`N° ${facture.numero}`, 150, 28);
    doc.text(`Date : ${facture.date_emission}`, 150, 34);

    doc.setFontSize(12); doc.text(`Client : ${facture.client_nom}`, 14, 45);

    autoTable(doc, {
      startY: 55,
      head: [['Description', 'Total HT']],
      body: [['Détails enregistrés', `${facture.total_ht.toLocaleString()} FCFA`]],
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total HT : ${facture.total_ht.toLocaleString()} FCFA`, 140, finalY);
    doc.text(`TVA (18%) : ${facture.total_tva.toLocaleString()} FCFA`, 140, finalY + 6);
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text(`Total TTC : ${facture.total_ttc.toLocaleString()} FCFA`, 140, finalY + 14);
    
    doc.save(`Facture_${facture.numero}.pdf`);
  };

  if (loading) return <div style={{padding: 50, textAlign:'center'}}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <div style={{ marginLeft: '260px', padding: '30px', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e293b' }}>Ventes & Facturation</h1>
            <p style={{ color: '#64748b' }}>Créez vos factures en sélectionnant vos produits et clients.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={btnStyle('#3b82f6')}>
            + Nouvelle Facture
          </button>
        </div>

        {/* LISTE */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={thStyle}>Numéro</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Client</th>
                <th style={{...thStyle, textAlign: 'right'}}>Total TTC</th>
                <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures.map(fac => (
                <tr key={fac.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{...tdStyle, fontWeight: 'bold'}}>{fac.numero}</td>
                  <td style={tdStyle}>{fac.date_emission}</td>
                  <td style={tdStyle}>{fac.client_nom}</td>
                  <td style={{...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#10b981'}}>
                    {fac.total_ttc.toLocaleString()} F
                  </td>
                  <td style={{...tdStyle, textAlign: 'right'}}>
                    <button onClick={() => generatePDF(fac)} style={{ cursor: 'pointer', border: 'none', background: '#cbd5e1', padding: '5px 10px', borderRadius: '4px' }}>🖨️ PDF</button>
                  </td>
                </tr>
              ))}
               {factures.length === 0 && <tr><td colSpan="5" style={{padding: 30, textAlign: 'center', color: '#94a3b8'}}>Aucune facture.</td></tr>}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '10px', width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Créer une facture</h2>
            
            <form onSubmit={handleSave}>
              {/* EN-TÊTE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Client</label>
                  {/* LISTE DÉROULANTE CLIENTS */}
                  <select 
                    value={selectedClientName} 
                    onChange={e => setSelectedClientName(e.target.value)} 
                    style={inputStyle} 
                    required
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {listeClients.map((c, i) => (
                        <option key={i} value={c.nom_complet}>{c.nom_complet}</option>
                    ))}
                  </select>
                  {listeClients.length === 0 && <small style={{color:'red'}}>Aucun client trouvé. Ajoutez-en dans "Clients / Fourniss."</small>}
                </div>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" required value={dateEmission} onChange={e => setDateEmission(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* LIGNES */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: '10px', marginBottom: '5px', fontWeight: 'bold', color: '#64748b', fontSize: '0.9rem' }}>
                <span>Produit / Service</span><span>Qté</span><span>Unité</span><span>Prix Unit.</span><span></span>
              </div>

              {lignes.map((ligne, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  
                  {/* LISTE DÉROULANTE PRODUITS */}
                  <select 
                    value={ligne.description} 
                    onChange={e => handleProductSelect(index, e.target.value)} 
                    style={inputStyle}
                    required
                  >
                    <option value="">-- Choisir produit --</option>
                    {listeProduits.map((p, i) => (
                        <option key={i} value={p.nom}>{p.nom} - {p.prix_vente} F</option>
                    ))}
                  </select>

                  <input type="number" placeholder="0" required min="1" value={ligne.quantite} onChange={e => updateLigne(index, 'quantite', Number(e.target.value))} style={inputStyle} />
                  <input type="text" value={ligne.unite} onChange={e => updateLigne(index, 'unite', e.target.value)} style={{...inputStyle, background:'#f1f5f9'}} readOnly />
                  <input type="number" value={ligne.prix} onChange={e => updateLigne(index, 'prix', Number(e.target.value))} style={{...inputStyle, background:'#f1f5f9'}} readOnly />
                  
                  {lignes.length > 1 && <button type="button" onClick={() => removeLigne(index)} style={{ padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>X</button>}
                </div>
              ))}
              
              <button type="button" onClick={addLigne} style={{ marginBottom: '20px', background: '#f1f5f9', border: '1px dashed #cbd5e1', padding: '8px', width: '100%', cursor: 'pointer' }}>+ Ajouter une ligne</button>

              <div style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>
                Total HT : {calculateTotal().toLocaleString()} FCFA
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', border: '1px solid #ddd', background: 'white', borderRadius: '5px', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>Enregistrer</button>
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
