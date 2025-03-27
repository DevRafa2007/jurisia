import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type ChatMessageProps = {
  conteudo: string;
  isUsuario: boolean;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ conteudo, isUsuario }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(conteudo)
      .then(() => {
        setCopied(true);
        toast.success('Texto copiado!', {
          id: 'clipboard',
          duration: 1500,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#FFFAEE',
          },
        });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error('Não foi possível copiar o texto.', {
          id: 'clipboard-error'
        });
      });
  };

  // Configurações de animação
  const messageVariants = {
    hidden: { 
      opacity: 0, 
      y: isUsuario ? 15 : -15,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 250,
        damping: 20,
        mass: 0.8
      }
    }
  };

  // Tempo formatado
  const formattedTime = new Date().toLocaleTimeString([], {
    hour: '2-digit', 
    minute: '2-digit'
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={messageVariants}
      className={`message relative mb-8 ${
        isUsuario ? 'ml-auto' : 'mr-auto'
      }`}
    >
      <div className={`flex ${isUsuario ? 'justify-end' : 'justify-start'} items-end`}>
        {/* Avatar para o assistente */}
        {!isUsuario && (
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-700 flex items-center justify-center text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Conteúdo da mensagem */}
        <div className={`${
          isUsuario
            ? 'bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-600 text-white rounded-2xl rounded-br-none max-w-[85%]'
            : 'bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none max-w-[90%]'
        } shadow-md border border-l border-r ${
          isUsuario 
            ? 'border-primary-400/30' 
            : 'border-gray-100 dark:border-gray-700/50'
        } px-5 py-4 relative`}
        >
          {/* Botão de copiar fixo (sem hover) */}
          <button 
            onClick={copyToClipboard}
            className={`absolute top-2 ${isUsuario ? 'left-2' : 'right-2'} p-1.5 rounded-full bg-white/20 dark:bg-gray-700/20 hover:bg-white/40 dark:hover:bg-gray-700/40 text-white/70 dark:text-gray-300 z-10`}
            title={copied ? "Copiado!" : "Copiar texto"}
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            )}
          </button>

          {/* Conteúdo adaptado para cada tipo de mensagem */}
          <div className="mt-2">
            {isUsuario ? (
              <div className="text-white w-full markdown [&>*]:text-white select-text">
                <ReactMarkdown>{conteudo}</ReactMarkdown>
              </div>
            ) : (
              <div className={`prose prose-sm sm:prose dark:prose-invert prose-headings:font-serif prose-p:text-primary-900 dark:prose-p:text-gray-200 w-full markdown select-text overflow-hidden transition-all duration-300 ${expanded ? 'max-h-none' : ''}`}>
                <ReactMarkdown>{conteudo}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Indicador de tempo elegante */}
          <div className={`mt-2 pt-1 text-right text-[10px] font-light ${isUsuario ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
            {formattedTime}
          </div>
        </div>

        {/* Avatar para o usuário */}
        {isUsuario && (
          <div className="flex-shrink-0 ml-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage; 