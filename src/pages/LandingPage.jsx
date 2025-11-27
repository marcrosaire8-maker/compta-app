import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPageAppleStyle() {
  // Hook pour l'effet d'apparition au scroll
  const useIntersectionObserver = (options) => {
    const [elements, setElements] = useState([]);
    
    useEffect(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      }, options);

      const targets = document.querySelectorAll('.reveal');
      targets.forEach((el) => observer.observe(el));

      return () => {
        targets.forEach((el) => observer.unobserve(el));
      };
    }, [options]);
  };

  useIntersectionObserver({ threshold: 0.1 });

  // Hook pour l'effet 3D de la souris sur le Hero
  const heroRef = useRef(null);
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 20; // Degrés de rotation
    const y = (clientY / innerHeight - 0.5) * 20;
    
    if (heroRef.current) {
      heroRef.current.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg) scale(1.02)`;
    }
  };

  const handleMouseLeave = () => {
    if (heroRef.current) {
      heroRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)`;
    }
  };

  return (
    <>
      {/* ===================== GLOBAL STYLES & ANIMATIONS ===================== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

        :root {
          --bg-dark: #000000;
          --bg-panel: #121212;
          --accent: #2563eb;
          --text-main: #f5f5f7;
          --text-muted: #86868b;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
          background-color: var(--bg-dark); 
          color: var(--text-main); 
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .container { 
          width: 100%; 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 0 24px; 
          position: relative;
          z-index: 2;
        }

        /* --- ANIMATIONS CLASSES --- */
        .reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .delay-100 { transition-delay: 0.1s; }
        .delay-200 { transition-delay: 0.2s; }
        .delay-300 { transition-delay: 0.3s; }

        /* --- BUTTONS --- */
        .btn-apple {
          background: #fff;
          color: #000;
          padding: 16px 32px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 17px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-apple:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(255,255,255,0.3);
        }
        .btn-link {
          color: #2997ff;
          text-decoration: none;
          font-size: 19px;
          font-weight: 500;
        }
        .btn-link:hover { text-decoration: underline; }

        /* ===================== HERO SECTION ===================== */
        .hero {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding-top: 80px;
        }
        
        .hero-bg {
          position: absolute;
          top: -20%; left: -20%; right: -20%; bottom: -20%;
          background: radial-gradient(circle at 50% 50%, #1a1a2e 0%, #000000 60%);
          z-index: 1;
        }
        
        /* Floating blurred orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 1;
          opacity: 0.4;
          animation: float 20s infinite ease-in-out;
        }
        .orb-1 { width: 400px; height: 400px; background: #2563eb; top: 10%; left: 20%; animation-delay: 0s; }
        .orb-2 { width: 300px; height: 300px; background: #7c3aed; bottom: 20%; right: 10%; animation-delay: -5s; }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -50px); }
        }

        .hero-content {
          text-align: center;
          z-index: 10;
          max-width: 900px;
        }

        h1 {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          background: linear-gradient(180deg, #fff 0%, #aaa 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .subtitle {
          font-size: 24px;
          color: var(--text-muted);
          line-height: 1.5;
          max-width: 600px;
          margin: 0 auto 40px;
          font-weight: 400;
        }

        .hero-dashboard-container {
          margin-top: 60px;
          perspective: 1000px;
          display: flex;
          justify-content: center;
        }

        .hero-dashboard {
          width: 90%;
          max-width: 1000px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8);
          border: 1px solid rgba(255,255,255,0.1);
          transition: transform 0.1s ease-out; /* Smooth movement */
          position: relative;
        }
        
        .hero-dashboard::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 70%);
          background-size: 200% 100%;
          animation: shine 6s infinite linear;
          pointer-events: none;
        }

        @keyframes shine { 0% {background-position: 200% 0} 100% {background-position: -200% 0} }

        .hero-dashboard img { width: 100%; display: block; }

        /* ===================== LOGOS ===================== */
        .marquee {
          background: #000;
          padding: 60px 0;
          overflow: hidden;
          border-bottom: 1px solid #222;
        }
        .track {
          display: flex;
          gap: 60px;
          width: max-content;
          animation: scroll 30s linear infinite;
        }
        .track img { height: 30px; opacity: 0.5; filter: grayscale(100%); }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        /* ===================== BENTO GRID (FEATURES) ===================== */
        .section-header { text-align: center; margin-bottom: 80px; padding-top: 120px; }
        h2 { font-size: 42px; font-weight: 700; color: #fff; margin-bottom: 16px; letter-spacing: -0.01em; }
        
        .bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        
        .bento-card {
          background: #161617;
          border-radius: 30px;
          padding: 40px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.3s;
        }
        .bento-card:hover { transform: scale(1.02); z-index: 2; }
        
        .bento-card h3 { font-size: 28px; margin-bottom: 12px; color: #fff; }
        .bento-card p { color: var(--text-muted); font-size: 17px; margin-bottom: 30px; }
        .bento-card img { 
          width: 100%; 
          border-radius: 12px; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }

        .large-card { grid-column: span 1; min-height: 500px; }
        
        /* ===================== TESTIMONIALS ===================== */
        .reviews {
          padding: 150px 0;
          background: #000;
          text-align: center;
        }
        .review-card {
          background: linear-gradient(180deg, #1c1c1e 0%, #111 100%);
          padding: 50px;
          border-radius: 30px;
          max-width: 800px;
          margin: 0 auto 30px;
          border: 1px solid #333;
        }
        .review-text {
          font-size: 28px;
          font-weight: 500;
          line-height: 1.4;
          background: linear-gradient(90deg, #fff, #999);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* ===================== FOOTER ===================== */
        .footer-cta {
          padding: 150px 0;
          text-align: center;
          background: radial-gradient(circle at center, #1a1a1a 0%, #000 70%);
        }

        /* ===================== RESPONSIVE ===================== */
        @media(min-width: 768px) {
          h1 { font-size: 72px; }
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .large-card { grid-column: span 2; }
          .hero-dashboard-container { margin-top: 80px; }
        }
        
        @media(min-width: 1024px) {
          h1 { font-size: 86px; }
          .container { padding: 0 40px; }
        }
      `}</style>

      {/* ===================== HERO SECTION ===================== */}
      <header className="hero" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <div className="hero-bg">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
        </div>

        <div className="container">
          <div className="hero-content reveal">
            <span style={{color:'#f59e0b', fontWeight:600, fontSize:'14px', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'20px', display:'block'}}>
              SYSCOHADA Révisé • Édition 2025
            </span>
            <h1>
              La comptabilité.<br />
              <span style={{opacity:0.6}}>Réinventée.</span>
            </h1>
            <p className="subtitle reveal delay-100">
              Gérez factures, trésorerie et déclarations avec une élégance jamais vue. 
              Puissant pour les experts. Simple pour tous.
            </p>
            <div className="reveal delay-200">
              <Link to="/login" className="btn-apple">
                Commencer maintenant
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>

          <div className="hero-dashboard-container reveal delay-300">
            <div className="hero-dashboard" ref={heroRef}>
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80" alt="Interface Dashboard" />
            </div>
          </div>
        </div>
      </header>

      {/* ===================== TRUST MARQUEE ===================== */}
      <div className="marquee">
        {/* <div className="track">
          {[1,2,3,4,5,6,1,2,3,4,5,6].map((i, index) => (
            <img key={index} src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=200&h=50&fit=crop`} alt="Logo" style={{opacity:0.4}} />
          ))}
          <span style={{color:'#333', fontSize:'20px', fontWeight:800, alignSelf:'center'}}>ORABANK</span>
          <span style={{color:'#333', fontSize:'20px', fontWeight:800, alignSelf:'center'}}>MOOV AFRICA</span>
          <span style={{color:'#333', fontSize:'20px', fontWeight:800, alignSelf:'center'}}>MTN BUSINESS</span>
          <span style={{color:'#333', fontSize:'20px', fontWeight:800, alignSelf:'center'}}>BOA GROUP</span>
          <span style={{color:'#333', fontSize:'20px', fontWeight:800, alignSelf:'center'}}>CANAL+</span>
           <span style={{color:'#333', fontSize:'20px', fontWeight:800, alignSelf:'center'}}>ORABANK</span>
          <span style={{color:'#333', fontSize:'20px', fontWeight:800, alignSelf:'center'}}>MOOV AFRICA</span>
        </div> */}
      </div>

      {/* ===================== PROBLEMS (FADE IN) ===================== */}
      <section className="container" style={{paddingTop:'150px', paddingBottom:'150px'}}>
        <div className="reveal">
          <h2 style={{textAlign:'center', maxWidth:'700px', margin:'0 auto 60px'}}>
            La comptabilité ne devrait pas être une source d'anxiété.
          </h2>
        </div>
        
        <div className="bento-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))'}}>
          <div className="bento-card reveal delay-100" style={{background:'transparent', border:'none', padding:'20px'}}>
            <div style={{fontSize:'40px', marginBottom:'20px'}}>😰</div>
            <h3>Peur du fisc</h3>
            <p>La crainte constante d'une erreur de saisie ou d'un redressement coûteux.</p>
          </div>
          <div className="bento-card reveal delay-200" style={{background:'transparent', border:'none', padding:'20px'}}>
             <div style={{fontSize:'40px', marginBottom:'20px'}}>⏳</div>
            <h3>Temps perdu</h3>
            <p>Des week-ends entiers sacrifiés à trier des tickets et remplir des fichiers Excel.</p>
          </div>
          <div className="bento-card reveal delay-300" style={{background:'transparent', border:'none', padding:'20px'}}>
             <div style={{fontSize:'40px', marginBottom:'20px'}}>📉</div>
            <h3>Pilotage aveugle</h3>
            <p>Aucune visibilité réelle sur la trésorerie avant qu'il ne soit trop tard.</p>
          </div>
        </div>
      </section>

      {/* ===================== BENTO GRID SOLUTION ===================== */}
      <section style={{background:'#0a0a0a', padding:'100px 0'}}>
        <div className="container">
          <div className="section-header reveal">
            <span style={{color:'#2997ff', fontWeight:600}}>Fonctionnalités</span>
            <h2>Tout ce dont vous avez besoin.<br/>Rien de superflu.</h2>
          </div>

          <div className="bento-grid">
            {/* Feature 1 */}
            <div className="bento-card large-card reveal">
              <div>
                <h3>Intelligence Artificielle Comptable</h3>
                <p>Prenez une photo. L'IA extrait le montant, la TVA et le fournisseur. Archivage automatique et légal.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1000&q=80" alt="AI Scan" style={{height:'400px', objectFit:'cover'}} />
            </div>

            {/* Feature 2 */}
            <div className="bento-card reveal delay-100">
              <h3>Trésorerie temps réel</h3>
              <p>Connecté à toutes les banques UEMOA/CEMAC. Visualisez votre cash disponible instantanément.</p>
              <div style={{flexGrow:1, background:'#222', borderRadius:'12px', marginTop:'20px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600" alt="Chart" style={{opacity:0.8}} />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bento-card reveal delay-200">
              <h3>Paiements Intégrés</h3>
              <p>Acceptez Mobile Money et Cartes Bancaires directement depuis vos factures PDF.</p>
              <div style={{flexGrow:1, background:'#222', borderRadius:'12px', marginTop:'20px', position:'relative', overflow:'hidden'}}>
                 <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600" alt="Payment" style={{opacity:0.8, width:'100%', height:'100%', objectFit:'cover'}} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="reviews">
        <div className="container">
          <div className="review-card reveal">
            <p className="review-text">
              "Je suis passé de 4 jours de comptabilité par mois à seulement 35 minutes. C'est magique."
            </p>
            <div style={{marginTop:'30px', display:'flex', alignItems:'center', justifyContent:'center', gap:'15px'}}>
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face" alt="Avatar" style={{borderRadius:'50%'}} />
              <div style={{textAlign:'left'}}>
                <div style={{color:'white', fontWeight:'600'}}>Fatima Camara</div>
                <div style={{color:'#666', fontSize:'14px'}}>CEO, Conakry</div>
              </div>
            </div>
          </div>

          <div className="review-card reveal delay-100" style={{marginTop:'40px', transform:'scale(0.95)', opacity:0.8}}>
            <p className="review-text" style={{fontSize:'24px'}}>
              "Enfin un logiciel adapté à l'OHADA qui ne ressemble pas à Windows 95."
            </p>
            <div style={{marginTop:'30px', display:'flex', alignItems:'center', justifyContent:'center', gap:'15px'}}>
               <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face" alt="Avatar" style={{borderRadius:'50%'}} />
              <div style={{textAlign:'left'}}>
                <div style={{color:'white', fontWeight:'600'}}>Ibrahim Ndiaye</div>
                <div style={{color:'#666', fontSize:'14px'}}>Expert-Comptable, Dakar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER CTA ===================== */}
      <footer className="footer-cta">
        <div className="container reveal">
          <h2 style={{fontSize:'56px', marginBottom:'40px'}}>
            Reprenez le contrôle.
          </h2>
          <Link to="/login" className="btn-apple" style={{padding:'24px 50px', fontSize:'22px'}}>
            Commencer l'essai gratuit
          </Link>
          <p style={{marginTop:'60px', color:'#444', fontSize:'14px'}}>
            © 2025 Compta-SaaS. Conçu avec passion pour l'Afrique.
          </p>
        </div>
      </footer>
    </>
  );
}