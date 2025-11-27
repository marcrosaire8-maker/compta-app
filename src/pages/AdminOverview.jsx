import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';

/* --- ICONS (Refined Style) --- */
const Icons = {
  Building: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4" /></svg>,
  Bill: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Sun: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
  Moon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
};

export default function AdminOverview() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('admin-theme') || 'light');
  
  // Parallax State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Fetch Data
    (async () => {
      try {
        const { data: rpcData, error } = await supabase.rpc('get_companies_activity');
        if (error) throw error;
        setData(rpcData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Theme Handling
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  // Parallax Effect Handler
  const handleMouseMove = (e) => {
    // Calcul de la position normalisée (-1 à 1)
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const filtered = data.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.email_contact?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCompanies = data.length;
  const totalFactures = data.reduce((a, c) => a + (c.total_factures || 0), 0);
  const totalUsers = data.reduce((a, c) => a + (c.total_users || 0), 0);

  const isDark = theme === 'dark';

  return (
    <div className="admin-wrapper" onMouseMove={handleMouseMove}>
      <style>{`
        :root {
          --bg-primary: ${isDark ? '#0a0a0a' : '#f4f4f7'};
          --text-primary: ${isDark ? '#ffffff' : '#1d1d1f'};
          --text-secondary: ${isDark ? '#a1a1a6' : '#86868b'};
          --accent-glow: ${isDark ? 'rgba(255, 59, 48, 0.4)' : 'rgba(0, 113, 227, 0.3)'};
          
          /* Glassmorphism Variables */
          --glass-bg: ${isDark ? 'rgba(20, 20, 20, 0.6)' : 'rgba(255, 255, 255, 0.65)'};
          --glass-border: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'};
          --glass-shine: ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)'};
          --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'});
        }

        body { margin: 0; overflow-x: hidden; background: var(--bg-primary); transition: background 0.5s ease; }

        /* --- BACKGROUND AURORA ANIMATION --- */
        .ambient-light {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0;
          pointer-events: none; overflow: hidden;
        }
        .blob {
          position: absolute; border-radius: 50%; filter: blur(80px); opacity: ${isDark ? '0.2' : '0.4'};
          transition: transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1); /* Lag effect for parallax */
        }
        .blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #ff3b30; animation: float 20s infinite alternate; }
        .blob-2 { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: #007aff; animation: float 25s infinite alternate-reverse; }
        .blob-3 { top: 40%; left: 40%; width: 40vw; height: 40vw; background: #ac39ff; animation: float 30s infinite linear; }

        @keyframes float { from { transform: translate(0,0) rotate(0deg); } to { transform: translate(50px, 50px) rotate(10deg); } }

        /* --- LAYOUT --- */
        .admin-wrapper {
          position: relative; min-height: 100vh; padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--text-primary); z-index: 1;
        }
        .container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 2; }

        /* --- HEADER & TOGGLE --- */
        .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3rem; }
        .title-group { animation: slideDown 0.6s ease-out; }
        .title-group h1 {
          font-size: 2.5rem; font-weight: 800; margin: 0; letter-spacing: -1px;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .title-group p { font-size: 1rem; color: var(--text-secondary); margin-top: 5px; font-weight: 500; }

        .theme-toggle {
          background: var(--glass-bg); border: 1px solid var(--glass-border);
          backdrop-filter: blur(20px); width: 44px; height: 44px; border-radius: 50%;
          display: flex; alignItems: center; justify-content: center; cursor: pointer;
          color: var(--text-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .theme-toggle:hover { transform: rotate(15deg) scale(1.1); box-shadow: 0 8px 20px var(--accent-glow); }

        /* --- STATS CARDS (3D TILT) --- */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
        
        .glass-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-xl);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-radius: 24px; padding: 1.5rem;
          position: relative; overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.1, 0.9, 0.2, 1), box-shadow 0.4s ease;
          animation: fadeSlideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        .glass-card:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 30px 60px -10px var(--accent-glow); border-color: var(--text-secondary); }
        .glass-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(120deg, transparent, var(--glass-shine), transparent);
          opacity: 0.5; pointer-events: none;
        }

        .stat-icon-box {
          width: 50px; height: 50px; border-radius: 14px;
          background: linear-gradient(135deg, ${isDark ? '#333' : '#fff'}, ${isDark ? '#111' : '#f0f0f0'});
          display: flex; align-items: center; justify-content: center;
          color: ${isDark ? '#fff' : '#000'}; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
        }
        .stat-value { font-size: 2.2rem; font-weight: 800; letter-spacing: -1px; margin: 0.2rem 0; }
        .stat-label { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 1px; }

        /* --- TABLE SECTION --- */
        .table-section {
          background: var(--glass-bg); border: 1px solid var(--glass-border);
          border-radius: 24px; padding: 1.5rem; overflow: hidden;
          backdrop-filter: blur(30px); box-shadow: var(--shadow-xl);
          animation: fadeSlideUp 0.8s ease-out forwards; opacity: 0; animation-delay: 0.2s;
        }

        .search-bar-wrapper {
          position: relative; max-width: 400px; margin-bottom: 1.5rem;
        }
        .search-input {
          width: 100%; padding: 12px 12px 12px 45px;
          background: ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)'};
          border: 1px solid var(--glass-border); border-radius: 12px;
          color: var(--text-primary); font-size: 0.95rem;
          transition: all 0.3s;
        }
        .search-input:focus { outline: none; border-color: var(--text-primary); box-shadow: 0 0 0 4px var(--accent-glow); }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); width: 18px; }

        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        th {
          text-align: left; padding: 1rem; color: var(--text-secondary);
          font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          border-bottom: 1px solid var(--glass-border);
        }
        td { padding: 1.2rem 1rem; border-bottom: 1px solid var(--glass-border); font-size: 0.95rem; font-weight: 500; transition: background 0.2s; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}; }

        /* --- BADGES --- */
        .badge { padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: inline-block; }
        .badge.intensif { background: rgba(255, 59, 48, 0.15); color: #ff3b30; border: 1px solid rgba(255, 59, 48, 0.3); }
        .badge.actif { background: rgba(52, 199, 89, 0.15); color: #34c759; border: 1px solid rgba(52, 199, 89, 0.3); }
        .badge.calme { background: rgba(255, 149, 0, 0.15); color: #ff9500; border: 1px solid rgba(255, 149, 0, 0.3); }
        .badge.inactif { background: rgba(142, 142, 147, 0.15); color: #8e8e93; border: 1px solid rgba(142, 142, 147, 0.3); }

        /* --- ANIMATIONS KEYFRAMES --- */
        @keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* --- RESPONSIVE --- */
        @media (max-width: 768px) {
          .admin-wrapper { padding: 1rem; }
          thead { display: none; }
          tr { display: block; margin-bottom: 1rem; background: rgba(0,0,0,0.02); border-radius: 12px; padding: 1rem; }
          td { display: flex; justify-content: space-between; padding: 0.5rem 0; border: none; }
          td::before { content: attr(data-label); color: var(--text-secondary); font-size: 0.8rem; font-weight: 600; }
        }
      `}</style>

      {/* --- PARALLAX BACKGROUND BLOBS --- */}
      <div className="ambient-light">
        <div className="blob blob-1" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }} />
        <div className="blob blob-2" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }} />
        <div className="blob blob-3" />
      </div>

      <div className="container">
        
        {/* HEADER */}
        <div className="top-bar">
          <div className="title-group">
            <h1>Monitoring</h1>
            <p>Vue d'ensemble en temps réel</p>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title="Changer le mode">
            {isDark ? <Icons.Sun /> : <Icons.Moon />}
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="stats-grid">
          <StatCard 
            title="Entreprises" 
            value={totalCompanies} 
            icon={<Icons.Building />} 
            delay="0s" 
            trend="+2 this week"
          />
          <StatCard 
            title="Factures émises" 
            value={totalFactures.toLocaleString()} 
            icon={<Icons.Bill />} 
            delay="0.1s"
            trend="Vol. élevé"
          />
          <StatCard 
            title="Utilisateurs" 
            value={totalUsers} 
            icon={<Icons.Users />} 
            delay="0.2s"
          />
        </div>

        {/* TABLEAU */}
        <div className="table-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Activité Récente</h3>
            <div className="search-bar-wrapper">
              <div className="search-icon"><Icons.Search /></div>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Rechercher une entreprise..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement des données...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    <th>Contact</th>
                    <th>Factures</th>
                    <th>Dernière Synchro</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, index) => (
                    <tr key={c.id} style={{ animation: `fadeSlideUp 0.3s ease-out forwards`, animationDelay: `${index * 0.05}s`, opacity: 0 }}>
                      <td data-label="Entreprise">
                        <div style={{ fontWeight: '700', color: isDark ? '#fff' : '#000' }}>{c.nom}</div>
                      </td>
                      <td data-label="Contact" style={{ color: 'var(--text-secondary)' }}>{c.email_contact}</td>
                      <td data-label="Factures">
                        <span style={{ fontWeight: '700', fontFamily: 'monospace', fontSize: '1rem' }}>{c.total_factures || 0}</span>
                      </td>
                      <td data-label="Dernière Synchro">
                        {c.derniere_activite ? new Date(c.derniere_activite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '-'}
                      </td>
                      <td data-label="État">
                        {getStatusBadge(c.derniere_activite, c.total_factures)}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        Aucune entreprise trouvée pour "{search}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function StatCard({ title, value, icon, delay, trend }) {
  return (
    <div className="glass-card" style={{ animationDelay: delay }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-icon-box">{icon}</div>
          <div className="stat-label">{title}</div>
          <div className="stat-value">{value}</div>
        </div>
        {trend && (
           <div style={{ 
             fontSize: '0.75rem', fontWeight: '700', 
             color: '#34c759', background: 'rgba(52, 199, 89, 0.1)', 
             padding: '4px 8px', borderRadius: '8px' 
           }}>
             {trend}
           </div>
        )}
      </div>
    </div>
  );
}

function getStatusBadge(date, factures) {
  if (!date) return <span className="badge inactif">Inactif</span>;
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

  if (factures > 1000) return <span className="badge intensif">Intensif</span>;
  if (days < 7) return <span className="badge actif">Actif</span>;
  if (days < 30) return <span className="badge calme">Calme</span>;
  return <span className="badge inactif">Inactif</span>;
}
