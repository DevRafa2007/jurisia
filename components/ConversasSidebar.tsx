import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { buscarConversas, Conversa } from '../utils/supabase';

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
                <motion.button
                  key={conversa.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className={`w-full text-left p-3 rounded-md text-sm transition-colors ${
                    conversaAtual === conversa.id
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => {
                    onSelecionarConversa(conversa.id);
                    if (isMobile) {
                      onFecharSidebar();
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="truncate flex-grow">
                      <div className="font-medium truncate">{conversa.titulo || 'Conversa sem título'}</div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                      {formatarData(conversa.atualizado_em || conversa.criado_em)}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ConversasSidebar; 