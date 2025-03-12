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
  recarregarSessao: () => Promise<void>;
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
  recarregarSessao: async () => {},
};

const AuthContext = createContext<AuthContextType>(initialAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [lastInitAttempt, setLastInitAttempt] = useState<number>(0);

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

  // Função para recarregar a sessão manualmente
  const recarregarSessao = async () => {
    try {
      setIsLoading(true);
      console.log("[AUTH] Recarregando sessão manualmente");
      
      // Limpar erros anteriores
      setAuthError(null);
      
      // Buscar sessão atual
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AUTH] Erro ao recarregar sessão:', error);
        setAuthError(error);
        throw error;
      }
      
      console.log("[AUTH] Sessão recarregada:", !!data.session);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      // Carregar perfil se o usuário estiver logado
      if (data.session?.user) {
        await carregarPerfil(data.session.user.id);
      } else {
        setPerfil(null);
      }
      
      // Marcar como inicializado e carregado
      setIsInitialized(true);
    } catch (error) {
      console.error('[AUTH] Erro ao recarregar sessão:', error);
      // Mesmo em caso de erro, marcamos como inicializado para evitar loops infinitos
      setIsInitialized(true); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log("[AUTH] Inicializando contexto de autenticação");

    // Registrar o tempo da última tentativa
    setLastInitAttempt(Date.now());

    // Buscar sessão inicial
    const getInitialSession = async () => {
      try {
        console.log("[AUTH] Buscando sessão inicial");
        
        // Primeiro verificar qualquer erro com o Supabase
        if (!supabase) {
          throw new Error('[AUTH] Cliente Supabase não inicializado');
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Erro ao buscar sessão:', error);
          setAuthError(error);
          
          // Detectar se a sessão é inválida
          if (error.message.includes('JWT expired') || error.message.includes('invalid token')) {
            console.log('[AUTH] Sessão expirada ou token inválido. Limpando dados locais.');
            
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('jurisia-auth-storage');
              } catch (e) {
                console.error('[AUTH] Erro ao limpar localStorage após token inválido:', e);
              }
            }
          }
          
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
          // Independentemente do resultado, marcar como inicializado e não carregando
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
        
        // Garantir que isInitialized esteja sempre true após mudança de estado
        setIsInitialized(true);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Verificar se a inicialização está demorando muito tempo
  useEffect(() => {
    // Se ainda estiver carregando e não inicializado após 5 segundos, forçar inicialização
    if (isLoading && !isInitialized && lastInitAttempt > 0) {
      const timeoutId = setTimeout(() => {
        console.warn('[AUTH] Timeout de inicialização atingido. Forçando finalização do carregamento.');
        setIsLoading(false);
        setIsInitialized(true);
      }, 5000); // 5 segundos de timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isInitialized, lastInitAttempt]);

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
      setUser(null);
      setSession(null);
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
    recarregarSessao,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
} 