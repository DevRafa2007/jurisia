import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { PerfilUsuario, obterPerfilUsuario, atualizarPerfilUsuario, uploadImagemPerfil } from '../utils/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  perfil: PerfilUsuario | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  atualizarNome: (nomeCompleto: string) => Promise<void>;
  uploadFotoPerfil: (arquivo: File) => Promise<string | null>;
  recarregarPerfil: () => Promise<void>;
}

// Usar um valor inicial em vez de undefined
const initialAuthContext: AuthContextType = {
  user: null,
  session: null,
  perfil: null,
  isLoading: true,
  signOut: async () => {},
  atualizarNome: async () => {},
  uploadFotoPerfil: async () => null,
  recarregarPerfil: async () => {},
};

const AuthContext = createContext<AuthContextType>(initialAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar o perfil do usuário
  const carregarPerfil = async (userId: string) => {
    try {
      const dadosPerfil = await obterPerfilUsuario(userId);
      setPerfil(dadosPerfil);
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
    }
  };

  useEffect(() => {
    // Verifica se o supabase está disponível (cliente)
    if (!supabase) {
      console.error('Supabase não está disponível no contexto atual');
      setIsLoading(false);
      return;
    }

    // Type assertion para evitar erros de TypeScript
    const supabaseClient = supabase as SupabaseClient;

    // Buscar sessão inicial
    const getInitialSession = async () => {
      try {
        const { data } = await supabaseClient.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        // Carregar perfil se o usuário estiver logado
        if (data.session?.user) {
          await carregarPerfil(data.session.user.id);
        }
      } catch (error) {
        console.error('Erro ao buscar sessão inicial:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Configurar listener para mudanças de autenticação
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Carregar perfil se o usuário estiver logado
        if (session?.user) {
          await carregarPerfil(session.user.id);
        } else {
          setPerfil(null);
        }
        
        setIsLoading(false);
      });
      
      subscription = data.subscription;
    } catch (error) {
      console.error('Erro ao configurar ouvinte de autenticação:', error);
      setIsLoading(false);
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
      setPerfil(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const atualizarNome = async (nomeCompleto: string) => {
    if (!user) {
      console.error('Usuário não está logado');
      return;
    }
    
    try {
      const perfilAtualizado = await atualizarPerfilUsuario(user.id, { nome_completo: nomeCompleto });
      setPerfil(perfilAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar nome do usuário:', error);
      throw error;
    }
  };

  const uploadFotoPerfil = async (arquivo: File): Promise<string | null> => {
    if (!user) {
      console.error('Usuário não está logado');
      return null;
    }
    
    try {
      const urlFoto = await uploadImagemPerfil(user.id, arquivo);
      if (urlFoto) {
        // Atualizar o estado do perfil com a nova URL
        setPerfil(prevPerfil => prevPerfil ? { ...prevPerfil, url_foto: urlFoto } : null);
      }
      return urlFoto;
    } catch (error) {
      console.error('Erro ao fazer upload da foto de perfil:', error);
      throw error;
    }
  };

  const recarregarPerfil = async () => {
    if (!user) {
      console.error('Usuário não está logado');
      return;
    }
    
    await carregarPerfil(user.id);
  };

  const value = {
    user,
    session,
    perfil,
    isLoading,
    signOut,
    atualizarNome,
    uploadFotoPerfil,
    recarregarPerfil,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
} 