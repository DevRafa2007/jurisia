import { logDebug, logError, logInfo } from './logger';

/**
 * Interface para atualizações legais
 */
export interface AtualizacaoLegal {
  ultimaVerificacao: Date;
  fontes: string[];
  legislacoes?: Array<{
    tipo: string;
    numero: string;
    data: string;
    ementa: string;
    url: string;
  }>;
}

/**
 * Interface para eventos legais (webhooks)
 */
export interface EventoLegal {
  tipo: 'nova_lei' | 'alteracao' | 'jurisprudencia' | 'revogacao';
  dados: {
    identificador: string;
    data: string;
    descricao: string;
    url?: string;
    conteudo?: string;
  };
}

/**
 * Interface para opções de consulta de atualizações
 */
export interface OpcoesConsultaAtualizacao {
  tipo?: string;
  desde?: Date;
  limite?: number;
}

// Cache para armazenar atualizações legais temporariamente
let cacheAtualizacoes: AtualizacaoLegal | null = null;
const TEMPO_CACHE_ATUALIZACOES = 1000 * 60 * 60 * 6; // 6 horas

/**
 * Verifica atualizações legais em fontes oficiais
 * @param opcoes Opções para filtrar consulta
 * @returns Objeto com informações sobre atualizações legais
 */
export async function verificarAtualizacoesLegais(
  opcoes: OpcoesConsultaAtualizacao = {}
): Promise<AtualizacaoLegal> {
  // Verificar se já temos cache válido
  if (cacheAtualizacoes && 
      (new Date().getTime() - cacheAtualizacoes.ultimaVerificacao.getTime() < TEMPO_CACHE_ATUALIZACOES)) {
    logDebug('Usando cache de atualizações legais');
    
    // Mesmo com cache, aplicar filtros
    return filtrarAtualizacoes(cacheAtualizacoes, opcoes);
  }

  try {
    logInfo('Consultando atualizações legais...');
    
    // Implementação simulada - em produção, seria uma chamada a APIs reais
    // como a API do Diário Oficial da União ou serviços de informação legal
    
    // Simulação de consulta a fontes oficiais
    const atualizacao: AtualizacaoLegal = {
      ultimaVerificacao: new Date(),
      fontes: [
        'https://www.planalto.gov.br/legislacao',
        'https://www.stf.jus.br/portal/jurisprudencia',
        'https://www.in.gov.br/web/dou'
      ],
      legislacoes: [
        {
          tipo: 'Lei Ordinária',
          numero: '14.999/2025',
          data: '12/03/2025',
          ementa: 'Dispõe sobre novas diretrizes para inteligência artificial em serviços jurídicos',
          url: 'https://www.planalto.gov.br/legislacao/14999_2025.html'
        },
        {
          tipo: 'Resolução CNJ',
          numero: '555/2025',
          data: '05/01/2025',
          ementa: 'Estabelece critérios para uso de IA em processos judiciais',
          url: 'https://www.cnj.jus.br/resolucoes/555_2025'
        },
        {
          tipo: 'Lei Complementar',
          numero: '198/2025',
          data: '20/02/2025',
          ementa: 'Altera a Lei Complementar nº 123/2006 para incluir novas categorias de microempreendedores',
          url: 'https://www.planalto.gov.br/legislacao/lc198_2025.html'
        },
        {
          tipo: 'Decreto',
          numero: '12.456/2025',
          data: '15/01/2025',
          ementa: 'Regulamenta a Lei nº 14.789/2024, que dispõe sobre proteção de dados em sistemas judiciais',
          url: 'https://www.planalto.gov.br/legislacao/d12456_2025.html'
        },
        {
          tipo: 'Súmula Vinculante',
          numero: '65',
          data: '18/02/2025',
          ementa: 'Estabelece critérios para aplicação do princípio da insignificância em crimes contra a administração pública',
          url: 'https://www.stf.jus.br/jurisprudencia/sumulas/sv65_2025.html'
        }
      ]
    };
    
    // Armazenar no cache
    cacheAtualizacoes = atualizacao;
    logInfo('Atualizações legais obtidas com sucesso');
    
    // Aplicar filtros antes de retornar
    return filtrarAtualizacoes(atualizacao, opcoes);
  } catch (error) {
    logError('Erro ao verificar atualizações legais', error instanceof Error ? error : new Error(String(error)));
    
    // Em caso de falha, retornar dados básicos
    return {
      ultimaVerificacao: new Date(),
      fontes: ['Sistema indisponível - usando dados de treinamento base do modelo']
    };
  }
}

/**
 * Filtra atualizações legais com base em critérios
 * @param atualizacoes Objeto completo de atualizações
 * @param opcoes Opções de filtro
 * @returns Objeto filtrado de atualizações
 */
function filtrarAtualizacoes(
  atualizacoes: AtualizacaoLegal,
  opcoes: OpcoesConsultaAtualizacao
): AtualizacaoLegal {
  // Se não há opções de filtro ou não há legislações, retornar como está
  if (!opcoes || !Object.keys(opcoes).length || !atualizacoes.legislacoes) {
    return atualizacoes;
  }
  
  // Criar cópia para não modificar o cache
  const resultado: AtualizacaoLegal = {
    ...atualizacoes,
    legislacoes: [...(atualizacoes.legislacoes || [])]
  };
  
  // Filtrar por tipo de legislação
  if (opcoes.tipo && resultado.legislacoes) {
    resultado.legislacoes = resultado.legislacoes.filter(leg => 
      leg.tipo.toLowerCase().includes(opcoes.tipo!.toLowerCase())
    );
  }
  
  // Filtrar por data
  if (opcoes.desde && resultado.legislacoes) {
    resultado.legislacoes = resultado.legislacoes.filter(leg => {
      // Converter string de data para objeto Date
      const dataLeg = new Date(leg.data.split('/').reverse().join('-'));
      return dataLeg >= opcoes.desde!;
    });
  }
  
  // Limitar quantidade
  if (opcoes.limite && resultado.legislacoes) {
    resultado.legislacoes = resultado.legislacoes.slice(0, opcoes.limite);
  }
  
  return resultado;
}

/**
 * Invalida o cache de atualizações legais
 * Útil após receber notificações de novas leis
 */
export function invalidarCacheAtualizacoes(): void {
  logInfo('Invalidando cache de atualizações legais');
  cacheAtualizacoes = null;
}

/**
 * Obtém resumo formatado das atualizações legais recentes
 * @param opcoes Opções para filtrar atualizações
 * @returns String formatada com resumo das atualizações
 */
export async function obterResumoAtualizacoes(
  opcoes: OpcoesConsultaAtualizacao = { limite: 5 }
): Promise<string> {
  try {
    // Obter atualizações com filtros aplicados
    const atualizacoes = await verificarAtualizacoesLegais(opcoes);
    
    // Se não há legislações, retornar mensagem padrão
    if (!atualizacoes.legislacoes || atualizacoes.legislacoes.length === 0) {
      return 'Não há atualizações legais recentes para exibir.';
    }
    
    // Construir texto formatado
    let resumo = `Atualizações legais mais recentes (até ${atualizacoes.ultimaVerificacao.toLocaleDateString('pt-BR')}):\n\n`;
    
    // Adicionar cada legislação
    atualizacoes.legislacoes.forEach((leg, index) => {
      resumo += `${index + 1}. ${leg.tipo} ${leg.numero} (${leg.data})\n`;
      resumo += `   ${leg.ementa}\n`;
      if (leg.url) {
        resumo += `   Disponível em: ${leg.url}\n`;
      }
      resumo += '\n';
    });
    
    return resumo;
  } catch (error) {
    logError('Erro ao gerar resumo de atualizações', error instanceof Error ? error : new Error(String(error)));
    return 'Não foi possível obter informações atualizadas sobre legislação recente.';
  }
} 