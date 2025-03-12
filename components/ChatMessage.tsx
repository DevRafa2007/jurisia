import React from 'react';
import ReactMarkdown from 'react-markdown';

type ChatMessageProps = {
  conteudo: string;
  isUsuario: boolean;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ conteudo, isUsuario }) => {
  return (
    <div 
      className={`flex ${isUsuario ? 'justify-end' : 'justify-start'} message-container`}
    >
      <div 
        className={`rounded-lg px-3 py-2 max-w-[85%] md:max-w-[80%] lg:max-w-[75%] ${
          isUsuario 
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 mr-1' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 ml-1'
        } message-content`}
      >
        <div className="prose prose-sm sm:prose max-w-none ${!isUsuario ? 'dark:prose-invert' : ''} overflow-visible">
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
    </div>
  );
};

export default ChatMessage; 