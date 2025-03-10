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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700"></div>
        </div>
      </Layout>
    );
  }

  // Se o usuário não estiver logado, não renderiza o conteúdo (será redirecionado)
  if (!user) {
    return <Layout />;
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px-48px)]">
        {/* Botão para toggle da sidebar em dispositivos móveis */}
        <button
          className="md:hidden fixed bottom-4 left-4 z-10 bg-primary-600 text-white p-3 rounded-full shadow-lg"
          onClick={() => setSidebarAberta(!sidebarAberta)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {sidebarAberta ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Sidebar com conversas */}
        <div className={`${sidebarAberta ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform fixed md:relative md:flex z-10 h-full md:h-auto`}>
          <ConversasSidebar
            usuarioId={user.id}
            conversaAtual={conversaAtual}
            onSelecionarConversa={handleSelecionarConversa}
            onNovaConversa={handleNovaConversa}
          />
        </div>

        {/* Área principal de chat */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-primary-800">Consulta Jurídica</h1>
              <p className="text-sm text-gray-600">
                Tire suas dúvidas sobre legislação brasileira com auxílio de inteligência artificial
              </p>
            </div>
            <button
              onClick={handleNovaConversa}
              className="btn btn-primary text-sm md:flex items-center hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Consulta
            </button>
          </div>
          
          {/* Área de chat */}
          <div 
            ref={chatContainerRef}
            className="p-4 overflow-y-auto flex-grow"
          >
            {mensagens.map((msg, idx) => (
              <ChatMessage
                key={idx}
                conteudo={msg.conteudo}
                isUsuario={msg.isUsuario}
              />
            ))}
            
            {isCarregando && (
              <div className="flex justify-center items-center my-4">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-primary-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-primary-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-primary-400 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input de chat */}
          <div className="px-4 py-2 border-t border-gray-200 bg-white">
            <ChatInput
              onEnviar={handleEnviarMensagem}
              isCarregando={isCarregando}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
} 