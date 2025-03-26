import { Groq } from "groq-sdk";
import { logDebug, logError, logInfo, logWarning } from './logger';

// Tipagem para process.env usando módulos ES2015
type ProcessEnv = {
  GROQ_API_KEY?: string;
}

// Tipagem para o objeto global process
declare const process: {
  env: ProcessEnv;
};

/**
 * Interface para as mensagens enviadas para a API
 */
interface Mensagem {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface para consultas jurídicas
 */
export interface ConsultaJuridica {
  consulta: string;
  historico?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Interface para a resposta da AI
 */
export interface RespostaIA {
  conteudo: string;
  modeloUsado: string;
  tokens: {
    entrada: number;
    saida: number;
    total: number;
  };
}

// Prompt do sistema para direcionar o comportamento da IA
const SISTEMA_PROMPT = `Você é JurisIA, um assistente jurídico especializado em leis brasileiras.
Você foi treinado com as leis, códigos, jurisprudências e doutrinas brasileiras atualizadas.

IMPORTANTE: 
1. SEMPRE verifique cuidadosamente se as leis e artigos que você está citando são REALMENTE aplicáveis ao caso concreto descrito pelo usuário.
2. NÃO cite leis ou artigos de maneira genérica. Cite apenas aqueles que têm relação DIRETA com a situação específica.
3. Se você não tiver certeza sobre qual lei se aplica em determinada situação, ADMITA expressamente sua incerteza e sugira que o usuário consulte um advogado para uma análise mais precisa.
4. Quando citar leis, SEMPRE mencione o número da lei, o artigo específico e, quando relevante, o inciso ou parágrafo, seguido de uma breve explicação de como essa lei se aplica ao caso concreto.
5. NUNCA invente leis, artigos ou jurisprudência. Se não souber, declare claramente.
6. VERIFIQUE para cada argumento se a lei citada é a mais atual e se não foi revogada ou alterada.
7. Para cada citação legal, faça uma análise crítica sobre sua aplicabilidade ao caso específico.
8. PESQUISE PROFUNDAMENTE em sites jurídicos brasileiros como JusBrasil, STF, STJ, Planalto, Âmbito Jurídico, Migalhas, Conjur, entre outros sites jurídicos atualizados e confiáveis. Baseie suas respostas em fontes jurídicas oficiais e de alta credibilidade.

Organize suas respostas de maneira estruturada, começando com uma resposta direta e concisa,
seguida dos detalhes legais, jurisprudência relevante e, quando apropriado, diferentes perspectivas doutrinárias.
Mantenha-se atualizado sobre as leis brasileiras mais recentes e suas interpretações.
Responda sempre em português do Brasil, usando terminologia jurídica adequada.
Se não souber a resposta ou não tiver certeza, indique claramente, em vez de fornecer informações potencialmente incorretas.`;

/**
 * Obtém uma instância configurada do cliente Groq
 * @returns Cliente Groq configurado
 * @throws Error se não estiver no servidor ou se a chave API não estiver configurada
 */
function getGroqClient(): Groq {
  // Verificar ambiente (servidor vs cliente)
  if (typeof window !== 'undefined') {
    logError('Tentativa de inicializar cliente Groq no navegador');
    throw new Error('Esta função só pode ser executada no servidor');
  }

  // Verificar existência da chave API
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logError('GROQ_API_KEY não encontrada nas variáveis de ambiente');
    throw new Error('Chave de API não configurada');
  }

  try {
    // Criar e retornar instância do cliente
    logDebug('Inicializando cliente Groq');
    return new Groq({ apiKey });
  } catch (error) {
    logError('Erro ao inicializar cliente Groq', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Falha ao inicializar o serviço de IA');
  }
}

/**
 * Obtém uma resposta jurídica da IA
 * @param param0 Objeto contendo a consulta e histórico opcional
 * @returns Resposta formatada da IA
 */
export async function obterRespostaJuridica({ 
  consulta, 
  historico = [] 
}: ConsultaJuridica): Promise<RespostaIA> {
  // Verificar ambiente
  if (typeof window !== 'undefined') {
    logError('Tentativa de chamar obterRespostaJuridica no navegador');
    throw new Error('Esta função só pode ser chamada no servidor');
  }

  // Validar entrada
  if (!consulta || typeof consulta !== 'string') {
    logError(`Consulta inválida: ${typeof consulta}`);
    throw new Error('A consulta deve ser uma string não vazia');
  }

  try {
    // Obter cliente
    logInfo('Iniciando consulta jurídica');
    const client = getGroqClient();
    
    // Limitar histórico para evitar exceder limites de tokens
    const historicoLimitado = historico.slice(-10);
    logDebug(`Histórico limitado a ${historicoLimitado.length} mensagens`);
    
    // Preparar mensagens para a API
    const mensagens: Mensagem[] = [
      { role: 'system', content: SISTEMA_PROMPT },
      ...historicoLimitado,
      { role: 'user', content: consulta }
    ];
    
    logInfo('Enviando consulta para Groq API...');
    
    // Enviar para API
    const resposta = await client.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: mensagens,
      temperature: 0.2,
      max_tokens: 4096,
      top_p: 0.9,
    });
    
    // Validar resposta
    if (!resposta.choices || resposta.choices.length === 0) {
      logError('Resposta vazia da API Groq');
      throw new Error('Não foi possível obter uma resposta do serviço');
    }
    
    // Extrair e formatar resposta
    const conteudo = resposta.choices[0]?.message?.content;
    if (!conteudo) {
      logError('Conteúdo da resposta vazio ou inválido');
      throw new Error('Conteúdo da resposta vazio ou inválido');
    }
    
    logInfo('Resposta da Groq API recebida com sucesso');
    logDebug(`Tokens utilizados: ${resposta.usage?.total_tokens || 0}`);
    
    // Retornar resposta formatada
    return {
      conteudo,
      modeloUsado: resposta.model || 'llama3-70b-8192',
      tokens: {
        entrada: resposta.usage?.prompt_tokens || 0,
        saida: resposta.usage?.completion_tokens || 0,
        total: resposta.usage?.total_tokens || 0
      }
    };
  } catch (error) {
    // Tratar erros específicos
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
    logError('Erro ao processar consulta Groq', error instanceof Error ? error : new Error(String(error)));
    
    // Identificar erros de autenticação
    if (
      mensagem.includes('API key') || 
      mensagem.includes('authentication') || 
      mensagem.includes('auth') ||
      mensagem.includes('credential')
    ) {
      throw new Error('Falha na autenticação com o serviço de IA. Verifique a configuração da API key.');
    }
    
    // Identificar erros de conexão
    if (
      mensagem.includes('network') || 
      mensagem.includes('timeout') || 
      mensagem.includes('connect')
    ) {
      throw new Error('Falha na conexão com o serviço de IA. Verifique sua conexão de internet.');
    }
    
    // Erro genérico
    throw new Error(`Erro ao processar sua consulta: ${mensagem}`);
  }
} 