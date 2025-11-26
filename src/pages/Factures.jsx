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
  
  // DONNÉES POUR LES LISTES DÉROULANTES
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // FORMULAIRE
  const [clientId, setClientId] = useState(''); // ID du client sélectionné
  const [clientNom, setClientNom] = useState(''); // Nom du client (pour affichage)
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  
  const [lignes, setLignes] = useState([
    { description: '', quantite: 1, unite: 'unité', prix: 0 }
  ]);

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
      fetchReferentiels(ste.id);
    }
    setLoading(false);
  }

  async function fetchFactures(entrepriseId) {
    const { data } = await supabase
      .from('factures')
      .select('*')
      .eq('entreprise_id', entrepriseId)
      .order('created_at', { ascending: false });
    setFactures(data || []);
  }

  // Charger Clients et Produits pour les menus déroulants
  async function fetchReferentiels(entrepriseId) {
    // Clients
    const { data: tiersData } = await supabase
        .from('tiers')
        .select('id, nom_complet')
        .eq('entreprise_id', entrepriseId)
        .eq('type_tier', 'CLIENT');
    setClients(tiersData || []);

    // Produits
    const { data: prodData } = await supabase
        .from('produits')
        .select('nom, prix_vente, unite')
        .eq('entreprise_id', entrepriseId);
    setProduits(prodData || []);
  }

  // --- LOGIQUE FORMULAIRE ---

  // Quand on choisit un client dans la liste
  const handleClientSelect = (e) => {
      const id = e.target.value;
      const client = clients.find(c => c.id === id);
      setClientId(id);
      setClientNom(client ? client.nom_complet : '');
  };

  // Quand on choisit un produit dans la liste
  const handleProductSelect = (index, nomProduit) => {
      const product = produits.find(p => p.nom === nomProduit);
      const newLignes = [...lignes];
      
      newLignes[index].description = nomProduit;
      if (product) {
          newLignes[index].prix = product.prix_vente; // Remplissage auto prix
          newLignes[index].unite = product.unite;     // Remplissage auto unité
      }
      setLignes(newLignes);
  };

  const updateLigne = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index][field] = value;
    setLignes(newLignes);
  };

  const addLigne = () => setLignes([...lignes, { description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  const removeLigne = (idx) => setLignes(lignes.filter((_, i) => i !== idx));

  const calculateTotal = () => lignes.reduce((acc, l) => acc + (l.quantite * l.prix), 0);

  // --- SAUVEGARDE ---
  async function handleSave(e) {
    e.preventDefault();
    if (!clientId) return alert("Veuillez sélectionner un client.");

    try {
        const totalHT = calculateTotal();
        const totalTVA = totalHT * 0.18; // 18% TVA
        const totalTTC = totalHT + totalTVA;
        
        // Génération numéro facture (FAC-TIMESTAMP)
        const numeroFacture = `FAC-${Date.now().toString().slice(-6)}`;

        // 1. Créer l'en-tête
        const { data: facture, error: errFact } = await supabase
            .from('factures')
            .insert([{
                entreprise_id: entreprise.id,
                tier_id: clientId,
                client_nom: clientNom,
                numero: numeroFacture, // IMPORTANT : On fournit le numéro ici
                date_emission: dateEmission,
                total_ht: totalHT,
                total_tva: totalTVA,
                total_ttc: totalTTC,
                type_facture: 'VENTE'
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

        alert("Facture enregistrée avec succès !");
        setIsModalOpen(false);
        // Reset
        setClientId('');
        setClientNom('');
        setLignes([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
        fetchFactures(entreprise.id);

    } catch (error) {
        console.error(error);
        alert("Erreur : " + error.message);
    }
  }

  // --- PDF ---
  const generatePDF = (facture) => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(entreprise?.nom || 'Entreprise', 14, 22);
    doc.setFontSize(12); doc.text("FACTURE", 150, 22);
    doc.setFontSize(10); doc.text(`N° ${facture.numero}`, 150, 28);
    doc.text(`Date : ${facture.date_emission}`, 150, 34);
    doc.text(`Client : ${facture.client_nom}`, 14, 45);

    autoTable(doc, {
        startY: 55,
        head: [['Description', 'Total']],
        body: [['Voir détail dans l\'application', `${facture.total_ttc.toLocaleString()} F`]]
    });
    doc.save(`Facture_${facture.numero}.pdf`);
  }

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar entrepriseNom={entreprise?.nom} userRole={entreprise?.role} />

      <div style={{ marginLeft: '260px', padding: '30px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <h1 style={{ margin: 0, color: '#1e293b' }}>Facturation Client</h1>
            <button onClick={() => setIsModalOpen(true)} style={btnStyle('#3b82f6')}>+ Nouvelle Facture</button>
        </div>

        {/* TABLEAU DES FACTURES */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <tr>
                        <th style={thStyle}>Numéro</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Client</th>
                        <th style={{...thStyle, textAlign:'right'}}>Montant TTC</th>
                        <th style={{...thStyle, textAlign:'right'}}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {factures.map(f => (
                        <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{...tdStyle, fontWeight:'bold'}}>{f.numero}</td>
                            <td style={tdStyle}>{f.date_emission}</td>
                            <td style={tdStyle}>{f.client_nom}</td>
                            <td style={{...tdStyle, textAlign:'right', fontWeight:'bold', color:'#10b981'}}>
                                {f.total_ttc.toLocaleString()} F
                            </td>
                            <td style={{...tdStyle, textAlign:'right'}}>
                                <button onClick={() => generatePDF(f)} style={{cursor:'pointer', border:'none', background:'#e2e8f0', padding:'5px 10px', borderRadius:4}}>🖨️ PDF</button>
                            </td>
                        </tr>
                    ))}
                    {factures.length === 0 && <tr><td colSpan="5" style={{padding:30, textAlign:'center', color:'#94a3b8'}}>Aucune facture</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {/* MODAL DE CRÉATION */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '10px', width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{marginTop:0, color:'#1e293b'}}>Nouvelle Facture</h2>
                
                <form onSubmit={handleSave}>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20}}>
                        <div>
                            <label style={labelStyle}>Client</label>
                            <select value={clientId} onChange={handleClientSelect} style={inputStyle} required>
                                <option value="">-- Choisir un client --</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
                            </select>
                            {clients.length === 0 && <small style={{color:'red'}}>Aucun client trouvé. Ajoutez-en dans "Tiers".</small>}
                        </div>
                        <div>
                            <label style={labelStyle}>Date</label>
                            <input type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} style={inputStyle} required />
                        </div>
                    </div>

                    {/* LIGNES */}
                    <div style={{display:'grid', gridTemplateColumns:'3fr 1fr 1fr 1fr auto', gap:10, marginBottom:5, color:'#64748b', fontSize:'0.9rem', fontWeight:'bold'}}>
                        <span>Produit</span><span>Qté</span><span>Unité</span><span>Prix U.</span><span></span>
                    </div>

                    {lignes.map((l, idx) => (
                        <div key={idx} style={{display:'grid', gridTemplateColumns:'3fr 1fr 1fr 1fr auto', gap:10, marginBottom:10, alignItems:'center'}}>
                            <select 
                                value={l.description} 
                                onChange={e => handleProductSelect(idx, e.target.value)} 
                                style={inputStyle} required
                            >
                                <option value="">-- Produit --</option>
                                {produits.map((p, i) => <option key={i} value={p.nom}>{p.nom}</option>)}
                            </select>

                            <input type="number" min="1" value={l.quantite} onChange={e => updateLigne(idx, 'quantite', Number(e.target.value))} style={inputStyle} />
                            <input type="text" value={l.unite} readOnly style={{...inputStyle, background:'#f1f5f9'}} />
                            <input type="number" value={l.prix} readOnly style={{...inputStyle, background:'#f1f5f9'}} />
                            
                            {lignes.length > 1 && <button type="button" onClick={() => removeLigne(idx)} style={{color:'red', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>X</button>}
                        </div>
                    ))}
                    
                    <button type="button" onClick={addLigne} style={{color:'#3b82f6', background:'none', border:'1px dashed #3b82f6', width:'100%', padding:10, borderRadius:5, cursor:'pointer', marginBottom:20}}>+ Ajouter une ligne</button>

                    <div style={{textAlign:'right', fontSize:'1.2rem', fontWeight:'bold', marginBottom:20}}>
                        Total HT : {calculateTotal().toLocaleString()} FCFA
                    </div>

                    <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{padding:'10px 20px', borderRadius:5, border:'1px solid #ddd', background:'white', cursor:'pointer'}}>Annuler</button>
                        <button type="submit" style={{padding:'10px 20px', borderRadius:5, border:'none', background:'#3b82f6', color:'white', fontWeight:'bold', cursor:'pointer'}}>Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = (bg) => ({ padding: '10px 20px', background: bg, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' })
const thStyle = { padding: '12px 15px', textAlign: 'left', color: '#64748b', fontWeight: '600', background: '#f8fafc' }
const tdStyle = { padding: '12px 15px', color: '#334155' }
const labelStyle = { display: 'block', marginBottom: 5, fontSize: '0.9rem', color: '#64748b' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }
