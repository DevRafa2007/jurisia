import { useState, useRef, useEffect, MouseEvent } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Layout from '../components/Layout';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import ConversasSidebar from '../components/ConversasSidebar';
import { useAuth } from '../contexts/AuthContext';
import { 
  criarConversa, 
  adicionarMensagem, 
  carregarMensagens, 
  Mensagem as MensagemDB 
} from '../utils/supabase';

// Tipo de mensagem para uso local na interface
type Mensagem = {
  conteudo: string;
  isUsuario: boolean;
  id: string;
};

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [isCarregando, setIsCarregando] = useState(false);
  const [conversaAtual, setConversaAtual] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Inicializar a barra lateral aberta apenas em dispositivos maiores (desktop)
  useEffect(() => {
    // Checar se estamos no cliente
    if (typeof window !== 'undefined') {
      setSidebarAberta(window.innerWidth >= 768);
      setIsMobile(window.innerWidth < 640);
      
      // Função para atualizar o estado da barra lateral quando a tela é redimensionada
      const handleResize = () => {
        const isMobile = window.innerWidth < 768;
        setIsMobile(window.innerWidth < 640);
        // Em desktop, sempre mostrar a barra lateral
        // Em mobile, manter o estado atual
        if (!isMobile) {
          setSidebarAberta(true);
        }
      };
      
      // Adicionar listener para eventos de redimensionamento
      window.addEventListener('resize', handleResize);
      
      // Limpar o listener quando o componente for desmontado
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Forçar scroll para o topo na carga inicial da página
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Desabilita qualquer rolagem automática durante a carga inicial
      const originalScrollTo = window.scrollTo;
      const originalScrollBy = window.scrollBy;
      
      // Impedir rolagem automática durante a carga inicial
      const blockInitialScroll = () => {
        window.scrollTo = function() { return; };
        window.scrollBy = function() { return; };
        
        // Forçar posição no topo
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Restaurar funções originais após um curto período
        setTimeout(() => {
          window.scrollTo = originalScrollTo;
          window.scrollBy = originalScrollBy;
        }, 500);
      };
      
      blockInitialScroll();
    }
  }, []);

  // Rolagem automática para a mensagem mais recente
  useEffect(() => {
    // Rola para mostrar o início da última mensagem quando novas mensagens são adicionadas
    // Não rolar automaticamente na carga inicial (quando mensagens não mudaram por ação do usuário)
    if (chatContainerRef.current && mensagens.length > 0 && !isLoading) {
      // Implementa uma pequena verificação para não rolar automaticamente na inicialização
      const isInitialLoad = document.readyState !== 'complete';
      if (!isInitialLoad) {
        const mensagensContainer = chatContainerRef.current;
        const allMessages = mensagensContainer.querySelectorAll('.message');
        
        if (allMessages.length > 0) {
          const lastMessage = allMessages[allMessages.length - 1];
          
          // Se não for uma mensagem do usuário, posiciona no início da mensagem
          if (mensagens[mensagens.length - 1] && !mensagens[mensagens.length - 1].isUsuario) {
            lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            // Se for uma mensagem do usuário, rola para o final normalmente
            mensagensContainer.scrollTop = mensagensContainer.scrollHeight;
          }
        }
      }
    }
  }, [mensagens, isLoading]);

  // Carregar mensagens de uma conversa existente
  useEffect(() => {
    const carregarConversa = async () => {
      if (!conversaAtual || !user) return;
      
      try {
        setIsCarregando(true);
        const mensagensDB = await carregarMensagens(conversaAtual);
        
        // Converter do formato do banco para o formato da UI
        const mensagensUI = mensagensDB.map((msg: MensagemDB) => ({
          conteudo: msg.conteudo,
          isUsuario: msg.tipo === 'usuario',
          id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        }));
        
        setMensagens(mensagensUI);
        
        // Após carregar as mensagens, resetar o scroll da área de chat para o topo
        if (chatContainerRef.current) {
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = 0;
            }
          }, 100); // Pequeno atraso para garantir que a renderização seja concluída
        }
        
      } catch (erro) {
        console.error('Erro ao carregar conversa:', erro);
        setErro('Falha ao carregar as mensagens da conversa. Tente novamente.');
      } finally {
        setIsCarregando(false);
      }
    };

    carregarConversa();
  }, [conversaAtual, user]);

  // Se nenhuma conversa estiver iniciada, mostrar mensagem de boas-vindas
  useEffect(() => {
    if (!conversaAtual && mensagens.length === 0 && user) {
      setMensagens([
        {
          conteudo: `# Bem-vindo à IA Advocacia

Olá, sou seu assistente jurídico virtual. Estou aqui para ajudar com:

* Pesquisa e interpretação de leis
* Análise de contratos e documentos
* Orientação processual básica
* Respostas a dúvidas jurídicas gerais

Como posso auxiliar você hoje?`,
          isUsuario: false,
          id: 'welcome-' + Date.now(),
        },
      ]);
    }
  }, [conversaAtual, mensagens.length, user]);

  // Converte as mensagens para o formato esperado pela API
  const converterParaHistorico = () => {
    return mensagens.map((msg: Mensagem) => ({
      role: msg.isUsuario ? "user" : "assistant",
      content: msg.conteudo,
    }));
  };

  const handleEnviarMensagem = async (texto: string) => {
    if (!texto.trim()) {
      return; // Não processar mensagens vazias
    }

    if (!user) {
      router.push('/login');
      return;
    }
    
    // Limpa qualquer erro anterior
    setErro(null);

    // Adiciona a mensagem do usuário ao chat
    const novaMensagemUsuario: Mensagem = {
      conteudo: texto,
      isUsuario: true,
      id: 'user-' + Date.now(),
    };
    
    setMensagens((prev: Mensagem[]) => [...prev, novaMensagemUsuario]);
    setIsCarregando(true);
    
    try {
      let conversaId = conversaAtual;
      
      // Se não houver conversa atual, cria uma nova
      if (!conversaId) {
        try {
          const novaConversa = await criarConversa(user.id, texto.substring(0, 50) + (texto.length > 50 ? '...' : ''));
          conversaId = novaConversa.id || null;
          setConversaAtual(conversaId);
          
          // Salva a mensagem do usuário no banco
          if (conversaId) {
            await adicionarMensagem(conversaId, texto, 'usuario');
          } else {
            throw new Error('Não foi possível criar uma nova conversa');
          }
        } catch (erroConversa) {
          console.error('Erro ao criar nova conversa:', erroConversa);
          throw new Error('Não foi possível criar uma nova conversa. Verifique sua conexão.');
        }
      } else {
        // Salva a mensagem do usuário no banco
        try {
          await adicionarMensagem(conversaId, texto, 'usuario');
        } catch (erroMensagem) {
          console.error('Erro ao salvar mensagem do usuário:', erroMensagem);
          // Continuar mesmo com erro ao salvar
        }
      }

      // Prepara o histórico para enviar à API
      const historico = converterParaHistorico();
      
      // Envia a consulta para a API
      try {
        const response = await axios.post('/api/juridica', {
          consulta: texto,
          historico: historico,
        });

        if (response.data && response.data.conteudo) {
          // Adiciona a resposta da IA ao chat
          const novaMensagemIA: Mensagem = {
            conteudo: response.data.conteudo,
            isUsuario: false,
            id: 'ai-' + Date.now(),
          };

          setMensagens((prev: Mensagem[]) => [...prev, novaMensagemIA]);
          
          // Salva a resposta da IA no banco
          if (conversaId) {
            try {
              await adicionarMensagem(conversaId, response.data.conteudo, 'assistente');
            } catch (erroSalvar) {
              console.error('Erro ao salvar resposta da IA:', erroSalvar);
              // Continuar mesmo com erro ao salvar
            }
          }
        } else {
          throw new Error('Resposta inválida da API');
        }
      } catch (erroAPI) {
        console.error('Erro na API:', erroAPI);
        throw new Error('Erro ao processar sua consulta no servidor. Por favor, tente novamente.');
      }
    } catch (erro) {
      console.error('Erro ao processar consulta:', erro);
      
      // Adiciona mensagem de erro ao chat
      const mensagemErro: Mensagem = {
        conteudo: erro instanceof Error ? erro.message : "Desculpe, ocorreu um erro ao processar sua consulta. Por favor, tente novamente mais tarde.",
        isUsuario: false,
        id: 'error-' + Date.now(),
      };
      
      setMensagens((prev: Mensagem[]) => [...prev, mensagemErro]);
      setErro(erro instanceof Error ? erro.message : "Ocorreu um erro ao processar sua consulta");
    } finally {
      setIsCarregando(false);
    }
  };

  const handleNovaConversa = () => {
    setConversaAtual(null);
    setMensagens([
      {
        conteudo: `# Bem-vindo à IA Advocacia

Olá, sou seu assistente jurídico virtual. Estou aqui para ajudar com:

* Pesquisa e interpretação de leis
* Análise de contratos e documentos
* Orientação processual básica
* Respostas a dúvidas jurídicas gerais

Como posso auxiliar você hoje?`,
        isUsuario: false,
        id: 'welcome-' + Date.now(),
      },
    ]);
    setErro(null);
  };

  const handleSelecionarConversa = (conversaId: string) => {
    setConversaAtual(conversaId);
    setErro(null);
  };

  // Se estiver carregando o estado de autenticação, mostra loader
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700 dark:border-primary-400"></div>
        </div>
      </Layout>
    );
  }

  // Se o usuário não estiver logado, não renderiza o conteúdo (será redirecionado)
  if (!user) {
    return <Layout>
      <div></div>
    </Layout>;
  }

  return (
    <>
      <Head>
        <title>IA Advocacia - Assistente Jurídico</title>
        <meta name="description" content="Assistente jurídico virtual para auxiliar advogados e clientes." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout sidebarAberta={sidebarAberta} toggleSidebar={() => setSidebarAberta(!sidebarAberta)}>
        <div className="flex flex-col md:flex-row h-full">
          {/* Sidebar com conversas - Responsiva */}
          <div 
            className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out md:relative md:block md:opacity-100 ${
              sidebarAberta 
                ? 'bg-gray-900 bg-opacity-50 opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
            } md:w-96 lg:w-1/4 xl:w-1/5 h-full md:bg-transparent`}
            onClick={(e: MouseEvent<HTMLDivElement>) => {
              // Fechar o sidebar quando clicar fora dele em dispositivos móveis
              if (window.innerWidth < 768 && e.target === e.currentTarget) {
                setSidebarAberta(false);
              }
            }}
          >
            {/* Conteúdo da barra lateral */}
            <div 
              className={`absolute h-full w-3/4 sm:w-96 md:w-full top-0 left-0 bg-white dark:bg-law-900 shadow-lg transform transition-transform duration-300 ease-in-out ${
                sidebarAberta ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              }`}
            >
              <ConversasSidebar
                usuarioId={user.id}
                conversaAtual={conversaAtual}
                onSelecionarConversa={(id: string) => {
                  handleSelecionarConversa(id);
                  if (window.innerWidth < 768) setSidebarAberta(false);
                }}
                onNovaConversa={() => {
                  handleNovaConversa();
                  if (window.innerWidth < 768) setSidebarAberta(false);
                }}
                toggleSidebar={() => setSidebarAberta(false)}
                isMobile={true}
              />
            </div>
          </div>
          
          {/* Área principal de chat - Responsiva */}
          <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
            {/* Cabeçalho da conversa */}
            <div className="border-b border-law-200 dark:border-law-700 bg-white dark:bg-law-900 p-4 shadow-sm rounded-t-lg">
              <div className="flex justify-between items-center">
                <h1 className="text-lg font-serif font-medium text-law-900 dark:text-law-100">
                  {conversaAtual ? 'Consulta em andamento' : 'Nova Consulta Jurídica'}
                </h1>
                <button
                  onClick={handleNovaConversa}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-primary-700 hover:bg-primary-600 dark:bg-primary-800 dark:hover:bg-primary-700 text-white rounded-lg transition-colors duration-300 flex items-center shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Nova Consulta</span>
                  <span className="sm:hidden">Nova</span>
                </button>
              </div>
            </div>
            
            {/* Área de mensagens com fundo estilizado */}
            <div 
              ref={chatContainerRef}
              className="flex-grow overflow-y-auto px-4 py-6 sm:px-6 law-bg-pattern bg-law-50 dark:bg-law-900"
              style={{ 
                height: 'auto',
                paddingBottom: 'calc(60px + 0.75rem)' // Aumentado para dispositivos móveis
              }}
            >
              <div className="max-w-2xl mx-auto space-y-6">
                {erro && (
                  <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{erro}</span>
                    </div>
                  </div>
                )}
                
                {mensagens.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    conteudo={msg.conteudo} 
                    isUsuario={msg.isUsuario} 
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Indicador de digitação */}
              {isCarregando && (
                <div className="flex items-center space-x-2 text-law-500 dark:text-law-400 text-sm mt-4 max-w-2xl mx-auto animate-fade-in">
                  <svg className="h-5 w-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="4" cy="12" r="3" />
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="20" cy="12" r="3" />
                  </svg>
                  <span>Assistente jurídico está digitando...</span>
                </div>
              )}
            </div>
            
            {/* Área de input */}
            <div className={`border-t border-law-200 dark:border-law-700 bg-white dark:bg-law-800 p-4 ${isMobile ? 'mobile-typing-area' : ''} rounded-b-lg`}>
              <div className="max-w-2xl mx-auto">
                <ChatInput 
                  onEnviar={handleEnviarMensagem} 
                  isCarregando={isCarregando} 
                />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
} 