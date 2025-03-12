import React, { useState, useEffect, useRef } from 'react';
import { 
  getSpeechRecognition, 
  checkMicrophonePermission, 
  extractTranscriptFromEvent 
} from '../utils/speechRecognition';

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
  const [comandoDetectado, setComandoDetectado] = useState(false);
  const [compatibilidadeNavegador, setCompatibilidadeNavegador] = useState<string>('');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Inicializar o gerenciador de reconhecimento de voz e verificar compatibilidade
    const speechRecognition = getSpeechRecognition();
    const mensagemCompatibilidade = speechRecognition.getCompatibilityMessage();
    setCompatibilidadeNavegador(mensagemCompatibilidade);
    
    console.log(`[AUDIO] API de reconhecimento suportada: ${speechRecognition.isSupported()}`);
    
    if (!speechRecognition.isSupported()) {
      setTemPermissao(false);
      setErroAudio("Seu navegador não suporta reconhecimento de voz. Tente usar Chrome, Edge ou Safari.");
      return;
    }
    
    // Verificar permissão de microfone
    checkMicrophonePermission()
      .then((hasPermission) => {
        console.log('[AUDIO] Permissão de microfone:', hasPermission ? 'concedida' : 'negada');
        setTemPermissao(hasPermission);
        if (!hasPermission) {
          setErroAudio("Permissão para acessar o microfone negada. Clique no ícone de cadeado na barra de endereço e permita o acesso.");
        } else {
          setErroAudio(null);
        }
      });

    // Limpar timeouts ao desmontar o componente
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      pararGravacao();
    };
  }, []);

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
          console.log('[AUDIO] Comando de envio detectado:', comando);
          return true;
        }
      }
    }
    
    return false;
  };

  const iniciarGravacao = () => {
    setErroAudio(null);
    setComandoDetectado(false);
    setIsTranscrevendo(false);
    
    try {
      console.log('[AUDIO] Iniciando reconhecimento de voz');
      
      const speechRecognition = getSpeechRecognition();
      
      if (!speechRecognition.isSupported()) {
        throw new Error('API de reconhecimento de voz não disponível neste navegador');
      }
      
      // Configurar handlers de eventos
      speechRecognition.setHandlers({
        onStart: () => {
          console.log('[AUDIO] Reconhecimento de voz iniciado com sucesso');
          setIsGravando(true);
          setIsTranscrevendo(false);
        },
        
        onResult: (event) => {
          console.log('[AUDIO] Evento onresult recebido');
          
          // Extrair transcrição do evento
          const { transcript, isFinal } = extractTranscriptFromEvent(event);
          
          if (transcript) {
            console.log(`[AUDIO] Transcrição ${isFinal ? 'final' : 'intermediária'}: "${transcript}"`);
            
            // Atualizar o campo de texto
            setMensagem(transcript);
            setIsTranscrevendo(true);
            
            // Verificar comando de envio em resultados finais
            if (isFinal && verificarComandoEnviar(transcript)) {
              setComandoDetectado(true);
              speechRecognition.stop();
            }
          }
        },
        
        onError: (event) => {
          console.error('[AUDIO] Erro no reconhecimento de voz:', event.error);
          
          // Obter mensagem de erro amigável baseada no código de erro
          const errorMessage = speechRecognition.getErrorMessage(event.error);
          setErroAudio(errorMessage);
          setIsGravando(false);
        },
        
        onEnd: () => {
          console.log('[AUDIO] Reconhecimento de voz finalizado');
          setIsGravando(false);
          
          // Se um comando de envio foi detectado, enviar a mensagem automaticamente
          if (comandoDetectado && mensagem.trim()) {
            console.log('[AUDIO] Enviando mensagem após comando:', mensagem.trim());
            setComandoDetectado(false);
            
            // Atraso pequeno para garantir que a mensagem foi atualizada corretamente
            timeoutRef.current = window.setTimeout(() => {
              onEnviar(mensagem);
              setMensagem('');
            }, 100);
          }
        }
      });
      
      // Iniciar reconhecimento
      const started = speechRecognition.start();
      
      if (!started) {
        throw new Error('Falha ao iniciar reconhecimento de voz');
      }
      
      console.log('[AUDIO] Reconhecimento iniciado e configurado');
      
    } catch (err) {
      console.error("[AUDIO] Erro ao iniciar reconhecimento de voz:", err);
      setTemPermissao(false);
      setErroAudio("Não foi possível iniciar o reconhecimento de voz. Verifique se seu navegador é compatível (Chrome, Edge, Safari) e se você permitiu acesso ao microfone.");
    }
  };

  const pararGravacao = () => {
    console.log('[AUDIO] Tentando parar gravação');
    const speechRecognition = getSpeechRecognition();
    speechRecognition.stop();
    setIsGravando(false);
  };

  const reiniciarReconhecimento = () => {
    console.log('[AUDIO] Reiniciando reconhecimento');
    const speechRecognition = getSpeechRecognition();
    speechRecognition.restart();
    setIsTranscrevendo(false);
    // Mostrar mensagem indicando o reinício
    setErroAudio("Reconhecimento reiniciado. Por favor, tente falar novamente.");
    // Limpar a mensagem de erro após 3 segundos
    timeoutRef.current = window.setTimeout(() => {
      setErroAudio(null);
    }, 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-1 sm:gap-2 w-full">
        <input
          type="text"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Digite sua mensagem..."
          className={`flex-grow p-2 sm:p-3 text-sm sm:text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 transition-colors duration-300 z-10 ${isTranscrevendo ? 'transcribing-text' : ''}`}
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
                ? 'bg-red-600 hover:bg-red-700 text-white pulse-recording' 
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
          <span>{isTranscrevendo ? 'Ouvindo... Continue falando' : 'Aguardando fala... Fale alguma coisa'}</span>
        </div>
      )}
      
      {/* Adicionar botão para reiniciar se estiver com problemas */}
      {isGravando && !isTranscrevendo && (
        <div className="mt-2">
          <button
            type="button"
            onClick={reiniciarReconhecimento}
            className="text-xs text-blue-600 dark:text-blue-400 underline"
          >
            Não está funcionando? Clique para reiniciar o reconhecimento
          </button>
        </div>
      )}

      {/* Status da transcrição */}
      {isTranscrevendo && (
        <div className="mt-1 text-xs text-green-600 dark:text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Reconhecimento funcionando! Diga "enviar" quando terminar.
        </div>
      )}
      
      {/* Mensagem de erro */}
      {erroAudio && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          <span className="mr-1">⚠️</span> {erroAudio}
        </div>
      )}
      
      {/* Dica de compatibilidade */}
      {compatibilidadeNavegador && !isGravando && !erroAudio && (
        <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
          <span className="mr-1">ℹ️</span> {compatibilidadeNavegador}
        </div>
      )}
      
      {/* Dica de uso */}
      {!isGravando && !erroAudio && temPermissao === true && !compatibilidadeNavegador && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="mr-1">💡</span> Dica: Clique no ícone de microfone para iniciar gravação. Fale sua mensagem e diga "enviar" ao final.
        </div>
      )}
    </form>
  );
};

export default ChatInput; 