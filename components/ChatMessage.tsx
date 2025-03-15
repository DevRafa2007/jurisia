import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type ChatMessageProps = {
  conteudo: string;
  isUsuario: boolean;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ conteudo, isUsuario }) => {
  const [showActions, setShowActions] = useState(false);
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
      className={`message p-2 sm:p-3 md:p-4 rounded-lg mb-2 sm:mb-3 md:mb-4 relative group ${
        isUsuario
          ? 'ml-auto bg-primary-700 dark:bg-primary-800 text-white transition-colors duration-300 max-w-[90%] sm:max-w-[85%] md:max-w-[75%] shadow-sm'
          : 'mr-auto bg-white dark:bg-law-800 text-primary-900 dark:text-law-200 border border-law-200 dark:border-law-700 transition-colors duration-300 max-w-[90%] sm:max-w-[85%] md:max-w-[75%] shadow-elegant'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Ícone do remetente com animação */}
      <motion.div 
        className={`absolute ${isUsuario ? 'right-full' : 'left-full'} top-2 mx-2`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.2 }}
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
          isUsuario 
            ? 'bg-primary-700 dark:bg-primary-800 text-white' 
            : 'bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-800'
          }`}
        >
          {isUsuario ? 'U' : 'AI'}
        </div>
      </motion.div>

      {/* Ações da mensagem - visíveis apenas ao passar o mouse */}
      <div className={`absolute right-2 top-2 flex space-x-1 transition-opacity duration-200 ${
        showActions ? 'opacity-100' : 'opacity-0'
      }`}>
        <motion.button 
          onClick={copyToClipboard}
          className={`p-1 rounded-md ${
            copied 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : 'bg-law-100 text-law-600 dark:bg-law-700 dark:text-law-300 hover:bg-law-200 dark:hover:bg-law-600'
          } transition-colors duration-200`}
          title={copied ? "Copiado!" : "Copiar texto"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </motion.button>
      </div>

      {/* Conteúdo da mensagem com animação de fade-in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {isUsuario ? (
          <div className="text-white max-w-none transition-colors duration-300 markdown [&>*]:text-white [&_a]:text-white [&_p]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white [&_ul]:text-white [&_ol]:text-white [&_li]:text-white [&_blockquote]:text-white [&_code]:text-white [&_pre]:text-white [&_strong]:text-white [&_em]:text-white [&_del]:text-white">
            <ReactMarkdown>{conteudo}</ReactMarkdown>
          </div>
        ) : (
          <div className="prose prose-sm sm:prose dark:prose-invert prose-headings:font-serif prose-p:text-primary-900 dark:prose-p:text-law-200 max-w-none transition-colors duration-300 markdown">
            <ReactMarkdown>{conteudo}</ReactMarkdown>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ChatMessage; 