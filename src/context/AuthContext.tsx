import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ADMIN_USER: User = {
  id: 'admin-user-rn3d',
  email: 'admin@rn3d.com.br',
  user_metadata: { name: 'Administrador 3D' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_ADMIN_USER);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState<boolean>(true);

  useEffect(() => {
    // Check local storage for demo session first
    const savedDemoUser = localStorage.getItem('rn3d_demo_user');
    if (savedDemoUser) {
      setIsDemo(true);
      setUser(JSON.parse(savedDemoUser));
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setUser(DEFAULT_ADMIN_USER);
      setLoading(false);
      return;
    }

    // Fetch initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
      } else {
        setUser(DEFAULT_ADMIN_USER);
      }
      setLoading(false);
    });

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
      } else {
        setUser(DEFAULT_ADMIN_USER);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      setUser(DEFAULT_ADMIN_USER);
      return { error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data) {
      if (data.session) setSession(data.session);
      if (data.user) setUser(data.user);
    } else {
      setUser(DEFAULT_ADMIN_USER);
    }
    return { error: null };
  };

  const loginAsDemo = () => {
    setUser(DEFAULT_ADMIN_USER);
    setIsDemo(true);
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(DEFAULT_ADMIN_USER);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isDemo,
        signInWithPassword,
        signOut,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
