import React from 'react';
import ReactMarkdown from 'react-markdown';

type ChatMessageProps = {
  conteudo: string;
  isUsuario: boolean;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ conteudo, isUsuario }) => {
  return (
    <div
      className={`p-2 sm:p-3 md:p-4 rounded-lg mb-2 sm:mb-3 md:mb-4 ${
        isUsuario
          ? 'ml-auto bg-primary-600 dark:bg-primary-700 text-white transition-colors duration-300 max-w-[90%] sm:max-w-[85%] md:max-w-[75%]'
          : 'mr-auto bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300 max-w-[90%] sm:max-w-[85%] md:max-w-[75%]'
      }`}
    >
      <div className={`prose prose-sm sm:prose ${!isUsuario ? 'dark:prose-invert' : ''} max-w-none transition-colors duration-300`}>
        <ReactMarkdown>{conteudo}</ReactMarkdown>
      </div>
    </div>
  );
};

export default ChatMessage; 