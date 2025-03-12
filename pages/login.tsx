import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Auth from '../components/Auth';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { user, isLoading, isInitialized, recarregarSessao } = useAuth();
  const router = useRouter();
  const [inicializacaoCompleta, setInicializacaoCompleta] = useState(false);
  const [erroSessao, setErroSessao] = useState<string | null>(null);
  const [recarregandoSessao, setRecarregandoSessao] = useState(false);
  const inicializacaoTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("[LOGIN] Estado de autenticação:", { isInitialized, isLoading, user: !!user });
    
    // Limpar timeout anterior se existir
    if (inicializacaoTimeout.current) {
      clearTimeout(inicializacaoTimeout.current);
    }
    
    // Redirecionar para a página inicial apenas quando tivermos certeza que o usuário está autenticado
    if (isInitialized && !isLoading) {
      if (user) {
        console.log("[LOGIN] Redirecionando para home - usuário já autenticado");
        router.push('/');
      } else {
        console.log("[LOGIN] Inicialização completa - usuário não autenticado");
        setInicializacaoCompleta(true);
        setErroSessao(null);
      }
    }
    // Se a inicialização demorar muito tempo, exibir erro
    else if (!isInitialized && !isLoading) {
      setErroSessao("A sessão não pode ser inicializada corretamente. Por favor, recarregue a sessão.");
    }
    // Se estiver carregando por muito tempo
    else if (isLoading) {
      inicializacaoTimeout.current = setTimeout(() => {
        if (isLoading) {
          setErroSessao("A inicialização está demorando mais que o esperado. Talvez a sessão esteja com problemas.");
        }
      }, 8000); // 8 segundos é muito tempo para carregar
    }
    
    return () => {
      if (inicializacaoTimeout.current) {
        clearTimeout(inicializacaoTimeout.current);
      }
    };
  }, [user, isLoading, isInitialized, router]);

  // Função para tentar recarregar a sessão
  const handleRecarregarSessao = async () => {
    try {
      setRecarregandoSessao(true);
      setErroSessao("Recarregando sessão...");
      await recarregarSessao();
      setErroSessao(null);
    } catch (error) {
      console.error("[LOGIN] Erro ao recarregar sessão:", error);
      setErroSessao("Erro ao recarregar a sessão. Tente navegar para a página de diagnóstico.");
    } finally {
      setRecarregandoSessao(false);
    }
  };

  // Mostrar tela de carregamento enquanto verificamos a autenticação
  if (!isInitialized || isLoading) {
    return (
      <Layout
        title="Carregando | JurisIA - Assistente Jurídico com IA"
        description="Carregando JurisIA, assistente jurídico inteligente para advogados brasileiros"
      >
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Verificando autenticação...</p>
            {isLoading && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Isso pode levar alguns segundos...</p>}
            {!isInitialized && !isLoading && (
              <div className="mt-4">
                <p className="text-red-600 dark:text-red-400 mb-2">Problema ao inicializar a sessão</p>
                <button 
                  onClick={handleRecarregarSessao}
                  disabled={recarregandoSessao}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300"
                >
                  {recarregandoSessao ? 'Recarregando...' : 'Recarregar Sessão'}
                </button>
                <button 
                  onClick={() => router.push('/debug')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300 ml-2"
                >
                  Diagnóstico
                </button>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Se houver erro de sessão, mostrar mensagem de erro
  if (erroSessao) {
    return (
      <Layout
        title="Erro | JurisIA - Assistente Jurídico com IA"
        description="Erro no JurisIA, assistente jurídico inteligente para advogados brasileiros"
      >
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md">
            <div className="text-red-600 dark:text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Problema com a Sessão</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{erroSessao}</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={handleRecarregarSessao}
                disabled={recarregandoSessao}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300"
              >
                {recarregandoSessao ? 'Recarregando...' : 'Recarregar Sessão'}
              </button>
              <button 
                onClick={() => router.push('/debug')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300"
              >
                Diagnóstico
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Login | JurisIA - Assistente Jurídico com IA"
      description="Acesse sua conta no JurisIA, assistente jurídico inteligente para advogados brasileiros"
    >
      <div className="container-custom py-10">
        <div className="max-w-md mx-auto">
          <Auth />
          <div className="mt-4 text-center">
            <button 
              onClick={() => router.push('/debug')}
              className="text-xs text-gray-500 dark:text-gray-400 underline"
            >
              Diagnóstico do Sistema
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage; 