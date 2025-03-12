import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

export default function Debug() {
  const { user, session, isLoading, isInitialized } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              throw error;
            }
            setSupabaseSession(data);
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

  const clearAuthStorage = () => {
    try {
      localStorage.removeItem('jurisia-auth-storage');
      alert('Dados de autenticação removidos. A página será recarregada.');
      window.location.reload();
    } catch (e) {
      alert(`Erro ao limpar dados: ${e}`);
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
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Informações de Ambiente</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
              <li>Next.js: 14.x</li>
              <li>Ambiente: {process.env.NODE_ENV}</li>
              <li>Supabase URL configurada: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</li>
              <li>Supabase Key configurada: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 5)}...{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 5)} {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</li>
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
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Sessão do Supabase</h2>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">
              <p><strong>Sessão ativa:</strong> {session ? '✅' : '❌'}</p>
              <p><strong>Sessão direta do Supabase:</strong> {supabaseSession?.session ? '✅' : '❌'}</p>
              
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
          
          <div className="mt-8 space-x-4">
            <button 
              onClick={clearAuthStorage}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors duration-300"
            >
              Limpar Dados de Autenticação
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
          </div>
        </div>
      </div>
    </Layout>
  );
} 