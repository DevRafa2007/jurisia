import React, { useState } from 'react';

type ChatInputProps = {
  onEnviar: (mensagem: string) => void;
  isCarregando: boolean;
};

const ChatInput: React.FC<ChatInputProps> = ({ onEnviar, isCarregando }) => {
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mensagem.trim() && !isCarregando) {
      onEnviar(mensagem);
      setMensagem('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-1 sm:gap-2 w-full">
        <input
          type="text"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-grow p-2 sm:p-3 text-sm sm:text-base border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 transition-colors duration-300"
          disabled={isCarregando}
        />
        <button
          type="submit"
          className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white rounded-lg transition-colors duration-300 min-w-[60px] sm:min-w-[80px] md:min-w-[100px] whitespace-nowrap"
          disabled={isCarregando || !mensagem.trim()}
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
    </form>
  );
};

export default ChatInput; 