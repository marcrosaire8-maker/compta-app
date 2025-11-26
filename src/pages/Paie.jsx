// src/pages/Paie.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatMoney = (value) => value?.toLocaleString('fr-FR') + ' F' || '0 F';

export default function Paie() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [bulletins, setBulletins] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    employe_id: '',
    mois: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    salaire_base: 0,
    primes: 0,
    cotisations: 0,
    impots: 0
  });

  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');

    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      await Promise.all([fetchBulletins(ste.id), fetchEmployes(ste.id)]);
    }
    setLoading(false);
  }

  async function fetchBulletins(id) {
    const { data } = await supabase
      .from('fiches_paie')
      .select('*')
      .eq('entreprise_id', id)
      .order('created_at', { ascending: false });
    setBulletins(data || []);
  }

  async function fetchEmployes(id) {
    const { data } = await supabase
      .from('tiers')
      .select('id, nom_complet')
      .eq('entreprise_id', id)
      .eq('type_tier', 'EMPLOYE');
    setEmployes(data || []);
  }

  const brut = Number(form.salaire_base) + Number(form.primes);
  const net = brut - Number(form.cotisations) - Number(form.impots);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.employe_id) return alert("Veuillez sélectionner un employé");

    try {
      const employe = employes.find(e => e.id === form.employe_id);
      const payload = {
        entreprise_id: entreprise.id,
        employe_id: form.employe_id,
        employe_nom: employe?.nom_complet || 'Inconnu',
        mois: form.mois,
        salaire_base: Number(form.salaire_base),
        primes: Number(form.primes),
        salaire_brut: brut,
        cotisations_sociales: Number(form.cotisations),
        impots_revenu: Number(form.impots),
        salaire_net: net,
        est_comptabilise: false
      };

      await supabase.from('fiches_paie').insert([payload]);
      alert("Bulletin de paie créé !");
      setIsModalOpen(false);
      setForm({
        employe_id: '',
        mois: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        salaire_base: 0,
        primes: 0,
        cotisations: 0,
        impots: 0
      });
      fetchBulletins(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  }

  const generatePDF = (b) => {
    const doc = bastante(new jsPDF());

    doc.setFontSize(20);
    doc.text("BULLETIN DE PAIE", 105, 25, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Employeur : ${entreprise?.nom || 'Entreprise'}`, 14, 40);
    doc.text(`Employé : ${b.employe_nom}`, 14, 48);
    doc.text(`Période : ${b.mois}`, 14, 56);

    autoTable(doc, {
      startY: 70,
      head: [['Rubrique', 'Montant']],
      body: [
        ['Salaire de base', formatMoney(b.salaire_base)],
        ['Primes & indemnités', formatMoney(b.primes)],
        ['Salaire BRUT', { content: formatMoney(b.salaire_brut), styles: { fontStyle: 'bold' } }],
        ['Cotisations sociales', formatMoney(b.cotisations_sociales)],
        ['Impôts sur le revenu', formatMoney(b.impots_revenu)],
        ['NET À PAYER', { content: formatMoney(b.salaire_net), styles: { fillColor: [220, 252, 231], fontStyle: 'bold', textColor: [22, 101, 52] } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      styles: { cellPadding: 6, fontSize: 11 }
    });

    doc.save(`Bulletin_${b.employe_nom.replace(/ /g, '_')}_${b.mois}.pdf`);
  };

  const comptabiliser = async (b) => {
    if (!confirm("Comptabiliser ce bulletin dans le journal ?")) return;
    try {
      const { data: ecriture } = await supabase
        .from('ecritures_comptables')
        .insert([{
          entreprise_id: entreprise.id,
          date_ecriture: new Date().toISOString().split('T')[0],
          libelle: `Paie ${b.mois} - ${b.employe_nom}`,
          journal_code: 'OD'
        }])
        .select()
        .single();

      // À améliorer avec vrais comptes (ex: 641, 421, 445)
      await supabase.from('lignes_ecriture').insert([
        { ecriture_id: ecriture.id, debit: b.salaire_brut, credit: 0, compte_id: null },
        { ecriture_id: ecriture.id, debit: 0, credit: b.salaire_net, compte_id: null }
      ]);

      await supabase.from('fiches_paie').update({ est_comptabilise: true }).eq('id', b.id);
      fetchBulletins(entreprise.id);
      alert("Écriture comptable générée !");
    } catch (err) {
      alert("Erreur comptabilisation : " + err.message);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Chargement de la paie...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar entrepriseNom={entreprise?.nom || '...'} userRole={entreprise?.role} />

      <main style={{ marginLeft: 260, padding: 40, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
        <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>Gestion de la Paie</h1>
            <p style={{ color: '#64748b', margin: '5px 0 0' }}>Bulletins de salaire et comptabilisation automatique</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={styles.guideBtn}>
            Nouveau Bulletin
          </button>
        </header>

        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#eef2ff' }}>
              <tr>
                <th style={thStyle}>Période</th>
                <th style={thStyle}>Employé</th>
                <th style={{...thStyle, textAlign: 'right'}}>Brut</th>
                <th style={{...thStyle, textAlign: 'right'}}>Net à payer</th>
                <th style={{...thStyle, textAlign: 'center'}}>Statut</th>
                <th style={{...thStyle, textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bulletins.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 80, textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem' }}>
                  Aucun bulletin de paie généré
                </td></tr>
              ) : bulletins.map(b => (
                <tr key={b.id} style={{ borderTop: '1px solid #c7d2fe' }}>
                  <td style={{...tdStyle, fontWeight: 600 }}>{b.mois}</td>
                  <td style={{...tdStyle, fontWeight: 700, color: '#4338ca' }}>{b.employe_nom}</td>
                  <td style={{...tdStyle, textAlign: 'right' }}>{formatMoney(b.salaire_brut)}</td>
                  <td style={{...tdStyle, textAlign: 'right', color: '#16a34a', fontWeight: 800 }}>
                    {formatMoney(b.salaire_net)}
                  </td>
                  <td style={{...tdStyle, textAlign: 'center' }}>
                    {b.est_comptabilise ? (
                      <span style={{ padding: '6px 12px', background: '#ecfdf5', color: '#059669', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem' }}>
                        Comptabilisé
                      </span>
                    ) : (
                      <span style={{ padding: '6px 12px', background: '#fff7ed', color: '#ea580c', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem' }}>
                        En attente
                      </span>
                    )}
                  </td>
                  <td style={{...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => generatePDF(b)} style={{ marginRight: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>PDF</button>
                    {!b.est_comptabilise && (
                      <button onClick={() => comptabiliser(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontWeight: 700 }}>
                        Comptabiliser
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL IDENTIQUE AUX AUTRES PAGES */}
      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 30px', color: '#4f46e5', fontSize: '1.8rem', fontWeight: 800 }}>Nouveau Bulletin de Paie</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Employé *</label>
                <select value={form.employe_id} onChange={e => setForm({...form, employe_id: e.target.value})} required style={inputStyle}>
                  <option value="">-- Sélectionner un employé --</option>
                  {employes.map(e => <option key={e.id} value={e.id}>{e.nom_complet}</option>)}
                </select>
                {employes.length === 0 && <small style={{color:'#ef4444', marginTop:8, display:'block'}}>Aucun employé. Ajoutez-en dans "Tiers" (type EMPLOYE)</small>}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Période</label>
                <input type="text" value={form.mois} onChange={e => setForm({...form, mois: e.target.value})} style={inputStyle} placeholder="ex: Juin 2025" />
              </div>

              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Salaire de base</label>
                    <input type="number" value={form.salaire_base} onChange={e => setForm({...form, salaire_base: e.target.value})} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Primes & indemnités</label>
                    <input type="number" value={form.primes} onChange={e => setForm({...form, primes: e.target.value})} style={inputStyle} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '1.3rem', fontWeight: 800, color: '#4f46e5' }}>
                  Salaire BRUT : {formatMoney(brut)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>Cotisations sociales (CNSS, etc.)</label>
                  <input type="number" value={form.cotisations} onChange={e => setForm({...form, cotisations: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Impôts sur le revenu (IRPP)</label>
                  <input type="number" value={form.impots} onChange={e => setForm({...form, impots: e.target.value})} style={inputStyle} />
                </div>
              </div>

              <div style={{ background: '#ecfdf5', padding: 20, borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', color: '#166534', marginBottom: 8 }}>NET À PAYER</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#166534' }}>
                  {formatMoney(net)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 30 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 32px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '12px 40px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
                  Créer le bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// === MÊMES STYLES QUE TOUTES LES AUTRES PAGES ===
const styles = {
  guideBtn: { padding: '12px 28px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 8px 25px rgba(79,70,229,0.3)' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: 'white', padding: 40, borderRadius: 20, width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' },
};

const thStyle = { padding: '20px', textAlign: 'left', color: '#4338ca', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' };
const tdStyle = { padding: '20px', color: '#334155' };
const labelStyle = { display: 'block', marginBottom: 8, fontWeight: 600, color: '#475569' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: '1rem', boxSizing: 'border-box' };
