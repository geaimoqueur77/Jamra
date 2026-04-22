/**
 * Jamra — Contexte d'authentification
 *
 * Expose la session Supabase + helpers signIn / signUp / signOut.
 * Écoute les changements d'auth via supabase.auth.onAuthStateChange.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { initSync, stopSync } from '../lib/sync';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Récupère la session au démarrage
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) initSync(data.session.user.id);
    });

    // Écoute les changements d'auth (signin, signout, refresh…)
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (event === 'SIGNED_IN' && newSession?.user) {
        initSync(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        stopSync();
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async ({ email, password, nom }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
