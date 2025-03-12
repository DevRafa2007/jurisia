import React, { useState, useRef } from 'react';

type ChatInputProps = {
  onEnviar: (mensagem: string) => void;
  isCarregando: boolean;
};

const ChatInput: React.FC<ChatInputProps> = ({ onEnviar, isCarregando }) => {
  const [mensagem, setMensagem] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mensagemTrimmed = mensagem.trim();
    if (mensagemTrimmed && !isCarregando) {
      onEnviar(mensagemTrimmed);
      setMensagem('');
      
      // Resetar altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMensagem(e.target.value);
    
    // Auto-resize do textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full relative">
      <div className="relative flex-grow">
        <textarea
          ref={textareaRef}
          value={mensagem}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua consulta jurídica..."
          className="w-full py-2 px-3 pr-10 rounded-l-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 resize-none overflow-hidden text-gray-900 dark:text-gray-100"
          rows={1}
          disabled={isCarregando}
        />
      </div>
      
      <button
        type="submit"
        disabled={!mensagem.trim() || isCarregando}
        className={`p-2 sm:p-3 rounded-r-lg ${
          !mensagem.trim() || isCarregando 
            ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
            : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800'
        } transition-colors duration-200`}
        title="Enviar mensagem"
      >
        {isCarregando ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" transform="rotate(90, 10, 10)" />
          </svg>
        )}
      </button>
    </form>
  );
};

export default ChatInput; 