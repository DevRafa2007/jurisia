import { Groq } from "groq-sdk";
import { logDebug, logError, logInfo } from './logger';
import { 
  verificarAtualizacoesLegais, 
  EventoLegal, 
  invalidarCacheAtualizacoes,
  OpcoesConsultaAtualizacao 
} from './atualizacoes-legais';

// Tipagem para process.env usando módulos ES2015
type ProcessEnv = {
  GROQ_API_KEY?: string;
  LEGAL_UPDATE_API_KEY?: string;
  WEBHOOK_SECRET?: string;
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
  fontesAtualizadas?: string[];
  dataAtualizacao?: string;
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
 * Registra um webhook para receber atualizações legais em tempo real
 * @returns Identificador do webhook registrado
 */
export async function registrarWebhookAtualizacoes(): Promise<string> {
  try {
    logInfo('Registrando webhook para atualizações legais...');
    
    // Implementação simulada de registro de webhook
    // Em produção, seria uma chamada a uma API real
    const webhookId = `webhook_${new Date().getTime()}`;
    
    // Simulação de configuração de evento para receber atualizações
    // const response = await fetch('https://api.legislacao.gov.br/webhook/register', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.LEGAL_UPDATE_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     callbackUrl: 'https://seudominio.com.br/api/atualizacoes-legais',
    //     eventos: ['nova_lei', 'alteracao', 'jurisprudencia', 'revogacao']
    //   })
    // });
    
    logInfo(`Webhook registrado com ID: ${webhookId}`);
    return webhookId;
  } catch (error) {
    logError('Erro ao registrar webhook', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Falha ao configurar sistema de atualizações legais automáticas');
  }
}

/**
 * Processa evento legal recebido via webhook
 * @param evento Evento legal recebido
 * @returns Status do processamento
 */
export async function processarEventoLegal(evento: EventoLegal): Promise<boolean> {
  try {
    logInfo(`Processando evento legal: ${evento.tipo}`);
    
    // Invalidar cache de atualizações
    invalidarCacheAtualizacoes();
    
    // Aqui seria implementada a lógica para armazenar a nova informação
    // em um banco de dados ou sistema de armazenamento
    
    // Exemplo de processamento conforme tipo do evento
    switch (evento.tipo) {
      case 'nova_lei':
        logInfo(`Nova legislação detectada: ${evento.dados.identificador}`);
        break;
      case 'alteracao':
        logInfo(`Alteração em legislação: ${evento.dados.identificador}`);
        break;
      case 'jurisprudencia':
        logInfo(`Nova jurisprudência relevante: ${evento.dados.identificador}`);
        break;
      case 'revogacao':
        logInfo(`Revogação de legislação: ${evento.dados.identificador}`);
        break;
    }
    
    return true;
  } catch (error) {
    logError('Erro ao processar evento legal', error instanceof Error ? error : new Error(String(error)));
    return false;
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
    
    // Opções para consultar atualizações legais
    const opcoesAtualizacao: OpcoesConsultaAtualizacao = {
      limite: 5 // Limitar a 5 itens para não sobrecarregar o contexto
    };
    
    // Obter atualizações legais 
    const atualizacoes = await verificarAtualizacoesLegais(opcoesAtualizacao);
    logDebug(`Atualizações obtidas de ${atualizacoes.fontes.length} fontes`);
    
    // Construir prompt com informações atualizadas
    let promptAtualizado = SISTEMA_PROMPT;
    
    // Adicionar informações sobre atualizações legais recentes
    if (atualizacoes.legislacoes && atualizacoes.legislacoes.length > 0) {
      promptAtualizado += `\n\nDados jurídicos complementares atualizados até ${atualizacoes.ultimaVerificacao.toLocaleDateString('pt-BR')}:\n`;
      
      // Adicionar legislações ao prompt
      atualizacoes.legislacoes.forEach(leg => {
        promptAtualizado += `- ${leg.tipo} ${leg.numero} (${leg.data}): ${leg.ementa}\n`;
      });
    }
    
    // Limitar histórico para evitar exceder limites de tokens
    const historicoLimitado = historico.slice(-10);
    logDebug(`Histórico limitado a ${historicoLimitado.length} mensagens`);
    
    // Preparar mensagens para a API
    const mensagens: Mensagem[] = [
      { role: 'system', content: promptAtualizado },
      ...historicoLimitado,
      { role: 'user', content: consulta }
    ];
    
    logInfo('Enviando consulta para Groq API...');
    
    // Enviar para API com modelo atualizado e parâmetros otimizados
    const resposta = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Llama 3.3, modelo mais recente e robusto disponível na Groq
      messages: mensagens,
      temperature: 0.2,
      max_tokens: 4096,
      top_p: 0.9,
      // Parâmetros adicionais seriam adicionados aqui quando suportados pelo SDK
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
    
    // Retornar resposta formatada com informações sobre atualização
    return {
      conteudo,
      modeloUsado: resposta.model || 'llama-3.3-70b-versatile',
      tokens: {
        entrada: resposta.usage?.prompt_tokens || 0,
        saida: resposta.usage?.completion_tokens || 0,
        total: resposta.usage?.total_tokens || 0
      },
      fontesAtualizadas: atualizacoes.fontes,
      dataAtualizacao: atualizacoes.ultimaVerificacao.toISOString()
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