import { useState, useRef, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import { SUPER_ADMIN_ID } from '../utils/constants'

export default function LoginAppleStyle() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  // États du formulaire
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

  // Réf pour l'effet Tilt 3D
  const cardRef = useRef(null)

  // Gestion de l'effet de parallaxe/tilt au mouvement de souris
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { innerWidth, innerHeight } = window;
    const { clientX, clientY } = e;
    
    // Calcul de la rotation (plus on s'éloigne du centre, plus ça tourne)
    const xRotation = ((clientY / innerHeight) - 0.5) * 20; // Max 10 deg
    const yRotation = ((clientX / innerWidth) - 0.5) * 20;
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${-xRotation}deg) rotateY(${yRotation}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    // Remise à zéro fluide
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        // INSCRIPTION
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password
        })
        if (authError) throw authError

        if (authData.user) {
          const { error: dbError } = await supabase
            .from('entreprises')
            .insert([
              {
                nom: companyName,
                email_contact: email,
                owner_id: authData.user.id
              }
            ])

          if (dbError) console.error('Erreur création entreprise:', dbError)
        }

        alert('Compte créé ! Vérifiez vos emails ou connectez-vous.')
        setIsSignUp(false)
        setCompanyName('')
        setPassword('')
      } else {
        // CONNEXION
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        if (data.user?.id === SUPER_ADMIN_ID) {
          navigate('/admin/overview')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="page-wrapper" 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        :root {
          --primary: #f97316; /* Ton Orange */
          --glass-bg: rgba(20, 20, 20, 0.6);
          --glass-border: rgba(255, 255, 255, 0.1);
          --text-main: #ffffff;
          --text-muted: #a1a1aa;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          background: #000;
          font-family: 'Inter', sans-serif;
          color: var(--text-main);
          overflow: hidden; /* Empêche le scroll pendant l'effet */
        }

        /* --- BACKGROUND ANIMÉ --- */
        .page-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: #000;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          z-index: 0;
          animation: float 10s infinite ease-in-out;
        }
        .orb-1 {
          width: 400px; height: 400px;
          background: #4f46e5; /* Indigo */
          top: -100px; left: -100px;
        }
        .orb-2 {
          width: 300px; height: 300px;
          background: #ea580c; /* Orange sombre */
          bottom: -50px; right: -50px;
          animation-delay: -5s;
        }
        .orb-3 {
          width: 200px; height: 200px;
          background: #db2777; /* Rose */
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.3;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        /* --- CARTE GLASSMORPHISM --- */
        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 50px 40px;
          background: var(--glass-bg);
          backdrop-filter: blur(40px); /* L'effet verre givré */
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid var(--glass-border);
          border-radius: 30px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
          z-index: 10;
          transition: transform 0.1s ease-out; /* Fluidité du tilt */
          position: relative;
          overflow: hidden;
        }

        /* Effet de brillance qui traverse la carte */
        .login-card::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          transform: skewX(-25deg);
          animation: shine 8s infinite;
        }
        @keyframes shine {
          0%, 80% { left: -100%; }
          100% { left: 200%; }
        }

        /* --- CONTENU --- */
        .brand-logo {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, #fff, #ccc);
          color: #000;
          border-radius: 18px;
          display: flex; align-items: center; justifyContent: center;
          font-weight: 700; font-size: 24px;
          margin: 0 auto 30px;
          box-shadow: 0 10px 30px rgba(255,255,255,0.1);
        }

        h2 {
          text-align: center;
          font-weight: 600;
          font-size: 28px;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }
        .subtitle {
          text-align: center;
          color: var(--text-muted);
          font-size: 15px;
          margin-bottom: 40px;
          font-weight: 400;
        }

        .input-wrapper {
          position: relative;
          margin-bottom: 20px;
        }
        
        input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 18px 20px;
          border-radius: 16px;
          color: white;
          font-size: 16px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        input::placeholder { color: rgba(255,255,255,0.3); }
        
        input:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.15);
          transform: scale(1.02);
        }

        .toggle-btn {
          position: absolute;
          right: 20px; top: 50%; transform: translateY(-50%);
          background: none; border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .submit-btn {
          width: 100%;
          padding: 18px;
          margin-top: 10px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -10px rgba(249, 115, 22, 0.5);
          background: #ff8534;
        }
        .submit-btn:active { transform: scale(0.98); }

        .footer-switch {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: var(--text-muted);
        }
        .footer-switch span {
          color: white;
          cursor: pointer;
          margin-left: 5px;
          font-weight: 500;
          position: relative;
        }
        .footer-switch span::after {
          content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px;
          background: white; transition: width 0.3s;
        }
        .footer-switch span:hover::after { width: 100%; }

        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          text-align: center;
          margin-top: 20px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* --- RESPONSIVE --- */
        @media (max-width: 600px) {
          .login-card { padding: 30px 24px; margin: 20px; }
          .orb { display: none; } /* On cache les orbes lourds sur mobile */
          .page-wrapper { background: #050505; }
        }
      `}</style>

      {/* Background Elements */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Main Card with 3D Ref */}
      <div className="login-card" ref={cardRef}>
        
        <div className="brand-logo">C</div>
        
        <h2>{isSignUp ? 'Rejoindre l\'élite' : 'Content de vous revoir'}</h2>
        <p className="subtitle">
          {isSignUp 
            ? 'Créez votre espace de pilotage financier.' 
            : 'Entrez vos identifiants pour accéder au dashboard.'}
        </p>

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <div className="input-wrapper" style={{animation: 'fadeIn 0.5s'}}>
              <input
                type="text"
                placeholder="Nom de l'entreprise"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          )}

          <div className="input-wrapper">
            <input
              type="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Masquer' : 'Voir'}
            </button>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span style={{opacity:0.8}}>Connexion...</span>
            ) : isSignUp ? (
              'Créer mon compte'
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {message && <div className="error-msg">{message}</div>}

        <div className="footer-switch">
          {isSignUp ? "Déjà client ?" : "Nouveau ici ?"}
          <span onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}>
            {isSignUp ? "Connexion" : "Créer un compte"}
          </span>
        </div>
      </div>
    </div>
  )
}