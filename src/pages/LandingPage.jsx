import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPagePerfect() {
  return (
    <>
      {/* ===================== CSS 100% RESPONSIVE (Mobile → Desktop → 4K) ===================== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@400;500;700;900&display=swap');

        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Satoshi',sans-serif; background:#fff; color:#0f172a; line-height:1.6; }

        .container { width:100%; max-width:1400px; margin:0 auto; padding:0 20px; }

        /* ===================== HERO ===================== */
        .hero {
          min-height:100vh;
          background:linear-gradient(135deg,#0f172a 0%,#1e293b 70%);
          color:white;
          display:flex;
          align-items:center;
          position:relative;
          padding:120px 0 80px;
          overflow:hidden;
        }
        .hero::before{
          content:''; position:absolute; inset:0;
          background:url('https://images.unsplash.com/photo-1559526324-c1f275fbfa32?w=1600&q=80') center/cover;
          opacity:0.15; z-index:1;
        }
        .hero > div { position:relative; z-index:2; width:100%; }

        .badge{
          background:#10b981; color:white; padding:8px 18px; border-radius:50px;
          font-weight:700; font-size:14px; display:inline-block;
        }
        .hero h1{
          font-size:42px; font-weight:900; line-height:1.1; margin:20px 0 16px;
        }
        .hero h1 span{
          background:linear-gradient(90deg,#f97316,#fbbf24);
          -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .hero p{
          font-size:18px; opacity:0.95; margin-bottom:36px; max-width:90%;
        }
        .btn{
          background:linear-gradient(135deg,#f97316,#ea580c);
          color:white; padding:18px 40px; border-radius:16px;
          font-size:19px; font-weight:800; text-decoration:none;
          display:inline-block; box-shadow:0 12px 30px rgba(249,115,22,0.4);
          transition:all .3s;
        }
        .btn:hover{ transform:translateY(-4px); box-shadow:0 20px 40px rgba(249,115,22,0.5); }

        .dash{
          margin-top:60px; border-radius:20px; overflow:hidden;
          box-shadow:0 25px 60px rgba(0,0,0,0.5); position:relative;
        }
        .dash img{ width:100%; display:block; }
        .live{
          position:absolute; top:16px; right:16px;
          background:#10b981; color:white; padding:10px 20px;
          border-radius:50px; font-weight:900; font-size:15px;
          animation:pulse 2.5s infinite;
        }
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}

        /* ===================== SECTIONS ===================== */
        section{padding:90px 0}
        h2{
          font-size:36px; font-weight:900; text-align:center; margin-bottom:60px;
          background:linear-gradient(90deg,#0f172a,#475569);
          -webkit-background-clip:text; background-clip:text; color:transparent;
        }

        /* Trust bar */
        .trust p{font-size:17px; color:#475569; text-align:center; margin-bottom:30px}
        .logos{display:flex; justify-content:center; gap:30px; flex-wrap:wrap;}
        .logos img{height:50px; filter:grayscale(100%) opacity(0.6);}

        /* Pain points */
        .grid{display:grid; gap:30px;}
        .card{
          background:white; padding:40px 28px; border-radius:24px; text-align:center;
          box-shadow:0 15px 40px rgba(0,0,0,0.08); transition:transform .4s;
        }
        .card:hover{transform:translateY(-10px)}
        .card .ico{font-size:56px; margin-bottom:16px}

        /* Solution blocks */
        .block{
          display:flex; flex-direction:column; gap:40px; margin-bottom:90px;
        }
        .block:nth-child(even){flex-direction:column-reverse}
        .block img{
          width:100%; border-radius:24px;
          box-shadow:0 20px 50px rgba(0,0,0,0.15);
        }
        .block h3{
          font-size:32px; font-weight:900; margin-bottom:16px;
        }

        /* Témoignages */
        .testimonials{background:linear-gradient(135deg,#0f172a,#1e293b); color:white; padding:100px 0}
        .testimonials h2{color:white; background:none}
        .tcard{
          background:rgba(255,255,255,0.1); backdrop-filter:blur(12px);
          border:1px solid rgba(255,255,255,0.15);
          padding:40px; border-radius:28px;
        }
        .tcard p{font-size:20px; line-height:1.7; margin-bottom:28px}

        /* Footer */
        .footer{
          background:#0f172a; color:white; text-align:center;
          padding:120px 20px 80px;
        }
        .footer h2{font-size:36px; color:white; background:none}

        /* ===================== RESPONSIVE ===================== */
        @media(min-width:640px){
          .hero h1{font-size:52px}
          .hero p{font-size:20px}
        }
        @media(min-width:768px){
          .hero h1{font-size:62px}
          .hero p{font-size:24px; max-width:620px}
          .btn{padding:22px 56px; font-size:22px}
          .dash{margin-top:0}
          .hero{display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center}
          .grid{grid-template-columns:repeat(3,1fr); gap:40px}
          .block{flex-direction:row; gap:80px}
          .block:nth-child(even){flex-direction:row-reverse}
        }
        @media(min-width:1024px){
          .container{padding:0 40px}
          h2{font-size:48px}
          .block h3{font-size:40px}
        }
        @media(min-width:1280px){
          .container{padding:0 80px}
          .hero h1{font-size:68px}
        }
      `}</style>

      {/* ===================== JSX ===================== */}
      <header className="hero">
        <div className="container">
          <div>
            <span className="badge">Conforme SYSCOHADA Révisé • 100 % Afrique</span>
            <h1>
              La comptabilité<br />
              devient enfin<br />
              <span>simple et agréable</span>
            </h1>
            <p>
              Gérez factures, trésorerie et déclarations en quelques clics.<br />
              Sans stress. Sans erreur. Sans perdre vos week-ends.
            </p>
            <Link to="/login" className="btn">
              Me connecter → Accéder à mon espace
            </Link>
          </div>

          <div className="dash">
            <img src="https://images.unsplash.com/photo-1559526324-c1f275fbfa32?w=1200&q=80" alt="Tableau de bord" />
            <div className="live">+78 % de productivité</div>
          </div>
        </div>
      </header>

      <section style={{background:'#f8fafc'}}>
        <div className="container">
          <p>Plus de 5 800 entreprises et cabinets d’expertise comptable nous font confiance</p>
          <div className="logos">
            <img src="https://images.unsplash.com/photo-1542744095-291d1f67b221?w=160" alt="" />
            <img src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=160" alt="" />
            <img src="https://images.unsplash.com/photo-1581093458791-9ea94ffa3e0b?w=160" alt="" />
            <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=160" alt="" />
            <img src="https://images.unsplash.com/photo-1519389951290-5b93?w=160" alt="" />
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <h2>Arrêtez de souffrir inutilement</h2>
          <div className="grid">
            <div className="card"><div className="ico">Fear</div><h3>Peur du redressement fiscal</h3><p>Une erreur = amendes coûteuses</p></div>
            <div className="card"><div className="ico">Clock</div><h3>Week-ends perdus</h3><p>Tri de tickets, ressaisie Excel…</p></div>
            <div className="card"><div className="ico">Blind</div><h3>Pilotage à l’aveugle</h3><p>Vous découvrez les pertes trop tard</p></div>
          </div>
        </div>
      </section>

      <section style={{background:'#f8fafc'}}>
        <div className="container">
          <h2>La solution que vous attendiez</h2>

          <div className="block">
            <div>
              <h3>Adieu les boîtes à chaussures</h3>
              <p>Photo → IA classe tout automatiquement : montant, TVA, fournisseur. Archivage légal inclus.</p>
            </div>
            <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900" alt="Scan mobile" />
          </div>

          <div className="block">
            <div>
              <h3>Trésorerie en temps réel</h3>
              <p>Connexion bancaire sécurisée. Vous savez toujours exactement où vous en êtes.</p>
            </div>
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900" alt="Trésorerie" />
          </div>

          <div className="block">
            <div>
              <h3>Facturez et soyez payé instantanément</h3>
              <p>Devis → facture pro → paiement Mobile Money ou carte en 1 clic.</p>
            </div>
            <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900" alt="Facture" />
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <h2>Ce qu’ils en disent</h2>
          <div className="grid">
            <div className="tcard">
              <p>« Je suis passé de 4 jours à 35 minutes par mois. Je revis. »</p>
              <div style={{display:'flex',alignItems:'center',gap:'18px'}}>
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&crop=face" alt="" style={{borderRadius:'50%'}} />
                <div><strong>Fatima Camara</strong><br/><span style={{opacity:0.8}}>CEO – Conakry</span></div>
              </div>
            </div>
            <div className="tcard">
              <p>« On gère 62 entreprises sur une seule plateforme. Incroyable. »</p>
              <div style={{display:'flex',alignItems:'center',gap:'18px'}}>
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&crop=face" alt="" style={{borderRadius:'50%'}} />
                <div><strong>Ibrahim Ndiaye</strong><br/><span style={{opacity:0.8}}>Expert-comptable – Dakar</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <h2>Prêt à reprendre le contrôle de votre comptabilité ?</h2>
          <Link to="/login" className="btn" style={{fontSize:'24px',padding:'26px 70px'}}>
            Me connecter maintenant
          </Link>
          <p style={{marginTop:'40px',opacity:0.9}}>
            © 2025 Compta-SaaS – La référence comptable africaine
          </p>
        </div>
      </footer>
    </>
  );
}
