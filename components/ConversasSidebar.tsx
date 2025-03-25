import { useState, useEffect } from 'react';
import { Conversa, carregarConversas, excluirConversa, marcarComoFavorito } from '../utils/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface ConversasSidebarProps {
  usuarioId?: string;
  conversaAtual: string | null;
  onSelecionarConversa: (conversaId: string) => void;
  onNovaConversa: () => void;
  isMobile?: boolean;
  onFecharSidebar?: () => void;
  onAbrirSidebar?: () => void;
}

const ConversasSidebar: React.FC<ConversasSidebarProps> = ({
  usuarioId,
  conversaAtual,
  onSelecionarConversa,
  onNovaConversa,
  isMobile = false,
  onFecharSidebar,
  onAbrirSidebar
}) => {
  const { user } = useAuth();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [visualizacao] = useState<'todas' | 'favoritas'>('todas');
  const [mostraOpcoes, setMostraOpcoes] = useState<string | null>(null);

  useEffect(() => {
    const carregarDados = async (tentativa = 0) => {
      // Usar o ID do usuário do contexto se não for fornecido como prop
      const userId = usuarioId || (user?.id);
      if (!userId) return;
      
      try {
        setCarregando(true);
        const dados = await carregarConversas(userId);
        setConversas(dados);
        setErro(null);
      } catch (error) {
        console.error(`Erro ao carregar conversas (tentativa ${tentativa + 1}):`, error);
        
        // Tentar novamente até 3 vezes com delay progressivo
        if (tentativa < 2) {
          const delay = (tentativa + 1) * 1000; // 1s, 2s
          setTimeout(() => carregarDados(tentativa + 1), delay);
          return;
        }
        
        setErro('Falha ao carregar conversas. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [usuarioId, user]);

  const handleExcluirConversa = async (e: React.MouseEvent, conversaId: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;

    try {
      await excluirConversa(conversaId);
      setConversas(conversas.filter(c => c.id !== conversaId));
      setMostraOpcoes(null);
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      setErro('Falha ao excluir conversa. Tente novamente.');
    }
  };

  const toggleFavorito = async (e: React.MouseEvent, conversaId: string) => {
    e.stopPropagation();
    
    try {
      // Encontrar a conversa atual
      const conversa = conversas.find(c => c.id === conversaId);
      if (!conversa) return;
      
      // Novo estado de favorito (invertido)
      const novoFavorito = !conversa.favorito;
      
      // Atualizar no banco de dados
      await marcarComoFavorito(conversaId, novoFavorito);
      
      // Atualizar no estado local
      setConversas(conversas.map(c => 
        c.id === conversaId 
          ? { ...c, favorito: novoFavorito } 
          : c
      ));
      
      // Feedback visual
      toast.success(novoFavorito 
        ? 'Conversa adicionada aos atalhos' 
        : 'Conversa removida dos atalhos'
      );
      
      setMostraOpcoes(null);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      toast.error('Falha ao atualizar atalho. Tente novamente.');
    }
  };

  const formatarData = (dataString?: string) => {
    if (!dataString) return '';
    
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const conversasFiltradas = conversas
    .filter(conversa => {
      // Filtro por texto
      const tituloMatch = conversa.titulo?.toLowerCase().includes(filtro.toLowerCase()) || false;
      
      // Filtro por favoritas
      if (visualizacao === 'favoritas' && !conversa.favorito) {
        return false;
      }
      
      return tituloMatch || filtro === '';
    })
    .sort((a, b) => {
      // Ordenar por favoritas primeiro, depois por data
      if (a.favorito && !b.favorito) return -1;
      if (!a.favorito && b.favorito) return 1;
      
      // Se ambas são favoritas ou não, ordenar por data
      const dataA = a.atualizado_em ? new Date(a.atualizado_em).getTime() : 0;
      const dataB = b.atualizado_em ? new Date(b.atualizado_em).getTime() : 0;
      return dataB - dataA;
    });

  const atualizarConversas = async () => {
    const userId = usuarioId || (user?.id);
    if (!userId) return;
    
    try {
      setCarregando(true);
      const dados = await carregarConversas(userId);
      setConversas(dados);
      setErro(null);
    } catch (error) {
      console.error('Erro ao atualizar conversas:', error);
      setErro('Falha ao atualizar conversas. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      {/* Botão para abrir a sidebar (fixo na interface) */}
      {onAbrirSidebar && (
        <div className="fixed top-4 left-4 z-30">
          <button
            onClick={onAbrirSidebar}
            className="p-2 rounded-full bg-white dark:bg-law-800 hover:bg-gray-100 dark:hover:bg-law-700 shadow-md transition-colors focus:outline-none"
            aria-label="Abrir menu de conversas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700 dark:text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      )}
    
      <div className="h-full w-full flex flex-col bg-white dark:bg-law-900 shadow-elegant rounded-r-lg overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-3 sm:p-4 border-b border-law-200 dark:border-law-700 flex items-center justify-between">
          <div className="flex items-center">
            {/* Botão para fechar o menu em dispositivos móveis */}
            {isMobile && onFecharSidebar && (
              <button 
                onClick={onFecharSidebar}
                className="md:hidden mr-2 p-1.5 rounded-md bg-law-100 hover:bg-law-200 dark:bg-law-800 dark:hover:bg-law-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300"
                aria-label="Fechar menu de conversas"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-primary-600 dark:text-primary-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <h2 className="font-medium text-base sm:text-lg text-primary-800 dark:text-law-200 font-serif">
              Conversas
            </h2>
          </div>
          
          {/* Botão Nova Conversa */}
          <button 
            onClick={onNovaConversa}
            className="p-1.5 rounded-md bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300"
            aria-label="Nova conversa"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-primary-600 dark:text-primary-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        
        {/* Barra de pesquisa */}
        <div className="p-3 border-b border-law-200 dark:border-law-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              name="busca"
              id="busca"
              placeholder="Buscar conversa..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-law-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-300"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-grow overflow-y-auto">
          {carregando && conversas.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : erro ? (
            <div className="p-4 text-center text-red-500">
              <p>{erro}</p>
              <button 
                onClick={atualizarConversas}
                className="mt-2 text-primary-600 hover:text-primary-500 underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {filtro ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa iniciada.'}
            </div>
          ) : (
            <ul>
              {conversasFiltradas.map((conversa) => (
                <li 
                  key={conversa.id} 
                  className={`p-3 hover:bg-law-100 dark:hover:bg-law-800 cursor-pointer relative group ${
                    conversa.id === conversaAtual ? 'bg-law-100 dark:bg-law-800 border-l-4 border-primary-500 dark:border-primary-600 pl-2' : 'border-l-4 border-transparent'
                  }`}
                  onClick={() => {
                    onSelecionarConversa(conversa.id);
                    // Fechar sidebar automaticamente em dispositivos móveis
                    if (isMobile && onFecharSidebar) {
                      onFecharSidebar();
                    }
                  }}
                >
                  <div className="flex items-start">
                    <div className="flex-grow truncate pr-10">
                      <div className="flex items-center mb-1">
                        {conversa.favorito && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-secondary-500 dark:text-secondary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        )}
                        <div className="font-medium text-xs sm:text-sm text-primary-800 dark:text-law-200 truncate">
                          {conversa.titulo || 'Nova Conversa'}
                        </div>
                      </div>
                      <div className="text-xs text-law-500 dark:text-law-500 truncate">
                        {formatarData(conversa.criado_em)}
                      </div>
                    </div>
                    
                    {/* Botão de opções */}
                    <div className={`absolute right-2 top-2 ${
                      isMobile 
                        ? 'opacity-100' // Sempre visível em dispositivos móveis
                        : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200' // Visível apenas no hover em desktop
                    }`}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMostraOpcoes(mostraOpcoes === conversa.id ? null : conversa.id);
                        }}
                        className="p-1 rounded-md hover:bg-law-200 dark:hover:bg-law-700 focus:outline-none transition-colors duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-law-500 dark:text-law-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {/* Menu de opções */}
                      {mostraOpcoes === conversa.id && (
                        <div className="absolute right-0 z-10 mt-1 w-40 bg-white dark:bg-law-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-colors duration-300">
                          <div className="py-1">
                            <button
                              onClick={(e) => toggleFavorito(e, conversa.id)}
                              className="w-full text-left block px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-law-700 transition-colors duration-150"
                            >
                              {conversa.favorito ? 'Remover dos atalhos' : 'Adicionar aos atalhos'}
                            </button>
                            <button
                              onClick={(e) => handleExcluirConversa(e, conversa.id)}
                              className="w-full text-left block px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-law-700 transition-colors duration-150"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default ConversasSidebar; 