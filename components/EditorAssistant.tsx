import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import toast from 'react-hot-toast';
import DocumentFeedback from './DocumentFeedback';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { CheckIcon } from '@heroicons/react/24/solid';
import { DocumentoService } from '../services/DocumentoService';
import { v4 as uuidv4 } from 'uuid';
import DocumentoContextualAnalysis from './DocumentoContextualAnalysis';

interface Mensagem {
  id?: string;
  conteudo: string;
  isUsuario: boolean;
  timestamp: Date;
  remetente?: string;
  foiUtil?: boolean;
  avaliacao?: number;
  metadata?: Record<string, any>;
  tipo?: 'texto' | 'contextual';
  analiseContextual?: AnaliseContextual;
}

interface EditorAssistantProps {
  documentoId: string;
  tipoDocumento: string;
  conteudoAtual: string;
  onAplicarSugestao?: (sugestao: string, selecao?: { index: number, length: number }) => void;
  
  // Novas props para manipulação avançada
  editorRef?: React.RefObject<any>; // Referência direta ao editor
  onSubstituirTexto?: (inicio: number, fim: number, novoTexto: string) => boolean;
  onMoverConteudo?: (origem: {inicio: number, fim: number}, destino: number) => boolean;
}

interface SecaoDocumento {
  tipo: 'introducao' | 'desenvolvimento' | 'conclusao' | 'argumentacao' | 'citacao' | 'outro';
  titulo: string;
  indice: number;
  conteudo: string;
  nivel: number;
}

interface ProblemaDocumento {
  tipo: 'inconsistencia' | 'falta_secao' | 'ordem_incorreta' | 'citacao_invalida' | 'terminologia';
  descricao: string;
  localizacao: number;
  sugestao?: string;
  severidade: 'alta' | 'media' | 'baixa';
}

interface AnaliseEstrutura {
  secoes: SecaoDocumento[];
  problemas: ProblemaDocumento[];
}

interface ResumoDocumento {
  resumoGeral: string;
  pontosPrincipais: string[];
  estrutura: {
    introducao?: string;
    argumentosPrincipais: string[];
    conclusao?: string;
  };
}

interface AnaliseContextual {
  analiseEstrutura?: AnaliseEstrutura;
  resumoDocumento?: ResumoDocumento;
  sugestoesAprimoramento?: string[];
}

const EditorAssistant: React.FC<EditorAssistantProps> = ({ 
  documentoId, 
  tipoDocumento, 
  conteudoAtual,
  onAplicarSugestao,
  editorRef, // Nova prop
  onSubstituirTexto,
  onMoverConteudo
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
  // Adicionar estado local para conteúdo do documento
  const [conteudoDocumentoLocal, setConteudoDocumentoLocal] = useState(conteudoAtual || '');
  // Adicionar estado para controlar a atualização ativa do contexto
  const [isAtualizandoContexto, setIsAtualizandoContexto] = useState(false);
  // Controle para evitar múltiplas notificações
  const [ultimaNotificacao, setUltimaNotificacao] = useState<number>(0);

  // Adicionar estado para o serviço de documento
  const [documentoService, setDocumentoService] = useState<DocumentoService | null>(null);
  
  // Adicionar estado para rastrear se temos acesso ao conteúdo do documento
  const [temConteudoDocumento, setTemConteudoDocumento] = useState<boolean>(false);

  // Função para adicionar mensagens ao estado
  const adicionarMensagem = (mensagem: Mensagem) => {
    setMensagens(prev => [...prev, mensagem]);
  };
  
  // Função para enviar mensagem ao assistente via API
  const enviarMensagemAoAssistente = async (
    conteudo: string,
    documentoId: string,
    tipoDocumento: string,
    contexto: string = ''
  ) => {
    try {
      console.log('🔍 Iniciando envio de mensagem para o assistente', {
        documentoId,
        tipoDocumento,
        tamanhoConteudo: conteudo.length,
        temContexto: contexto ? 'sim' : 'não'
      });
      
      // Obter o conteúdo completo do documento através do DocumentoService
      let conteudoCompletoDocumento = '';
      
      if (documentoService && documentoService.isEditorReady()) {
        // Usar DocumentoService para obter o conteúdo completo
        conteudoCompletoDocumento = documentoService.getConteudoTexto();
        console.log(`✅ Obtido conteúdo completo do documento via DocumentoService: ${conteudoCompletoDocumento.length} caracteres`);
      } else {
        // Tentativa de fallback para obter o conteúdo do editor
        console.log('⚠️ DocumentoService não disponível ou editor não pronto, tentando métodos alternativos');
        
        try {
          if (editorRef?.current) {
            if (typeof editorRef.current.getEditor === 'function') {
              const quill = editorRef.current.getEditor();
              conteudoCompletoDocumento = quill.getText();
              console.log(`✅ Obtido conteúdo do documento via getEditor(): ${conteudoCompletoDocumento.length} caracteres`);
            } else if (editorRef.current.editor) {
              conteudoCompletoDocumento = editorRef.current.editor.getText();
              console.log(`✅ Obtido conteúdo do documento via editor.getText(): ${conteudoCompletoDocumento.length} caracteres`);
            }
          }
        } catch (error) {
          console.error('❌ Erro ao tentar obter conteúdo do editor via API direta:', error);
        }
        
        // Se ainda não conseguimos o conteúdo, tentar via DOM
        if (!conteudoCompletoDocumento) {
          try {
            const editorElement = document.querySelector('.ql-editor');
            if (editorElement) {
              conteudoCompletoDocumento = editorElement.textContent || '';
              console.log(`✅ Obtido conteúdo do documento via DOM: ${conteudoCompletoDocumento.length} caracteres`);
            }
          } catch (error) {
            console.error('❌ Erro ao tentar obter conteúdo do editor via DOM:', error);
          }
        }
      }
      
      if (!conteudoCompletoDocumento) {
        console.warn('⚠️ Não foi possível obter o conteúdo completo do documento. A IA terá contexto limitado.');
        conteudoCompletoDocumento = conteudoAtual || '';
      }
      
      // Tente primeiro a API de teste para verificar se a infraestrutura está funcionando
      console.log('🔍 Testando API básica primeiro');
      const { data: testData } = await axios.post('/api/documento-assistente-teste', {
        operacao: 'teste',
        texto: conteudo.substring(0, 50), // Enviar apenas um trecho para o teste
        documentoId,
        tipoDocumento
      });
      
      console.log('✅ API de teste respondeu com sucesso:', testData);
      
      // Se passarmos do teste, tentamos a API real
      console.log('🔍 Enviando requisição para API principal');
      
      // Criar dados corretos compatíveis com a nova estrutura da API
      const dadosRequisicao = {
        operacao: 'perguntar',
        mensagem: conteudo, 
        texto: conteudo, // Campo alternativo para compatibilidade
        documento_id: documentoId,
        tipo_documento: tipoDocumento,
        documentoId: documentoId, // Duplicado para compatibilidade
        tipoDocumento: tipoDocumento, // Duplicado para compatibilidade
        usuarioId: usuarioId || 'usuario_anonimo',
        conteudo_documento: conteudoCompletoDocumento, // Enviar o conteúdo completo do documento
        contexto: {
          selecao: contexto,
          conteudoAtual: conteudoCompletoDocumento // Usar documento completo para contexto
        }
      };
      
      console.log(`📤 Enviando requisição com conteúdo completo do documento (${conteudoCompletoDocumento.length} caracteres)`);
      
      const { data } = await axios.post('/api/documento-assistente', dadosRequisicao);
      
      console.log('📥 Resposta recebida da API:', data);
      
      // Salvar a interação
      await salvarInteracaoDocumento(
        'pergunta',
        conteudo,
        data.resposta,
        {
          modeloUsado: data.modeloUsado,
          tokens: data.tokens
        }
      );
      
      return {
        texto: data.resposta,
        metadata: {
          modeloUsado: data.modeloUsado,
          tokens: data.tokens
        }
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem para o assistente:', error);
      
      // Verificar se há detalhes adicionais no erro
      if (error.response?.data) {
        console.error('❌ Resposta de erro da API:', JSON.stringify(error.response.data));
      }
      
      // Retornar uma resposta de contingência em caso de erro
      return {
        texto: "Desculpe, estou enfrentando alguns problemas técnicos no momento. Nossa equipe está trabalhando para resolver isso o mais rápido possível. Por favor, tente novamente em alguns instantes.",
        metadata: {
          modeloUsado: "contingência",
          tokens: { entrada: 0, saida: 0, total: 0 }
        }
      };
    }
  };
  
  // Inicializar o serviço quando a referência do editor estiver disponível
  useEffect(() => {
    if (editorRef?.current && !documentoService) {
      const service = new DocumentoService(editorRef);
      setDocumentoService(service);
      console.log('DocumentoService inicializado no EditorAssistant');
    }
  }, [editorRef?.current]);

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
  
  // Função para processar comandos avançados
  const processarComandoAvancado = async (comando: string) => {
    if (!documentoService) return false;
    
    // Verificar padrões de comando para substituição
    const regexSubstituir = /substituir?\s+"([^"]+)"\s+por\s+"([^"]+)"/i;
    if (regexSubstituir.test(comando)) {
      try {
        const match = comando.match(regexSubstituir);
        if (match && match.length >= 3) {
          const textoAntigo = match[1];
          const textoNovo = match[2];
          
          // Buscar todas as ocorrências do texto
          const ocorrencias = documentoService.buscarTexto(textoAntigo);
          
          if (ocorrencias.length === 0) {
            adicionarMensagem({
              id: uuidv4(),
              conteudo: `Não encontrei "${textoAntigo}" no documento.`,
              isUsuario: false,
              timestamp: new Date().toISOString()
            });
            return true;
          }
          
          // Se houver apenas uma ocorrência, substituir diretamente
          if (ocorrencias.length === 1) {
            const ocorrencia = ocorrencias[0];
            const sucesso = documentoService.substituirTexto(
              ocorrencia.indice, 
              ocorrencia.indice + ocorrencia.comprimento, 
              textoNovo
            );
            
            if (sucesso) {
              adicionarMensagem({
                id: uuidv4(),
                conteudo: `Substituí "${textoAntigo}" por "${textoNovo}" com sucesso.`,
                isUsuario: false,
                timestamp: new Date().toISOString()
              });
            } else {
              adicionarMensagem({
                id: uuidv4(),
                conteudo: `Encontrei o texto, mas houve um erro ao fazer a substituição.`,
                isUsuario: false,
                timestamp: new Date().toISOString()
              });
            }
            return true;
          }
          
          // Se houver múltiplas ocorrências, perguntar qual substituir
          let mensagem = `Encontrei ${ocorrencias.length} ocorrências de "${textoAntigo}". Qual você deseja substituir?\n\n`;
          
          ocorrencias.forEach((ocorrencia, index) => {
            // Obter contexto em torno da ocorrência
            const textoCompleto = documentoService.getConteudoTexto();
            const inicio = Math.max(0, ocorrencia.indice - 20);
            const fim = Math.min(textoCompleto.length, ocorrencia.indice + ocorrencia.comprimento + 20);
            const contexto = textoCompleto.substring(inicio, fim);
            
            // Destacar a ocorrência no contexto
            const ocorrenciaIndex = ocorrencia.indice - inicio;
            const parteAntes = contexto.substring(0, ocorrenciaIndex);
            const parteMeio = contexto.substring(ocorrenciaIndex, ocorrenciaIndex + ocorrencia.comprimento);
            const parteDepois = contexto.substring(ocorrenciaIndex + ocorrencia.comprimento);
            
            mensagem += `${index + 1}. "...${parteAntes}**${parteMeio}**${parteDepois}..."\n\n`;
          });
          
          mensagem += `Responda com o número da ocorrência que deseja substituir, ou "todas" para substituir todas.`;
          
          adicionarMensagem({
            id: uuidv4(),
            conteudo: mensagem,
            isUsuario: false,
            timestamp: new Date().toISOString()
          });
          
          // Armazenar o contexto da substituição para continuar depois
          setContextoOperacao({
            tipo: 'substituir',
            dados: {
              ocorrencias,
              textoAntigo,
              textoNovo
            }
          });
          
          return true;
        }
      } catch (error) {
        console.error('Erro ao processar comando de substituição:', error);
      }
    }
    
    // Verificar padrões de comando para mover texto
    const regexMover = /mover?\s+(?:o\s+)?(?:parágrafo|trecho|seção)\s+"([^"]+)"\s+(?:para|após|antes)\s+"([^"]+)"/i;
    if (regexMover.test(comando)) {
      try {
        const match = comando.match(regexMover);
        if (match && match.length >= 3) {
          const trechoMover = match[1];
          const referencia = match[2];
          
          // Buscar o trecho a ser movido
          const ocorrenciasOrigem = documentoService.buscarTexto(trechoMover);
          
          if (ocorrenciasOrigem.length === 0) {
            adicionarMensagem({
              id: uuidv4(),
              conteudo: `Não encontrei o trecho "${trechoMover}" no documento.`,
              isUsuario: false,
              timestamp: new Date().toISOString()
            });
            return true;
          }
          
          // Buscar a referência de destino
          const ocorrenciasDestino = documentoService.buscarTexto(referencia);
          
          if (ocorrenciasDestino.length === 0) {
            adicionarMensagem({
              id: uuidv4(),
              conteudo: `Não encontrei a referência "${referencia}" no documento.`,
              isUsuario: false,
              timestamp: new Date().toISOString()
            });
            return true;
          }
          
          // Se houver apenas uma ocorrência de cada, mover diretamente
          if (ocorrenciasOrigem.length === 1 && ocorrenciasDestino.length === 1) {
            const origem = ocorrenciasOrigem[0];
            const destino = ocorrenciasDestino[0];
            
            // Calcular a posição após a referência
            const posicaoDestino = destino.indice + destino.comprimento;
            
            const sucesso = documentoService.moverConteudo(
              { inicio: origem.indice, fim: origem.indice + origem.comprimento },
              posicaoDestino
            );
            
            if (sucesso) {
              adicionarMensagem({
                id: uuidv4(),
                conteudo: `Movi o trecho com sucesso.`,
                isUsuario: false,
                timestamp: new Date().toISOString()
              });
            } else {
              adicionarMensagem({
                id: uuidv4(),
                conteudo: `Encontrei os trechos, mas houve um erro ao fazer a movimentação.`,
                isUsuario: false,
                timestamp: new Date().toISOString()
              });
            }
            return true;
          }
          
          // Se houver múltiplas ocorrências, perguntar qual usar
          let mensagem = `Encontrei ${ocorrenciasOrigem.length} ocorrências do trecho a mover e ${ocorrenciasDestino.length} ocorrências da referência. Preciso de mais informações.\n\n`;
          
          mensagem += `Por favor, especifique com mais detalhes qual trecho deseja mover e para onde.`;
          
          adicionarMensagem({
            id: uuidv4(),
            conteudo: mensagem,
            isUsuario: false,
            timestamp: new Date().toISOString()
          });
          
          return true;
        }
      } catch (error) {
        console.error('Erro ao processar comando de mover:', error);
      }
    }
    
    return false;
  };
  
  // Estado para armazenar contexto de operações multi-passo
  const [contextoOperacao, setContextoOperacao] = useState<{
    tipo: 'substituir' | 'mover' | null;
    dados: any;
  } | null>(null);
  
  // Modificar a função enviarMensagem para processar comandos avançados
  const enviarMensagem = async () => {
    if (!inputMensagem.trim() || isAnalisando) return;
    
    // Adicionar mensagem do usuário
    const mensagemUsuario = {
      id: uuidv4(),
      conteudo: inputMensagem,
      isUsuario: true,
      timestamp: new Date().toISOString()
    };

    console.log('Verificando se adicionarMensagem está definida:', typeof adicionarMensagem);
    console.log('Mensagem a ser adicionada:', mensagemUsuario);

    adicionarMensagem(mensagemUsuario);
    
    // Limpar o input
    setInputMensagem('');
    
    // Se estamos no meio de uma operação contextual
    if (contextoOperacao) {
      if (contextoOperacao.tipo === 'substituir') {
        const { ocorrencias, textoAntigo, textoNovo } = contextoOperacao.dados;
        
        // Tentar interpretar a resposta como um número ou "todas"
        if (inputMensagem.toLowerCase() === 'todas' || inputMensagem.toLowerCase() === 'todos') {
          // Substituir todas as ocorrências
          let sucesso = true;
          let contador = 0;
          
          // Substituir de trás para frente para evitar problemas com índices
          for (let i = ocorrencias.length - 1; i >= 0; i--) {
            const ocorrencia = ocorrencias[i];
            const resultado = documentoService?.substituirTexto(
              ocorrencia.indice,
              ocorrencia.indice + ocorrencia.comprimento,
              textoNovo
            );
            
            if (resultado) contador++;
            sucesso = sucesso && resultado;
          }
          
          if (sucesso) {
            adicionarMensagem({
              id: uuidv4(),
              conteudo: `Substituí ${contador} ocorrências de "${textoAntigo}" por "${textoNovo}" com sucesso.`,
              isUsuario: false,
              timestamp: new Date().toISOString()
            });
          } else {
            adicionarMensagem({
              id: uuidv4(),
              conteudo: `Tentei substituir todas as ocorrências, mas algumas falhas ocorreram. ${contador} substituições foram realizadas.`,
              isUsuario: false,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          // Tentar interpretar como um número
          const indice = parseInt(inputMensagem) - 1; // Ajustar para índice base-0
          
          if (isNaN(indice) || indice < 0 || indice >= ocorrencias.length) {
            adicionarMensagem({
              id: uuidv4(),
              conteudo: `Não entendi qual ocorrência você deseja substituir. Por favor, responda com um número entre 1 e ${ocorrencias.length}, ou "todas".`,
              isUsuario: false,
              timestamp: new Date().toISOString()
            });
          } else {
            // Substituir a ocorrência específica
            const ocorrencia = ocorrencias[indice];
            const sucesso = documentoService?.substituirTexto(
              ocorrencia.indice,
              ocorrencia.indice + ocorrencia.comprimento,
              textoNovo
            );
            
            if (sucesso) {
              adicionarMensagem({
                id: uuidv4(),
                conteudo: `Substituí a ocorrência ${indice + 1} de "${textoAntigo}" por "${textoNovo}" com sucesso.`,
                isUsuario: false,
                timestamp: new Date().toISOString()
              });
            } else {
              adicionarMensagem({
                id: uuidv4(),
                conteudo: `Houve um erro ao substituir a ocorrência ${indice + 1}. Por favor, tente novamente ou use outro método.`,
                isUsuario: false,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
        
        // Limpar o contexto após processar
        setContextoOperacao(null);
        return;
      }
      
      // Outros tipos de operações contextuais podem ser processados aqui
    }
    
    // Verificar se é um comando de edição avançada
    const comandosPossiveis = [
      'substituir', 'mover', 'inserir após', 'remover', 'formatar'
    ];
    
    const podeSerComandoAvancado = comandosPossiveis.some(cmd => 
      inputMensagem.toLowerCase().includes(cmd)
    );
    
    if (podeSerComandoAvancado && documentoService) {
      const foiProcessado = await processarComandoAvancado(inputMensagem);
      if (foiProcessado) {
        // Comando foi processado como edição avançada
        return;
      }
    }
    
    // Se não foi um comando avançado, continuar com o processamento normal
    // ... código existente para processar mensagens normais ...
    
    setIsAnalisando(true);
    setIsTyping(true);
    
    try {
      const mensagemAssistente = await enviarMensagemAoAssistente(
        mensagemUsuario.conteudo, 
        documentoId, 
        tipoDocumento,
        textoSelecionado
      );
      
      const novaMensagem = {
        id: uuidv4(),
        conteudo: mensagemAssistente.texto,
        isUsuario: false,
        timestamp: new Date().toISOString(),
        foiUtil: null,
        avaliacao: null
      };
      
      adicionarMensagem(novaMensagem);
      
      // Verificar se a resposta contém uma sugestão e armazená-la
      if (
        mensagemAssistente.texto.includes('sugestão') || 
        mensagemAssistente.texto.includes('correção') ||
        mensagemAssistente.texto.includes('trecho sugerido')
      ) {
        setSugestaoPendente(mensagemAssistente.texto);
        setMostrarSugestaoEditor(true);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      adicionarMensagem({
        id: uuidv4(),
        conteudo: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        isUsuario: false,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsAnalisando(false);
      setIsTyping(false);
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
          conteudoAtual: conteudoDocumentoLocal.substring(0, 500) // Usar o estado local para o contexto
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

  // Adicionando função para solicitar análise contextual
  const solicitarAnaliseContextual = async () => {
    if (!conteudoDocumentoLocal) {
      adicionarMensagem({
        id: uuidv4(),
        conteudo: "Por favor, insira algum texto no editor para ser analisado.",
        isUsuario: false,
        timestamp: new Date()
      });
      return;
    }

    const mensagemId = uuidv4();
    const novaMensagem: Mensagem = {
      id: mensagemId,
      conteudo: "Analisando o documento...",
      isUsuario: false,
      timestamp: new Date().toISOString(),
      processando: true
    };
    
    setMensagens(mensagens => [...mensagens, novaMensagem]);

    try {
      const resposta = await fetch('/api/documento-analise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conteudo: conteudoDocumentoLocal,
          documentoNome: tipoDocumento || 'Documento sem título'
        }),
      });

      if (!resposta.ok) {
        throw new Error(`Erro na API: ${resposta.status}`);
      }

      const dados = await resposta.json();
      
      // Atualiza a mensagem com o resultado da análise contextual
      setMensagens(mensagens => mensagens.map(msg => 
        msg.id === mensagemId 
          ? {
              ...msg,
              texto: "Análise contextual do documento concluída",
              processando: false,
              tipo: 'contextual',
              analiseContextual: dados
            }
          : msg
      ));
    } catch (erro) {
      console.error('Erro ao solicitar análise contextual:', erro);
      
      // Atualiza a mensagem com erro
      setMensagens(mensagens => mensagens.map(msg => 
        msg.id === mensagemId 
          ? {
              ...msg,
              texto: "Não foi possível realizar a análise contextual. Por favor, tente novamente mais tarde.",
              processando: false
            }
          : msg
      ));
    }
  };

  // Adicionar função para atualizar manualmente o contexto do documento
  const atualizarContextoDocumento = () => {
    // Evitar atualizações se já estiver em processo de atualização
    if (isAtualizandoContexto) return;
    
    // Evitar múltiplas notificações em curto período
    const agora = Date.now();
    const deveNotificar = agora - ultimaNotificacao > 60000; // Notificar no máximo a cada 1 minuto
    
    try {
      setIsAtualizandoContexto(true);
      
      if (documentoService && documentoService.isEditorReady()) {
        documentoService.forceUpdateCache();
        const conteudo = documentoService.getConteudoTexto();
        setConteudoDocumentoLocal(conteudo);
        setTemConteudoDocumento(!!conteudo && conteudo.length > 0);
        
        if (deveNotificar) {
          toast.success(`Contexto do documento atualizado (${conteudo.length} caracteres)`, {
            duration: 2000,
            icon: '📄'
          });
          setUltimaNotificacao(agora);
        }
        return;
      }
      
      // Método alternativo se DocumentoService não estiver disponível
      let conteudoObtido = '';
      if (editorRef?.current) {
        try {
          if (typeof editorRef.current.getEditor === 'function') {
            const quill = editorRef.current.getEditor();
            conteudoObtido = quill.getText();
          } else if (editorRef.current.editor) {
            conteudoObtido = editorRef.current.editor.getText();
          }
        } catch (e) {
          console.error('Erro ao obter conteúdo:', e);
        }
      }
      
      // Último recurso: tentar via DOM
      if (!conteudoObtido) {
        const editorElement = document.querySelector('.ql-editor');
        if (editorElement) {
          conteudoObtido = editorElement.textContent || '';
        }
      }
      
      if (conteudoObtido) {
        setConteudoDocumentoLocal(conteudoObtido);
        setTemConteudoDocumento(true);
        
        if (deveNotificar) {
          toast.success(`Contexto do documento atualizado (${conteudoObtido.length} caracteres)`, {
            duration: 2000,
            icon: '📄'
          });
          setUltimaNotificacao(agora);
        }
      } else {
        if (deveNotificar) {
          toast.error('Não foi possível acessar o conteúdo do documento.', {
            duration: 3000,
            icon: '⚠️'
          });
          setUltimaNotificacao(agora);
        }
        setTemConteudoDocumento(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar contexto do documento:', error);
      if (deveNotificar) {
        toast.error('Erro ao atualizar contexto do documento.');
        setUltimaNotificacao(agora);
      }
      setTemConteudoDocumento(false);
    } finally {
      setIsAtualizandoContexto(false);
    }
  };

  // Tentar obter o conteúdo inicialmente
  useEffect(() => {
    if (editorRef?.current) {
      atualizarContextoDocumento();
      
      // Configurar atualização periódica a cada 2 minutos (menos frequente)
      const intervalo = setInterval(atualizarContextoDocumento, 120000);
      
      return () => {
        clearInterval(intervalo);
      };
    }
  }, [editorRef?.current]);

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

  // Adicionar seção de comandos rápidos no componente de chat
  const renderizarComandosRapidos = () => {
    return (
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Comandos avançados:
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setInputMensagem('substituir "texto antigo" por "texto novo"')}
            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded text-gray-700 dark:text-gray-300"
          >
            Substituir texto
          </button>
          <button
            onClick={() => setInputMensagem('mover parágrafo "início do parágrafo" para após "referência"')}
            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded text-gray-700 dark:text-gray-300"
          >
            Mover conteúdo
          </button>
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
              {/* Cabeçalho do chat */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg flex justify-between items-center">
                <h3 className="font-semibold">Assistente Jurídico IA</h3>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Fechar assistente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Área de status do contexto do documento */}
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${temConteudoDocumento ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {temConteudoDocumento 
                      ? `IA tem acesso ao documento (${conteudoDocumentoLocal.length} caracteres)` 
                      : 'IA sem acesso ao documento'}
                  </span>
                </div>
                <button 
                  onClick={atualizarContextoDocumento}
                  disabled={isAtualizandoContexto}
                  className={`text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 
                    ${isAtualizandoContexto ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Atualizar o contexto do documento"
                >
                  {isAtualizandoContexto ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
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
                
                {/* Adicionar a seção de comandos rápidos */}
                {renderizarComandosRapidos()}
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