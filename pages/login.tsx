import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Auth from '../components/Auth';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { user, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const [inicializacaoCompleta, setInicializacaoCompleta] = useState(false);

  useEffect(() => {
    console.log("[LOGIN] Estado de autenticação:", { isInitialized, isLoading, user: !!user });
    
    // Redirecionar para a página inicial apenas quando tivermos certeza que o usuário está autenticado
    if (isInitialized && !isLoading && user) {
      console.log("[LOGIN] Redirecionando para home - usuário já autenticado");
      router.push('/');
    }

    // Marcar inicialização como completa
    if (isInitialized) {
      console.log("[LOGIN] Inicialização da autenticação completa");
      setInicializacaoCompleta(true);
    }
  }, [user, isLoading, isInitialized, router]);

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
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage; 