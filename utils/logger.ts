/**
 * Logger utilitário para toda a aplicação
 * Centraliza a lógica de logging com níveis e formatação
 */

// Tipos de níveis de log
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Configuração de cores para console
const CORES = {
  debug: '\x1b[36m', // Ciano
  info: '\x1b[32m',  // Verde
  warn: '\x1b[33m',  // Amarelo
  error: '\x1b[31m', // Vermelho
  reset: '\x1b[0m'   // Reset
};

// Função para obter timestamp formatado
function getTimestamp(): string {
  return new Date().toISOString();
}

// Configuração global para nível mínimo de log (pode ser ajustado via env)
const nivelMinimo: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

// Ordem de importância dos níveis para filtrar logs
const NIVEL_ORDEM = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Função genérica para logging
function log(nivel: LogLevel, mensagem: string, dados?: unknown): void {
  // Verificar se este nível deve ser exibido
  if (NIVEL_ORDEM[nivel] < NIVEL_ORDEM[nivelMinimo]) {
    return;
  }

  try {
    // Formatar mensagem
    const timestamp = getTimestamp();
    const prefixo = `[${timestamp}] [${nivel.toUpperCase()}]`;
    
    // Aplicar cores no ambiente do servidor (não no navegador)
    const prefixoColorido = typeof window === 'undefined' 
      ? `${CORES[nivel]}${prefixo}${CORES.reset}`
      : prefixo;
    
    // Log da mensagem
    console.log(`${prefixoColorido} ${mensagem}`);
    
    // Log de dados adicionais se fornecidos
    if (dados !== undefined) {
      try {
        // Tentar serializar objetos complexos
        const dadosString = typeof dados === 'object' 
          ? JSON.stringify(dados, null, 2)
          : String(dados);
        
        // Se for um objeto grande, exibir em formato mais compacto
        if (dadosString.length > 500) {
          console.log(`${prefixoColorido} [DADOS RESUMIDOS] ${dadosString.substring(0, 500)}...`);
        } else {
          console.log(`${prefixoColorido} [DADOS] ${dadosString}`);
        }
      } catch (err) {
        console.log(`${prefixoColorido} [DADOS] Não foi possível serializar os dados`, dados);
      }
    }
    
    // Se for erro, registrar no serviço de monitoramento (implementação futura)
    if (nivel === 'error' && typeof window === 'undefined') {
      // TODO: implementar integração com serviço de monitoramento de erros
      // reportErrorToMonitoringService(mensagem, dados);
    }
  } catch (err) {
    // Fallback para garantir que erros no logger não afetem a aplicação
    console.error('Erro no sistema de logging:', err);
    console.error('Mensagem original:', mensagem);
  }
}

// Funções específicas para cada nível de log
export function logDebug(mensagem: string, dados?: unknown): void {
  log('debug', mensagem, dados);
}

export function logInfo(mensagem: string, dados?: unknown): void {
  log('info', mensagem, dados);
}

export function logWarning(mensagem: string, dados?: unknown): void {
  log('warn', mensagem, dados);
}

export function logError(mensagem: string, dados?: unknown): void {
  log('error', mensagem, dados);
}

// Função para mudar o nível de log em tempo de execução (útil para debugging)
export function setLogLevel(nivel: LogLevel): void {
  (globalThis as any).__LOG_LEVEL = nivel;
}

// Exportar a função principal para casos de uso avançados
export default log; 