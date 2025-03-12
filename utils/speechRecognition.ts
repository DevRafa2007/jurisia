// Interface para o navegador com suporte a reconhecimento de voz
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

// Classe para gerenciar reconhecimento de voz
export class SpeechRecognitionManager {
  private recognition: any;
  private isAvailable: boolean;
  private browserName: string;
  private lang: string;
  private continuous: boolean;
  private interimResults: boolean;
  private maxAlternatives: number;
  private debugMode: boolean;

  constructor({
    lang = 'pt-BR',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1
  }: SpeechRecognitionOptions = {}, debugMode = false) {
    this.isAvailable = false;
    this.browserName = this.detectBrowser();
    this.lang = lang;
    this.continuous = continuous;
    this.interimResults = interimResults;
    this.maxAlternatives = maxAlternatives;
    this.debugMode = debugMode;

    // Inicializar a API de reconhecimento
    this.init();
  }

  // Verificar disponibilidade da API
  public isSupported(): boolean {
    return this.isAvailable;
  }

  // Detectar qual navegador está sendo usado
  private detectBrowser(): string {
    if (typeof window === 'undefined') return 'server';
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (userAgent.indexOf('chrome') > -1) return 'chrome';
    if (userAgent.indexOf('firefox') > -1) return 'firefox';
    if (userAgent.indexOf('safari') > -1) return 'safari';
    if (userAgent.indexOf('edge') > -1) return 'edge';
    if (userAgent.indexOf('msie') > -1 || userAgent.indexOf('trident') > -1) return 'ie';
    
    return 'unknown';
  }

  // Inicializar reconhecimento
  private init(): void {
    if (typeof window === 'undefined') {
      this.isAvailable = false;
      return;
    }

    // Detectar API disponível
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      this.log('API de reconhecimento de voz não está disponível neste navegador');
      this.isAvailable = false;
      return;
    }

    try {
      // Criar uma instância da API
      this.recognition = new SpeechRecognitionAPI();
      
      // Configuração básica
      this.recognition.lang = this.lang;
      this.recognition.continuous = this.continuous;
      this.recognition.interimResults = this.interimResults;
      this.recognition.maxAlternatives = this.maxAlternatives;
      
      this.isAvailable = true;
      this.log(`API de reconhecimento iniciada com sucesso no navegador ${this.browserName}`);
    } catch (error) {
      this.log('Erro ao inicializar API de reconhecimento de voz:', error);
      this.isAvailable = false;
    }
  }

  // Configurar handlers de eventos
  public setHandlers({
    onStart,
    onResult,
    onError,
    onEnd
  }: {
    onStart?: () => void;
    onResult?: (event: any) => void;
    onError?: (event: any) => void;
    onEnd?: () => void;
  }): void {
    if (!this.isAvailable || !this.recognition) return;

    if (onStart) {
      this.recognition.onstart = () => {
        this.log('Evento: reconhecimento iniciado');
        onStart();
      };
    }

    if (onResult) {
      this.recognition.onresult = (event: any) => {
        this.log('Evento: resultado recebido', event);
        onResult(event);
      };
    }

    if (onError) {
      this.recognition.onerror = (event: any) => {
        this.log('Evento: erro no reconhecimento', event);
        onError(event);
      };
    }

    if (onEnd) {
      this.recognition.onend = () => {
        this.log('Evento: reconhecimento finalizado');
        onEnd();
      };
    }
  }

  // Iniciar reconhecimento
  public start(): boolean {
    if (!this.isAvailable || !this.recognition) {
      this.log('Não foi possível iniciar - API não disponível');
      return false;
    }

    try {
      this.recognition.start();
      this.log('Reconhecimento iniciado');
      return true;
    } catch (error) {
      this.log('Erro ao iniciar reconhecimento:', error);
      return false;
    }
  }

  // Parar reconhecimento
  public stop(): boolean {
    if (!this.isAvailable || !this.recognition) {
      return false;
    }

    try {
      this.recognition.stop();
      this.log('Reconhecimento parado');
      return true;
    } catch (error) {
      this.log('Erro ao parar reconhecimento:', error);
      return false;
    }
  }

  // Reiniciar o reconhecimento
  public restart(): boolean {
    this.stop();
    // Delay para garantir que o reconhecimento foi totalmente parado
    return setTimeout(() => this.start(), 200) !== undefined;
  }

  // Função de log
  private log(...args: any[]): void {
    if (this.debugMode) {
      console.log('[SpeechRecognition]', ...args);
    }
  }

  // Obter mensagem de erro para o usuário baseada no código de erro
  public getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'no-speech':
        return 'Nenhuma fala foi detectada. Verifique se seu microfone está funcionando.';
      case 'audio-capture':
        return 'Falha ao capturar áudio. Verifique se seu microfone está conectado e funcionando.';
      case 'not-allowed':
        return 'Permissão para usar o microfone foi negada. Clique no ícone de cadeado na barra de endereço e permita o acesso.';
      case 'network':
        return 'Erro de rede. Verifique sua conexão com a internet.';
      case 'aborted':
        return 'Reconhecimento de voz foi interrompido.';
      case 'language-not-supported':
        return 'O idioma selecionado não é suportado.';
      case 'service-not-allowed':
        return 'O serviço de reconhecimento de voz não está disponível neste navegador.';
      case 'bad-grammar':
        return 'Erro na gramática de reconhecimento.';
      default:
        return `Erro no reconhecimento de voz: ${errorCode}. Tente novamente ou use outro navegador.`;
    }
  }

  // Verificar compatibilidade do navegador
  public getCompatibilityMessage(): string {
    if (!this.isAvailable) {
      switch (this.browserName) {
        case 'firefox':
          return 'O Firefox tem suporte limitado para reconhecimento de voz. Para melhor experiência, use Chrome, Edge ou Safari.';
        case 'ie':
          return 'O Internet Explorer não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.';
        case 'unknown':
          return 'Seu navegador não parece suportar reconhecimento de voz. Use Chrome, Edge ou Safari.';
        default:
          return 'Reconhecimento de voz não está disponível neste navegador. Use Chrome, Edge ou Safari.';
      }
    }
    
    // Navegadores com bom suporte
    if (['chrome', 'edge'].includes(this.browserName)) {
      return ''; // Sem mensagem, é totalmente compatível
    }
    
    // Safari tem algumas limitações
    if (this.browserName === 'safari') {
      return 'O Safari tem algumas limitações com reconhecimento de voz. Se encontrar problemas, tente o Chrome ou Edge.';
    }
    
    return ''; // Padrão: sem mensagem
  }
}

// Singleton para uso em toda a aplicação
let instance: SpeechRecognitionManager | null = null;

// Função para obter instância do gerenciador
export function getSpeechRecognition(options?: SpeechRecognitionOptions): SpeechRecognitionManager {
  if (!instance) {
    instance = new SpeechRecognitionManager(options, true); // true para modo debug
  }
  return instance;
}

// Verificar permissão de microfone
export async function checkMicrophonePermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.mediaDevices) {
    return false;
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Parar o stream após verificar permissão
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Erro ao verificar permissão de microfone:', error);
    return false;
  }
}

// Função para extrair o texto de um evento de reconhecimento
export function extractTranscriptFromEvent(event: any): { transcript: string, isFinal: boolean } {
  if (!event || !event.results || event.results.length === 0) {
    return { transcript: '', isFinal: false };
  }
  
  // Obter o resultado mais recente
  const result = event.results[event.results.length - 1];
  
  // Verificar se é um resultado final
  const isFinal = !!result.isFinal;
  
  // Extrair o texto
  const transcript = result[0].transcript || '';
  
  return { transcript, isFinal };
} 