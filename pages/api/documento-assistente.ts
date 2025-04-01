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

// Handler principal
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RespostaAssistente | ErrorResponse>
) {
  // Log de entrada da requisição
  logInfo(`Requisição recebida: ${req.method} ${req.url}`);
  
  // Verificar método HTTP
  if (req.method !== 'POST') {
    logWarning(`Método não permitido: ${req.method}`);
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { 
      operacao, 
      texto, 
      tipoDocumento, 
      tipoAnalise, 
      documentoId, 
      usuarioId,
      dadosContexto
    } = req.body;

    // Log dos parâmetros recebidos
    logDebug('Parâmetros recebidos:', { 
      operacao, 
      tipoDocumento, 
      tipoAnalise, 
      documentoId, 
      usuarioId,
      textoLength: texto?.length
    });

    // Validar campos obrigatórios
    if (!operacao) {
      return res.status(400).json({ erro: 'Operação não especificada. Use "analisar" ou "sugerir"' });
    }

    if (!usuarioId) {
      return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
    }

    let resposta: RespostaAssistente;

    switch (operacao) {
      case 'analisar':
        // Validar campos específicos para análise
        if (!texto) {
          return res.status(400).json({ erro: 'Texto para análise é obrigatório' });
        }
        if (!tipoDocumento) {
          return res.status(400).json({ erro: 'Tipo de documento é obrigatório' });
        }

        // Realizar análise do texto
        resposta = await analisarTextoJuridico(texto, tipoDocumento, tipoAnalise);
        
        // Salvar interação no histórico
        if (documentoId) {
          await salvarInteracaoDocumento({
            documento_id: documentoId,
            usuario_id: usuarioId,
            conteudo_consulta: texto,
            conteudo_resposta: resposta.resposta,
            tipo_interacao: 'analise',
            aplicada: false,
            metadados: {
              tipoAnalise,
              tipoDocumento,
              referenciasJuridicas: resposta.referenciasJuridicas
            }
          });
        }
        break;

      case 'sugerir':
        // Validar campos específicos para sugestão
        if (!tipoDocumento) {
          return res.status(400).json({ erro: 'Tipo de documento é obrigatório' });
        }
        if (!dadosContexto) {
          return res.status(400).json({ erro: 'Dados de contexto são obrigatórios' });
        }

        // Gerar sugestões de trechos
        resposta = await sugerirTrechosJuridicos(tipoDocumento, dadosContexto);
        
        // Salvar interação no histórico
        if (documentoId) {
          await salvarInteracaoDocumento({
            documento_id: documentoId,
            usuario_id: usuarioId,
            conteudo_consulta: JSON.stringify(dadosContexto),
            conteudo_resposta: resposta.resposta,
            tipo_interacao: 'sugestao_trecho',
            aplicada: false,
            metadados: {
              tipoDocumento,
              sugestoes: resposta.sugestoes
            }
          });
        }
        break;

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

    // Log de sucesso
    logInfo(`Operação ${operacao} concluída com sucesso`);
    
    // Retornar a resposta
    return res.status(200).json(resposta);
  } catch (error) {
    // Tratamento de erro global
    const err = error as Error;
    const mensagemErro = err.message || 'Erro desconhecido ao processar solicitação';
    const stack = err.stack || '';
    
    logError('Erro ao processar solicitação do assistente de documentos:', error);
    
    return res.status(500).json({ 
      erro: mensagemErro,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined,
      detalhes: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.'
    });
  }
} 