import { NextApiRequest, NextApiResponse } from 'next';
import { obterRespostaJuridica } from '../../utils/groq';
import { logDebug, logError, logInfo, logWarning } from '../../utils/logger';
import { supabase } from '../../utils/supabase';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import { GroqChat } from 'langchain/chat_models/groq';
import { prisma } from '../../lib/prisma';
import { logApiRequest, logApiResponse, logApiError } from '../../utils/logger';

// Tipagem para resposta de erro
type ErrorResponse = {
  erro: string;
  stack?: string;
  detalhes?: string;
};

// Tipagem para análise estrutural
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

interface AnaliseContextualResponse {
  analiseEstrutura?: AnaliseEstrutura;
  resumoDocumento?: ResumoDocumento;
  sugestoesAprimoramento?: string[];
}

// Cache para reduzir chamadas repetitivas à API
// Configuração: TTL de 30 minutos, verificação a cada 5 minutos
let analiseCache: NodeCache | null = null;

try {
  analiseCache = new NodeCache({ 
    stdTTL: 1800, 
    checkperiod: 300,
    useClones: false 
  });
  logInfo('Cache da análise contextual inicializado com sucesso');
} catch (error) {
  logError('Erro ao inicializar cache da análise contextual:', error);
}

// Função auxiliar para gerar chave de cache
function gerarChaveCache(documentoId: string, conteudo: string, tipo: string): string {
  try {
    // Gerar hash do conteúdo para identificar mudanças
    const conteudoHash = Buffer.from(conteudo.substring(0, 1000))
      .toString('base64')
      .replace(/[+/=]/g, '')
      .substring(0, 32);
    
    return `analise_${documentoId}_${tipo}_${conteudoHash}`;
  } catch (error) {
    logWarning('Erro ao gerar chave de cache, usando fallback', error);
    // Fallback em caso de erro
    return `analise_${documentoId}_${tipo}_${Date.now()}`;
  }
}

// Inicializa o modelo de IA da Groq
const initializeGroqModel = () => {
  try {
    return new GroqChat({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama3-70b-8192",
      temperature: 0.2,
      maxTokens: 6000,
    });
  } catch (erro) {
    console.error('Erro ao inicializar modelo Groq:', erro);
    return null;
  }
};

// Função para analisar seções do documento
async function analisarSecoesDocumento(conteudo: string, model: GroqChat): Promise<SecaoDocumento[]> {
  const promptAnaliseSecoes = `
  Você é um assistente jurídico especializado em análise de documentos legais. Analise o documento a seguir e identifique todas as seções estruturais presentes.

  Para cada seção, determine:
  1. O tipo (introdução, desenvolvimento, conclusão, argumentação, citação, ou outro)
  2. Um título descritivo baseado no conteúdo
  3. O índice aproximado onde a seção começa no documento (número de caracteres desde o início)
  4. Um trecho representativo do conteúdo (até 300 caracteres)
  5. O nível hierárquico da seção (1 para seções principais, 2 para subseções, etc.)

  Documento a analisar:
  """
  ${conteudo}
  """

  Retorne APENAS um objeto JSON no seguinte formato, sem comentários adicionais:
  {
    "secoes": [
      {
        "tipo": "tipo_da_secao",
        "titulo": "título_descritivo",
        "indice": indice_numerico,
        "conteudo": "trecho_do_conteudo",
        "nivel": nivel_numerico
      },
      ...
    ]
  }
  `;

  try {
    const cacheKey = `secoes-${Buffer.from(conteudo.substring(0, 300)).toString('base64')}`;
    const cachedResult = analiseCache?.get<SecaoDocumento[]>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const resposta = await model.invoke(promptAnaliseSecoes);
    
    let resultado;
    try {
      // Tentar extrair JSON se estiver dentro de um bloco de código
      const match = resposta.text.match(/```(?:json)?(.+?)```/s);
      if (match && match[1]) {
        resultado = JSON.parse(match[1].trim());
      } else {
        resultado = JSON.parse(resposta.text);
      }
      
      const secoes = resultado.secoes || [];
      
      // Armazenar no cache
      if (analiseCache) {
        analiseCache.set(cacheKey, secoes);
      }
      
      return secoes;
    } catch (parseError) {
      console.error('Erro ao analisar resposta JSON:', parseError);
      console.log('Resposta recebida:', resposta.text);
      return [];
    }
  } catch (erro) {
    console.error('Erro ao analisar seções do documento:', erro);
    return [];
  }
}

// Função para detectar problemas no documento
async function detectarProblemasDocumento(conteudo: string, secoes: SecaoDocumento[], model: GroqChat): Promise<ProblemaDocumento[]> {
  const secoesJson = JSON.stringify(secoes);
  
  const promptDeteccaoProblemas = `
  Você é um assistente jurídico especializado em análise de documentos legais. Analise o documento a seguir e identifique todos os problemas estruturais, lógicos, e de conteúdo presentes.

  Para ajudar sua análise, já identificamos as seguintes seções no documento:
  ${secoesJson}

  Para cada problema, determine:
  1. O tipo (inconsistencia, falta_secao, ordem_incorreta, citacao_invalida, terminologia)
  2. Uma descrição clara do problema
  3. A localização aproximada do problema no texto (número de caracteres desde o início)
  4. Uma sugestão de como corrigir o problema
  5. A severidade do problema (alta, media, baixa)

  Documento a analisar:
  """
  ${conteudo}
  """

  Considere especialmente:
  - Inconsistências lógicas ou na argumentação
  - Seções essenciais que estão faltando
  - Problemas de ordem ou estrutura
  - Citações incorretas ou incompletas
  - Uso inconsistente de terminologia jurídica

  Retorne APENAS um objeto JSON no seguinte formato, sem comentários adicionais:
  {
    "problemas": [
      {
        "tipo": "tipo_do_problema",
        "descricao": "descrição_detalhada",
        "localizacao": localizacao_numerica,
        "sugestao": "sugestão_de_correção",
        "severidade": "severidade_do_problema"
      },
      ...
    ]
  }
  `;

  try {
    const cacheKey = `problemas-${Buffer.from(conteudo.substring(0, 300)).toString('base64')}`;
    const cachedResult = analiseCache?.get<ProblemaDocumento[]>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const resposta = await model.invoke(promptDeteccaoProblemas);
    
    let resultado;
    try {
      // Tentar extrair JSON se estiver dentro de um bloco de código
      const match = resposta.text.match(/```(?:json)?(.+?)```/s);
      if (match && match[1]) {
        resultado = JSON.parse(match[1].trim());
      } else {
        resultado = JSON.parse(resposta.text);
      }
      
      const problemas = resultado.problemas || [];
      
      // Armazenar no cache
      if (analiseCache) {
        analiseCache.set(cacheKey, problemas);
      }
      
      return problemas;
    } catch (parseError) {
      console.error('Erro ao analisar resposta JSON:', parseError);
      console.log('Resposta recebida:', resposta.text);
      return [];
    }
  } catch (erro) {
    console.error('Erro ao detectar problemas no documento:', erro);
    return [];
  }
}

// Função para gerar resumo do documento
async function gerarResumoDocumento(conteudo: string, model: GroqChat): Promise<ResumoDocumento | null> {
  const promptResumo = `
  Você é um assistente jurídico especializado em análise de documentos legais. Gere um resumo completo do documento a seguir.

  O resumo deve incluir:
  1. Um resumo geral do documento (até 500 caracteres)
  2. Os pontos principais abordados (3-5 pontos)
  3. Uma estrutura que identifique introdução, argumentos principais e conclusão

  Documento a resumir:
  """
  ${conteudo}
  """

  Retorne APENAS um objeto JSON no seguinte formato, sem comentários adicionais:
  {
    "resumoGeral": "texto_do_resumo_geral",
    "pontosPrincipais": ["ponto1", "ponto2", "ponto3", ...],
    "estrutura": {
      "introducao": "resumo_da_introducao",
      "argumentosPrincipais": ["argumento1", "argumento2", ...],
      "conclusao": "resumo_da_conclusao"
    }
  }
  `;

  try {
    const cacheKey = `resumo-${Buffer.from(conteudo.substring(0, 300)).toString('base64')}`;
    const cachedResult = analiseCache?.get<ResumoDocumento>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const resposta = await model.invoke(promptResumo);
    
    let resultado;
    try {
      // Tentar extrair JSON se estiver dentro de um bloco de código
      const match = resposta.text.match(/```(?:json)?(.+?)```/s);
      if (match && match[1]) {
        resultado = JSON.parse(match[1].trim());
      } else {
        resultado = JSON.parse(resposta.text);
      }
      
      // Armazenar no cache
      if (analiseCache) {
        analiseCache.set(cacheKey, resultado);
      }
      
      return resultado;
    } catch (parseError) {
      console.error('Erro ao analisar resposta JSON:', parseError);
      console.log('Resposta recebida:', resposta.text);
      return null;
    }
  } catch (erro) {
    console.error('Erro ao gerar resumo do documento:', erro);
    return null;
  }
}

// Função para gerar sugestões de aprimoramento
async function gerarSugestoes(conteudo: string, problemas: ProblemaDocumento[], model: GroqChat): Promise<string[]> {
  const problemasJson = JSON.stringify(problemas);
  
  const promptSugestoes = `
  Você é um assistente jurídico especializado em análise de documentos legais. Com base no documento a seguir e nos problemas já identificados, forneça 3-5 sugestões concretas para aprimorar o documento.

  Problemas já identificados:
  ${problemasJson}

  Documento a analisar:
  """
  ${conteudo}
  """

  Suas sugestões devem:
  1. Ser específicas e acionáveis
  2. Focar em melhorias estruturais, argumentativas ou de clareza
  3. Considerar aspectos como coerência, coesão e precisão jurídica
  4. Não repetir problemas já identificados acima

  Retorne APENAS um objeto JSON no seguinte formato, sem comentários adicionais:
  {
    "sugestoes": [
      "sugestão_detalhada_1",
      "sugestão_detalhada_2",
      ...
    ]
  }
  `;

  try {
    const cacheKey = `sugestoes-${Buffer.from(conteudo.substring(0, 300)).toString('base64')}`;
    const cachedResult = analiseCache?.get<string[]>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const resposta = await model.invoke(promptSugestoes);
    
    let resultado;
    try {
      // Tentar extrair JSON se estiver dentro de um bloco de código
      const match = resposta.text.match(/```(?:json)?(.+?)```/s);
      if (match && match[1]) {
        resultado = JSON.parse(match[1].trim());
      } else {
        resultado = JSON.parse(resposta.text);
      }
      
      const sugestoes = resultado.sugestoes || [];
      
      // Armazenar no cache
      if (analiseCache) {
        analiseCache.set(cacheKey, sugestoes);
      }
      
      return sugestoes;
    } catch (parseError) {
      console.error('Erro ao analisar resposta JSON:', parseError);
      console.log('Resposta recebida:', resposta.text);
      return [];
    }
  } catch (erro) {
    console.error('Erro ao gerar sugestões de aprimoramento:', erro);
    return [];
  }
}

// Função para dividir texto em segmentos de tamanho gerenciável
function dividirTextoEmSegmentos(texto: string, tamanhoMaximo: number = 8000): string[] {
  const segmentos: string[] = [];
  
  // Se o texto for menor que o tamanho máximo, retorna o texto original
  if (texto.length <= tamanhoMaximo) {
    return [texto];
  }
  
  // Divide o texto em parágrafos
  const paragrafos = texto.split(/\n\s*\n/);
  let segmentoAtual = '';
  
  for (const paragrafo of paragrafos) {
    // Se adicionar este parágrafo exceder o tamanho máximo, adiciona o segmento atual à lista e começa um novo
    if (segmentoAtual.length + paragrafo.length > tamanhoMaximo) {
      if (segmentoAtual.length > 0) {
        segmentos.push(segmentoAtual);
        segmentoAtual = '';
      }
      
      // Se um único parágrafo exceder o tamanho máximo, divide-o
      if (paragrafo.length > tamanhoMaximo) {
        let resto = paragrafo;
        while (resto.length > 0) {
          const parte = resto.substring(0, tamanhoMaximo);
          segmentos.push(parte);
          resto = resto.substring(tamanhoMaximo);
        }
      } else {
        segmentoAtual = paragrafo;
      }
    } else {
      // Adiciona um separador de parágrafo se não for o primeiro parágrafo no segmento
      if (segmentoAtual.length > 0) {
        segmentoAtual += '\n\n';
      }
      segmentoAtual += paragrafo;
    }
  }
  
  // Adiciona o último segmento se não estiver vazio
  if (segmentoAtual.length > 0) {
    segmentos.push(segmentoAtual);
  }
  
  return segmentos;
}

// Handler principal da API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnaliseContextualResponse | ErrorResponse>
) {
  // Registra a requisição
  const requestId = uuidv4();
  logApiRequest(requestId, 'documento-analise', req);

  // Verifica se o método é POST
  if (req.method !== 'POST') {
    const erro = { erro: 'Método não permitido' };
    logApiResponse(requestId, 400, erro);
    return res.status(400).json(erro);
  }

  try {
    const { conteudo, documentoNome, documento_id } = req.body;

    // Validação dos dados de entrada
    if (!conteudo) {
      const erro = { erro: 'Conteúdo do documento não fornecido' };
      logApiResponse(requestId, 400, erro);
      return res.status(400).json(erro);
    }

    // Inicializa o modelo
    const model = initializeGroqModel();
    if (!model) {
      const erro = { erro: 'Não foi possível inicializar o modelo de IA' };
      logApiResponse(requestId, 500, erro);
      return res.status(500).json(erro);
    }

    // Verifica se o conteúdo é muito grande e divide em segmentos se necessário
    const segmentos = dividirTextoEmSegmentos(conteudo);
    console.log(`Documento dividido em ${segmentos.length} segmentos para processamento`);

    // Para análise inicial, usamos o documento completo ou um resumo significativo
    const conteudoAnalise = segmentos.length > 1 
      ? segmentos[0] + '\n...\n' + segmentos[segmentos.length - 1]
      : conteudo;

    // Processa as análises em paralelo
    const [secoes, resumo] = await Promise.all([
      analisarSecoesDocumento(conteudoAnalise, model),
      gerarResumoDocumento(conteudoAnalise, model)
    ]);

    // Com base nas seções, detecta problemas
    const problemas = await detectarProblemasDocumento(conteudoAnalise, secoes, model);

    // Gera sugestões baseadas nos problemas detectados
    const sugestoes = await gerarSugestoes(conteudoAnalise, problemas, model);

    // Constrói o objeto de resposta
    const resposta: AnaliseContextualResponse = {
      analiseEstrutura: {
        secoes,
        problemas
      },
      resumoDocumento: resumo || undefined,
      sugestoesAprimoramento: sugestoes
    };

    // Registra o histórico de análise no banco de dados se o ID do documento for fornecido
    if (documento_id) {
      try {
        await prisma.documentoHistorico.create({
          data: {
            documento_id,
            tipo: 'analise',
            conteudo: JSON.stringify(resposta),
            criado_em: new Date()
          }
        });
        console.log(`Histórico de análise registrado para o documento ${documento_id}`);
      } catch (dbError) {
        console.error('Erro ao registrar histórico de análise:', dbError);
        // Continua o processamento mesmo com erro no banco de dados
      }
    }

    // Registra a resposta
    logApiResponse(requestId, 200, { status: 'sucesso', tamanho: JSON.stringify(resposta).length });
    return res.status(200).json(resposta);
  } catch (erro: any) {
    // Registra e retorna o erro
    const errorDetails = {
      erro: 'Erro ao processar análise do documento',
      detalhes: erro.message || String(erro)
    };
    logApiError(requestId, 'documento-analise', erro);
    return res.status(500).json(errorDetails);
  }
} 