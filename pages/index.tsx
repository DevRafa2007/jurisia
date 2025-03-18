import { useState, useRef, useEffect, MouseEvent } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
import Link from 'next/link';

// Tipo de mensagem para uso local na interface
type Mensagem = {
  conteudo: string;
  isUsuario: boolean;
  id: string;
};

// Variantes de animação para o chat
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      when: "beforeChildren"
    }
  }
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
    
    // Adicionar mensagem do usuário na interface
    const idMensagemUsuario = `msg-${Date.now()}-${Math.random()}`;
    const novaMsgUsuario = {
      conteudo: texto,
      isUsuario: true,
      id: idMensagemUsuario,
    };
    
    setMensagens((msgs) => [...msgs, novaMsgUsuario]);
    
    // Se for uma nova conversa, criar no banco
    let idConversa = conversaAtual;
    if (!conversaAtual) {
      try {
        const novaConversa = await criarConversa(user.id, texto);
        if (novaConversa && novaConversa.id) {
          idConversa = novaConversa.id;
          setConversaAtual(novaConversa.id);
        } else {
          throw new Error('ID da conversa não disponível');
        }
      } catch (erro) {
        console.error('Erro ao criar conversa:', erro);
        setErro('Não foi possível criar uma nova conversa. Tente novamente.');
        return;
      }
    }
    
    // Adicionar mensagem do usuário no banco
    try {
      if (idConversa) {
        await adicionarMensagem(idConversa, texto, 'usuario');
      } else {
        throw new Error('ID da conversa não está disponível');
      }
    } catch (erro) {
      console.error('Erro ao salvar mensagem:', erro);
      // Continuar apesar do erro para não bloquear a interface
    }
    
    // Preparar histórico para o contexto da consulta
    const historico = converterParaHistorico();
    
    // Iniciar carregamento
    setIsCarregando(true);
    setErro(null);
    
    try {
      // Chamar a API para obter resposta da IA
      const resposta = await axios.post('/api/juridica', {
        consulta: texto,
        historico: historico,
      });
      
      if (resposta.data && resposta.data.resposta) {
        // Adicionar resposta da IA na interface
        const idMensagemIA = `msg-${Date.now()}-${Math.random()}`;
        const novaMsgIA = {
          conteudo: resposta.data.resposta,
          isUsuario: false,
          id: idMensagemIA,
        };
        
        setMensagens((msgs) => [...msgs, novaMsgIA]);
        
        // Salvar resposta da IA no banco
        try {
          if (idConversa) {
            await adicionarMensagem(idConversa, resposta.data.resposta, 'assistente');
          }
        } catch (erro) {
          console.error('Erro ao salvar resposta:', erro);
          // Continuar apesar do erro
        }
      } else {
        throw new Error('Resposta da API inválida ou incompleta');
      }
      
    } catch (erro) {
      console.error('Erro ao processar consulta:', erro);
      
      let mensagemErro = 'Houve um problema ao processar sua consulta. Tente novamente.';
      
      if (axios.isAxiosError(erro) && erro.response) {
        if (erro.response.status === 429) {
          mensagemErro = 'Você enviou muitas consultas em um curto período. Aguarde um momento e tente novamente.';
        } else if (erro.response.data && erro.response.data.error) {
          mensagemErro = erro.response.data.error;
        }
      }
      
      setErro(mensagemErro);
      toast.error(mensagemErro, {
        duration: 5000,
      });
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

      <Layout title="JurisIA - Assistente Jurídico com IA" sidebarAberta={sidebarAberta} toggleSidebar={() => setSidebarAberta(!sidebarAberta)}>
        <div className="h-full flex flex-col sm:flex-row">
          {/* Sidebar de conversas para mobile e versão desktop */}
          <AnimatePresence>
            {sidebarAberta && (
              <motion.div
                key="sidebar"
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 z-40 bg-white dark:bg-law-900 overflow-hidden sm:relative sm:w-full sm:max-w-[280px] border-r border-gray-200 dark:border-law-700"
              >
                <ConversasSidebar 
                  conversaAtual={conversaAtual}
                  onSelecionarConversa={handleSelecionarConversa}
                  onNovaConversa={handleNovaConversa}
                  onFecharSidebar={() => setSidebarAberta(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Área principal de chat */}
          <motion.div 
            className="flex-grow h-full overflow-hidden flex flex-col relative"
            animate={{ 
              marginLeft: isMobile ? 0 : sidebarAberta ? "0" : "-280px",
              width: isMobile ? "100%" : sidebarAberta ? "calc(100% - 280px)" : "100%"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {!user && !isLoading && (
              <div className="flex-grow flex flex-col justify-center items-center p-4 text-center">
                <h1 className="text-2xl sm:text-4xl font-serif text-primary-700 dark:text-primary-300 mb-4">
                  Bem-vindo à JurisIA
                </h1>
                <p className="text-law-600 dark:text-law-300 mb-8 max-w-md">
                  Faça login para começar a usar o assistente jurídico inteligente para advogados brasileiros
                </p>
                <Link 
                  href="/login"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  Entrar na plataforma
                </Link>
              </div>
            )}

            {user && (
              <>
                {/* Botões de acesso rápido */}
                <div className="flex justify-center space-x-4 my-4 px-4">
                  <Link
                    href="/documentos"
                    className="flex items-center px-4 py-2 bg-primary-50 dark:bg-law-800 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-law-700 transition-colors duration-300 border border-primary-200 dark:border-law-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Criar Documentos
                  </Link>
                </div>
                
                {/* Chat existente */}
                <div 
                  ref={chatContainerRef}
                  className="flex-grow overflow-y-auto scrollbar-custom pb-32 pt-4 px-2 sm:px-4"
                  id="chat-messages"
                >
                  <motion.div 
                    className="max-w-2xl mx-auto space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {erro && (
                      <motion.div 
                        className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{erro}</span>
                        </div>
                      </motion.div>
                    )}
                    
                    <AnimatePresence initial={false}>
                      {mensagens.map((msg) => (
                        <ChatMessage 
                          key={msg.id} 
                          conteudo={msg.conteudo} 
                          isUsuario={msg.isUsuario} 
                        />
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </motion.div>
                  
                  {/* Indicador de digitação */}
                  <AnimatePresence>
                    {isCarregando && (
                      <motion.div 
                        className="flex items-center space-x-2 text-law-500 dark:text-law-400 text-sm mt-4 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg className="h-5 w-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="4" cy="12" r="3" />
                          <circle cx="12" cy="12" r="3" />
                          <circle cx="20" cy="12" r="3" />
                        </svg>
                        <span>Assistente jurídico está digitando...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              </>
            )}
          </motion.div>
        </div>
      </Layout>
    </>
  );
} 