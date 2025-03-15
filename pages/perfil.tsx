import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';

const PerfilPage = () => {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [confirmacao, setConfirmacao] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [editandoNome, setEditandoNome] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    // Redirecionar para login se não estiver logado
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Carregar nome do usuário
  useEffect(() => {
    const carregarNomeUsuario = async () => {
      if (!user) return;
      
      try {
        // Verificar primeiro se o nome está nos metadados do usuário
        const userMetadata = user.user_metadata as { nome_completo?: string } | null;
        if (userMetadata?.nome_completo) {
          setNomeCompleto(userMetadata.nome_completo);
          return;
        }
        
        // Se não estiver nos metadados, tenta buscar na tabela de perfis
        const { data, error } = await supabase
          .from('perfis')
          .select('nome_completo')
          .eq('usuario_id', user.id)
          .single();
        
        if (error) {
          console.error('Erro ao buscar perfil:', error);
          return;
        }
        
        if (data?.nome_completo) {
          setNomeCompleto(data.nome_completo);
        }
      } catch (error) {
        console.error('Erro ao buscar nome do usuário:', error);
      }
    };
    
    carregarNomeUsuario();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleSalvarNome = async () => {
    if (!user) return;
    
    try {
      setSalvando(true);
      
      // Atualizar os metadados do usuário
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { nome_completo: nomeCompleto }
      });
      
      if (metadataError) {
        throw metadataError;
      }
      
      // Atualizar também na tabela de perfis
      const { error: perfilError } = await supabase
        .from('perfis')
        .upsert({
          usuario_id: user.id,
          nome_completo: nomeCompleto,
          atualizado_em: new Date().toISOString()
        });
      
      if (perfilError) {
        throw perfilError;
      }
      
      toast.success('Nome atualizado com sucesso!');
      setEditandoNome(false);
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast.error('Falha ao atualizar o nome. Tente novamente.');
    } finally {
      setSalvando(false);
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
                  {nomeCompleto ? nomeCompleto.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  {editandoNome ? (
                    <div className="flex flex-col space-y-2">
                      <input
                        type="text"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200"
                        placeholder="Seu nome completo"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSalvarNome}
                          disabled={salvando}
                          className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm transition-colors duration-200 disabled:opacity-70"
                        >
                          {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={() => setEditandoNome(false)}
                          className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-md text-sm transition-colors duration-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mr-2">
                          {nomeCompleto || user.email?.split('@')[0]}
                        </h2>
                        <button
                          onClick={() => setEditandoNome(true)}
                          className="p-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
                          title="Editar nome"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                    </>
                  )}
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