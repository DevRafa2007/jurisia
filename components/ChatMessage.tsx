import React from 'react';
import ReactMarkdown from 'react-markdown';

type ChatMessageProps = {
  conteudo: string;
  isUsuario: boolean;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ conteudo, isUsuario }) => {
  return (
    <div className={`flex ${isUsuario ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUsuario
            ? 'bg-primary-600 text-white rounded-tr-none'
            : 'bg-gray-200 text-gray-800 rounded-tl-none'
        }`}
      >
        {isUsuario ? (
          <p className="text-sm">{conteudo}</p>
        ) : (
          <div className="text-sm prose prose-sm max-w-none">
            <ReactMarkdown>{conteudo}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage; 