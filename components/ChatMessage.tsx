import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

type ChatMessageProps = {
  conteudo: string;
  isUsuario: boolean;
  onErroAudio?: (mensagem: string | null) => void;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ conteudo, isUsuario, onErroAudio }) => {
  const [isReproducao, setIsReproducao] = useState(false);
  const [vozesDisponiveis, setVozesDisponiveis] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Verificar se o navegador suporta síntese de voz
    if ('speechSynthesis' in window) {
      // Carregar vozes disponíveis
      const carregarVozes = () => {
        const vozes = window.speechSynthesis.getVoices();
        if (vozes.length > 0) {
          setVozesDisponiveis(vozes);
        }
      };

      // Algumas vezes as vozes não estão disponíveis imediatamente
      carregarVozes();

      // Evento disparado quando as vozes são carregadas (principalmente para Chrome)
      window.speechSynthesis.onvoiceschanged = carregarVozes;
    }
  }, []);

  // Função para reproduzir o texto em áudio usando a API de Speech Synthesis
  const reproduzirAudio = () => {
    if (!('speechSynthesis' in window)) {
      if (onErroAudio) {
        onErroAudio('⚠️ Seu navegador não suporta a função de áudio. Tente usar Chrome, Edge ou Safari no computador.');
      }
      return;
    }

    try {
      // Parar qualquer reprodução anterior
      window.speechSynthesis.cancel();

      // Iniciar nova reprodução
      setIsReproducao(true);
      if (onErroAudio) {
        onErroAudio(null); // Limpar qualquer erro anterior
      }

      const utterance = new SpeechSynthesisUtterance(conteudo);
      
      // Configurar voz em português
      utterance.lang = 'pt-BR';
      
      // Buscar uma voz em português, se disponível
      const vozPortugues = vozesDisponiveis.find(voz => 
        voz.lang.includes('pt-BR') || voz.lang.includes('pt_BR') || voz.lang.includes('pt')
      );
      
      if (vozPortugues) {
        utterance.voice = vozPortugues;
        console.log('Usando voz:', vozPortugues.name);
      } else {
        console.log('Nenhuma voz em português encontrada, usando voz padrão');
      }

      // Ajustar velocidade para melhor compreensão
      utterance.rate = 0.95;
      
      // Evento para quando a reprodução terminar
      utterance.onend = () => {
        setIsReproducao(false);
      };

      // Evento para erros
      utterance.onerror = (event) => {
        console.error('Erro na reprodução de áudio:', event);
        setIsReproducao(false);
        if (onErroAudio) {
          onErroAudio('⚠️ Não foi possível reproduzir o áudio. Em computadores, verifique se o som não está mudo e se permitiu acesso ao microfone/áudio no navegador.');
        }
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (erro) {
      console.error('Erro ao iniciar reprodução:', erro);
      setIsReproducao(false);
      if (onErroAudio) {
        onErroAudio('⚠️ Erro ao iniciar áudio. Em computadores, verifique as configurações de som nas preferências do sistema e permissões do navegador.');
      }
    }
  };

  // Função para parar a reprodução de áudio
  const pararAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsReproducao(false);
    }
  };

  return (
    <div
      className={`p-3 sm:p-4 rounded-lg ${
        isUsuario
          ? 'bg-primary-100 dark:bg-primary-700 ml-auto'
          : 'bg-gray-100 dark:bg-gray-700 mr-auto'
      } max-w-[92%] sm:max-w-[85%] md:max-w-[80%] break-words shadow-none message-container mb-4 relative`}
    >
      <div className="flex justify-between items-start mb-2">
        <div 
          className={`font-medium ${
            isUsuario 
              ? 'text-primary-800 dark:text-gray-200' 
              : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {isUsuario ? 'Você' : 'JurisIA'}
          {isReproducao && (
            <span className="ml-2 text-xs audio-playing">
              <span className="audio-playing-icon">🔊</span>
              <span>Reproduzindo...</span>
            </span>
          )}
        </div>
        
        {/* Botão de áudio - apenas para mensagens do assistente */}
        {!isUsuario && (
          <button
            onClick={isReproducao ? pararAudio : reproduzirAudio}
            className={`ml-2 p-1 rounded-full transition-colors ${
              isReproducao 
                ? 'bg-red-100 text-red-600 dark:bg-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-600' 
                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
            title={isReproducao ? "Parar reprodução" : "Ouvir resposta"}
          >
            {isReproducao ? (
              // Ícone de parar (quadrado)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect width="14" height="14" x="5" y="5" strokeWidth="2" />
              </svg>
            ) : (
              // Ícone de alto-falante
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      <div className={`prose prose-sm sm:prose max-w-none ${!isUsuario ? 'dark:prose-invert' : ''} overflow-visible`}>
        <ReactMarkdown
          components={{
            p: ({node, ...props}) => <div className="mb-2 last:mb-0 overflow-visible" {...props} />,
            pre: ({node, ...props}) => <pre className="overflow-x-auto rounded bg-gray-200 dark:bg-gray-800 p-2 my-2 text-sm" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 overflow-visible" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 overflow-visible" {...props} />,
            li: ({node, ...props}) => <li className="mb-1 overflow-visible" {...props} />,
            h1: ({node, ...props}) => <h1 className="text-xl font-bold my-3 overflow-visible" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-lg font-bold my-2 overflow-visible" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-base font-bold my-2 overflow-visible" {...props} />,
          }}
        >
          {conteudo}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ChatMessage; 