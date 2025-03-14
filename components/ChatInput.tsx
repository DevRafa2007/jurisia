import React, { useState, useRef, useEffect } from 'react';

type ChatInputProps = {
  onEnviar: (mensagem: string) => void;
  isCarregando: boolean;
};

// Prompts pré-definidos para diversos tipos de consultas jurídicas
const PROMPTS_TEMPLATES = [
  { 
    titulo: 'Interpretação de lei', 
    texto: 'Qual a interpretação atual do artigo X da lei Y? Como ele se aplica em casos de...?'
  },
  {
    titulo: 'Análise de contrato', 
    texto: 'Analise esta cláusula contratual: [insira a cláusula]. Ela é legal? Quais seus possíveis problemas?'
  },
  {
    titulo: 'Jurisprudência recente', 
    texto: 'Existe jurisprudência recente do STF ou STJ sobre o tema X? Como os tribunais têm decidido?'
  },
  {
    titulo: 'Orientação processual', 
    texto: 'Qual o próximo passo processual após X? Quais os prazos envolvidos?'
  }
];

const ChatInput: React.FC<ChatInputProps> = ({ onEnviar, isCarregando }) => {
  const [mensagem, setMensagem] = useState('');
  const [mostrarTemplates, setMostrarTemplates] = useState(false);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);

  // Sugestões de perguntas baseadas no contexto (simplificadas para demonstração)
  const sugestoes = [
    "Como funciona o processo de usucapião?",
    "Quais são os documentos necessários para abertura de processo trabalhista?",
    "Qual a diferença entre dano moral e dano material?",
    "Quais são os prazos para recurso em processos cíveis?"
  ];

  useEffect(() => {
    // Ajusta a altura do textarea para se adaptar ao conteúdo
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [mensagem]);

  useEffect(() => {
    // Fecha o menu de templates quando clicar fora dele
    function handleClickOutside(event: MouseEvent) {
      if (templatesRef.current && !templatesRef.current.contains(event.target as Node)) {
        setMostrarTemplates(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    // Enviar mensagem com Ctrl+Enter ou Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const aplicarTemplate = (template: string) => {
    setMensagem(template);
    setMostrarTemplates(false);
    // Foca no input e move o cursor para o final
    if (inputRef.current) {
      inputRef.current.focus();
      const length = template.length;
      inputRef.current.setSelectionRange(length, length);
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

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <div className="flex items-end gap-1 sm:gap-2 w-full">
        {/* Botão de templates */}
        <div className="relative" ref={templatesRef}>
          <button
            type="button"
            onClick={() => {
              setMostrarTemplates(!mostrarTemplates);
              setMostrarSugestoes(false);
            }}
            className="p-2 text-primary-600 dark:text-primary-400 hover:bg-law-100 dark:hover:bg-law-700 rounded-lg transition-colors duration-200 self-end"
            title="Templates de consulta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </button>
          
          {/* Menu dropdown de templates */}
          {mostrarTemplates && (
            <div className="absolute left-0 bottom-full mb-2 w-72 bg-white dark:bg-law-800 rounded-lg shadow-elegant border border-law-200 dark:border-law-700 py-2 z-20">
              <div className="px-3 py-1 text-xs font-medium text-law-600 dark:text-law-400 border-b border-law-200 dark:border-law-700 mb-1">
                Templates de consulta
              </div>
              {PROMPTS_TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-law-100 dark:hover:bg-law-700 transition-colors duration-200"
                  onClick={() => aplicarTemplate(template.texto)}
                >
                  <div className="font-medium text-primary-800 dark:text-law-200 mb-0.5">{template.titulo}</div>
                  <div className="text-xs text-law-600 dark:text-law-400 line-clamp-1">{template.texto}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-grow relative">
          <textarea
            ref={inputRef}
            value={mensagem}
            onChange={(e) => {
              setMensagem(e.target.value);
              // Mostrar sugestões quando o input está vazio e o usuário começa a digitar
              if (e.target.value === '') {
                setMostrarSugestoes(true);
              } else {
                setMostrarSugestoes(false);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua consulta jurídica..."
            className="w-full p-3 text-sm sm:text-base border rounded-lg bg-white dark:bg-law-800 text-primary-900 dark:text-law-200 border-law-300 dark:border-law-600 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 transition-colors duration-300 z-10 resize-none min-h-[44px] max-h-[140px] overflow-y-auto"
            disabled={isCarregando}
            autoComplete="off"
            autoFocus
            rows={1}
          />
          
          {/* Sugestões de perguntas - aparecem quando o input está vazio */}
          {mostrarSugestoes && mensagem === '' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-law-800 rounded-lg shadow-elegant border border-law-200 dark:border-law-700 py-2 z-20">
              <div className="px-3 py-1 text-xs font-medium text-law-600 dark:text-law-400 border-b border-law-200 dark:border-law-700 mb-1">
                Sugestões de consulta
              </div>
              {sugestoes.map((sugestao, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-law-100 dark:hover:bg-law-700 transition-colors duration-200 text-primary-700 dark:text-law-300"
                  onClick={() => aplicarSugestao(sugestao)}
                >
                  {sugestao}
                </button>
              ))}
            </div>
          )}
          
          {/* Contador de caracteres e atalhos */}
          <div className="absolute right-3 bottom-2 text-xs text-law-500 dark:text-law-500 flex items-center">
            {mensagem.length > 0 && (
              <span className="mr-2 bg-law-100 dark:bg-law-700 px-1.5 py-0.5 rounded">
                {mensagem.length}
              </span>
            )}
            <span className="hidden sm:inline-block">Ctrl+Enter para enviar</span>
          </div>
        </div>
        
        <button
          type="submit"
          className="px-3 sm:px-4 py-3 text-xs sm:text-sm bg-primary-700 hover:bg-primary-600 dark:bg-primary-800 dark:hover:bg-primary-700 text-white rounded-lg transition-colors duration-300 min-w-[44px] h-[44px] flex items-center justify-center shadow-sm"
          disabled={isCarregando || !mensagem.trim()}
          title="Enviar mensagem"
        >
          {isCarregando ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInput; 