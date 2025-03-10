import { Groq } from "groq-sdk";

// Declaração de tipo para resolver o erro "Cannot find name 'process'"
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GROQ_API_KEY?: string;
    }
  }
}

// Inicializa o cliente Groq
const getGroqClient = () => {
  // Usar uma abordagem mais segura para acessar variáveis de ambiente
  const apiKey = typeof window === 'undefined' 
    ? process.env.GROQ_API_KEY 
    : '';
  
  if (!apiKey) {
    throw new Error("A chave de API do Groq não está definida. Configure a variável de ambiente GROQ_API_KEY.");
  }
  
  return new Groq({ apiKey });
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

// Função para obter resposta da IA
export async function obterRespostaJuridica({ consulta, historico = [] }: ConsultaJuridica) {
  try {
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
    
    return {
      conteudo: resposta.choices[0]?.message?.content || "Não foi possível processar sua consulta.",
      modeloUsado: resposta.model,
      tokens: {
        entrada: resposta.usage?.prompt_tokens || 0,
        saida: resposta.usage?.completion_tokens || 0,
        total: resposta.usage?.total_tokens || 0
      }
    };
  } catch (erro) {
    console.error("Erro ao consultar a API do Groq:", erro);
    throw new Error("Falha ao processar sua consulta jurídica. Por favor, tente novamente mais tarde.");
  }
} 