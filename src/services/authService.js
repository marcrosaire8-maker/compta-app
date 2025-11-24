import { supabase } from './supabase'

/**
 * Trouve l'entreprise liée à l'utilisateur connecté.
 * Cherche d'abord s'il est propriétaire, sinon s'il est membre invité.
 */
export async function getEntrepriseForUser(userId, userEmail) {
  
  // 1. Est-ce qu'il est PROPRIÉTAIRE ?
  const { data: ownerSte, error: errOwner } = await supabase
    .from('entreprises')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle()

  if (ownerSte) return { ...ownerSte, role: 'ADMIN' }; // On retourne l'entreprise + son rôle

  // 2. Est-ce qu'il est MEMBRE INVITÉ ?
  const { data: memberSte, error: errMember } = await supabase
    .from('membres_entreprise')
    .select('role, entreprise:entreprises(*)') // On joint la table entreprises
    .eq('email', userEmail)
    .maybeSingle()

  if (memberSte && memberSte.entreprise) {
    // On retourne l'entreprise trouvée + le rôle assigné (ex: COMPTABLE)
    return { ...memberSte.entreprise, role: memberSte.role };
  }

  return null; // Aucune entreprise trouvée
}
