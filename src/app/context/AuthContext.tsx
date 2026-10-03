'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { mapProfile, type ProfileRow } from '@/lib/mappers';
import { translateError } from '@/lib/format';
import type { Profile } from '@/lib/types';

interface SignUpData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isGuest: boolean;
  loading: boolean;
  /** Devuelve un mensaje de error, o null si todo salió bien. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signInAsGuest: () => Promise<string | null>;
  signUp: (data: SignUpData) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  changePassword: (password: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (session: Session | null) => {
      const u = session?.user ?? null;
      if (!u) {
        if (active) {
          setUser(null);
          setProfile(null);
        }
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
      if (!active) return;
      setUser(u);
      setProfile(data ? mapProfile(data as ProfileRow) : null);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => load(data.session))
      .finally(() => active && setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // setTimeout evita bloqueos al llamar a Supabase dentro de este callback
      setTimeout(() => void load(session), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback<AuthState['signIn']>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? translateError(error.message) : null;
  }, []);

  const signInAsGuest = useCallback<AuthState['signInAsGuest']>(async () => {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: { data: { name: 'Invitado' } },
    });
    if (error) return translateError(error.message);
    if (!data.user) return 'No se pudo iniciar la sesión de invitado. Inténtalo de nuevo.';
    setUser(data.user);
    setProfile(null);
    return null;
  }, []);

  const signUp = useCallback<AuthState['signUp']>(async ({ name, email, phone, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });
    if (error) return { error: translateError(error.message), needsConfirmation: false };
    return { error: null, needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const changePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? translateError(error.message) : null;
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, profile, isAdmin: profile?.role === 'admin', isGuest: user?.is_anonymous ?? false, loading, signIn, signInAsGuest, signUp, signOut, changePassword }),
    [user, profile, loading, signIn, signInAsGuest, signUp, signOut, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}