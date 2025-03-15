import winston from 'winston';

// Configuração do logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    // Logs de erro vão para o console
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
  ],
});

// Adiciona log de arquivo apenas em ambiente de produção local (não no Vercel)
// O Vercel tem sistema de arquivos somente leitura
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  try {
    logger.add(
      new winston.transports.File({ 
        filename: 'logs/errors.log', 
        level: 'error' 
      })
    );
    logger.add(
      new winston.transports.File({ 
        filename: 'logs/combined.log' 
      })
    );
  } catch (error) {
    // Ignora erro de escrita em arquivo
    console.error('Não foi possível configurar logs em arquivo:', error);
  }
}

// Funções de utilidade
export const logDebug = (message: string) => {
  logger.debug(message);
};

export const logInfo = (message: string) => {
  logger.info(message);
};

export const logError = (message: string, error?: Error) => {
  if (error) {
    logger.error(`${message}: ${error.message}`);
    if (error.stack) {
      logger.error(`Stack: ${error.stack}`);
    }
  } else {
    logger.error(message);
  }
};

export const logWarning = (message: string) => {
  logger.warn(message);
};

export default logger; 