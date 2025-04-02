import { NextApiRequest, NextApiResponse } from 'next';
import { obterRespostaJuridica } from '../../utils/groq';
import { logDebug, logError, logInfo, logWarning } from '../../utils/logger';
import { supabase } from '../../utils/supabase';
import NodeCache from 'node-cache';

// Tipagem para resposta de erro
type ErrorResponse = {
  erro: string;
  stack?: string;
  detalhes?: string;
};

// Tipagem para resposta do assistente
interface RespostaAssistente {
  resposta: string;
  modeloUsado: string;
  tokens: {
    entrada: number;
    saida: number;
    total: number;
  };
  sugestoes?: Array<{
    titulo: string;
    texto: string;
    explicacao: string;
  }>;
  referenciasJuridicas?: {
    leis?: string[];
    jurisprudencias?: string[];
    doutrinas?: string[];
  };
}

// Interface para o histórico de interações
interface InteracaoDocumento {
  id?: string;
  documento_id: string;
  usuario_id: string;
  conteudo_consulta: string;
  conteudo_resposta: string;
  tipo_interacao: 'analise' | 'sugestao_trecho' | 'correcao' | 'duvida';
  aplicada: boolean;
  criado_em?: string;
  metadados?: Record<string, any>;
}

// Cache para reduzir chamadas repetitivas à API
// Configuração: TTL de 30 minutos, verificação a cada 5 minutos
let assistanteCache: NodeCache | null = null;

try {
  assistanteCache = new NodeCache({ 
    stdTTL: 1800, 
    checkperiod: 300,
    useClones: false 
  });
  logInfo('Cache do assistente de documentos inicializado com sucesso');
} catch (error) {
  logError('Erro ao inicializar cache do assistente:', error);
  // Não interromper a execução se o cache falhar
}

// Função auxiliar para gerar chave de cache
function gerarChaveCache(documentoId: string, consulta: string, tipo: string): string {
  try {
    if (!consulta) return `doc_${documentoId}_${tipo}_empty`;
    const consultaHash = Buffer.from(consulta).toString('base64').slice(0, 32);
    return `doc_${documentoId}_${tipo}_${consultaHash}`;
  } catch (error) {
    logWarning('Erro ao gerar chave de cache, usando fallback', error);
    // Fallback em caso de erro
    return `doc_${documentoId}_${tipo}_${Date.now()}`;
  }
}

// Função segura para acessar o cache
function obterDoCache<T>(chave: string): T | null {
  if (!assistanteCache) return null;
  try {
    return assistanteCache.get<T>(chave);
  } catch (error) {
    logWarning(`Erro ao obter item '${chave}' do cache:`, error);
    return null;
  }
}

// Função segura para salvar no cache
function salvarNoCache(chave: string, valor: any): boolean {
  if (!assistanteCache) return false;
  try {
    return assistanteCache.set(chave, valor);
  } catch (error) {
    logWarning(`Erro ao salvar item '${chave}' no cache:`, error);
    return false;
  }
}

// Função para salvar interação com o documento
async function salvarInteracaoDocumento(interacao: InteracaoDocumento): Promise<InteracaoDocumento | null> {
  if (!supabase) {
    logError('Cliente Supabase não inicializado');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('interacoes_documento')
      .insert([interacao])
      .select()
      .single();

    if (error) {
      logError('Erro ao salvar interação com documento:', error);
      return null;
    }

    return data;
  } catch (error) {
    logError('Erro inesperado ao salvar interação com documento:', error);
    return null;
  }
}

// Função para obter histórico de interações de um documento
async function obterHistoricoInteracoes(documentoId: string, limite: number = 10): Promise<InteracaoDocumento[]> {
  if (!supabase) {
    logError('Cliente Supabase não inicializado');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('interacoes_documento')
      .select('*')
      .eq('documento_id', documentoId)
      .order('criado_em', { ascending: false })
      .limit(limite);

    if (error) {
      logError('Erro ao obter histórico de interações:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logError('Erro inesperado ao obter histórico de interações:', error);
    return [];
  }
}

// Resposta simulada para quando a API estiver indisponível
function gerarRespostaSimulada(texto: string, tipo: string): RespostaAssistente {
  logWarning('Gerando resposta simulada (contingência)');
  
  let resposta = '';
  
  if (tipo === 'analise') {
    resposta = `## Análise de Contingência (Simulada)

Este é um texto de contingência gerado quando a API principal não está disponível.

### Análise Preliminar
Seu texto foi recebido, mas não foi possível analisá-lo completamente no momento.

### Sugestões
- Verifique a formatação do texto
- Considere adicionar citações de jurisprudência
- Revise os termos técnicos

*Nota: Este é um modo de contingência. O serviço completo estará disponível em breve.*`;
  } else {
    resposta = `## Sugestões de Trechos (Modo Contingência)

Este é um texto de contingência gerado quando a API principal não está disponível.

### Trecho 1: Introdução Genérica
Venho, respeitosamente, perante Vossa Excelência, com fundamento no artigo X da Lei Y, apresentar...

### Trecho 2: Conclusão Padrão
Diante do exposto, requer-se o deferimento do pedido, com a consequente...

*Nota: Este é um modo de contingência. O serviço completo estará disponível em breve.*`;
  }
  
  return {
    resposta,
    modeloUsado: 'contingência',
    tokens: {
      entrada: 0,
      saida: 0,
      total: 0
    }
  };
}

// Função para procesar o conteúdo do documento e prepará-lo para uso na consulta
function prepararConteudoDocumento(conteudoBruto: string | null, maximo: number = 10000): string {
  if (!conteudoBruto) return '';
  
  // Se o conteúdo for muito grande, precisamos reduzir para evitar estourar tokens
  if (conteudoBruto.length > maximo) {
    console.log(`⚠️ Conteúdo do documento é grande (${conteudoBruto.length} caracteres), reduzindo para ~${maximo} caracteres`);
    
    // Extrair diferentes partes do documento para manter o contexto geral
    const inicio = conteudoBruto.substring(0, maximo * 0.3); // 30% do início
    const meio = conteudoBruto.substring(
      Math.floor(conteudoBruto.length / 2 - (maximo * 0.2)),
      Math.floor(conteudoBruto.length / 2 + (maximo * 0.2))
    ); // 40% do meio
    const fim = conteudoBruto.substring(conteudoBruto.length - maximo * 0.3); // 30% do final
    
    return `${inicio}\n\n[...]\n\n${meio}\n\n[...]\n\n${fim}`;
  }
  
  return conteudoBruto;
}

// Função principal para processar análise de texto jurídico
async function analisarTextoJuridico(
  texto: string, 
  tipoDocumento: string, 
  tipoAnalise: 'terminologia' | 'citacoes' | 'estrutura' | 'completa' = 'completa'
): Promise<RespostaAssistente> {
  // Verificar se o resultado está em cache
  const chaveCache = gerarChaveCache(tipoDocumento, texto, tipoAnalise);
  const cacheHit = obterDoCache<RespostaAssistente>(chaveCache);
  
  if (cacheHit) {
    logInfo(`Usando resposta em cache para análise de texto jurídico [${tipoAnalise}]`);
    return cacheHit;
  }

  // Construir prompt para o tipo de análise solicitado
  let promptAnalise = `Analise o seguinte trecho de documento jurídico do tipo "${tipoDocumento}" e forneça feedback específico:\n\n${texto}\n\n`;
  
  switch (tipoAnalise) {
    case 'terminologia':
      promptAnalise += "Foque exclusivamente na identificação de termos jurídicos incorretos ou imprecisos. Verifique se a terminologia legal está correta e adequada ao contexto.";
      break;
    case 'citacoes':
      promptAnalise += "Foque exclusivamente na verificação de citações legais. Identifique citações incorretas ou desatualizadas de leis, artigos, parágrafos e jurisprudências.";
      break;
    case 'estrutura':
      promptAnalise += "Foque exclusivamente na estrutura e clareza do texto. Avalie a organização, coesão, coerência e adequação formal para o tipo de documento jurídico.";
      break;
    case 'completa':
    default:
      promptAnalise += `Forneça uma análise completa abordando:
1. Terminologia jurídica incorreta ou imprecisa
2. Inconsistências na argumentação jurídica 
3. Citações legais incorretas ou desatualizadas
4. Problemas de estrutura ou clareza
5. Sugestões específicas de correção e aprimoramento`;
      break;
  }
  
  promptAnalise += "\n\nResponda de forma estruturada com markdown, identificando claramente cada problema e fornecendo sugestões específicas de correção.";

  try {
    // Fazer a chamada à API da IA
    logInfo(`Iniciando análise de texto jurídico: ${tipoAnalise}`);
    const resposta = await obterRespostaJuridica({ consulta: promptAnalise, historico: [] });
    logInfo('Resposta da API recebida com sucesso');
    
    // Extrair referências jurídicas (leis, jurisprudências e doutrinas) usando regex
    const leisRegex = /(?:Lei(?:\s+n[º°.]?\s*\d+[\d.,/\s]*(?:\/\d+)?)|Artigo\s+\d+[°º,.]?(?:\s*(?:d[aoe]|,|\s)\s*[\wÀ-ú\s]+)?|C(?:ódigo|F|PC|PP|DC|LT)\s+[\wÀ-ú\s,.]+\d+|Decreto[\w\d\s-]+)/gi;
    const leisMatch = Array.from(new Set(resposta.conteudo.match(leisRegex) || []));
    
    const jurisprudenciaRegex = /(?:(?:STF|STJ|TST|TSE|TRF\d?|TJ[A-Z]{2}|TRT\d{1,2})[\s:-]+(?:.*?)(?=\n|$)|Súmula(?:\s+n[°º.]?)?\s*\d+(?:\s*d[oe]\s*[\wÀ-ú\s]+)?|(?:Recurso|Agravo|Apelação|Habeas|Mandado)\s+[\w\d\s-]+\d+)/gi;
    const jurisprudenciaMatch = Array.from(new Set(resposta.conteudo.match(jurisprudenciaRegex) || []));
    
    const doutrinaRegex = /(?:[A-ZÀ-Ú][a-zà-ú]+,\s+[A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*\.?(?:\s+[\wÀ-ú\s,.:()]+)?(?:\(\d{4}\)|\d{4}))/gi;
    const doutrinaMatch = Array.from(new Set(resposta.conteudo.match(doutrinaRegex) || []));
    
    // Criar objeto de resposta processada
    const respostaProcessada: RespostaAssistente = {
      resposta: resposta.conteudo,
      modeloUsado: resposta.modeloUsado,
      tokens: resposta.tokens,
      referenciasJuridicas: {
        leis: leisMatch.length > 0 ? leisMatch : undefined,
        jurisprudencias: jurisprudenciaMatch.length > 0 ? jurisprudenciaMatch : undefined,
        doutrinas: doutrinaMatch.length > 0 ? doutrinaMatch : undefined
      }
    };
    
    // Salvar no cache
    salvarNoCache(chaveCache, respostaProcessada);
    
    return respostaProcessada;
  } catch (error) {
    logError('Erro ao analisar texto jurídico:', error);
    
    // Retornar resposta de contingência em caso de falha
    const respostaSimulada = gerarRespostaSimulada(texto, 'analise');
    // Não salvamos respostas simuladas no cache
    
    return respostaSimulada;
  }
}

// Função para sugerir trechos para documentos
async function sugerirTrechosJuridicos(
  tipoDocumento: string,
  dadosContexto: Record<string, any>
): Promise<RespostaAssistente> {
  // Verificar se o resultado está em cache
  const chaveCache = gerarChaveCache(tipoDocumento, JSON.stringify(dadosContexto), 'sugestao_trecho');
  const cacheHit = obterDoCache<RespostaAssistente>(chaveCache);
  
  if (cacheHit) {
    logInfo(`Usando resposta em cache para sugestão de trechos jurídicos [${tipoDocumento}]`);
    return cacheHit;
  }
  
  // Construir prompt para solicitar sugestão de trechos
  const contextoDados = Object.entries(dadosContexto)
    .filter(([_, valor]) => valor)
    .map(([campo, valor]) => `${campo}: ${valor}`)
    .join('\n');

  const promptSugestao = `Sugira 3 exemplos de trechos jurídicos prontos para um documento do tipo "${tipoDocumento}" com base nos seguintes dados:
      
${contextoDados}

Para cada trecho, forneça:
1. Um título descritivo
2. O texto pronto para ser aplicado ao documento
3. Uma breve explicação da finalidade e relevância deste trecho

Retorne os trechos em formato markdown, com cabeçalhos para cada seção. Seja específico e direto.`;

  try {
    // Fazer a chamada à API da IA
    logInfo(`Iniciando sugestão de trechos para: ${tipoDocumento}`);
    const resposta = await obterRespostaJuridica({ consulta: promptSugestao, historico: [] });
    logInfo('Resposta da API de sugestões recebida com sucesso');
    
    // Extrair sugestões de trechos com regex (básico)
    // Em uma implementação mais robusta, seria melhor pedir resposta estruturada em JSON
    const secoes = resposta.conteudo.split(/##\s+/g).filter(s => s.trim());
    
    const sugestoes = secoes.map(secao => {
      const [titulo, ...resto] = secao.split('\n');
      const conteudoCompleto = resto.join('\n').trim();
      
      // Tentar dividir entre texto e explicação (heurística básica)
      const partes = conteudoCompleto.split(/\n\n(?=.*explicação|.*finalidade|.*relevância)/i);
      
      let texto = conteudoCompleto;
      let explicacao = '';
      
      if (partes.length >= 2) {
        texto = partes[0].trim();
        explicacao = partes.slice(1).join('\n\n').trim();
      }
      
      return {
        titulo: titulo.trim(),
        texto,
        explicacao
      };
    });
    
    // Criar objeto de resposta processada
    const respostaProcessada: RespostaAssistente = {
      resposta: resposta.conteudo,
      modeloUsado: resposta.modeloUsado,
      tokens: resposta.tokens,
      sugestoes
    };
    
    // Salvar no cache
    salvarNoCache(chaveCache, respostaProcessada);
    
    return respostaProcessada;
  } catch (error) {
    logError('Erro ao sugerir trechos jurídicos:', error);
    
    // Retornar resposta de contingência em caso de falha
    const respostaSimulada = gerarRespostaSimulada('', 'sugestao');
    // Não salvamos respostas simuladas no cache
    
    return respostaSimulada;
  }
}

// Função de emergência para responder quando a API principal falha
function respostaDeFallback(pergunta: string): string {
  console.log('⚠️ Gerando resposta de emergência para:', pergunta.substring(0, 100));
  
  return `## Resposta de Contingência

Estou operando em modo de contingência devido a uma limitação temporária.

### Resposta à sua consulta:

${pergunta.includes('analis') ? 
    'Com base na minha análise preliminar, recomendo revisar a estrutura do documento para garantir clareza e coesão dos argumentos. Verifique também as citações legais e terminologia jurídica.' : 
    'Para auxiliar com sua consulta, recomendo consultar a legislação pertinente ao caso. Estruture seu documento com introdução clara, argumentação sólida baseada em fundamentos legais, e conclusão objetiva.'}

> 💡 Nossa equipe está trabalhando para restaurar todas as funcionalidades em breve.
`;
}

// Handler principal
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RespostaAssistente | ErrorResponse>
) {
  console.log('API documento-assistente - Inicializando handler');
  console.log('Método:', req.method);
  
  // Verificar método
  if (req.method !== 'POST') {
    console.error('Método inválido');
    return res.status(405).json({ erro: 'Método não permitido' });
  }
  
  try {
    console.log('Inicializando manipulador de API do assistente de documentos');
    
    // Log detalhado dos dados recebidos
    console.log('🔍 Corpo da requisição recebida:', JSON.stringify({
      operacao: req.body.operacao,
      temMensagem: !!req.body.mensagem,
      temTexto: !!req.body.texto,
      documentId: req.body.documento_id || req.body.documentoId,
      tipoDoc: req.body.tipo_documento || req.body.tipoDocumento,
      temUsuarioId: !!req.body.usuarioId,
      temContexto: !!req.body.contexto,
      temConteudoDocumento: !!req.body.conteudo_documento,
      tamanhoConteudoDocumento: req.body.conteudo_documento ? req.body.conteudo_documento.length : 0
    }));
    
    // Extrair e validar dados da requisição com fallbacks extensivos
    const operacao = req.body.operacao || 'perguntar';
    
    // Aceitar mensagem de múltiplas propriedades para maior compatibilidade
    const mensagem = req.body.mensagem || req.body.texto || '';
    
    // Se não temos mensagem, tentar extrair de outras fontes possíveis
    let mensagemFinal = mensagem;
    if (!mensagemFinal && req.body.contexto?.selecao) {
      mensagemFinal = `Analise o seguinte trecho: "${req.body.contexto.selecao}"`;
      console.log('⚠️ Usando seleção de contexto como mensagem alternativa');
    }
    
    if (!mensagemFinal && req.body.conteudo_documento) {
      mensagemFinal = `Analise o documento e dê sugestões gerais para aprimoramento.`;
      console.log('⚠️ Usando conteúdo do documento como base para mensagem alternativa');
    }
    
    if (!mensagemFinal) {
      mensagemFinal = "Olá, como posso ajudar com seu documento jurídico?";
      console.log('⚠️ Usando mensagem padrão genérica');
    }
    
    const documentoId = req.body.documento_id || req.body.documentoId || 'doc_' + new Date().getTime();
    const tipoDocumento = req.body.tipo_documento || req.body.tipoDocumento || 'genérico';
    const usuarioId = req.body.usuarioId || 'usuario_anonimo';
    const contexto = req.body.contexto || {};
    
    // Obter e processar o conteúdo completo do documento
    const conteudoDocumentoBruto = req.body.conteudo_documento || 
                                  req.body.contexto?.conteudoAtual || 
                                  '';
    
    // Preparar o conteúdo do documento para uso na consulta
    const conteudoDocumento = prepararConteudoDocumento(conteudoDocumentoBruto);
    
    if (conteudoDocumento) {
      console.log(`✅ Conteúdo do documento processado: ${conteudoDocumento.length} caracteres`);
    } else {
      console.log('⚠️ Nenhum conteúdo de documento disponível');
    }
    
    // SOLUÇÃO DE EMERGÊNCIA: Se ainda há problemas, gerar uma resposta de contingência
    // e continuar a execução para evitar falhas
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('API key não configurada');
      }
      
      console.log('Requisição válida, processando operação:', operacao);
      
      // Processar operação normalmente...
      switch (operacao) {
        case 'perguntar':
          try {
            // Construir a consulta incluindo o conteúdo do documento
            let consultaCompleta = mensagemFinal;
            
            if (conteudoDocumento) {
              consultaCompleta = `
A seguir está o conteúdo do documento atual:

"""
${conteudoDocumento}
"""

Baseado no documento acima, responda à seguinte consulta:

${mensagemFinal}
`;
            }
            
            console.log(`📝 Enviando consulta para IA com ${consultaCompleta.length} caracteres`);
            
            const resposta = await obterRespostaJuridica({
              consulta: consultaCompleta,
              historico: [], // Implementar histórico de contexto no futuro
              tipoDocumento,
              contextoAdicional: JSON.stringify(contexto)
            });
            
            // Construir resposta
            const resultadoFinal: RespostaAssistente = {
              resposta: resposta.conteudo,
              modeloUsado: resposta.modelo || 'llama3',
              tokens: {
                entrada: resposta.tokens?.entrada || 0,
                saida: resposta.tokens?.saida || 0,
                total: resposta.tokens?.total || 0
              }
            };
            
            // Salvar interação para análise futura (assíncrono, não bloqueia a resposta)
            if (documentoId) {
              salvarInteracaoDocumento({
                documento_id: documentoId,
                usuario_id: usuarioId,
                conteudo_consulta: mensagemFinal, // Salvamos só a consulta do usuário, não o contexto
                conteudo_resposta: resposta.conteudo,
                tipo_interacao: 'duvida',
                aplicada: false,
                metadados: {
                  modelo: resposta.modelo,
                  tokens: resposta.tokens,
                  operacao,
                  tamanhoDocumento: conteudoDocumento.length
                }
              }).catch(err => {
                logError('Erro ao salvar interação (não-crítico):', err);
              });
            }
            
            return res.status(200).json(resultadoFinal);
          } catch (error) {
            logError('Erro ao processar pergunta jurídica:', error);
            return res.status(500).json({ 
              erro: 'Erro ao processar pergunta jurídica',
              detalhes: error.message 
            });
          }

        case 'analisar':
          // Validar campos específicos para análise
          if (!mensagemFinal) {
            return res.status(400).json({ erro: 'Texto para análise é obrigatório' });
          }
          if (!tipoDocumento) {
            return res.status(400).json({ erro: 'Tipo de documento é obrigatório' });
          }

          // Realizar análise do texto
          const respostaAnalise = await analisarTextoJuridico(mensagemFinal, tipoDocumento);
          
          // Salvar interação no histórico
          if (documentoId) {
            await salvarInteracaoDocumento({
              documento_id: documentoId,
              usuario_id: usuarioId,
              conteudo_consulta: mensagemFinal,
              conteudo_resposta: respostaAnalise.resposta,
              tipo_interacao: 'analise',
              aplicada: false,
              metadados: {
                tipoAnalise: 'completa',
                tipoDocumento,
                referenciasJuridicas: respostaAnalise.referenciasJuridicas
              }
            });
          }
          
          // Retornar resposta de análise
          return res.status(200).json(respostaAnalise);

        case 'sugerir':
          // Validar campos específicos para sugestão
          if (!tipoDocumento) {
            return res.status(400).json({ erro: 'Tipo de documento é obrigatório' });
          }
          if (!contexto) {
            return res.status(400).json({ erro: 'Dados de contexto são obrigatórios' });
          }

          // Gerar sugestões de trechos
          const respostaSugestao = await sugerirTrechosJuridicos(tipoDocumento, contexto);
          
          // Salvar interação no histórico
          if (documentoId) {
            await salvarInteracaoDocumento({
              documento_id: documentoId,
              usuario_id: usuarioId,
              conteudo_consulta: JSON.stringify(contexto),
              conteudo_resposta: respostaSugestao.resposta,
              tipo_interacao: 'sugestao_trecho',
              aplicada: false,
              metadados: {
                tipoDocumento,
                sugestoes: respostaSugestao.sugestoes
              }
            });
          }
          
          // Retornar resposta com sugestões
          return res.status(200).json(respostaSugestao);

        case 'historico':
          // Validar campos específicos para histórico
          if (!documentoId) {
            return res.status(400).json({ erro: 'ID do documento é obrigatório' });
          }

          // Obter histórico de interações
          const historico = await obterHistoricoInteracoes(documentoId);
          
          // Retornar o histórico
          return res.status(200).json({
            resposta: `Histórico recuperado com sucesso: ${historico.length} interações encontradas.`,
            modeloUsado: 'historico',
            tokens: {
              entrada: 0,
              saida: 0,
              total: 0
            },
            sugestoes: historico.map(interacao => ({
              titulo: `${interacao.tipo_interacao} - ${new Date(interacao.criado_em || '').toLocaleString('pt-BR')}`,
              texto: interacao.conteudo_resposta,
              explicacao: `Consulta original: ${interacao.conteudo_consulta.slice(0, 100)}${interacao.conteudo_consulta.length > 100 ? '...' : ''}`
            }))
          });

        case 'feedback':
          // Validar campos específicos para feedback
          const { interacaoId, aplicada, comentario } = req.body;
          
          if (!interacaoId) {
            return res.status(400).json({ erro: 'ID da interação é obrigatório' });
          }
          
          if (typeof aplicada !== 'boolean') {
            return res.status(400).json({ erro: 'Campo "aplicada" é obrigatório e deve ser booleano' });
          }
          
          // Atualizar feedback da interação
          if (!supabase) {
            throw new Error('Cliente Supabase não inicializado');
          }
          
          const { error } = await supabase
            .from('interacoes_documento')
            .update({ 
              aplicada,
              metadados: { 
                ...req.body.metadados, 
                comentario, 
                feedbackTime: new Date().toISOString() 
              }
            })
            .eq('id', interacaoId);
          
          if (error) {
            throw error;
          }
          
          return res.status(200).json({
            resposta: 'Feedback registrado com sucesso.',
            modeloUsado: 'feedback',
            tokens: {
              entrada: 0,
              saida: 0,
              total: 0
            }
          });

        default:
          return res.status(400).json({ erro: `Operação desconhecida: ${operacao}` });
      }

      // Log de sucesso - Este código nunca será executado porque todos os cases têm return
      // logInfo(`Operação ${operacao} concluída com sucesso`);
    }
    catch (erroInterno) {
      console.error('⚠️ Erro interno na API, usando resposta de contingência:', erroInterno);
      
      // Retornar resposta de contingência
      return res.status(200).json({
        resposta: respostaDeFallback(mensagemFinal),
        modeloUsado: 'fallback_interno',
        tokens: {
          entrada: 0,
          saida: 0,
          total: 0
        }
      });
    }
  } catch (error) {
    console.error('Erro no handler principal:', error);
    
    // Retornar erro com detalhes
    return res.status(500).json({ 
      erro: 'Erro interno no servidor', 
      detalhes: error.message || 'Detalhes não disponíveis',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 