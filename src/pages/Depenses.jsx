// src/pages/Depenses.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format monétaire identique au Dashboard
const formatMoney = (value) => {
  return value.toLocaleString('fr-FR') + ' F';
};

export default function Depenses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [depenses, setDepenses] = useState([]);
  const [listeFournisseurs, setListeFournisseurs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulaire
  const [fournisseurId, setFournisseurId] = useState('');
  const [fournisseurNom, setFournisseurNom] = useState('');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);

  useEffect(() => { checkUser(); }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');
    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      await Promise.all([fetchDepenses(ste.id), fetchFournisseurs(ste.id)]);
    }
    setLoading(false);
  }

  async function fetchDepenses(entrepriseId) {
    const { data } = await supabase
      .from('factures')
      .select('*, lignes_facture:lignes_facture(*)')
      .eq('entreprise_id', entrepriseId)
      .eq('type_facture', 'ACHAT')
      .order('date_emission', { ascending: false });
    setDepenses(data || []);
  }

  async function fetchFournisseurs(entrepriseId) {
    const { data } = await supabase
      .from('tiers')
      .select('id, nom_complet')
      .eq('entreprise_id', entrepriseId)
      .eq('type_tier', 'FOURNISSEUR')
      .order('nom_complet');
    setListeFournisseurs(data || []);
  }

  const handleFournisseurSelect = (e) => {
    const id = e.target.value;
    const f = listeFournisseurs.find(x => x.id === id);
    setFournisseurId(id);
    setFournisseurNom(f ? f.nom_complet : '');
  };

  const addLigne = () => setLignes([...lignes, { description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  const updateLigne = (i, field, val) => {
    const newL = [...lignes];
    newL[i][field] = field === 'quantite' || field === 'prix' ? Number(val) || 0 : val;
    setLignes(newL);
  };
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));
  const total = () => lignes.reduce((a, l) => a + l.quantite * l.prix, 0);

  async function handleSave(e) {
    e.preventDefault();
    if (!fournisseurId) return alert("Sélectionnez un fournisseur");
    if (lignes.some(l => !l.description || l.prix <= 0)) return alert("Remplissez toutes les lignes");

    try {
      const numero = `ACH-${Date.now().toString().slice(-6)}`;
      const { data: facture } = await supabase
        .from('factures')
        .insert([{
          entreprise_id: entreprise.id,
          tier_id: fournisseurId,
          client_nom: fournisseurNom,
          numero,
          date_emission: dateEmission,
          type_facture: 'ACHAT',
          statut: 'PAYEE',
          total_ht: total(),
          total_ttc: total()
        }])
        .select()
        .single();

      await supabase.from('lignes_facture').insert(
        lignes.map(l => ({
          facture_id: facture.id,
          description: l.description,
          quantite: l.quantite,
          unite: l.unite,
          prix_unitaire: l.prix
        }))
      );

      alert("Dépense enregistrée !");
      setIsModalOpen(false);
      resetForm();
      fetchDepenses(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  const resetForm = () => {
    setFournisseurId(''); setFournisseurNom('');
    setDateEmission(new Date().toISOString().split('T')[0]);
    setLignes([{ description: '', quantite: 1, unite: 'unité', prix: 0 }]);
  };

  const generatePDF = (facture) => {
    const lignes = facture.lignes_facture || [];
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(entreprise?.nom || "Entreprise", 14, 25);
    doc.setFontSize(16); doc.text("BON DE DÉPENSE", 105, 25, { align: "center" });
    doc.setFontSize(11);
    doc.text(`N° ${facture.numero}`, 140, 35);
    doc.text(`Date : ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}`, 140, 42);
    doc.text(`Fournisseur : ${facture.client_nom}`, 14, 55);

    autoTable(doc, {
      startY: 65,
      head: [['Description', 'Qté', 'Unité', 'Prix U.', 'Total']],
      body: lignes.map(l => [l.description, l.quantite, l.unite, formatMoney(l.prix_unitaire), formatMoney(l.quantite * l.prix_unitaire)]),
      foot: [['', '', '', 'Total Payé', formatMoney(facture.total_ttc)]],
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      footStyles: { fillColor: [254, 226, 226], fontSize: 13, fontStyle: 'bold' }
    });
    doc.save(`Depense_${facture.numero}.pdf`);
  };

  if (loading) return <div style={{ padding: 50, textAlign: 'center', color: '#64748b' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar entrepriseNom={entreprise?.nom || '...'} userRole={entreprise?.role} />

      <main style={{ marginLeft: 260, padding: 40, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
        <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>Mes Dépenses</h1>
            <p style={{ color: '#64748b', margin: '5px 0 0' }}>Achats, charges et fournisseurs</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={styles.guideBtn}>
            + Nouvelle Dépense
          </button>
        </header>

        {/* Liste des dépenses */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#fef2f2' }}>
              <tr>
                <th style={thStyle}>Numéro</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Fournisseur</th>
                <th style={{...thStyle, textAlign: 'right'}}>Montant</th>
                <th style={{...thStyle, textAlign: 'center'}}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {depenses.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 80, textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem' }}>
                  Aucune dépense enregistrée
                </td></tr>
              ) : depenses.map(d => (
                <tr key={d.id} style={{ borderTop: '1px solid #fee2e2' }}>
                  <td style={tdStyle}>{d.numero}</td>
                  <td style={tdStyle}>{new Date(d.date_emission).toLocaleDateString('fr-FR')}</td>
                  <td style={{...tdStyle, fontWeight: 700 }}>{d.client_nom}</td>
                  <td style={{...tdStyle, textAlign: 'right', color: '#dc2626', fontWeight: 800 }}>
                    - {formatMoney(d.total_ttc)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => generatePDF(d)} style={{ padding: '8px 16px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL IDENTIQUE AU DASHBOARD */}
      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 30px', color: '#dc2626', fontSize: '1.8rem', fontWeight: 800 }}>Nouvelle Dépense</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 30 }}>
                <div>
                  <label style={labelStyle}>Fournisseur *</label>
                  <select value={fournisseurId} onChange={handleFournisseurSelect} required style={inputStyle}>
                    <option value="">-- Choisir --</option>
                    {listeFournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom_complet}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} required style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #fee2e2', display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: 16, fontWeight: 700, color: '#64748b' }}>
                <span>Description</span><span>Qté</span><span>Unité</span><span>Prix U.</span><span></span>
              </div>

              {lignes.map((l, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: 16, marginBottom: 16, alignItems: 'center' }}>
                  <input type="text" placeholder="ex: Loyer mars" value={l.description} onChange={e => updateLigne(i, 'description', e.target.value)} required style={inputStyle} />
                  <input type="number" min="1" value={l.quantite} onChange={e => updateLigne(i, 'quantite', e.target.value)} style={inputStyle} />
                  <input type="text" value={l.unite} onChange={e => updateLigne(i, 'unite', e.target.value)} style={inputStyle} />
                  <input type="number" value={l.prix} onChange={e => updateLigne(i, 'prix', e.target.value)} required style={inputStyle} />
                  {lignes.length > 1 && <button type="button" onClick={() => removeLigne(i)} style={{ color: '#ef4444', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>}
                </div>
              ))}

              <div onClick={addLigne} style={{ padding: 20, background: '#fef2f2', border: '2px dashed #fca5a5', borderRadius: 16, textAlign: 'center', cursor: 'pointer', fontWeight: 700, color: '#dc2626', margin: '24px 0' }}>
                + Ajouter une ligne
              </div>

              <div style={{ textAlign: 'right', fontSize: '1.8rem', fontWeight: 900, color: '#dc2626', margin: '30px 0' }}>
                Total : {formatMoney(total())}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 32px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '12px 40px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// === MÊMES STYLES QUE LE DASHBOARD ===
const styles = {
  guideBtn: { padding: '12px 28px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 8px 25px rgba(239,68,68,0.3)' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { background: 'white', padding: 40, borderRadius: 20, width: '90%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' },
};

const thStyle = { padding: '20px', textAlign: 'left', color: '#991b1b', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' };
const tdStyle = { padding: '20px', color: '#334155' };
const labelStyle = { display: 'block', marginBottom: 8, fontWeight: 600, color: '#475569' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: '1rem', boxSizing: 'border-box' };
