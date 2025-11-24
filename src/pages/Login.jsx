import { useState } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import { SUPER_ADMIN_ID } from '../utils/constants'

export default function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Champs
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
        // --- INSCRIPTION ---
        
        // 1. Création de l'utilisateur Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password
        })
        if (authError) throw authError

        // 2. CRÉATION IMMÉDIATE DE L'ENTREPRISE
        if (authData.user) {
            const { error: dbError } = await supabase
              .from('entreprises')
              .insert([
                { 
                  nom: companyName, 
                  email_contact: email, 
                  owner_id: authData.user.id // <--- LE LIEN CRUCIAL
                }
              ])
            
            if (dbError) {
                console.error("Erreur création entreprise:", dbError)
                // On ne bloque pas, mais on loggue l'erreur
            }
        }

        alert('Compte et Entreprise créés avec succès ! Connectez-vous.')
        setIsSignUp(false) // On bascule vers la connexion pour qu'il se connecte

      } else {
        // --- CONNEXION ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        // Redirection intelligente
        if (data.user.id === SUPER_ADMIN_ID) {
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

  // Styles
  const styles = {
    container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', fontFamily: 'sans-serif' },
    card: { background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', textAlign: 'center' },
    input: { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', marginTop: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>{isSignUp ? 'Démarrer avec Compta-SaaS' : 'Connexion'}</h2>
        
        <form onSubmit={handleAuth}>
          {isSignUp && (
            <input 
              type="text" placeholder="Nom de votre entreprise" required 
              value={companyName} onChange={e => setCompanyName(e.target.value)} 
              style={styles.input} 
            />
          )}

          <input 
            type="email" placeholder="Email professionnel" required 
            value={email} onChange={e => setEmail(e.target.value)} 
            style={styles.input} 
          />

          <div style={{position: 'relative'}}>
            <input 
              type={showPassword ? "text" : "password"} placeholder="Mot de passe" required 
              value={password} onChange={e => setPassword(e.target.value)} 
              style={styles.input} 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: 10, top: 12, border: 'none', background: 'none', cursor: 'pointer'}}>
                {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Traitement...' : (isSignUp ? "Créer mon espace" : "Se connecter")}
          </button>
        </form>

        {message && <p style={{color: 'red', marginTop: 10}}>{message}</p>}

        <p style={{marginTop: 20, color: '#64748b', fontSize: '0.9rem'}}>
          <span onClick={() => setIsSignUp(!isSignUp)} style={{color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold'}}>
            {isSignUp ? "J'ai déjà un compte" : "Créer un nouveau compte"}
          </span>
        </p>
      </div>
    </div>
  )
}
