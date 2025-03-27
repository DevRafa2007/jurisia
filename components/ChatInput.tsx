import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type ChatInputProps = {
  onEnviar: (mensagem: string) => void;
  isCarregando: boolean;
};

// Sugestões simplificadas para consultas rápidas
const SUGESTOES = [
  "Como funciona o processo de usucapião?",
  "Quais são os documentos necessários para abertura de processo trabalhista?",
  "Qual a diferença entre dano moral e dano material?",
  "Quais são os prazos para recurso em processos cíveis?"
];

const ChatInput: React.FC<ChatInputProps> = ({ onEnviar, isCarregando }) => {
  const [mensagem, setMensagem] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Ajusta a altura do textarea para se adaptar ao conteúdo
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [mensagem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mensagem.trim() && !isCarregando) {
      onEnviar(mensagem);
      setMensagem('');
      // Resetar altura do textarea
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enviar mensagem com Enter (sem shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const aplicarSugestao = (sugestao: string) => {
    setMensagem(sugestao);
    setMostrarSugestoes(false);
    // Foca no input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Variantes de animação
  const dropdownVariants = {
    hidden: { opacity: 0, y: -5, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: {
        duration: 0.15
      }
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="w-full relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-full bg-transparent border border-gray-200/70 dark:border-gray-700/50 shadow-sm hover:shadow-sm focus-within:shadow-md focus-within:border-gray-300 dark:focus-within:border-gray-600 rounded-xl transition-all duration-200">
        <textarea
          ref={inputRef}
          value={mensagem}
          onChange={(e) => {
            setMensagem(e.target.value);
            setMostrarSugestoes(e.target.value === '');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte alguma coisa"
          className="w-full py-3 px-4 pr-10 text-sm sm:text-base bg-transparent text-gray-900 dark:text-gray-200 focus:ring-0 focus:outline-none resize-none min-h-[44px] max-h-[120px] overflow-y-auto rounded-xl"
          disabled={isCarregando}
          autoComplete="off"
          autoFocus
          rows={1}
        />
        
        <div className="absolute right-2 bottom-1.5 flex items-center">
          {/* Botões adicionais */}
          <button
            type="button"
            onClick={() => setMostrarSugestoes(!mostrarSugestoes)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-full transition-colors"
            title="Mostrar sugestões"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          
          {/* Botão de enviar */}
          <button
            type="submit"
            disabled={isCarregando || !mensagem.trim()}
            className="ml-1 flex items-center justify-center w-8 h-8 rounded-full bg-primary-600/80 text-white hover:bg-primary-700 hover:scale-105 transition-all duration-300 disabled:bg-gray-400/60 disabled:cursor-not-allowed"
          >
            {isCarregando ? (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-1 h-1 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Sugestões de perguntas com animação */}
      <AnimatePresence>
        {mostrarSugestoes && mensagem === '' && (
          <motion.div 
            className="absolute bottom-full left-0 right-0 mb-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md border-0 py-2 z-20"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">
              Sugestões
            </div>
            <div className="max-h-40 overflow-y-auto">
              {SUGESTOES.map((sugestao, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-700 dark:text-gray-300"
                  onClick={() => aplicarSugestao(sugestao)}
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Texto de atalho de teclado */}
      <div className="text-xs text-gray-500/80 dark:text-gray-400/80 mt-2 text-right pr-2">
        <span className="hidden sm:inline-block">Pressione </span>
        <kbd className="px-1 py-0.5 rounded text-xs bg-white/50 dark:bg-gray-700/50 border-0 text-gray-800 dark:text-gray-300 shadow-sm">Enter</kbd>
        <span className="hidden sm:inline-block"> para enviar</span>
      </div>
    </motion.form>
  );
};

export default ChatInput; 