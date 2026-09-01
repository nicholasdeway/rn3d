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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  useEffect(() => {
    // 48-Hour Login Session Expiration check (48 * 60 * 60 * 1000 ms)
    const loginTime = localStorage.getItem('rn3d_login_timestamp');
    const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

    if (loginTime && Date.now() - Number(loginTime) > FORTY_EIGHT_HOURS_MS) {
      console.warn('[Auth Expiration] Sessão de 48 horas expirada. Efetuando logout automático...');
      localStorage.removeItem('rn3d_login_timestamp');
      localStorage.removeItem('rn3d_demo_user');
      if (isSupabaseConfigured()) {
        supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    // Check local storage for demo session first
    const savedDemoUser = localStorage.getItem('rn3d_demo_user');
    if (savedDemoUser) {
      setIsDemo(true);
      setUser(JSON.parse(savedDemoUser));
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Fetch initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session && !localStorage.getItem('rn3d_login_timestamp')) {
        localStorage.setItem('rn3d_login_timestamp', String(Date.now()));
      }
      setLoading(false);
    });

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        if (!localStorage.getItem('rn3d_login_timestamp')) {
          localStorage.setItem('rn3d_login_timestamp', String(Date.now()));
        }
      } else {
        localStorage.removeItem('rn3d_login_timestamp');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase não está configurado no arquivo .env. Use o modo demonstração ou configure as chaves.') };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      localStorage.setItem('rn3d_login_timestamp', String(Date.now()));
    }
    return { error };
  };

  const loginAsDemo = () => {
    const demoUser = {
      id: 'demo-user-123',
      email: 'admin@rn3d.com.br',
      user_metadata: { name: 'Administrador 3D' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User;

    localStorage.setItem('rn3d_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('rn3d_login_timestamp', String(Date.now()));
    setIsDemo(true);
    setUser(demoUser);
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem('rn3d_demo_user');
      setIsDemo(false);
      setUser(null);
      setSession(null);
      return;
    }

    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
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
