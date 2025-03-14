import { useState, useEffect } from 'react';
import { Conversa, carregarConversas, excluirConversa } from '../utils/supabase';

interface ConversasSidebarProps {
  usuarioId: string;
  conversaAtual: string | null;
  onSelecionarConversa: (conversaId: string) => void;
  onNovaConversa: () => void;
  toggleSidebar?: () => void;
  isMobile?: boolean;
}

const ConversasSidebar: React.FC<ConversasSidebarProps> = ({
  usuarioId,
  conversaAtual,
  onSelecionarConversa,
  onNovaConversa,
  toggleSidebar,
  isMobile = false
}) => {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [visualizacao, setVisualizacao] = useState<'todas' | 'favoritas'>('todas');
  const [mostraOpcoes, setMostraOpcoes] = useState<string | null>(null);

  // Estado fictício para ilustrar favoritos
  const [favoritas, setFavoritas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuarioId) return;
      
      try {
        setCarregando(true);
        const dados = await carregarConversas(usuarioId);
        setConversas(dados);
        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        setErro('Falha ao carregar conversas. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [usuarioId]);

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

  const toggleFavorito = (e: React.MouseEvent, conversaId: string) => {
    e.stopPropagation();
    setFavoritas(prev => ({
      ...prev,
      [conversaId]: !prev[conversaId]
    }));
    setMostraOpcoes(null);
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
      if (visualizacao === 'favoritas' && !favoritas[conversa.id]) {
        return false;
      }
      
      return tituloMatch || filtro === '';
    })
    .sort((a, b) => {
      // Ordenar por favoritas primeiro, depois por data
      if (favoritas[a.id] && !favoritas[b.id]) return -1;
      if (!favoritas[a.id] && favoritas[b.id]) return 1;
      
      const dataA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
      const dataB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
      return dataB - dataA; // Mais recentes primeiro
    });

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-law-900 shadow-elegant rounded-r-lg overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-law-200 dark:border-law-700 flex items-center justify-between">
        <div className="flex items-center">
          {/* Botão para fechar o menu em dispositivos móveis */}
          {isMobile && toggleSidebar && (
            <button 
              onClick={toggleSidebar}
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
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setVisualizacao(visualizacao === 'todas' ? 'favoritas' : 'todas')}
            className={`p-1.5 rounded-md transition-colors duration-300 ${
              visualizacao === 'favoritas' 
                ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300' 
                : 'bg-law-100 hover:bg-law-200 text-primary-700 dark:bg-law-800 dark:hover:bg-law-700 dark:text-law-300'
            }`}
            title={visualizacao === 'favoritas' ? 'Mostrar todas' : 'Mostrar favoritas'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill={visualizacao === 'favoritas' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button 
            onClick={onNovaConversa}
            className="p-1.5 rounded-md bg-primary-50 hover:bg-primary-100 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-700 dark:text-primary-300 transition-colors duration-300"
            title="Nova Conversa"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Campo de busca */}
      <div className="px-3 py-2 border-b border-law-200 dark:border-law-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full px-3 py-2 pl-9 text-xs sm:text-sm border rounded-md border-law-300 dark:border-law-600 bg-white dark:bg-law-800 text-primary-900 dark:text-law-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 dark:text-law-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {filtro && (
            <button
              onClick={() => setFiltro('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-law-500 hover:text-law-700 dark:hover:text-law-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        {carregando ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : erro ? (
          <div className="p-4 text-red-600 dark:text-red-400 text-xs sm:text-sm">
            Erro ao carregar conversas.
          </div>
        ) : conversasFiltradas.length === 0 ? (
          <div className="p-4 text-law-500 dark:text-law-400 text-xs sm:text-sm text-center">
            {filtro ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa iniciada. Clique no botão + para iniciar uma nova conversa.'}
          </div>
        ) : (
          <ul className="divide-y divide-law-200 dark:divide-law-700">
            {conversasFiltradas.map((conversa) => (
              <li 
                key={conversa.id} 
                className={`p-3 hover:bg-law-100 dark:hover:bg-law-800 cursor-pointer relative group ${
                  conversa.id === conversaAtual ? 'bg-law-100 dark:bg-law-800 border-l-4 border-primary-500 dark:border-primary-600 pl-2' : 'border-l-4 border-transparent'
                }`}
                onClick={() => onSelecionarConversa(conversa.id)}
              >
                <div className="flex items-start">
                  <div className="flex-grow truncate pr-10">
                    <div className="flex items-center mb-1">
                      {favoritas[conversa.id] && (
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMostraOpcoes(mostraOpcoes === conversa.id ? null : conversa.id);
                    }}
                    className="absolute right-3 top-3 text-law-400 hover:text-law-600 dark:hover:text-law-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-law-200 dark:hover:bg-law-700"
                    title="Opções"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Menu de opções */}
                  {mostraOpcoes === conversa.id && (
                    <div className="absolute right-0 top-8 mt-1 w-36 bg-white dark:bg-law-800 rounded-md shadow-elegant py-1 z-10 border border-law-200 dark:border-law-700 text-xs sm:text-sm">
                      <button
                        onClick={(e) => toggleFavorito(e, conversa.id)}
                        className="flex items-center w-full text-left px-3 py-1.5 hover:bg-law-100 dark:hover:bg-law-700 text-primary-700 dark:text-law-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 mr-2 ${favoritas[conversa.id] ? 'text-secondary-500 dark:text-secondary-400' : 'text-law-500 dark:text-law-400'}`} 
                          fill={favoritas[conversa.id] ? "currentColor" : "none"} 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {favoritas[conversa.id] ? 'Remover favorito' : 'Adicionar favorito'}
                      </button>
                      <button
                        onClick={(e) => handleExcluirConversa(e, conversa.id)}
                        className="flex items-center w-full text-left px-3 py-1.5 hover:bg-law-100 dark:hover:bg-law-700 text-red-600 dark:text-red-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Rodapé da barra lateral com opções de exportação */}
      <div className="p-3 border-t border-law-200 dark:border-law-700 flex justify-between items-center">
        <button 
          className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center transition-colors duration-300"
          title="Exportar conversas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Exportar
        </button>
        <button 
          className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center transition-colors duration-300"
          title="Acessar atalhos"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Atalhos
        </button>
      </div>
    </div>
  );
};

export default ConversasSidebar; 