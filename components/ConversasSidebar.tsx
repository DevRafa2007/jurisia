import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { buscarConversas, excluirConversa, Conversa } from '../utils/supabase';

type ConversasSidebarProps = {
  conversaAtual: string | null;
  onSelecionarConversa: (id: string) => void;
  onNovaConversa: () => void;
  onFecharSidebar: () => void;
  isMobile: boolean;
};

const ConversasSidebar: React.FC<ConversasSidebarProps> = ({
  conversaAtual,
  onSelecionarConversa,
  onNovaConversa,
  onFecharSidebar,
  isMobile,
}) => {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const carregarConversas = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const data = await buscarConversas(user.id);
        
        // Ordenar por data de atualização, mais recentes primeiro
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(a.atualizado_em || a.criado_em).getTime();
          const dateB = new Date(b.atualizado_em || b.criado_em).getTime();
          return dateB - dateA;
        });
        
        setConversas(sortedData);
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarConversas();
  }, [user, conversaAtual]);

  // Fechar menu de opções quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuAbertoId(null);
    };
    
    // Adicionar listener para clicks no documento
    document.addEventListener('click', handleClickOutside);
    
    // Remover listener quando o componente for desmontado
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    
    // Se for hoje, mostrar apenas a hora
    if (data.toDateString() === hoje.toDateString()) {
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Se for ontem, mostrar "Ontem"
    if (data.toDateString() === ontem.toDateString()) {
      return 'Ontem';
    }
    
    // Para outras datas, mostrar dia/mês
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handleToggleMenu = (event: React.MouseEvent, conversaId: string) => {
    // Impedir a propagação para evitar que o clique seja registrado no documento
    // e feche o menu imediatamente
    event.stopPropagation();
    
    // Toggle menu: fechar se já estiver aberto, abrir se estiver fechado
    setMenuAbertoId(menuAbertoId === conversaId ? null : conversaId);
  };

  const handleExcluirConversa = async (event: React.MouseEvent, conversaId: string) => {
    event.stopPropagation();
    setMenuAbertoId(null);

    // Confirmação antes de excluir
    if (!confirm("Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    try {
      setExcluindoId(conversaId);
      await excluirConversa(conversaId);
      
      // Atualizar lista de conversas localmente
      setConversas(conversas.filter(c => c.id !== conversaId));
      
      // Se a conversa excluída for a conversa atual, criar nova conversa
      if (conversaId === conversaAtual) {
        onNovaConversa();
      }
      
      toast.success('Conversa excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      toast.error('Não foi possível excluir a conversa. Tente novamente.');
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Cabeçalho da sidebar */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Conversas</h2>
        
        {isMobile && (
          <button
            onClick={onFecharSidebar}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Botão Nova Conversa */}
      <div className="p-4">
        <button
          onClick={onNovaConversa}
          className="w-full flex items-center justify-center gap-2 p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nova conversa</span>
        </button>
      </div>
      
      {/* Lista de conversas */}
      <div className="flex-grow overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : conversas.length === 0 ? (
          <div className="text-center py-6 px-4 text-gray-500 dark:text-gray-400 text-sm">
            <p>Nenhuma conversa encontrada.</p>
            <p className="mt-2">Comece uma nova conversa para aparecer aqui.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-1">
              {conversas.map((conversa) => (
                <motion.div
                  key={conversa.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className={`w-full relative rounded-md text-sm transition-colors ${
                    conversaAtual === conversa.id
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <button
                    className="w-full text-left p-3 pr-8 flex items-center justify-between"
                    onClick={() => {
                      onSelecionarConversa(conversa.id);
                      if (isMobile) {
                        onFecharSidebar();
                      }
                    }}
                  >
                    <div className="truncate flex-grow">
                      <div className="font-medium truncate">{conversa.titulo || 'Conversa sem título'}</div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                      {formatarData(conversa.atualizado_em || conversa.criado_em)}
                    </span>
                  </button>
                  
                  {/* Botão de opções para cada conversa */}
                  <button
                    onClick={(e) => handleToggleMenu(e, conversa.id)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    aria-label="Opções da conversa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Menu de opções */}
                  <AnimatePresence>
                    {menuAbertoId === conversa.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-9 mt-1 z-[1000] bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-md py-1 min-w-[150px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          onClick={(e) => handleExcluirConversa(e, conversa.id)}
                          disabled={excluindoId === conversa.id}
                        >
                          {excluindoId === conversa.id ? (
                            <div className="animate-spin h-4 w-4 border-b-2 border-red-500 rounded-full mr-2" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                          {excluindoId === conversa.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ConversasSidebar; 