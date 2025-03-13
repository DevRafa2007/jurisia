import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const PerfilPage = () => {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [confirmacao, setConfirmacao] = useState(false);

  useEffect(() => {
    // Redirecionar para login se não estiver logado
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Se estiver carregando ou não tiver usuário, mostra loader
  if (isLoading || !user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-64px-48px)]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Perfil | JurisIA - Assistente Jurídico com IA"
      description="Gerencie seu perfil no JurisIA, assistente jurídico inteligente para advogados brasileiros"
    >
      <div className="container-custom py-10">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-400 mb-6">Seu Perfil</h1>
            
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary-600 dark:bg-primary-700 flex items-center justify-center text-white text-2xl mr-4">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {user.email?.split('@')[0]}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <p><strong>ID da conta:</strong> {user.id}</p>
                <p><strong>Último login:</strong> {new Date(user.last_sign_in_at || '').toLocaleString('pt-BR')}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Ações da Conta</h3>
              
              <div className="space-y-4">
                <div>
                  <button
                    onClick={() => router.push('/')}
                    className="btn btn-primary w-full sm:w-auto mr-2 mb-2"
                  >
                    Voltar para as Consultas
                  </button>
                  
                  <button
                    onClick={() => setConfirmacao(true)}
                    className="btn bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto mb-2"
                  >
                    Sair da Conta
                  </button>
                </div>
                
                {confirmacao && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-400 mb-3">Tem certeza que deseja sair da sua conta?</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Sim, sair
                      </button>
                      <button
                        onClick={() => setConfirmacao(false)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PerfilPage; 