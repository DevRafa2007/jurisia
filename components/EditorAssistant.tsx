import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import toast from 'react-hot-toast';
import DocumentFeedback from './DocumentFeedback';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Mensagem {
  id?: string;
  conteudo: string;
  isUsuario: boolean;
  timestamp: Date;
  remetente?: string;
  foiUtil?: boolean;
  avaliacao?: number;
  metadata?: Record<string, any>;
}

interface EditorAssistantProps {
  documentoId: string;
  tipoDocumento: string;
  conteudoAtual: string;
  onAplicarSugestao?: (sugestao: string, selecao?: { index: number, length: number }) => void;
}

const EditorAssistant: React.FC<EditorAssistantProps> = ({ 
  documentoId, 
  tipoDocumento, 
  conteudoAtual,
  onAplicarSugestao 
}) => {
  // Estados
  const [isVisible, setIsVisible] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [inputMensagem, setInputMensagem] = useState('');
  const [isAnalisando, setIsAnalisando] = useState(false);
  const [textoSelecionado, setTextoSelecionado] = useState('');
  const [posicaoSelecao, setPosicaoSelecao] = useState<{ index: number, length: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [mensagensHistorico, setMensagensHistorico] = useState<Mensagem[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState<boolean>(false);
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [mostrarSugestaoEditor, setMostrarSugestaoEditor] = useState(false);
  const [sugestaoPendente, setSugestaoPendente] = useState('');

  // Obter ID do usuário ao montar o componente
  useEffect(() => {
    // Em um ambiente real, obter o ID do usuário da autenticação
    // Por hora, vamos simular um ID fixo para desenvolvimento
    setUsuarioId('user_' + Math.random().toString(36).substring(2, 9));
  }, []);

  // Inicializar mensagens quando o componente montar ou o documento mudar
  useEffect(() => {
    if (documentoId) {
      // Mostrar mensagem inicial
      const mensagemInicial = MENSAGENS_INICIAIS[tipoDocumento] || MENSAGENS_INICIAIS.default;
      setMensagens([
        {
          id: 'initial_' + Date.now(),
          conteudo: mensagemInicial,
          isUsuario: false,
          timestamp: new Date()
        }
      ]);
      
      // Carregar histórico de interações
      carregarHistoricoDocumento();
    }
  }, [documentoId, tipoDocumento]);

  // Rolar para a última mensagem quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensagens]);

  // Função para carregar histórico de interações do documento
  const carregarHistoricoDocumento = useCallback(async () => {
    if (!documentoId) return;
    
    setCarregandoHistorico(true);
    
    try {
      const { data } = await axios.get(`/api/documento-historico?documento_id=${documentoId}`);
      
      if (data && data.interacoes && data.interacoes.length > 0) {
        // Converter interações do histórico para o formato de mensagens
        const historico: Mensagem[] = [];
        
        data.interacoes.forEach((interacao: any) => {
          // Adicionar mensagem do usuário
          historico.push({
            id: `user_${interacao.id}`,
            conteudo: interacao.conteudo_enviado,
            isUsuario: true,
            timestamp: new Date(interacao.created_at),
            metadata: interacao.metadata || {}
          });
          
          // Adicionar resposta do assistente
          historico.push({
            id: interacao.id,
            conteudo: interacao.resposta_assistente,
            isUsuario: false,
            timestamp: new Date(interacao.created_at),
            foiUtil: interacao.foi_util,
            avaliacao: interacao.avaliacao,
            metadata: interacao.metadata || {}
          });
        });
        
        setMensagensHistorico(historico);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico do documento:', error);
      toast.error('Não foi possível carregar o histórico do assistente.');
    } finally {
      setCarregandoHistorico(false);
    }
  }, [documentoId]);
  
  // Função para salvar interação com o documento
  const salvarInteracaoDocumento = async (
    tipo: 'pergunta' | 'analise' | 'sugestao' | 'correcao' | 'jurisprudencia',
    conteudoEnviado: string,
    respostaAssistente: string,
    metadata: Record<string, any> = {}
  ): Promise<string | null> => {
    if (!documentoId || !usuarioId) return null;
    
    try {
      const { data } = await axios.post('/api/documento-historico', {
        documento_id: documentoId,
        tipo,
        conteudo_enviado: conteudoEnviado,
        resposta_assistente: respostaAssistente,
        usuarioId, // Adicionar ID do usuário explicitamente
        metadata
      });
      
      // Retornar o ID da interação criada
      return data.id;
    } catch (error) {
      console.error('Erro ao salvar interação com documento:', error);
      // Não mostrar toast para não interromper a experiência do usuário
      return null;
    }
  };
  
  // Enviar mensagem ao assistente
  const enviarMensagem = async () => {
    if (!inputMensagem.trim() || isAnalisando) return;
    
    // Adicionar mensagem do usuário
    const mensagemUsuario: Mensagem = {
      id: 'user_' + Date.now(),
      conteudo: inputMensagem,
      isUsuario: true,
      timestamp: new Date()
    };
    
    setMensagens(prev => [...prev, mensagemUsuario]);
    setInputMensagem('');
    setIsAnalisando(true);
    setIsTyping(true);
    
    try {
      // Criar histórico para o prompt
      const historico = mensagens
        .slice(-6) // Últimas 6 mensagens para manter o contexto
        .map(msg => ({
          role: msg.isUsuario ? 'user' : 'assistant',
          content: msg.conteudo
        }));
      
      // Verificar se a mensagem é um pedido para editar o documento
      const podeSerPedidoDeEdicao = 
        inputMensagem.toLowerCase().includes('editar') || 
        inputMensagem.toLowerCase().includes('modificar') || 
        inputMensagem.toLowerCase().includes('alterar') || 
        inputMensagem.toLowerCase().includes('escrever') ||
        inputMensagem.toLowerCase().includes('corrigir') ||
        inputMensagem.toLowerCase().includes('melhorar') ||
        inputMensagem.toLowerCase().includes('revisar');
      
      // Se for um pedido de edição, incluir todo o conteúdo do documento
      const incluirDocumentoCompleto = podeSerPedidoDeEdicao;
      
      // Chamar API do assistente
      const { data } = await axios.post('/api/documento-assistente', {
        operacao: 'analisar',
        texto: inputMensagem,
        tipoDocumento,
        documentoId,
        usuarioId,
        dadosContexto: {
          historico: historico,
          tipoDocumento,
          conteudoAtual: incluirDocumentoCompleto ? conteudoAtual : conteudoAtual.substring(0, 1000), // Enviar conteúdo completo ou parcial dependendo do contexto
          pedidoDeEdicao: podeSerPedidoDeEdicao
        }
      });
      
      // Adicionar resposta do assistente
      const interacaoId = await salvarInteracaoDocumento(
        'pergunta', 
        inputMensagem, 
        data.resposta, 
        {
          modeloUsado: data.modeloUsado,
          tokens: data.tokens,
          referenciasJuridicas: data.referenciasJuridicas
        }
      );
      
      const mensagemAssistente: Mensagem = {
        id: interacaoId || 'assistant_' + Date.now(),
        conteudo: data.resposta,
        isUsuario: false,
        timestamp: new Date(),
        metadata: {
          modeloUsado: data.modeloUsado,
          tokens: data.tokens,
          referenciasJuridicas: data.referenciasJuridicas
        }
      };
      
      // Verificar se a resposta contém sugestões de edição explícitas
      // Procurar por padrões como:
      // - "Sugiro alterar..."
      // - "Você pode editar..." 
      // - Blocos de código ou texto entre backticks, aspas ou com formatação específica
      if (podeSerPedidoDeEdicao) {
        // Tentar extrair um trecho específico que poderia ser uma sugestão de edição
        const sugestoes = extrairSugestoesDeEdicao(data.resposta);
        
        if (sugestoes.length > 0) {
          // Se encontrou sugestões, mostrar botão para aplicar
          setSugestaoPendente(sugestoes[0]);
          setMostrarSugestaoEditor(true);
        }
      }
      
      setMensagens(prev => [...prev, mensagemAssistente]);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      toast.error('Não foi possível processar sua solicitação. Tente novamente mais tarde.');
      
      // Adicionar mensagem de erro
      const mensagemErro: Mensagem = {
        id: 'error_' + Date.now(),
        conteudo: "Desculpe, não foi possível processar sua solicitação. Por favor, tente novamente mais tarde.",
        isUsuario: false,
        timestamp: new Date()
      };
      
      setMensagens(prev => [...prev, mensagemErro]);
    } finally {
      setIsAnalisando(false);
      setIsTyping(false);
      setTextoSelecionado('');
      setPosicaoSelecao(null);
    }
  };

  // Extrair possíveis sugestões de edição de uma resposta
  const extrairSugestoesDeEdicao = (texto: string): string[] => {
    const sugestoes: string[] = [];
    
    // Procurar por texto entre backticks (código)
    const regexCodigo = /```(?:\w+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = regexCodigo.exec(texto)) !== null) {
      if (match[1] && match[1].trim().length > 10) {
        sugestoes.push(match[1].trim());
      }
    }
    
    // Se não encontrou entre backticks, procurar por blocos de texto que podem ser sugestões
    if (sugestoes.length === 0) {
      const linhas = texto.split('\n');
      let blocoAtual = '';
      let dentroDeBloco = false;
      
      for (const linha of linhas) {
        // Possíveis indicadores de início de sugestão
        if (linha.includes('Sugiro:') || 
            linha.includes('Sugestão:') || 
            linha.includes('Correção:') || 
            linha.includes('Você pode alterar para:') ||
            linha.includes('Trecho sugerido:') ||
            linha.includes('> ') ||
            linha.startsWith('"') && linha.endsWith('"') && linha.length > 20) {
          
          dentroDeBloco = true;
          blocoAtual = linha.replace(/^[">]|[:]/g, '').trim();
          continue;
        }
        
        if (dentroDeBloco) {
          // Fim do bloco?
          if (linha.trim() === '' || linha.startsWith('#')) {
            if (blocoAtual.length > 10) {
              sugestoes.push(blocoAtual);
            }
            blocoAtual = '';
            dentroDeBloco = false;
          } else {
            blocoAtual += '\n' + linha;
          }
        }
      }
      
      // Adicionar o último bloco se existir
      if (dentroDeBloco && blocoAtual.length > 10) {
        sugestoes.push(blocoAtual);
      }
    }
    
    return sugestoes;
  };

  // Lidar com tecla Enter para enviar mensagem
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  // Aplicar sugestão ao editor
  const aplicarSugestao = async (sugestao: string, mensagemId?: string) => {
    if (onAplicarSugestao) {
      // Extrair apenas o texto da sugestão, removendo marcações
      const texto = sugestao
        .replace(/\*\*Trecho sugerido:\*\*/g, '')
        .replace(/\*\*/g, '')
        .trim();
      
      onAplicarSugestao(texto, posicaoSelecao || undefined);
      
      // Registrar feedback de que a sugestão foi aplicada
      if (mensagemId) {
        try {
          await axios.put(`/api/documento-historico`, {
            interacao_id: mensagemId,
            foi_util: true,
            aplicada: true,
            comentario: 'Sugestão aplicada ao documento'
          });
        } catch (error) {
          console.error('Erro ao registrar feedback de aplicação:', error);
        }
      }
      
      toast.success('Sugestão aplicada ao documento!', {
        duration: 2000,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
      
      // Limpar estado após aplicar
      setMostrarSugestaoEditor(false);
      setSugestaoPendente('');
    }
  };

  // Analisar texto selecionado
  const analisarTexto = async (texto: string, tipoAnalise: 'terminologia' | 'citacoes' | 'estrutura' | 'completa' = 'completa') => {
    if (!texto || texto.length < 10 || isAnalisando) return;
    
    setIsAnalisando(true);
    setIsTyping(true);
    
    // Adicionar mensagem do usuário
    const solicitacao = `Analise o seguinte trecho do meu documento (${tipoAnalise}): "${texto.substring(0, 50)}${texto.length > 50 ? '...' : ''}"`;
    
    const mensagemUsuario: Mensagem = {
      id: 'user_' + Date.now(),
      conteudo: solicitacao,
      isUsuario: true,
      timestamp: new Date()
    };
    
    setMensagens(prev => [...prev, mensagemUsuario]);
    
    try {
      // Chamar API do assistente para análise
      const { data } = await axios.post('/api/documento-assistente', {
        operacao: 'analisar',
        texto,
        tipoDocumento,
        tipoAnalise,
        documentoId,
        usuarioId
      });
      
      // Salvar a interação e obter o ID
      const interacaoId = await salvarInteracaoDocumento(
        'analise', 
        texto, 
        data.resposta, 
        {
          tipoAnalise,
          modeloUsado: data.modeloUsado,
          tokens: data.tokens,
          referenciasJuridicas: data.referenciasJuridicas
        }
      );
      
      // Adicionar resposta do assistente
      const mensagemAssistente: Mensagem = {
        id: interacaoId || 'assistant_' + Date.now(),
        conteudo: data.resposta,
        isUsuario: false,
        timestamp: new Date(),
        metadata: {
          tipoAnalise,
          modeloUsado: data.modeloUsado,
          tokens: data.tokens,
          referenciasJuridicas: data.referenciasJuridicas
        }
      };
      
      setMensagens(prev => [...prev, mensagemAssistente]);
      
      // Verificar se a resposta contém sugestões de correção
      const sugestoes = extrairSugestoesDeEdicao(data.resposta);
      if (sugestoes.length > 0) {
        // Se encontrou sugestões, mostrar botão para aplicar
        setSugestaoPendente(sugestoes[0]);
        setMostrarSugestaoEditor(true);
      }
    } catch (error) {
      console.error('Erro ao analisar texto:', error);
      toast.error('Não foi possível analisar o texto. Tente novamente mais tarde.');
      
      // Adicionar mensagem de erro
      const mensagemErro: Mensagem = {
        id: 'error_' + Date.now(),
        conteudo: "Desculpe, não foi possível analisar o texto. Por favor, tente novamente mais tarde.",
        isUsuario: false,
        timestamp: new Date()
      };
      
      setMensagens(prev => [...prev, mensagemErro]);
    } finally {
      setIsAnalisando(false);
      setIsTyping(false);
    }
  };
  
  // Sugerir trechos jurídicos para o documento
  const sugerirTrechos = async (dados: Record<string, string>) => {
    if (isAnalisando) return;
    
    setIsAnalisando(true);
    setIsTyping(true);
    
    // Adicionar mensagem do usuário
    const solicitacao = `Por favor, sugira trechos para um documento do tipo ${tipoDocumento} com os seguintes dados: ${Object.entries(dados).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
    
    const mensagemUsuario: Mensagem = {
      id: 'user_' + Date.now(),
      conteudo: solicitacao,
      isUsuario: true,
      timestamp: new Date()
    };
    
    setMensagens(prev => [...prev, mensagemUsuario]);
    
    try {
      // Chamar API do assistente para obter sugestões
      const { data } = await axios.post('/api/documento-assistente', {
        operacao: 'sugerir',
        tipoDocumento,
        documentoId,
        usuarioId,
        dadosContexto: {
          ...dados,
          conteudoAtual: conteudoAtual.substring(0, 500) // Enviar parte do conteúdo atual para contexto
        }
      });
      
      // Salvar a interação e obter o ID
      const interacaoId = await salvarInteracaoDocumento(
        'sugestao', 
        JSON.stringify(dados), 
        data.resposta, 
        {
          sugestoes: data.sugestoes,
          modeloUsado: data.modeloUsado,
          tokens: data.tokens
        }
      );
      
      // Adicionar resposta do assistente
      const mensagemAssistente: Mensagem = {
        id: interacaoId || 'assistant_' + Date.now(),
        conteudo: data.resposta,
        isUsuario: false,
        timestamp: new Date(),
        metadata: {
          sugestoes: data.sugestoes,
          modeloUsado: data.modeloUsado,
          tokens: data.tokens
        }
      };
      
      setMensagens(prev => [...prev, mensagemAssistente]);
      
      // Se tiver sugestões, mostrar a primeira como pendente
      if (data.sugestoes && data.sugestoes.length > 0) {
        setSugestaoPendente(data.sugestoes[0].texto);
        setMostrarSugestaoEditor(true);
      }
    } catch (error) {
      console.error('Erro ao sugerir trechos:', error);
      toast.error('Não foi possível gerar sugestões. Tente novamente mais tarde.');
      
      // Adicionar mensagem de erro
      const mensagemErro: Mensagem = {
        id: 'error_' + Date.now(),
        conteudo: "Desculpe, não foi possível gerar sugestões. Por favor, tente novamente mais tarde.",
        isUsuario: false,
        timestamp: new Date()
      };
      
      setMensagens(prev => [...prev, mensagemErro]);
    } finally {
      setIsAnalisando(false);
      setIsTyping(false);
    }
  };

  // Renderizar uma mensagem individual
  const renderizarMensagem = (mensagem: Mensagem) => {
    return (
      <div 
        key={mensagem.id} 
        className={`my-4 ${mensagem.isUsuario ? 'flex justify-end' : 'flex justify-start'}`}
      >
        <div className="flex items-end">
          {/* Avatar para o assistente */}
          {!mensagem.isUsuario && (
            <div className="flex-shrink-0 mr-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        
          <div 
            className={`relative rounded-lg px-4 py-3 max-w-[85%] break-words
              ${mensagem.isUsuario 
                ? 'bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-600 text-white rounded-2xl rounded-br-none'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700/50'
              }`}
          >
            {/* Conteúdo da mensagem com formatação markdown */}
            <ReactMarkdown
              className={`prose dark:prose-invert prose-sm max-w-none ${mensagem.isUsuario ? '[&>*]:text-white' : ''}`}
              components={{
                // Personalizar componentes de markdown
                p: ({node, ...props}) => <p className="my-1" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-2 mb-1" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-md font-bold mt-2 mb-1" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-4 my-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-1" {...props} />,
                li: ({node, ...props}) => <li className="my-0.5" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-primary-200 dark:border-primary-700 pl-2 italic my-1" {...props} />
                ),
                code: ({node, inline, ...props}) => (
                  inline 
                    ? <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs" {...props} />
                    : <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded text-xs my-1 overflow-x-auto">
                        <code {...props} />
                      </div>
                ),
              }}
            >
              {mensagem.conteudo}
            </ReactMarkdown>
            
            {/* Tempo formatado */}
            <div className={`mt-1 text-right text-[10px] font-light ${mensagem.isUsuario ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
              {new Date(mensagem.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </div>
            
            {/* Botões de interação para mensagens do assistente */}
            {!mensagem.isUsuario && (
              <div className="flex mt-2 space-x-2 justify-end items-center text-xs">
                {/* Botão para aplicar sugestão */}
                {mensagem.conteudo.includes('sugestão') || 
                 mensagem.conteudo.includes('Trecho sugerido') || 
                 mensagem.conteudo.toLowerCase().includes('correção') ? (
                  <button
                    onClick={() => aplicarSugestao(mensagem.conteudo, mensagem.id)}
                    className="text-xs bg-primary-500 text-white px-2 py-1 rounded hover:bg-primary-600 transition-colors"
                  >
                    <span className="flex items-center">
                      <CheckIcon className="h-3 w-3 mr-1" />
                      Aplicar
                    </span>
                  </button>
                ) : null}
                
                {/* Feedback da interação */}
                {!mensagem.isUsuario && (
                  <DocumentFeedback 
                    mensagemId={mensagem.id || ''} 
                    initialFoiUtil={mensagem.foiUtil} 
                    initialAvaliacao={mensagem.avaliacao} 
                  />
                )}
              </div>
            )}
          </div>

          {/* Avatar para o usuário */}
          {mensagem.isUsuario && (
            <div className="flex-shrink-0 ml-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar o componente
  return (
    <>
      {/* Componente principal do assistente */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, x: 300 }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          x: isVisible ? 0 : 300,
          width: isVisible ? '320px' : '0px'
        }}
        transition={{ duration: 0.3 }}
        className={`fixed top-20 right-6 bottom-20 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col overflow-hidden rounded-xl ${!isVisible ? 'pointer-events-none' : ''}`}
        style={{ maxWidth: '90vw' }}
      >
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Cabeçalho */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-primary-500 to-indigo-600 text-white rounded-t-xl">
                <h3 className="font-medium">Assistente Jurídico IA</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setIsVisible(false)}
                    className="text-white/80 hover:text-white transition-colors focus:outline-none p-1 rounded-md hover:bg-white/10"
                    aria-label="Fechar assistente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Área de mensagens */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 flex flex-col"
              >
                {/* Histórico de interações passadas */}
                {carregandoHistorico ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                    <span className="ml-2 text-sm text-gray-500">Carregando histórico...</span>
                  </div>
                ) : mensagensHistorico.length > 0 ? (
                  <>
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                      Histórico de interações anteriores com este documento
                    </div>
                    {mensagensHistorico.map(renderizarMensagem)}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                  </>
                ) : null}
                
                {/* Conversação atual */}
                {mensagens.map(renderizarMensagem)}
                
                {/* Indicador de digitação */}
                {isTyping && (
                  <div className="self-start bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mt-4 flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Processando</span>
                    <div className="flex space-x-1">
                      <motion.div 
                        className="h-2 w-2 bg-primary-500 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                      />
                      <motion.div 
                        className="h-2 w-2 bg-primary-500 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      />
                      <motion.div 
                        className="h-2 w-2 bg-primary-500 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Botão para aplicar sugestão ao editor quando disponível */}
                {mostrarSugestaoEditor && sugestaoPendente && (
                  <div className="flex justify-center my-4">
                    <button 
                      onClick={() => aplicarSugestao(sugestaoPendente)}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded transition-colors flex items-center"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Aplicar ao documento
                    </button>
                  </div>
                )}
              </div>

              {/* Área de entrada de mensagem */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                <div className="relative flex items-center">
                  <textarea
                    value={inputMensagem}
                    onChange={(e) => setInputMensagem(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Como posso ajudar com seu documento?"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white resize-none"
                    rows={1}
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                    disabled={isAnalisando}
                  />
                  <button
                    onClick={enviarMensagem}
                    disabled={!inputMensagem.trim() || isAnalisando}
                    className={`absolute right-2 p-1.5 rounded-full ${
                      inputMensagem.trim() && !isAnalisando
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    } transition-colors duration-200`}
                    aria-label="Enviar mensagem"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                  <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Botão para abrir o assistente quando fechado - Movido para baixo */}
      {!isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => setIsVisible(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Abrir assistente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </motion.button>
      )}
    </>
  );
};

// Mensagens iniciais por tipo de documento
const MENSAGENS_INICIAIS: Record<string, string> = {
  'petição': "Olá! Estou aqui para ajudar com sua petição. Posso analisar o texto, verificar citações legais, sugerir melhorias ou responder dúvidas sobre argumentação jurídica. O que você precisa?",
  'contrato': "Olá! Estou pronto para auxiliar com seu contrato. Posso analisar cláusulas, verificar termos técnicos, sugerir melhorias ou responder dúvidas sobre implicações legais. Como posso ajudar?",
  'parecer': "Olá! Estou disponível para ajudar com seu parecer jurídico. Posso analisar a fundamentação, verificar citações, sugerir melhorias na estrutura ou responder dúvidas sobre precedentes. Como posso ajudar?",
  'recurso': "Olá! Estou aqui para auxiliar com seu recurso. Posso analisar argumentos, verificar citações de jurisprudência, sugerir melhorias na fundamentação ou responder dúvidas sobre estratégias recursais. Como posso ajudar?",
  'peticao_inicial': "Estou aqui para ajudar com sua petição inicial. Posso sugerir estruturas, verificar termos jurídicos ou auxiliar com fundamentação legal.",
  'contestacao': "Precisa de ajuda com sua contestação? Posso sugerir preliminares, verificar jurisprudência ou ajudar com a estrutura do mérito.",
  'procuracao': "Precisa de ajuda com sua procuração? Posso sugerir poderes específicos ou verificar a estrutura do documento.",
  'notificacao': "Estou pronto para auxiliar com sua notificação. Posso sugerir linguagem formal, estrutura ou verificar requisitos legais.",
  'acordo': "Precisa de ajuda com seu acordo? Posso sugerir termos, obrigações ou garantias para as partes envolvidas.",
  'default': "Olá! Sou seu assistente jurídico para este documento. Posso analisar texto selecionado, verificar citações legais, sugerir trechos ou responder suas dúvidas. Como posso ajudar hoje?"
};

export default EditorAssistant; 