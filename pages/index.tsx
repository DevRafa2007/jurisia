import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [isCarregando, setIsCarregando] = useState(false);
  const [conversaAtual, setConversaAtual] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarAberta, setSidebarAberta] = useState(true);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Rola para a última mensagem quando novas mensagens são adicionadas
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensagens]);

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
        }));
        
        setMensagens(mensagensUI);
      } catch (erro) {
        console.error('Erro ao carregar conversa:', erro);
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
          conteudo: "Olá! Sou o JurisIA, seu assistente jurídico alimentado por inteligência artificial. Como posso ajudar você hoje com questões jurídicas brasileiras?",
          isUsuario: false,
        },
      ]);
    }
  }, [conversaAtual, mensagens.length, user]);

  // Converte as mensagens para o formato esperado pela API
  const converterParaHistorico = () => {
    return mensagens.map((msg) => ({
      role: msg.isUsuario ? "user" : "assistant",
      content: msg.conteudo,
    }));
  };

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

    try {
      // Se não houver conversa atual, cria uma nova
      if (!conversaAtual) {
        const novaConversa = await criarConversa(user.id, texto.substring(0, 50) + (texto.length > 50 ? '...' : ''));
        setConversaAtual(novaConversa.id || null);
        
        // Salva a mensagem do usuário no banco
        if (novaConversa.id) {
          await adicionarMensagem(novaConversa.id, texto, 'usuario');
        }
      } else {
        // Salva a mensagem do usuário no banco
        await adicionarMensagem(conversaAtual, texto, 'usuario');
      }

      // Prepara o histórico para enviar à API
      const historico = converterParaHistorico();

      // Envia a consulta para a API
      const response = await axios.post('/api/juridica', {
        consulta: texto,
        historico: historico,
      });

      // Adiciona a resposta da IA ao chat
      const novaMensagemIA: Mensagem = {
        conteudo: response.data.conteudo,
        isUsuario: false,
      };

      setMensagens((prev) => [...prev, novaMensagemIA]);
      
      // Salva a resposta da IA no banco
      if (conversaAtual) {
        await adicionarMensagem(conversaAtual, response.data.conteudo, 'assistente');
      }
    } catch (erro) {
      console.error('Erro ao processar consulta:', erro);
      
      // Adiciona mensagem de erro ao chat
      const mensagemErro: Mensagem = {
        conteudo: "Desculpe, ocorreu um erro ao processar sua consulta. Por favor, tente novamente mais tarde.",
        isUsuario: false,
      };
      
      setMensagens((prev) => [...prev, mensagemErro]);
    } finally {
      setIsCarregando(false);
    }
  };

  const handleNovaConversa = () => {
    setConversaAtual(null);
    setMensagens([
      {
        conteudo: "Olá! Sou o JurisIA, seu assistente jurídico alimentado por inteligência artificial. Como posso ajudar você hoje com questões jurídicas brasileiras?",
        isUsuario: false,
      },
    ]);
  };

  const handleSelecionarConversa = (conversaId: string) => {
    setConversaAtual(conversaId);
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
    return <Layout />;
  }

  return (
    <Layout sidebarAberta={sidebarAberta} toggleSidebar={() => setSidebarAberta(!sidebarAberta)}>
      <div className="flex flex-col md:flex-row h-[calc(100vh-48px-32px)] sm:h-[calc(100vh-56px-36px)] md:h-[calc(100vh-64px-48px)]">
        {/* Sidebar com conversas - Responsiva */}
        <div 
          className={`${
            sidebarAberta 
              ? 'fixed inset-0 z-20 bg-gray-900 bg-opacity-50 md:bg-opacity-0 md:relative md:inset-auto'
              : 'hidden md:block'
          } md:w-96 lg:w-1/4 xl:w-1/5 h-full transition-all duration-300`}
          onClick={(e) => {
            // Fechar o sidebar quando clicar fora dele em dispositivos móveis
            if (window.innerWidth < 768 && e.target === e.currentTarget) {
              setSidebarAberta(false);
            }
          }}
        >
          <div 
            className={`${
              sidebarAberta 
                ? 'translate-x-0 h-full w-3/4 sm:w-96 md:w-full'
                : '-translate-x-full md:translate-x-0'
            } transition-transform duration-300 absolute md:relative top-0 left-0 h-full`}
          >
            <ConversasSidebar
              usuarioId={user.id}
              conversaAtual={conversaAtual}
              onSelecionarConversa={(id) => {
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
        <div className="flex-1 flex flex-col overflow-hidden w-full h-full">
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

          {/* Área de mensagens */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 bg-white dark:bg-gray-900 relative"
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
              <div className="space-y-2 sm:space-y-4 relative z-10">
                {mensagens.map((mensagem, index) => (
                  <ChatMessage
                    key={index}
                    conteudo={mensagem.conteudo}
                    isUsuario={mensagem.isUsuario}
                  />
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
              </div>
            )}
          </div>

          {/* Área de input */}
          <div className="p-2 sm:p-3 md:p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg shadow-inner">
            <ChatInput onEnviar={handleEnviarMensagem} isCarregando={isCarregando} />
          </div>
        </div>
      </div>
    </Layout>
  );
} 