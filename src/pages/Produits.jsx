// src/pages/Produits.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getEntrepriseForUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';

const formatMoney = (value) => value?.toLocaleString('fr-FR') + ' F' || '0 F';

export default function Produits() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState(null);
  const [produits, setProduits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    nom: '',
    quantite: 0,
    prix_achat: 0,
    prix_vente: 0,
    unite: 'unité',
    seuil_alerte: 5
  });

  useEffect(() => { initData(); }, []);

  async function initData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');

    const ste = await getEntrepriseForUser(user.id, user.email);
    if (ste) {
      setEntreprise(ste);
      fetchProduits(ste.id);
    }
    setLoading(false);
  }

  async function fetchProduits(id) {
    const { data } = await supabase
      .from('produits')
      .select('*')
      .eq('entreprise_id', id)
      .order('nom', { ascending: true });
    setProduits(data || []);
  }

  const filtered = produits.filter(p =>
    p.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (p) => {
    setEditing(p);
    setForm({
      nom: p.nom,
      quantite: p.stock_actuel || 0,
      prix_achat: p.prix_achat || 0,
      prix_vente: p.prix_vente || 0,
      unite: p.unite || 'unité',
      seuil_alerte: p.seuil_alerte || 5
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ nom: '', quantite: 0, prix_achat: 0, prix_vente: 0, unite: 'unité', seuil_alerte: 5 });
  };

  const saveProduit = async (e) => {
    e.preventDefault();
    if (!form.nom || form.prix_vente <= 0) return alert("Veuillez remplir les champs obligatoires");

    try {
      const payload = {
        entreprise_id: entreprise.id,
        nom: form.nom.trim(),
        stock_actuel: Number(form.quantite),
        prix_achat: Number(form.prix_achat),
        prix_vente: Number(form.prix_vente),
        unite: form.unite,
        seuil_alerte: Number(form.seuil_alerte),
        type_produit: 'BIEN'
      };

      if (editing) {
        await supabase.from('produits').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('produits').insert([payload]);
      }

      alert(editing ? "Produit modifié !" : "Produit ajouté !");
      setIsModalOpen(false);
      resetForm();
      fetchProduits(entreprise.id);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const deleteProduit = async (id) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from('produits').delete().eq('id', id);
    fetchProduits(entreprise.id);
  };

  const exportExcel = () => {
    const data = filtered.map(p => ({
      'Produit': p.nom,
      'Stock': p.stock_actuel,
      'Unité': p.unite,
      'Prix Achat': p.prix_achat,
      'Prix Vente': p.prix_vente,
      'Valeur Stock': p.stock_actuel * p.prix_achat,
      'Marge unitaire': p.prix_vente - p.prix_achat
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, `Stock_${entreprise.nom.replace(/ /g, '_')}.xlsx`);
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Chargement des produits...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar entrepriseNom={entreprise?.nom || '...'} userRole={entreprise?.role} />

      <main style={{ marginLeft: 260, padding: 40, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
        <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>Gestion du Stock</h1>
            <p style={{ color: '#64748b', margin: '5px 0 0' }}>Produits, prix et alertes de stock</p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} style={styles.guideBtn}>
              + Ajouter un produit
            </button>
            <button onClick={exportExcel} style={{ ...styles.guideBtn, background: '#10b981' }}>
              Excel
            </button>
          </div>
        </header>

        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: 12,
            border: '2px solid #e2e8f0',
            fontSize: '1rem',
            marginBottom: 30,
            background: 'white'
          }}
        />

        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f0fdf4' }}>
              <tr>
                <th style={thStyle}>Produit</th>
                <th style={{...thStyle, textAlign: 'center'}}>Stock</th>
                <th style={thStyle}>Unité</th>
                <th style={{...thStyle, textAlign: 'right'}}>Prix Achat</th>
                <th style={{...thStyle, textAlign: 'right'}}>Prix Vente</th>
                <th style={{...thStyle, textAlign: 'center'}}>Marge</th>
                <th style={{...thStyle, textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 80, textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem' }}>
                  {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit enregistré'}
                </td></tr>
              ) : filtered.map(p => {
                const marge = p.prix_vente - (p.prix_achat || 0);
                const alerte = p.stock_actuel <= p.seuil_alerte;
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #dcfce7' }}>
                    <td style={{...tdStyle, fontWeight: 700, color: '#166534'}}>{p.nom}</td>
                    <td style={{...tdStyle, textAlign: 'center', fontWeight: 800, color: alerte ? '#dc2626' : '#166534' }}>
                      {p.stock_actuel}
                      {alerte && <span style={{marginLeft: 8, fontSize: '1.2rem'}}>Stock bas</span>}
                    </td>
                    <td style={tdStyle}>{p.unite}</td>
                    <td style={{...tdStyle, textAlign: 'right'}}>{formatMoney(p.prix_achat)}</td>
                    <td style={{...tdStyle, textAlign: 'right', fontWeight: 700, color: '#16a34a'}}>{formatMoney(p.prix_vente)}</td>
                    <td style={{...tdStyle, textAlign: 'center'}}>
                      {marge > 0 ? (
                        <span style={{ padding: '6px 12px', background: '#ecfdf5', color: '#059669', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem' }}>
                          +{marge.toLocaleString()} F
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{...tdStyle, textAlign: 'center'}}>
                      <button onClick={() => handleEdit(p)} style={{ marginRight: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>Modifier</button>
                      <button onClick={() => deleteProduit(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '1.2rem' }}>Supprimer</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL IDENTIQUE AUX AUTRES PAGES */}
      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 30px', color: '#16a34a', fontSize: '1.8rem', fontWeight: 800 }}>
              {editing ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            <form onSubmit={saveProduit}>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Nom du produit *</label>
                <input type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required style={inputStyle} placeholder="Ex: Sac de riz 50kg" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>Stock actuel</label>
                  <input type="number" min="0" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Unité</label>
                  <input type="text" value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} style={inputStyle} placeholder="kg, pièce, carton..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>Prix d'achat (coût)</label>
                  <input type="number" min="0" step="100" value={form.prix_achat} onChange={e => setForm({...form, prix_achat: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Prix de vente *</label>
                  <input type="number" min="0" step="100" value={form.prix_vente} onChange={e => setForm({...form, prix_vente: e.target.value})} required style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 30 }}>
                <label style={labelStyle}>Seuil d'alerte stock bas</label>
                <input type="number" min="0" value={form.seuil_alerte} onChange={e => setForm({...form, seuil_alerte: e.target.value})} style={inputStyle} />
                <small style={{ color: '#64748b', marginTop: 8, display: 'block' }}>
                  Alerte quand le stock descend sous ce nombre
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 32px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '12px 40px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
                  {editing ? 'Mettre à jour' : 'Ajouter le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// === MÊMES STYLES QUE DASHBOARD / FACTURES / DÉPENSES ===
const styles = {
  guideBtn: { padding: '12px 28px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 8px 25px rgba(59,130,246,0.3)' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: 'white', padding: 40, borderRadius: 20, width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' },
};

const thStyle = { padding: '20px', textAlign: 'left', color: '#166534', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' };
const tdStyle = { padding: '20px', color: '#334155' };
const labelStyle = { display: 'block', marginBottom: 8, fontWeight: 600, color: '#475569' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: '1rem', boxSizing: 'border-box' };
