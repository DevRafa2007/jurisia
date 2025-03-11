import React, { useState, useEffect } from 'react';

// Definição do tipo SpeechRecognition para TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

type ChatInputProps = {
  onEnviar: (mensagem: string) => void;
  isCarregando: boolean;
};

const ChatInput: React.FC<ChatInputProps> = ({ onEnviar, isCarregando }) => {
  const [mensagem, setMensagem] = useState('');
  const [isGravando, setIsGravando] = useState(false);
  const [isTranscrevendo, setIsTranscrevendo] = useState(false);
  const [temPermissao, setTemPermissao] = useState<boolean | null>(null);
  const [erroAudio, setErroAudio] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [comandoDetectado, setComandoDetectado] = useState(false);

  useEffect(() => {
    // Verificar se o navegador suporta a API de reconhecimento de voz
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setTemPermissao(false);
      setErroAudio("Seu navegador não suporta reconhecimento de voz");
      return;
    }
    
    // Verificar permissão de microfone
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        setTemPermissao(true);
        setErroAudio(null);
      })
      .catch((err) => {
        console.log("Erro ao acessar o microfone:", err);
        setTemPermissao(false);
        setErroAudio("Permissão para acessar o microfone negada");
      });
      
    // Inicializar vozes do sistema (para o TTS funcionar melhor)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }

    // Limpar o reconhecimento ao desmontar o componente
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          // Ignorar erros ao parar o reconhecimento
        }
      }
    };
  }, [recognition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mensagem.trim() && !isCarregando) {
      onEnviar(mensagem);
      setMensagem('');
    }
  };

  // Verificar comandos de voz especiais
  const verificarComandoEnviar = (texto: string): boolean => {
    // Comandos para envio automático
    const comandosEnviar = [
      'enviar',
      'enviar mensagem',
      'envie',
      'envie isso',
      'mande',
      'mande isso', 
      'mandar',
      'pode enviar',
      'enviar agora',
      'pronto pode enviar'
    ];
    
    // Verificar se o texto termina com um dos comandos (ignorando case e espaços extras)
    const textoLimpo = texto.trim().toLowerCase();
    
    for (const comando of comandosEnviar) {
      if (textoLimpo.endsWith(comando)) {
        // Remover o comando do final do texto
        const mensagemSemComando = textoLimpo.substring(0, textoLimpo.length - comando.length).trim();
        if (mensagemSemComando.length > 0) {
          // Atualizar mensagem sem o comando
          setMensagem(mensagemSemComando);
          return true;
        }
      }
    }
    
    return false;
  };

  const iniciarGravacao = () => {
    setErroAudio(null);
    setComandoDetectado(false);
    
    try {
      // Inicializar o reconhecimento de voz
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      // Configurar
      recognitionInstance.lang = 'pt-BR';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.maxAlternatives = 1;
      
      // Eventos
      recognitionInstance.onstart = () => {
        setIsGravando(true);
        setIsTranscrevendo(false);
        console.log('Reconhecimento de voz iniciado');
      };
      
      // Capturar resultados intermediários para feedback imediato
      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
          
        console.log('Transcrição:', transcript);
        setMensagem(transcript);
        
        // Verificar se há um comando para enviar a mensagem automaticamente
        if (verificarComandoEnviar(transcript)) {
          setComandoDetectado(true);
          recognitionInstance.stop();
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setErroAudio(`Erro no reconhecimento: ${event.error}`);
        setIsGravando(false);
        
        // Tentar parar o reconhecimento
        try {
          recognitionInstance.stop();
        } catch (e) {
          // Ignorar erros ao parar
        }
      };
      
      recognitionInstance.onend = () => {
        console.log('Reconhecimento de voz finalizado');
        setIsGravando(false);
        
        // Se um comando de envio foi detectado, enviar a mensagem automaticamente
        if (comandoDetectado && mensagem.trim()) {
          setComandoDetectado(false);
          onEnviar(mensagem);
          setMensagem('');
        }
      };
      
      // Iniciar reconhecimento
      recognitionInstance.start();
      setRecognition(recognitionInstance);
      
    } catch (err) {
      console.error("Erro ao iniciar reconhecimento de voz:", err);
      setTemPermissao(false);
      setErroAudio("Não foi possível iniciar o reconhecimento de voz");
    }
  };

  const pararGravacao = () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.error("Erro ao parar reconhecimento:", e);
      }
    }
    setIsGravando(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-1 sm:gap-2 w-full">
        <input
          type="text"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-grow p-2 sm:p-3 text-sm sm:text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 transition-colors duration-300 z-10"
          disabled={isCarregando || isGravando}
          autoComplete="off"
          autoFocus
        />
        
        {/* Botão de gravação */}
        {temPermissao !== false && (
          <button
            type="button"
            onClick={isGravando ? pararGravacao : iniciarGravacao}
            disabled={isCarregando || temPermissao === null}
            className={`p-2 sm:p-3 rounded-lg transition-colors duration-300 z-10 ${
              isGravando 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
            }`}
            title={isGravando ? "Parar gravação" : "Gravar mensagem de voz"}
          >
            {isGravando ? (
              // Ícone de parar gravação (quadrado)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect width="14" height="14" x="5" y="5" strokeWidth="2" />
              </svg>
            ) : (
              // Ícone de microfone
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        )}
        
        <button
          type="submit"
          className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white rounded-lg transition-colors duration-300 min-w-[60px] sm:min-w-[80px] md:min-w-[100px] whitespace-nowrap z-10"
          disabled={isCarregando || isGravando || !mensagem.trim()}
        >
          {isCarregando ? (
            <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Enviar'
          )}
        </button>
      </div>
      
      {/* Indicador de gravação */}
      {isGravando && (
        <div className="mt-2 flex items-center text-xs text-red-600 dark:text-red-400">
          <div className="audio-wave mr-2">
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
            <div className="audio-wave-bar"></div>
          </div>
          <span>Falando... (clique no botão para parar ou diga "enviar" ao final)</span>
        </div>
      )}
      
      {/* Mensagem de erro */}
      {erroAudio && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          <span className="mr-1">⚠️</span> {erroAudio}
        </div>
      )}
      
      {/* Dica de uso */}
      {!isGravando && !erroAudio && temPermissao === true && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="mr-1">💡</span> Dica: Clique no ícone de microfone e diga "enviar" ao final para enviar automaticamente
        </div>
      )}
    </form>
  );
};

export default ChatInput; 