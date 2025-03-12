import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

export default function Debug() {
  const { user, session, isLoading, isInitialized, recarregarSessao } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [recarregando, setRecarregando] = useState(false);
  const [recarregandoSupabase, setRecarregandoSupabase] = useState(false);
  const [recarregadoEm, setRecarregadoEm] = useState<string | null>(null);

  useEffect(() => {
    async function checkStorage() {
      try {
        if (typeof window !== 'undefined') {
          // Verificar dados do localStorage
          const authStorage = localStorage.getItem('jurisia-auth-storage');
          if (authStorage) {
            try {
              const parsed = JSON.parse(authStorage);
              setLocalStorageData(parsed);
            } catch (e) {
              setLocalStorageData({ error: 'Não foi possível analisar os dados do localStorage' });
            }
          } else {
            setLocalStorageData({ message: 'Nenhum dado de autenticação encontrado no localStorage' });
          }

          // Verificar sessão diretamente do Supabase
          try {
            refreshSupabaseSession();
          } catch (e: any) {
            setError(`Erro ao buscar sessão: ${e.message}`);
          }
        }
      } catch (e: any) {
        setError(`Erro ao verificar armazenamento: ${e.message}`);
      }
    }
    
    checkStorage();
  }, []);

  const refreshSupabaseSession = async () => {
    try {
      setRecarregandoSupabase(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      setSupabaseSession(data);
      setRecarregadoEm(new Date().toLocaleTimeString());
    } catch (e: any) {
      setLastError(`Erro ao buscar sessão Supabase: ${e.message}`);
    } finally {
      setRecarregandoSupabase(false);
    }
  };

  const clearAuthStorage = () => {
    try {
      localStorage.removeItem('jurisia-auth-storage');
      alert('Dados de autenticação removidos. A página será recarregada.');
      window.location.reload();
    } catch (e) {
      alert(`Erro ao limpar dados: ${e}`);
    }
  };

  const handleRecarregarSessao = async () => {
    try {
      setRecarregando(true);
      await recarregarSessao();
      await refreshSupabaseSession();
      alert('Sessão recarregada com sucesso!');
    } catch (e: any) {
      setLastError(`Erro ao recarregar sessão: ${e.message}`);
      alert(`Erro ao recarregar sessão: ${e.message}`);
    } finally {
      setRecarregando(false);
    }
  };

  const handleForcarInicializacao = () => {
    try {
      if (typeof window !== 'undefined') {
        // Adicionar flag temporária para forçar inicialização
        localStorage.setItem('force_init', 'true');
        window.location.reload();
      }
    } catch (e) {
      alert(`Erro ao forçar inicialização: ${e}`);
    }
  };

  return (
    <Layout
      title="Diagnóstico | JurisIA"
      description="Página de diagnóstico do JurisIA"
    >
      <div className="container-custom py-10">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Diagnóstico do Sistema</h1>
          
          {lastError && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
              <p><strong>Último erro:</strong> {lastError}</p>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Informações de Ambiente</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
              <li>Next.js: 14.x</li>
              <li>Ambiente: {process.env.NODE_ENV}</li>
              <li>Supabase URL configurada: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</li>
              <li>Supabase Key configurada: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 5)}...{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 5)} {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</li>
              {recarregadoEm && <li>Última verificação: {recarregadoEm}</li>}
            </ul>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Estado da Autenticação</h2>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">
              <p className="mb-2"><strong>isInitialized:</strong> {isInitialized ? '✅' : '❌'}</p>
              <p className="mb-2"><strong>isLoading:</strong> {isLoading ? '⏳' : '✅'}</p>
              <p className="mb-2"><strong>Usuário Logado:</strong> {user ? '✅' : '❌'}</p>
              {user && (
                <div className="ml-4 mt-2">
                  <p className="mb-1"><strong>ID:</strong> {user.id}</p>
                  <p className="mb-1"><strong>Email:</strong> {user.email}</p>
                  <p className="mb-1"><strong>Role:</strong> {user.role}</p>
                  <p className="mb-1"><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</p>
                  <p className="mb-1"><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Sessão do Supabase</h2>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">
              <div className="flex items-center mb-4">
                <p className="flex-1"><strong>Sessão ativa no Context:</strong> {session ? '✅' : '❌'}</p>
                <button 
                  onClick={handleRecarregarSessao}
                  disabled={recarregando}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors duration-300"
                >
                  {recarregando ? 'Recarregando...' : 'Recarregar Sessão'}
                </button>
              </div>
              
              <div className="flex items-center">
                <p className="flex-1"><strong>Sessão direta do Supabase:</strong> {supabaseSession?.session ? '✅' : '❌'}</p>
                <button 
                  onClick={refreshSupabaseSession}
                  disabled={recarregandoSupabase}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors duration-300"
                >
                  {recarregandoSupabase ? 'Verificando...' : 'Verificar Novamente'}
                </button>
              </div>
              
              {session && (
                <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-2">
                  <p className="mb-1"><strong>Expira Em:</strong> {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</p>
                  <p className="mb-1"><strong>Expires In:</strong> {session.expires_in ? `${session.expires_in} segundos` : 'N/A'}</p>
                </div>
              )}
              
              {error && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                  <p><strong>Erro:</strong> {error}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Dados no LocalStorage</h2>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">
              <pre className="text-xs">{JSON.stringify(localStorageData, null, 2)}</pre>
            </div>
          </div>
          
          <div className="mt-8 space-x-4 flex flex-wrap gap-3">
            <button 
              onClick={clearAuthStorage}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors duration-300"
            >
              Limpar Dados de Autenticação
            </button>
            
            <button 
              onClick={handleForcarInicializacao}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors duration-300"
            >
              Forçar Inicialização
            </button>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors duration-300"
            >
              Voltar para Home
            </button>
            
            <button 
              onClick={() => window.location.href = '/login'}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors duration-300"
            >
              Ir para Login
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors duration-300"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
} 