import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  authChecked: boolean;
  signOut: () => Promise<void>;
}

// Usar um valor inicial em vez de undefined
const initialAuthContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  authChecked: false,
  signOut: async () => {}
};

const AuthContext = createContext<AuthContextType>(initialAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Verifica se o código está rodando no cliente
    const isClient = typeof window !== 'undefined';
    if (!isClient) {
      return;
    }

    // Verifica se o supabase está disponível
    if (!supabase) {
      console.error('Supabase não está disponível no contexto atual');
      setIsLoading(false);
      setAuthChecked(true);
      return;
    }

    // Type assertion para evitar erros de TypeScript
    const supabaseClient = supabase as SupabaseClient;

    // Buscar sessão inicial
    const getInitialSession = async () => {
      try {
        console.log('Verificando sessão de autenticação');
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error.message);
          throw error;
        }
        
        if (data.session) {
          console.log('Sessão encontrada:', !!data.session);
        } else {
          console.log('Nenhuma sessão ativa encontrada');
        }
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error('Erro ao buscar sessão inicial:', error);
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };

    getInitialSession();

    // Configurar listener para mudanças de autenticação
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
        console.log('Evento de mudança de autenticação:', _event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        setAuthChecked(true);
      });
      
      subscription = data.subscription;
    } catch (error) {
      console.error('Erro ao configurar ouvinte de autenticação:', error);
      setIsLoading(false);
      setAuthChecked(true);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    if (!supabase) {
      console.error('Supabase não está disponível');
      return;
    }
    
    try {
      // Type assertion para evitar erros de TypeScript
      const supabaseClient = supabase as SupabaseClient;
      await supabaseClient.auth.signOut();
      
      // Redirecionar para a landing page após o logout
      if (typeof window !== 'undefined') {
        window.location.href = '/landing';
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    authChecked,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
} 