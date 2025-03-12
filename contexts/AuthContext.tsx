import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { PerfilUsuario, obterPerfilUsuario, atualizarPerfilUsuario, uploadImagemPerfil } from '../utils/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  perfil: PerfilUsuario | null;
  isLoading: boolean;
  isInitialized: boolean;
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
  isInitialized: false,
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  // Função para carregar o perfil do usuário
  const carregarPerfil = async (userId: string) => {
    try {
      console.log("[AUTH] Carregando perfil para usuário:", userId);
      const dadosPerfil = await obterPerfilUsuario(userId);
      setPerfil(dadosPerfil);
    } catch (error) {
      console.error('[AUTH] Erro ao carregar perfil do usuário:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log("[AUTH] Inicializando contexto de autenticação");

    // Buscar sessão inicial
    const getInitialSession = async () => {
      try {
        console.log("[AUTH] Buscando sessão inicial");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Erro ao buscar sessão:', error);
          setAuthError(error);
          throw error;
        }
        
        if (mounted) {
          console.log("[AUTH] Sessão encontrada:", !!data.session);
          setSession(data.session);
          setUser(data.session?.user ?? null);
          
          // Carregar perfil se o usuário estiver logado
          if (data.session?.user) {
            await carregarPerfil(data.session.user.id);
          }
        }
      } catch (error) {
        console.error('[AUTH] Erro ao buscar sessão inicial:', error);
        // Limpar localStorage para evitar loops em caso de erro
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('jurisia-auth-storage');
          } catch (e) {
            console.error('[AUTH] Erro ao limpar localStorage:', e);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    getInitialSession();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[AUTH] Mudança de estado de autenticação:", _event);
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Carregar perfil se o usuário estiver logado
        if (session?.user) {
          await carregarPerfil(session.user.id);
        } else {
          setPerfil(null);
        }
        
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("[AUTH] Iniciando processo de logout");
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AUTH] Erro ao fazer logout:', error);
        throw error;
      }
      
      setPerfil(null);
      console.log("[AUTH] Logout concluído com sucesso");
      
      // Limpar dados locais após logout
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('jurisia-auth-storage');
        } catch (e) {
          console.error('[AUTH] Erro ao limpar localStorage após logout:', e);
        }
      }
    } catch (error) {
      console.error('[AUTH] Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarNome = async (nomeCompleto: string) => {
    if (!user) {
      console.error('[AUTH] Usuário não está logado');
      return;
    }
    
    try {
      const perfilAtualizado = await atualizarPerfilUsuario(user.id, { nome_completo: nomeCompleto });
      setPerfil(perfilAtualizado);
    } catch (error) {
      console.error('[AUTH] Erro ao atualizar nome do usuário:', error);
      throw error;
    }
  };

  const uploadFotoPerfil = async (arquivo: File): Promise<string | null> => {
    if (!user) {
      console.error('[AUTH] Usuário não está logado');
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
      console.error('[AUTH] Erro ao fazer upload da foto de perfil:', error);
      throw error;
    }
  };

  const recarregarPerfil = async () => {
    if (!user) {
      console.error('[AUTH] Usuário não está logado');
      return;
    }
    
    await carregarPerfil(user.id);
  };

  const value = {
    user,
    session,
    perfil,
    isLoading,
    isInitialized,
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