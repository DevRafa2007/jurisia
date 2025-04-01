import { NextApiRequest, NextApiResponse } from 'next';
import { obterRespostaJuridica } from '../../utils/groq';
import { logError, logInfo, logWarning } from '../../utils/logger';
import NodeCache from 'node-cache';

// Tipagem para resposta de erro
type ErrorResponse = {
  erro: string;
  detalhes?: string;
};

// Tipagem para resposta de jurisprudência
interface RespostaJurisprudencia {
  resposta: string;
  modeloUsado: string;
  tokens: {
    entrada: number;
    saida: number;
    total: number;
  };
  jurisprudencias: Array<{
    tribunal: string;
    numero: string;
    ementa: string;
    data: string;
    url?: string;
    relevancia?: number;
  }>;
  legislacaoRelacionada?: string[];
}

// Cache para reduzir chamadas repetitivas à API
// Configuração: TTL de 1 dia (86400 segundos), verificação a cada 3600 segundos (1 hora)
let jurisprudenciaCache: NodeCache | null = null;

try {
  jurisprudenciaCache = new NodeCache({ 
    stdTTL: 86400, 
    checkperiod: 3600,
    useClones: false 
  });
  logInfo('Cache de jurisprudência inicializado com sucesso');
} catch (error) {
  logError('Erro ao inicializar cache de jurisprudência:', error);
  // Não interromper a execução se o cache falhar
}

// Função auxiliar para gerar chave de cache
function gerarChaveCache(tema: string, termo?: string): string {
  try {
    const chave = termo 
      ? `jurisprudencia_${tema.toLowerCase()}_${termo.toLowerCase()}`
      : `jurisprudencia_${tema.toLowerCase()}`;
    
    return chave.replace(/[^a-z0-9_]/g, '_').slice(0, 64);
  } catch (error) {
    logWarning('Erro ao gerar chave de cache, usando fallback', error);
    return `jurisprudencia_${Date.now()}`;
  }
}

// Função segura para acessar o cache
function obterDoCache<T>(chave: string): T | null {
  if (!jurisprudenciaCache) return null;
  try {
    const resultado = jurisprudenciaCache.get<T>(chave);
    return resultado !== undefined ? resultado : null;
  } catch (error) {
    logWarning('Erro ao obter item do cache', error);
    return null;
  }
}

// Função segura para salvar no cache
function salvarNoCache(chave: string, valor: unknown): boolean {
  if (!jurisprudenciaCache) return false;
  try {
    return jurisprudenciaCache.set(chave, valor);
  } catch (error) {
    logWarning('Erro ao salvar item no cache', error);
    return false;
  }
}

// Função para gerar resposta simulada para casos de falha
function gerarRespostaJurisprudenciaSimulada(tema: string): RespostaJurisprudencia {
  logInfo('Gerando resposta simulada de jurisprudência para: ' + tema);
  
  // Exemplos de tribunais
  const tribunais = ['STF', 'STJ', 'TRF-1', 'TJSP', 'TST'];
  
  // Gerar jurisprudências simuladas
  const jurisprudencias = Array(3).fill(null).map((_, index) => ({
    tribunal: tribunais[index % tribunais.length],
    numero: `XXXXXX-${Math.floor(Math.random() * 90000) + 10000}`,
    ementa: `Esta é uma ementa simulada para o tema "${tema}". Gerada em modo de contingência quando a API principal não está disponível.`,
    data: `${Math.floor(Math.random() * 30) + 1}/${Math.floor(Math.random() * 12) + 1}/202${Math.floor(Math.random() * 4)}`,
    relevancia: 1
  }));
  
  return {
    resposta: `# Jurisprudências para ${tema} (MODO CONTINGÊNCIA)\n\nNOTA: Este resultado é simulado porque o serviço principal está temporariamente indisponível.\n\n${jurisprudencias.map(j => `## ${j.tribunal} - ${j.numero}\nData: ${j.data}\n\n${j.ementa}`).join('\n\n')}`,
    modeloUsado: 'contingência',
    tokens: { entrada: 0, saida: 0, total: 0 },
    jurisprudencias,
    legislacaoRelacionada: ['(Sugestões de legislação temporariamente indisponíveis)']
  };
}

// Função para buscar jurisprudências relevantes
async function buscarJurisprudencias(
  tema: string,
  termo?: string,
  limite: number = 5
): Promise<RespostaJurisprudencia> {
  // Verificar se o resultado está em cache
  const chaveCache = gerarChaveCache(tema, termo);
  const cacheHit = obterDoCache<RespostaJurisprudencia>(chaveCache);
  
  if (cacheHit) {
    logInfo(`Usando resposta em cache para jurisprudência: ${tema} ${termo || ''}`);
    return cacheHit;
  }
  
  // Preparar prompt para a API
  let prompt = `Localize ${limite} jurisprudências relevantes sobre o tema "${tema}"`;
  if (termo) {
    prompt += ` relacionadas especificamente ao termo "${termo}"`;
  }
  
  prompt += `
Por favor, responda com jurisprudências recentes e relevantes no seguinte formato:

JURISPRUDÊNCIA 1:
Tribunal: [nome do tribunal]
Número: [número do processo/acordão]
Data: [data do julgamento]
Ementa: [texto resumido da ementa]
URL: [link para o documento, se disponível]

JURISPRUDÊNCIA 2:
...

Além disso, indique qual legislação é aplicável a este tema, citando os artigos específicos.

LEGISLAÇÃO RELACIONADA:
- [citação da lei/artigo 1]
- [citação da lei/artigo 2]
...

Certifique-se de que cada jurisprudência citada seja real, atual e diretamente relacionada ao tema. Prefira decisões de tribunais superiores (STF, STJ) ou que tenham estabelecido precedentes importantes.`;

  try {
    // Fazer a chamada à API da IA
    logInfo(`Iniciando busca de jurisprudências para: ${tema}`);
    const resposta = await obterRespostaJuridica({ consulta: prompt, historico: [] });
    logInfo('Resposta da API recebida com sucesso');
    
    // Extrair jurisprudências com regex (básico)
    const jurisprudenciasBlocos = resposta.conteudo.split(/JURISPRUDÊNCIA \d+:/g).filter(b => b.trim());
    
    const jurisprudencias = jurisprudenciasBlocos.map(bloco => {
      // Extrair dados com regex simples
      const tribunal = bloco.match(/Tribunal:\s*([^\n]+)/i)?.[1]?.trim() || 'Não especificado';
      const numero = bloco.match(/Número:\s*([^\n]+)/i)?.[1]?.trim() || 'Não especificado';
      const data = bloco.match(/Data:\s*([^\n]+)/i)?.[1]?.trim() || 'Não especificado';
      const ementa = bloco.match(/Ementa:\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:URL|$))/i)?.[1]?.trim() || 'Não disponível';
      const url = bloco.match(/URL:\s*([^\n]+)/i)?.[1]?.trim();
      
      // Calcular relevância com base na presença do termo na ementa
      let relevancia = 1;
      if (termo && ementa.toLowerCase().includes(termo.toLowerCase())) {
        relevancia = 2;
        // Verificar se o termo aparece mais de uma vez ou em posição de destaque
        const ocorrencias = (ementa.toLowerCase().match(new RegExp(termo.toLowerCase(), 'g')) || []).length;
        if (ocorrencias > 1 || ementa.toLowerCase().startsWith(termo.toLowerCase())) {
          relevancia = 3;
        }
      }
      
      return {
        tribunal,
        numero,
        ementa,
        data,
        url,
        relevancia
      };
    });
    
    // Extrair legislação relacionada
    const legislacaoBloco = resposta.conteudo.match(/LEGISLAÇÃO RELACIONADA[:\s]*\n([\s\S]*?)(?=\n\s*$|$)/i);
    const legislacaoTexto = legislacaoBloco ? legislacaoBloco[1] : '';
    const legislacao = legislacaoTexto.split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.startsWith('-') || linha.match(/^\d+\./))
      .map(linha => linha.replace(/^[- ]\s*/, '').trim())
      .filter(Boolean);
    
    // Criar objeto de resposta processada
    const respostaProcessada: RespostaJurisprudencia = {
      resposta: resposta.conteudo,
      modeloUsado: resposta.modeloUsado,
      tokens: resposta.tokens,
      jurisprudencias: jurisprudencias,
      legislacaoRelacionada: legislacao.length > 0 ? legislacao : undefined
    };
    
    // Salvar no cache
    salvarNoCache(chaveCache, respostaProcessada);
    
    return respostaProcessada;
  } catch (error) {
    logError('Erro ao buscar jurisprudências:', error);
    
    // Retornar resposta simulada em caso de falha
    return gerarRespostaJurisprudenciaSimulada(tema);
  }
}

// Função para extrair temas jurídicos de um texto
async function extrairTemasJuridicos(texto: string): Promise<string[]> {
  if (!texto || texto.trim().length < 50) {
    return ['geral'];
  }
  
  // Verificar se o resultado está em cache
  const chaveCache = `temas_${Buffer.from(texto.substring(0, 200)).toString('base64').slice(0, 32)}`;
  const cacheHit = obterDoCache<string[]>(chaveCache);
  
  if (cacheHit) {
    logInfo('Usando temas jurídicos em cache');
    return cacheHit;
  }
  
  const prompt = `Analise o seguinte texto jurídico e extraia os 3 principais temas jurídicos abordados:

${texto.substring(0, 1000)}${texto.length > 1000 ? '...' : ''}

Responda apenas com os temas jurídicos, um por linha, sem numeração ou marcadores. 
Exemplo:
Responsabilidade civil
Dano moral
Relação de consumo`;

  try {
    // Fazer a chamada à API da IA
    logInfo('Iniciando extração de temas jurídicos');
    const resposta = await obterRespostaJuridica({ consulta: prompt, historico: [] });
    logInfo('Resposta da API recebida para extração de temas');
    
    // Extrair temas (cada linha como um tema)
    const temas = resposta.conteudo
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => 
        linha && 
        !linha.match(/^[0-9-•*]+\s/) && // remover linhas que começam com números, hífen, etc.
        linha.length > 3 && 
        linha.length < 50
      );
    
    // Garantir que temos pelo menos um tema
    const temasFinais = temas.length > 0 ? temas : ['geral'];
    
    // Salvar no cache
    salvarNoCache(chaveCache, temasFinais);
    
    return temasFinais;
  } catch (error) {
    logError('Erro ao extrair temas jurídicos:', error);
    return ['geral']; // Fallback para tema genérico
  }
}

// Handler principal
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RespostaJurisprudencia | { temas: string[] } | ErrorResponse>
) {
  // Log de entrada da requisição
  logInfo(`Requisição recebida: ${req.method} ${req.url}`);
  
  // Verificar método HTTP
  if (req.method !== 'POST') {
    logWarning(`Método não permitido: ${req.method}`);
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { operacao, tema, termo, texto, limite } = req.body;

    // Log dos parâmetros recebidos
    logDebug('Parâmetros da requisição:', { 
      operacao, 
      tema, 
      termo, 
      textoLength: texto?.length, 
      limite 
    });

    // Validar operação
    if (!operacao) {
      return res.status(400).json({ erro: 'Operação não especificada. Use "buscar" ou "extrair_temas"' });
    }

    switch (operacao) {
      case 'buscar': {
        // Validar campos obrigatórios
        if (!tema) {
          return res.status(400).json({ erro: 'Tema jurídico é obrigatório' });
        }

        // Buscar jurisprudências
        const resposta = await buscarJurisprudencias(tema, termo, limite || 5);
        logInfo(`Operação "buscar" concluída para tema: ${tema}`);
        return res.status(200).json(resposta);
      }

      case 'extrair_temas': {
        // Validar campos obrigatórios
        if (!texto) {
          return res.status(400).json({ erro: 'Texto para análise é obrigatório' });
        }

        // Extrair temas jurídicos
        const temas = await extrairTemasJuridicos(texto);
        logInfo(`Operação "extrair_temas" concluída, ${temas.length} temas encontrados`);
        return res.status(200).json({ temas });
      }

      default:
        return res.status(400).json({ erro: `Operação desconhecida: ${operacao}` });
    }
  } catch (error) {
    // Tratamento de erro global
    const err = error as Error;
    const mensagemErro = err.message || 'Erro desconhecido';
    
    logError('Erro ao processar solicitação de jurisprudência:', error);
    
    return res.status(500).json({ 
      erro: mensagemErro,
      detalhes: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.'
    });
  }
} 