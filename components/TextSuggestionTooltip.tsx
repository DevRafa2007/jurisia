import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextSuggestionTooltipProps {
  posicao: { x: number; y: number };
  sugestao: string;
  textoOriginal: string;
  onAceitar: () => void;
  onRejeitar: () => void;
  onFechar: () => void;
  isVisible: boolean;
}

const TextSuggestionTooltip: React.FC<TextSuggestionTooltipProps> = ({
  posicao,
  sugestao,
  textoOriginal,
  onAceitar,
  onRejeitar,
  onFechar,
  isVisible
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosicao, setTooltipPosicao] = useState(posicao);

  // Ajustar posição do tooltip para garantir que fique visível na tela
  useEffect(() => {
    if (tooltipRef.current && isVisible) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Ajustar posição horizontal se estiver saindo da tela
      let x = posicao.x;
      if (x + tooltipRect.width > windowWidth - 20) {
        x = windowWidth - tooltipRect.width - 20;
      }
      
      // Ajustar posição vertical se estiver saindo da tela
      let y = posicao.y;
      if (y + tooltipRect.height > windowHeight - 20) {
        y = windowHeight - tooltipRect.height - 20;
      }
      
      setTooltipPosicao({ x, y });
    }
  }, [posicao, isVisible]);

  // Fechar tooltip ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onFechar();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onFechar]);

  // Calcular diferenças entre o texto original e a sugestão
  const calcularDiferencas = () => {
    // Simplificação para demonstração
    // Uma implementação real usaria um algoritmo de diff mais sofisticado
    if (textoOriginal === sugestao) {
      return { original: textoOriginal, novo: sugestao };
    }
    
    return {
      original: textoOriginal,
      novo: sugestao
    };
  };

  const { original, novo } = calcularDiferencas();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          className="fixed z-50 w-80 bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden"
          style={{
            left: tooltipPosicao.x + 'px',
            top: tooltipPosicao.y + 'px',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-primary-500 to-indigo-600 px-4 py-3 text-white flex justify-between items-center">
            <h3 className="text-sm font-medium">Sugestão de melhoria</h3>
            <button
              onClick={onFechar}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Conteúdo */}
          <div className="p-4">
            <div className="mb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Texto original:</div>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded text-sm text-gray-800 dark:text-gray-200 line-through">
                {original}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Sugestão:</div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded text-sm text-gray-800 dark:text-gray-200 font-medium">
                {novo}
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex justify-between">
              <button
                onClick={onRejeitar}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rejeitar
              </button>
              
              <button
                onClick={onAceitar}
                className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aplicar mudança
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TextSuggestionTooltip; 