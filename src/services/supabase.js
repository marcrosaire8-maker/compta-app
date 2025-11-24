import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// --- LE MOUCHARD DE DÉBOGAGE ---
console.log("--- TEST DE CONNEXION ---")
console.log("URL :", supabaseUrl ? "✅ Chargée" : "❌ MANQUANTE (undefined)")
console.log("KEY :", supabaseKey ? "✅ Chargée" : "❌ MANQUANTE (undefined)")
// -------------------------------

if (!supabaseUrl || !supabaseKey) {
  alert("ERREUR CRITIQUE : Les clés Supabase ne sont pas chargées ! Vérifiez le fichier .env.local")
}

export const supabase = createClient(supabaseUrl, supabaseKey)
