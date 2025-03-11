import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';

const PerfilPage = () => {
  const { user, perfil, isLoading, signOut, atualizarNome, uploadFotoPerfil } = useAuth();
  const router = useRouter();
  const [confirmacao, setConfirmacao] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Redirecionar para login se não estiver logado
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    // Inicializar o nome com o valor do perfil, se disponível
    if (perfil?.nome_completo) {
      setNomeCompleto(perfil.nome_completo);
    }
  }, [user, perfil, isLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleAtualizarNome = async () => {
    if (!nomeCompleto.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, informe um nome válido.' });
      return;
    }

    try {
      await atualizarNome(nomeCompleto);
      setEditandoNome(false);
      setMensagem({ tipo: 'sucesso', texto: 'Nome atualizado com sucesso!' });
      
      // Limpar a mensagem após 3 segundos
      setTimeout(() => setMensagem({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao atualizar o nome. Tente novamente.' });
    }
  };

  const handleFotoClick = () => {
    // Acionar o input de arquivo quando a área da foto for clicada
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Verificar tipo e tamanho do arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMensagem({ tipo: 'erro', texto: 'Formato inválido. Use JPEG, PNG, GIF ou WebP.' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setMensagem({ tipo: 'erro', texto: 'A imagem deve ter no máximo 5MB.' });
      return;
    }

    setUploading(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      await uploadFotoPerfil(file);
      setMensagem({ tipo: 'sucesso', texto: 'Foto de perfil atualizada com sucesso!' });
      
      // Limpar a mensagem após 3 segundos
      setTimeout(() => setMensagem({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao atualizar a foto. Tente novamente.' });
    } finally {
      setUploading(false);
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
        <div className={`max-w-2xl mx-auto ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-colors duration-300`}>
          <div className="p-6">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-primary-500' : 'text-primary-700'} mb-6`}>Seu Perfil</h1>
            
            {mensagem.texto && (
              <div className={`p-3 mb-4 rounded-md ${
                mensagem.tipo === 'sucesso' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
                  : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
              }`}>
                {mensagem.texto}
              </div>
            )}
            
            <div className={`mb-8 p-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg transition-colors duration-300`}>
              <div className="flex flex-col sm:flex-row items-center mb-6">
                <div 
                  className="relative w-24 h-24 mb-4 sm:mb-0 sm:mr-6 cursor-pointer group" 
                  onClick={handleFotoClick}
                >
                  {perfil?.url_foto ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden relative">
                      <Image 
                        src={perfil.url_foto} 
                        alt="Foto de perfil" 
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-full"
                      />
                    </div>
                  ) : (
                    <div className={`w-24 h-24 rounded-full ${isDark ? 'bg-primary-600' : 'bg-primary-600'} flex items-center justify-center text-white text-3xl`}>
                      {(perfil?.nome_completo?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                  )}
                  
                  <div className={`absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${uploading ? 'opacity-100' : ''}`}>
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                  />
                </div>
                
                <div className="text-center sm:text-left flex-1">
                  {editandoNome ? (
                    <div className="mb-2">
                      <input
                        type="text"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        className={`w-full p-2 border rounded ${isDark ? 'bg-gray-600 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        placeholder="Seu nome completo"
                      />
                      <div className="flex mt-2 justify-center sm:justify-start">
                        <button
                          onClick={handleAtualizarNome}
                          className="btn btn-primary btn-sm mr-2"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setEditandoNome(false);
                            // Restaurar o nome original
                            setNomeCompleto(perfil?.nome_completo || '');
                          }}
                          className={`btn btn-sm ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center mb-2 justify-center sm:justify-start">
                      <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {perfil?.nome_completo || user.email?.split('@')[0]}
                      </h2>
                      <button
                        onClick={() => setEditandoNome(true)}
                        className={`ml-2 p-1 rounded-full ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors duration-300`}
                        title="Editar nome"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{user.email}</p>
                </div>
              </div>
              
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                <p><strong>ID da conta:</strong> {user.id}</p>
                <p><strong>Último login:</strong> {new Date(user.last_sign_in_at || '').toLocaleString('pt-BR')}</p>
              </div>
            </div>
            
            <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : ''}`}>Ações da Conta</h3>
              
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
                  <div className={`p-4 ${isDark ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg`}>
                    <p className={`${isDark ? 'text-red-300' : 'text-red-700'} mb-3`}>Tem certeza que deseja sair da sua conta?</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Sim, sair
                      </button>
                      <button
                        onClick={() => setConfirmacao(false)}
                        className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
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