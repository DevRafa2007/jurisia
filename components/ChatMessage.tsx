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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(conteudo)
      .then(() => {
        setCopied(true);
        toast.success('Texto copiado para a área de transferência!', {
          id: 'clipboard',
          duration: 1500,
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
      y: isUsuario ? 10 : -10,
      scale: 0.98
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={messageVariants}
      className={`message relative group mb-4 ${
        isUsuario
          ? 'ml-auto'
          : 'mr-auto'
      }`}
    >
      {/* Conteúdo da mensagem principal */}
      <div className={`flex ${isUsuario ? 'justify-end' : 'justify-start'} items-end`}>
        {/* Avatar ou indicador (apenas para mensagens do assistente) */}
        {!isUsuario && (
          <div className="flex-shrink-0 mr-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
              IA
            </div>
          </div>
        )}
        
        {/* Conteúdo da mensagem */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className={`px-4 py-3 rounded-2xl ${
            isUsuario
              ? 'bg-primary-600 text-white rounded-br-sm max-w-[85%]'
              : 'bg-white dark:bg-law-800/80 border-[0.5px] border-law-200 dark:border-law-700/30 text-primary-900 dark:text-law-200 rounded-bl-sm max-w-[90%]'
          }`}
        >
          {isUsuario ? (
            <div className="text-white max-w-none markdown [&>*]:text-white">
              <ReactMarkdown>{conteudo}</ReactMarkdown>
            </div>
          ) : (
            <div className="prose prose-sm sm:prose dark:prose-invert prose-headings:font-serif prose-p:text-primary-900 dark:prose-p:text-law-200 max-w-none markdown">
              <ReactMarkdown>{conteudo}</ReactMarkdown>
            </div>
          )}
        </motion.div>
      </div>

      {/* Botões de ação discretos que aparecem ao passar o mouse */}
      <div className={`absolute ${isUsuario ? 'left-0' : 'right-0'} bottom-0 flex opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
        <motion.button 
          onClick={copyToClipboard}
          className={`p-1.5 rounded-full ${
            copied 
              ? 'bg-green-100/90 text-green-700 dark:bg-green-900/90 dark:text-green-300' 
              : 'bg-law-100/90 text-law-600 dark:bg-law-700/90 dark:text-law-300 hover:bg-law-200/90 dark:hover:bg-law-600/90'
          } transition-colors duration-200 backdrop-blur-sm`}
          title={copied ? "Copiado!" : "Copiar texto"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatMessage; 