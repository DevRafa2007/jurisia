import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import ConversasSidebar from '../components/ConversasSidebar';
import { useAuth } from '../contexts/AuthContext';
import { 
  criarConversa, 
  adicionarMensagem, 
  carregarMensagens, 
  Mensagem as MensagemDB 
} from '../utils/supabase';

type Mensagem = {
  conteudo: string;
  isUsuario: boolean;
};

export default function Home() {
  const { user, isLoading, isInitialized, recarregarSessao } = useAuth();
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [isCarregando, setIsCarregando] = useState(false);
  const [conversaAtual, setConversaAtual] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [erroAudioGlobal, setErroAudioGlobal] = useState<string | null>(null);
  const [portalContainer, setPortalContainer] = useState<Element | null>(null);
  const [inicializacaoCompleta, setInicializacaoCompleta] = useState(false);
  const [erroSessao, setErroSessao] = useState<string | null>(null);
  const [recarregandoSessao, setRecarregandoSessao] = useState(false);
  const inicializacaoTimeout = useRef<NodeJS.Timeout | null>(null);

  // Atualizar a largura da janela quando redimensionar
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      
      // Se for desktop, iniciar com a sidebar aberta
      if (window.innerWidth >= 768 && !sidebarAberta) {
        setSidebarAberta(true);
      }
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Efeito para garantir que a sidebar apareça em desktop
  useEffect(() => {
    if (windowWidth >= 768 && !sidebarAberta) {
      setSidebarAberta(true);
    }
  }, [windowWidth, sidebarAberta]);

  // Redirecionar para login apenas se a inicialização da autenticação estiver completa
  useEffect(() => {
    console.log("[HOME] Estado de autenticação:", { isInitialized, isLoading, user: !!user });
    
    // Limpar timeout anterior se existir
    if (inicializacaoTimeout.current) {
      clearTimeout(inicializacaoTimeout.current);
    }
    
    // Só redirecionar quando temos certeza que a autenticação foi verificada
    if (isInitialized && !isLoading) {
      if (!user) {
        console.log("[HOME] Redirecionando para login - usuário não autenticado");
        router.push('/login');
      } else {
        console.log("[HOME] Inicialização completa - usuário autenticado");
        setInicializacaoCompleta(true);
        setErroSessao(null);
      }
    } 
    // Se a inicialização demorar muito tempo, exibir erro
    else if (!isInitialized && !isLoading) {
      setErroSessao("A sessão não pode ser inicializada corretamente. Por favor, recarregue a sessão.");
    }
    // Se estiver carregando por muito tempo
    else if (isLoading) {
      inicializacaoTimeout.current = setTimeout(() => {
        if (isLoading) {
          setErroSessao("A inicialização está demorando mais que o esperado. Talvez a sessão esteja com problemas.");
        }
      }, 8000); // 8 segundos é muito tempo para carregar
    }
    
    return () => {
      if (inicializacaoTimeout.current) {
        clearTimeout(inicializacaoTimeout.current);
      }
    };
  }, [user, isLoading, isInitialized, router]);

  // Hook para rolar para o final da conversa quando novas mensagens são adicionadas
  const scrollToBottomWithDelay = useCallback(() => {
    if (!chatContainerRef.current) return;
    
    // Scroll imediato inicial
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        const scrollHeight = chatContainerRef.current.scrollHeight;
        const height = chatContainerRef.current.clientHeight;
        const maxScrollTop = scrollHeight - height;
        
        // Adicionamos um pequeno extra para garantir que o scroll vá completamente para o final
        chatContainerRef.current.scrollTop = maxScrollTop + 200;
      }
    };
    
    // Executa imediatamente
    scrollToBottom();
    
    // E também com vários intervalos para garantir que o DOM foi atualizado
    const timers = [
      setTimeout(scrollToBottom, 50),
      setTimeout(scrollToBottom, 150),
      setTimeout(scrollToBottom, 300),
      setTimeout(scrollToBottom, 500)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);
  
  // Usa o hook de scroll quando as mensagens mudam
  useEffect(() => {
    return scrollToBottomWithDelay();
  }, [mensagens, scrollToBottomWithDelay]);
  
  // Também rola para baixo quando a conversa muda
  useEffect(() => {
    if (conversaAtual) {
      return scrollToBottomWithDelay();
    }
  }, [conversaAtual, scrollToBottomWithDelay]);

  // Carregar mensagens de uma conversa existente
  useEffect(() => {
    const carregarConversa = async () => {
      if (!conversaAtual || !user) return;
      
      try {
        setIsCarregando(true);
        const mensagensDB = await carregarMensagens(conversaAtual);
        
        if (!mensagensDB || mensagensDB.length === 0) {
          console.log('Nenhuma mensagem encontrada para esta conversa');
          setMensagens([]);
          return;
        }
        
        // Converter do formato do banco para o formato da UI
        const mensagensUI = mensagensDB.map((msg: MensagemDB) => ({
          conteudo: msg.conteudo,
          isUsuario: msg.tipo === 'usuario',
        }));
        
        setMensagens(mensagensUI);
        
        // Assegurar que a rolagem funcione após o carregamento
        setTimeout(() => scrollToBottomWithDelay(), 300);
      } catch (erro) {
        console.error('Erro ao carregar conversa:', erro);
        // Mostrar mensagem de erro ao usuário
        setMensagens([{
          conteudo: "Ocorreu um erro ao carregar esta conversa. Por favor, tente novamente mais tarde.",
          isUsuario: false
        }]);
      } finally {
        setIsCarregando(false);
      }
    };

    carregarConversa();
  }, [conversaAtual, user, scrollToBottomWithDelay]);

  // Converte as mensagens para o formato esperado pela API
  const converterParaHistorico = () => {
    return mensagens.map((msg) => ({
      role: msg.isUsuario ? "user" : "assistant",
      content: msg.conteudo,
    }));
  };

  // Nova conversa com useCallback para evitar dependência circular
  const handleNovaConversa = useCallback(() => {
    setConversaAtual(null);
    setMensagens([
      {
        conteudo: "Olá! Sou o JurisIA, seu assistente jurídico alimentado por inteligência artificial. Como posso ajudar você hoje com questões jurídicas brasileiras?",
        isUsuario: false,
      },
    ]);
  }, []);

  // Se nenhuma conversa estiver iniciada, mostrar mensagem de boas-vindas
  useEffect(() => {
    if (!conversaAtual && mensagens.length === 0 && user) {
      // A mensagem de boas-vindas agora é adicionada ao criar uma nova conversa
      // e já é salva no banco de dados
      handleNovaConversa();
    }
  }, [conversaAtual, mensagens.length, user, handleNovaConversa]);

  const handleEnviarMensagem = async (texto: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Adiciona a mensagem do usuário ao chat
    const novaMensagemUsuario: Mensagem = {
      conteudo: texto,
      isUsuario: true,
    };
    
    setMensagens((prev) => [...prev, novaMensagemUsuario]);
    setIsCarregando(true);

    // IDs para controle de timeouts
    let timeoutId: NodeJS.Timeout | null = null;
    let apiTimeoutId: NodeJS.Timeout | null = null;

    try {
      // Configurar um timeout para a operação completa (15 segundos)
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Tempo limite excedido ao processar a consulta.'));
        }, 15000);
      });

      // Função para criar ou obter o ID da conversa
      const obterIdConversa = async (): Promise<string | null> => {
        try {
          // Variável para armazenar o ID da conversa atual ou nova
          let idConversaAtual: string | null = conversaAtual;
          
          // Se não houver conversa atual, cria uma nova
          if (!idConversaAtual) {
            console.log("[CHAT] Criando nova conversa");
            // Usar o texto da mensagem do usuário como título (limitando a 50 caracteres)
            const tituloConversa = texto.substring(0, 50) + (texto.length > 50 ? '...' : '');
            const novaConversa = await criarConversa(user.id, tituloConversa);
            
            if (novaConversa && novaConversa.id) {
              idConversaAtual = novaConversa.id;
              setConversaAtual(idConversaAtual);
              console.log("[CHAT] Nova conversa criada:", idConversaAtual);
            } else {
              console.error("[CHAT] Falha ao criar nova conversa");
              throw new Error("Não foi possível criar uma nova conversa.");
            }
          }
          
          return idConversaAtual;
        } catch (erro) {
          console.error("[CHAT] Erro ao obter ID da conversa:", erro);
          throw erro;
        }
      };

      // Função para salvar a mensagem no banco de dados
      const salvarMensagem = async (conversaId: string, conteudo: string, tipo: 'usuario' | 'assistente'): Promise<void> => {
        try {
          console.log(`[CHAT] Salvando mensagem de ${tipo} para conversa:`, conversaId);
          await adicionarMensagem(conversaId, conteudo, tipo);
          console.log(`[CHAT] Mensagem de ${tipo} salva com sucesso`);
        } catch (erro) {
          console.error(`[CHAT] Erro ao salvar mensagem de ${tipo}:`, erro);
          throw erro;
        }
      };

      // Função para enviar consulta à API com retentativas
      const enviarConsultaAPI = async (consultaTexto: string, historicoMensagens: any[], tentativas = 0): Promise<any> => {
        const maxTentativas = 2; // Tentativas totais: inicial + 2 retentativas
        
        try {
          console.log(`[CHAT] Enviando consulta para API (tentativa ${tentativas + 1}/${maxTentativas + 1})`);
          
          // Configurar um timeout específico para a chamada da API (10 segundos)
          if (apiTimeoutId) {
            clearTimeout(apiTimeoutId);
          }
          
          const apiTimeoutPromise = new Promise<never>((_, reject) => {
            apiTimeoutId = setTimeout(() => {
              reject(new Error('Tempo limite excedido na comunicação com a API.'));
            }, 10000);
          });
          
          // Fazer a chamada à API com o timeout
          const responsePromise = axios.post('/api/juridica', {
            consulta: consultaTexto,
            historico: historicoMensagens,
          });
          
          // Aguardar o que acontecer primeiro: resposta ou timeout
          const response = await Promise.race([responsePromise, apiTimeoutPromise]);
          
          // Limpar o timeout se a resposta chegar antes
          if (apiTimeoutId) {
            clearTimeout(apiTimeoutId);
            apiTimeoutId = null;
          }
          
          console.log(`[CHAT] Resposta da API recebida com sucesso`);
          return response.data;
        } catch (erro: any) {
          // Limpar o timeout em caso de erro
          if (apiTimeoutId) {
            clearTimeout(apiTimeoutId);
            apiTimeoutId = null;
          }
          
          console.error(`[CHAT] Erro ao enviar consulta para API (tentativa ${tentativas + 1}):`, erro);
          
          // Se ainda temos tentativas disponíveis, tentamos novamente
          if (tentativas < maxTentativas) {
            console.log(`[CHAT] Tentando novamente em ${(tentativas + 1) * 2} segundos...`);
            
            // Exibir mensagem de retentativa para o usuário
            const mensagemRetentativa: Mensagem = {
              conteudo: `⚠️ Estamos com dificuldades para processar sua consulta. Tentando novamente... (${tentativas + 2}/${maxTentativas + 1})`,
              isUsuario: false,
            };
            setMensagens((prev) => [...prev.slice(0, -1), mensagemRetentativa]);
            
            // Aguardar um tempo antes de tentar novamente (backoff exponencial)
            await new Promise(resolve => setTimeout(resolve, (tentativas + 1) * 2000));
            
            // Remover a mensagem de retentativa
            setMensagens((prev) => prev.filter(m => !m.conteudo.includes('⚠️ Estamos com dificuldades')));
            
            // Tentar novamente
            return enviarConsultaAPI(consultaTexto, historicoMensagens, tentativas + 1);
          }
          
          // Se esgotar as tentativas, propagar o erro
          throw erro;
        }
      };

      // Processamento principal - executar tudo com limite de tempo
      const resultadoPromise = (async () => {
        try {
          // 1. Obter ID da conversa
          const idConversaAtual = await obterIdConversa();
          if (!idConversaAtual) {
            throw new Error("Não foi possível obter o ID da conversa.");
          }
          
          // 2. Salvar mensagem do usuário
          await salvarMensagem(idConversaAtual, texto, 'usuario');
          
          // 3. Preparar o histórico para enviar à API
          const historico = converterParaHistorico();
          
          // 4. Enviar a consulta para a API (com retentativas)
          const resposta = await enviarConsultaAPI(texto, historico);
          
          // 5. Adicionar a resposta da IA ao chat
          const novaMensagemIA: Mensagem = {
            conteudo: resposta.conteudo,
            isUsuario: false,
          };
          
          setMensagens((prev) => [...prev, novaMensagemIA]);
          
          // 6. Salvar a resposta da IA no banco
          await salvarMensagem(idConversaAtual, resposta.conteudo, 'assistente');
          
          return true;
        } catch (erro) {
          throw erro;
        }
      })();
      
      // Executar a operação principal ou falhar se exceder o tempo limite
      await Promise.race([resultadoPromise, timeoutPromise]);
      
      // Limpar o timeout se a operação concluir com sucesso
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

    } catch (erro: any) {
      // Limpar os timeouts em caso de erro
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (apiTimeoutId) {
        clearTimeout(apiTimeoutId);
        apiTimeoutId = null;
      }
      
      console.error('[CHAT] Erro ao processar consulta:', erro);
      
      // Determinar a mensagem de erro apropriada
      let mensagemErroTexto = "Desculpe, ocorreu um erro ao processar sua consulta. Por favor, tente novamente mais tarde.";
      
      if (erro.message?.includes('tempo limite') || erro.message?.includes('timeout')) {
        mensagemErroTexto = "A resposta está demorando mais que o esperado. Por favor, tente novamente ou faça uma consulta mais simples.";
      } else if (erro.response?.status === 401 || erro.response?.status === 403) {
        mensagemErroTexto = "Parece que a sua sessão expirou. Por favor, recarregue a página e faça login novamente.";
      } else if (erro.response?.status === 429) {
        mensagemErroTexto = "Muitas consultas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.";
      } else if (erro.message?.includes('network') || erro.message?.includes('Network Error') || erro.message?.includes('Failed to fetch')) {
        mensagemErroTexto = "Problemas de conexão com o servidor. Verifique sua internet e tente novamente.";
      }
      
      // Adiciona mensagem de erro ao chat
      const mensagemErro: Mensagem = {
        conteudo: mensagemErroTexto,
        isUsuario: false,
      };
      
      setMensagens((prev) => [...prev, mensagemErro]);
    } finally {
      setIsCarregando(false);
    }
  };

  const handleSelecionarConversa = (conversaId: string) => {
    setConversaAtual(conversaId);
  };

  // Detectar se há overflow (mais conteúdo que cabe na área visível)
  const checkOverflow = useCallback(() => {
    if (chatContainerRef.current) {
      const hasScrollableContent = 
        chatContainerRef.current.scrollHeight > chatContainerRef.current.clientHeight;
      setHasOverflow(hasScrollableContent);
    }
  }, []);

  // Verificar overflow quando as mensagens mudam ou a janela é redimensionada
  useEffect(() => {
    checkOverflow();
    
    // Também verificar após os timeouts do scroll para garantir que o conteúdo foi renderizado
    const timeouts = [
      setTimeout(checkOverflow, 100),
      setTimeout(checkOverflow, 300),
      setTimeout(checkOverflow, 500)
    ];
    
    // Adicionar verificação de overflow no redimensionamento da janela
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      window.removeEventListener('resize', checkOverflow);
    };
  }, [mensagens, conversaAtual, checkOverflow]);

  // Configurar o container para o portal das notificações
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Verificar se já existe um container
      let container = document.getElementById('notification-portal');
      
      if (!container) {
        // Criar o container se não existir
        container = document.createElement('div');
        container.id = 'notification-portal';
        // Adicionar ao final do body para garantir que fique acima de tudo
        document.body.appendChild(container);
      }
      
      setPortalContainer(container);
      
      // Limpar ao desmontar
      return () => {
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      };
    }
  }, []);

  // Handler para fechar notificação quando clicar fora (no caso de desktop)
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (erroAudioGlobal && windowWidth >= 768) {
      const notification = document.querySelector('.desktop-notification');
      if (notification && !notification.contains(e.target as Node)) {
        setErroAudioGlobal(null);
      }
    }
  }, [erroAudioGlobal, windowWidth]);

  // Adicionar event listener para clicar fora da notificação
  useEffect(() => {
    if (erroAudioGlobal && windowWidth >= 768) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [erroAudioGlobal, windowWidth, handleClickOutside]);

  // Função para definir o erro de áudio global
  const definirErroAudio = (mensagem: string | null) => {
    setErroAudioGlobal(mensagem);
    if (mensagem) {
      // Limpar a mensagem após 12 segundos em desktop, 8 em mobile
      setTimeout(() => setErroAudioGlobal(null), windowWidth >= 768 ? 12000 : 8000);
    }
  };

  // Função para tentar recarregar a sessão
  const handleRecarregarSessao = async () => {
    try {
      setRecarregandoSessao(true);
      setErroSessao("Recarregando sessão...");
      await recarregarSessao();
      setErroSessao(null);
    } catch (error) {
      console.error("[HOME] Erro ao recarregar sessão:", error);
      setErroSessao("Erro ao recarregar a sessão. Tente novamente ou vá para a página de login.");
    } finally {
      setRecarregandoSessao(false);
    }
  };

  // Mostrar estado de carregamento enquanto verificamos autenticação
  if (!isInitialized || isLoading) {
    return (
      <Layout
        title="Carregando | JurisIA - Assistente Jurídico com IA"
        description="Carregando JurisIA, assistente jurídico inteligente para advogados brasileiros"
      >
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Inicializando aplicação...</p>
            {isLoading && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Verificando autenticação...</p>}
            {!isInitialized && !isLoading && (
              <div className="mt-4">
                <p className="text-red-600 dark:text-red-400 mb-2">Problema ao inicializar a sessão</p>
                <button 
                  onClick={handleRecarregarSessao}
                  disabled={recarregandoSessao}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300"
                >
                  {recarregandoSessao ? 'Recarregando...' : 'Recarregar Sessão'}
                </button>
                <button 
                  onClick={() => router.push('/login')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300 ml-2"
                >
                  Ir para Login
                </button>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Se o usuário não estiver logado, não renderiza o conteúdo (será redirecionado)
  if (!user) {
    return <Layout>
      {/* Componente vazio para satisfazer o prop children */}
      <div></div>
    </Layout>;
  }

  // Se tiver um erro de sessão, mesmo com o usuário logado
  if (erroSessao) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md">
            <div className="text-red-600 dark:text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Problema com a Sessão</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{erroSessao}</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={handleRecarregarSessao}
                disabled={recarregandoSessao}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300"
              >
                {recarregandoSessao ? 'Recarregando...' : 'Recarregar Sessão'}
              </button>
              <button 
                onClick={() => router.push('/debug')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300"
              >
                Diagnóstico
              </button>
              <button 
                onClick={() => router.push('/login')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors duration-300"
              >
                Ir para Login
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout sidebarAberta={sidebarAberta} toggleSidebar={() => setSidebarAberta(!sidebarAberta)}>
      {/* Notificação de erro de áudio via Portal - Renderizada fora da hierarquia normal do DOM */}
      {portalContainer && erroAudioGlobal && createPortal(
        <div 
          className={`fixed mx-auto max-w-md z-[99999] bg-red-100 dark:bg-red-900 border-2 border-red-500 dark:border-red-600 p-4 rounded-lg shadow-2xl notification-error ${windowWidth >= 768 ? 'desktop-notification' : 'mobile-notification'}`}
          style={{ 
            // Para celulares: topo da tela
            ...(windowWidth < 768 ? {
              top: '0',
              left: '0',
              right: '0',
              width: '90%',
              marginTop: '50px'
            } : 
            // Para computadores: centro da tela
            {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1.05)',
              width: '450px',
              boxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.3)',
              padding: '20px',
              borderWidth: '3px'
            })
          }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className={`${windowWidth >= 768 ? 'h-8 w-8' : 'h-6 w-6'} text-red-600 dark:text-red-400`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className={`${windowWidth >= 768 ? 'text-base md:text-lg font-bold' : 'text-sm font-semibold'} text-red-600 dark:text-red-200`}>{erroAudioGlobal}</p>
            <button 
              className="ml-auto text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100 p-1"
              onClick={() => setErroAudioGlobal(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`${windowWidth >= 768 ? 'h-6 w-6' : 'h-5 w-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>,
        portalContainer
      )}

      <div className="flex flex-col md:flex-row h-[calc(100vh-48px-32px)] sm:h-[calc(100vh-56px-36px)] md:h-[calc(100vh-64px-48px)]">
        {/* Sidebar com conversas - Responsiva */}
        <div 
          className="fixed inset-0 z-30 md:relative md:w-96 lg:w-1/4 xl:w-1/5"
          style={{ 
            visibility: sidebarAberta || windowWidth >= 768 ? 'visible' : 'hidden',
            pointerEvents: sidebarAberta || windowWidth >= 768 ? 'auto' : 'none'
          }}
        >
          {/* Overlay escuro para dispositivos móveis */}
          <div 
            className={`absolute inset-0 bg-gray-900 md:hidden sidebar-animation ${
              sidebarAberta ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setSidebarAberta(false)}
            aria-hidden="true"
          ></div>
          
          {/* Contenedor da barra lateral com animação simplificada */}
          <div 
            ref={sidebarRef}
            className="absolute md:relative top-0 left-0 h-full md:h-full z-40 md:z-auto pointer-events-auto md:w-96 lg:w-1/4 xl:w-1/5 sidebar-animation"
            style={{ 
              transform: sidebarAberta || windowWidth >= 768 ? 'translateX(0)' : 'translateX(-100%)',
              width: windowWidth < 768 ? '75%' : '100%',
              maxWidth: windowWidth < 768 ? '300px' : 'none',
              boxShadow: sidebarAberta && windowWidth < 768 ? '0 0 15px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            <ConversasSidebar
              usuarioId={user.id}
              conversaAtual={conversaAtual}
              onSelecionarConversa={(id) => {
                handleSelecionarConversa(id);
                if (windowWidth < 768) setSidebarAberta(false);
              }}
              onNovaConversa={() => {
                handleNovaConversa();
                if (windowWidth < 768) setSidebarAberta(false);
              }}
              toggleSidebar={() => setSidebarAberta(false)}
              isMobile={true}
            />
          </div>
        </div>

        {/* Área principal de chat - Responsiva */}
        <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative chat-container">
          {/* Cabeçalho da área de chat */}
          <div className="p-2 sm:p-3 md:p-4 bg-primary-50 dark:bg-gray-800 border-b border-primary-100 dark:border-gray-700 rounded-t-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-primary-800 dark:text-primary-300">Consulta Jurídica</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Tire suas dúvidas sobre legislação brasileira
                </p>
              </div>
              <button
                onClick={handleNovaConversa}
                className="btn btn-primary text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3 flex items-center dark:bg-primary-700 dark:hover:bg-primary-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
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

          {/* Container para área de mensagens e input */}
          <div className="flex-1 relative overflow-hidden">
            {/* Área de mensagens */}
            <div 
              ref={chatContainerRef}
              className={`absolute inset-0 overflow-y-auto p-2 sm:p-3 md:p-4 bg-white dark:bg-gray-900 message-area ${hasOverflow ? 'has-overflow' : ''}`}
              style={{ 
                bottom: windowWidth >= 768 ? "80px" : "60px", 
                paddingBottom: windowWidth >= 768 ? "90px" : "70px" 
              }}
            >
              {/* Marca d'água do símbolo de Direito - Versão detalhada e realista */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.06] dark:opacity-[0.035] overflow-hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 700 700"
                  className="w-[85%] sm:w-[80%] md:w-[75%] max-w-[600px] text-primary-600 dark:text-primary-400"
                  fill="currentColor"
                >
                  {/* Estátua de Têmis (deusa da justiça) */}
                  <path d="M350 30 C340 30 335 35 335 45 V75 C335 85 340 90 350 90 C360 90 365 85 365 75 V45 C365 35 360 30 350 30 Z" />
                  <path d="M350 90 C330 90 315 95 310 105 L325 120 H375 L390 105 C385 95 370 90 350 90 Z" />
                  <path d="M335 120 V150 H365 V120 Z" />
                  
                  {/* Venda nos olhos - símbolo da imparcialidade */}
                  <path d="M320 60 H380" stroke="currentColor" strokeWidth="10" fill="none" />
                  
                  {/* Base ornamentada */}
                  <path d="M250 630 H450 C470 630 485 615 485 595 V580 H215 V595 C215 615 230 630 250 630 Z" />
                  <path d="M215 580 H485 L500 540 H200 Z" />
                  <path d="M230 540 H470 L455 510 H245 Z" />
                  
                  {/* Padrões decorativos na base */}
                  <path d="M240 605 H265 V615 H240 Z" />
                  <path d="M285 605 H310 V615 H285 Z" />
                  <path d="M330 605 H370 V615 H330 Z" />
                  <path d="M390 605 H415 V615 H390 Z" />
                  <path d="M435 605 H460 V615 H435 Z" />
                  
                  {/* Pilar central refinado */}
                  <path d="M320 510 H380 L375 200 H325 Z" />
                  <path d="M320 200 H380 C395 200 405 190 405 180 C405 160 385 145 350 145 C315 145 295 160 295 180 C295 190 305 200 320 200 Z" />
                  <path d="M330 485 H370 V505 H330 Z" />
                  <path d="M330 425 H370 V445 H330 Z" />
                  <path d="M330 365 H370 V385 H330 Z" />
                  <path d="M330 305 H370 V325 H330 Z" />
                  <path d="M330 245 H370 V265 H330 Z" />
                  
                  {/* Braço da balança mais elaborado */}
                  <path d="M90 190 H610 C625 190 640 180 640 160 C640 140 625 130 610 130 H90 C75 130 60 140 60 160 C60 180 75 190 90 190 Z" />
                  <path d="M90 175 H610" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path d="M90 145 H610" stroke="currentColor" strokeWidth="3" fill="none" />
                  
                  {/* Pontos de suspensão refinados */}
                  <circle cx="115" cy="160" r="15" />
                  <circle cx="585" cy="160" r="15" />
                  
                  {/* Correntes mais detalhadas */}
                  <path d="M115 175 L122 210 A10 10 0 0 0 108 210 L115 245 A10 10 0 0 0 101 245 L108 280 A10 10 0 0 0 94 280 L115 315" fill="none" stroke="currentColor" strokeWidth="6" />
                  <path d="M585 175 L578 210 A10 10 0 0 1 592 210 L585 245 A10 10 0 0 1 599 245 L592 280 A10 10 0 0 1 606 280 L585 315" fill="none" stroke="currentColor" strokeWidth="6" />
                  
                  {/* Pratos da balança mais realistas */}
                  <ellipse cx="165" cy="330" rx="90" ry="25" />
                  <path d="M75 325 A90 35 0 0 0 255 325 A90 35 0 0 1 75 325 Z" />
                  <path d="M95 320 A70 25 0 0 0 235 320" fill="none" stroke="currentColor" strokeWidth="3" />
                  
                  <ellipse cx="535" cy="330" rx="90" ry="25" />
                  <path d="M445 325 A90 35 0 0 0 625 325 A90 35 0 0 1 445 325 Z" />
                  <path d="M465 320 A70 25 0 0 0 605 320" fill="none" stroke="currentColor" strokeWidth="3" />
                  
                  {/* Detalhes decorativos adicionais */}
                  <path d="M350 125 L375 145 H325 Z" />
                  <circle cx="350" cy="110" r="8" />
                </svg>
              </div>
              
              {mensagens.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-2 sm:p-4 relative z-10">
                  <div className="text-center max-w-md mx-auto">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                      Bem-vindo ao JurisIA
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                      Assistente jurídico com inteligência artificial para ajudar em suas consultas sobre legislação brasileira.
                    </p>
                    <button
                      onClick={handleNovaConversa}
                      className="btn btn-primary text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3 dark:bg-primary-700 dark:hover:bg-primary-800"
                    >
                      Iniciar Nova Consulta
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 relative z-10 pb-4 sm:pb-6">
                  {mensagens.map((mensagem, index) => (
                    <div key={index} className="mt-4">
                      <ChatMessage
                        conteudo={mensagem.conteudo}
                        isUsuario={mensagem.isUsuario}
                        onErroAudio={definirErroAudio}
                      />
                    </div>
                  ))}
                  {isCarregando && (
                    <div className="flex justify-center my-2 sm:my-4">
                      <div className="loading">
                        <span className="loading-dot bg-primary-600 dark:bg-primary-500"></span>
                        <span className="loading-dot bg-primary-600 dark:bg-primary-500"></span>
                        <span className="loading-dot bg-primary-600 dark:bg-primary-500"></span>
                      </div>
                    </div>
                  )}
                  {/* Espaço extra no final para garantir rolagem total */}
                  <div className="h-16 md:h-20"></div>
                </div>
              )}
              
              {/* Indicador de rolagem */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none z-10 scroll-fade-indicator"
                style={{ 
                  bottom: windowWidth >= 768 ? "80px" : "60px",
                }}
              ></div>
            </div>

            {/* Área de input - Fixa na parte inferior */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg shadow-md z-20 input-container"
              style={{ 
                height: windowWidth >= 768 ? "80px" : "auto",
                minHeight: "60px"
              }}
            >
              <ChatInput onEnviar={handleEnviarMensagem} isCarregando={isCarregando} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 