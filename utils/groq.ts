import { Groq } from "groq-sdk";

// Declaração de tipo para resolver o erro "Cannot find name 'process'"
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GROQ_API_KEY?: string;
    }
  }
}

// Configurações
const GROQ_TIMEOUT_MS = 20000; // 20 segundos
const MAX_RETRIES = 2; // Número máximo de retentativas
const RETRY_DELAY_MS = 1000; // Tempo de espera entre retentativas (1 segundo inicial)

// Inicializa o cliente Groq com configuração de timeout
const getGroqClient = () => {
  // Usar uma abordagem mais segura para acessar variáveis de ambiente
  const apiKey = typeof window === 'undefined' 
    ? process.env.GROQ_API_KEY 
    : '';
  
  if (!apiKey) {
    throw new Error("A chave de API do Groq não está definida. Configure a variável de ambiente GROQ_API_KEY.");
  }
  
  return new Groq({ 
    apiKey,
    // Adicionamos um timeout de 20 segundos para a API do Groq
    timeout: GROQ_TIMEOUT_MS
  });
};

// Sistema para direcionar a IA a se comportar como especialista em leis brasileiras
const SISTEMA_PROMPT = `Você é JurisIA, um assistente jurídico especializado em leis brasileiras.
Você foi treinado com as leis, códigos, jurisprudências e doutrinas brasileiras atualizadas.
Sempre cite as fontes legais específicas ao responder perguntas jurídicas.
Organize suas respostas de maneira estruturada, começando com uma resposta direta e concisa,
seguida dos detalhes legais, jurisprudência relevante e, quando apropriado, diferentes perspectivas doutrinárias.
Mantenha-se atualizado sobre as leis brasileiras mais recentes e suas interpretações.
Responda sempre em português do Brasil, usando terminologia jurídica adequada.
Se não souber a resposta ou não tiver certeza, indique claramente, em vez de fornecer informações potencialmente incorretas.`;

// Interface para consultas jurídicas
export interface ConsultaJuridica {
  consulta: string;
  historico?: Array<{ role: "user" | "assistant"; content: string }>;
}

// Função para delay entre tentativas (com backoff exponencial)
const delay = (retry: number) => {
  const ms = RETRY_DELAY_MS * Math.pow(2, retry);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Função para obter resposta da IA com tratamento de erros e retries
export async function obterRespostaJuridica({ consulta, historico = [] }: ConsultaJuridica) {
  // Contador de tentativas
  let tentativas = 0;
  
  while (true) {
    try {
      console.log(`[GROQ] Enviando consulta para API do Groq (tentativa ${tentativas + 1}/${MAX_RETRIES + 1})`);
      
      const startTime = Date.now();
      const client = getGroqClient();
      
      // Cria o contexto da conversa
      const mensagens = [
        { role: "system", content: SISTEMA_PROMPT },
        ...historico,
        { role: "user", content: consulta }
      ];
      
      // Envia a consulta para o modelo Llama-3 através do Groq
      const resposta = await client.chat.completions.create({
        messages: mensagens,
        model: "llama3-70b-8192",
        temperature: 0.2,
        max_tokens: 4096,
        top_p: 0.9,
      });
      
      const tempoTotal = Date.now() - startTime;
      console.log(`[GROQ] Resposta recebida com sucesso em ${tempoTotal}ms`);
      
      return {
        conteudo: resposta.choices[0]?.message?.content || "Não foi possível processar sua consulta.",
        modeloUsado: resposta.model,
        tokens: {
          entrada: resposta.usage?.prompt_tokens || 0,
          saida: resposta.usage?.completion_tokens || 0,
          total: resposta.usage?.total_tokens || 0
        }
      };
    } catch (erro: any) {
      tentativas++;
      
      // Log detalhado do erro
      const mensagemErro = erro.message || 'Erro desconhecido';
      const statusCode = erro.status || 'N/A';
      console.error(`[GROQ] Erro (status: ${statusCode}) ao consultar a API do Groq (tentativa ${tentativas}/${MAX_RETRIES + 1}):`, mensagemErro);
      
      // Verifica se é um erro que merece retry
      const deveRetentar = (
        // Erros temporários da API (429, 500, 503, etc)
        (statusCode >= 429 && statusCode < 600) || 
        // Erros de timeout ou rede
        mensagemErro.includes('timeout') || 
        mensagemErro.includes('timed out') || 
        mensagemErro.includes('network') ||
        mensagemErro.includes('ETIMEDOUT') ||
        mensagemErro.includes('ECONNRESET')
      );
      
      // Se esgotou as tentativas ou não é um erro que merece retry, lançar o erro
      if (tentativas > MAX_RETRIES || !deveRetentar) {
        let mensagemFinal = "Falha ao processar sua consulta jurídica.";
        
        if (statusCode === 429) {
          mensagemFinal = "O serviço de IA está sobrecarregado no momento. Por favor, tente novamente em alguns minutos.";
        } else if (mensagemErro.includes('timeout') || mensagemErro.includes('timed out')) {
          mensagemFinal = "Tempo limite excedido ao processar sua consulta. Por favor, tente uma consulta mais simples.";
        } else if (statusCode >= 500 && statusCode < 600) {
          mensagemFinal = "O serviço de IA está enfrentando problemas técnicos. Por favor, tente novamente mais tarde.";
        }
        
        throw new Error(mensagemFinal);
      }
      
      // Aguardar antes de tentar novamente (com backoff exponencial)
      console.log(`[GROQ] Aguardando ${RETRY_DELAY_MS * Math.pow(2, tentativas-1)}ms antes de tentar novamente...`);
      await delay(tentativas-1);
      
      // Continua no loop para tentar novamente
    }
  }
} 