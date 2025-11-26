import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import { SUPER_ADMIN_ID } from '../utils/constants'

export default function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

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

        alert('Compte et entreprise créés avec succès ! Connectez-vous maintenant.')
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
      setMessage('Erreur : ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ==== DESIGN PREMIUM – 100% JS / JSX ==== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@400;500;700;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Satoshi', sans-serif; background: #0f172a; }

        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 70%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        .login-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('https://images.unsplash.com/photo-1559526324-c1f275fbfa32?w=1600&q=70') center/cover;
          opacity: 0.1;
          z-index: 1;
        }

        .card {
          background: white;
          width: 100%;
          max-width: 440px;
          border-radius: 28px;
          padding: 48px 40px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.4);
          position: relative;
          z-index: 2;
        }

        .logo {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-radius: 20px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          color: white;
          font-weight: 900;
        }

        h2 {
          font-size: 32px;
          font-weight: 900;
          text-align: center;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .subtitle {
          text-align: center;
          color: #64748b;
          font-size: 16px;
          margin-bottom: 32px;
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }
        input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 16px;
          background: #f8fafc;
          transition: all 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #f97316;
          background: white;
          box-shadow: 0 0 0 4px rgba(249,115,22,0.1);
        }

        .toggle-pass {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }

        .btn-primary {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 10px;
        }
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(249,115,22,0.4);
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .switch {
          text-align: center;
          margin-top: 28px;
          color: #64748b;
          font-size: 15px;
        }
        .switch span {
          color: #f97316;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }

        .error {
          color: #ef4444;
          font-size: 14px;
          margin-top: 12px;
          text-align: center;
        }

        @media (max-width: 480px) {
          .card { padding: 40px 28px; border-radius: 20px; }
          h2 { font-size: 28px; }
        }
      `}</style>

      <div className="login-page">
        <div className="card">
          {/* Tu peux remplacer "C" par ton logo réel */}
          <div className="logo">C</div>

          <h2>{isSignUp ? 'Créer votre espace' : 'Bienvenue'}</h2>
          <p className="subtitle">
            {isSignUp ? 'Démarrez en 30 secondes' : 'Connectez-vous à votre comptabilité intelligente'}
          </p>

          <form onSubmit={handleAuth}>
            {isSignUp && (
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Nom de votre entreprise"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            )}

            <div className="input-group">
              <input
                type="email"
                placeholder="Email professionnel"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? 'Traitement en cours...'
                : isSignUp
                ? 'Créer mon espace'
                : 'Se connecter'}
            </button>
          </form>

          {message && <p className="error">{message}</p>}

          <div className="switch">
            {isSignUp ? "Vous avez déjà un compte ? " : "Pas encore de compte ? "}
            <span onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}>
              {isSignUp ? "Se connecter" : "Créer un espace"}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
