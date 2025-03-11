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

  const handleExcluirConversa = async (e: React.MouseEvent, conversaId: string | undefined) => {
    e.stopPropagation();
    if (!conversaId) return;
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;

    try {
      await excluirConversa(conversaId);
      setConversas(conversas.filter(c => c.id !== conversaId));
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      setErro('Falha ao excluir conversa. Tente novamente.');
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

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-800 shadow-md rounded-r-lg md:rounded-none transition-all duration-300 ease-in-out">
      <div className="p-2 sm:p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          {/* Botão para fechar o menu em dispositivos móveis */}
          {isMobile && toggleSidebar && (
            <button 
              onClick={toggleSidebar}
              className="md:hidden mr-2 p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
              aria-label="Fechar menu de conversas"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-primary-600 dark:text-primary-400 transition-transform duration-300 ease-in-out" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <h2 className="font-medium text-base sm:text-lg text-gray-800 dark:text-gray-300">
            Conversas
          </h2>
        </div>
        <button 
          onClick={onNovaConversa}
          className="p-1 sm:p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95"
          title="Nova Conversa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        {carregando ? (
          <div className="p-3 flex justify-center">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : erro ? (
          <div className="p-3 text-red-600 dark:text-red-400 text-xs sm:text-sm">
            Erro ao carregar conversas.
          </div>
        ) : conversas.length === 0 ? (
          <div className="p-3 text-gray-500 dark:text-gray-400 text-xs sm:text-sm text-center">
            Nenhuma conversa iniciada. Clique no botão + para iniciar uma nova conversa.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversas.map((conversa) => (
              <li 
                key={conversa.id} 
                className={`p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center group transition-colors duration-200 ease-in-out ${
                  conversa.id === conversaAtual ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
                onClick={() => conversa.id && onSelecionarConversa(conversa.id)}
              >
                <div className="truncate flex-grow">
                  <div className="font-medium text-xs sm:text-sm text-gray-800 dark:text-gray-200 truncate">
                    {conversa.titulo || 'Nova Conversa'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatarData(conversa.criado_em)}
                  </div>
                </div>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => conversa.id && handleExcluirConversa(e, conversa.id)}
                  aria-label="Excluir conversa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversasSidebar; 