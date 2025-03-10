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
    <form onSubmit={handleSubmit} className="pt-4 pb-2 border-t border-gray-200">
      <div className="flex gap-2">
        <input
          type="text"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Digite sua dúvida jurídica..."
          className="input flex-grow"
          disabled={isCarregando}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isCarregando || !mensagem.trim()}
        >
          {isCarregando ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando
            </div>
          ) : (
            'Enviar'
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInput; 