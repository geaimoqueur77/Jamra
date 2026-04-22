/**
 * Jamra — Client Supabase
 *
 * Le client est configuré avec :
 *  - persistSession: true → la session est stockée dans localStorage
 *  - autoRefreshToken: true → le token est renouvelé automatiquement
 *  - detectSessionInUrl: true → détecte les callbacks magic link/OAuth
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes. Vérifie que .env.local contient VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'jamra.auth.session',
  },
});

/**
 * Petit helper : l'utilisateur est-il connecté ?
 */
export async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}
