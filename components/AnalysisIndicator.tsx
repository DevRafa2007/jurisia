import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisIndicatorProps {
  isVisible: boolean;
  mensagem?: string;
  posicao?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

const AnalysisIndicator: React.FC<AnalysisIndicatorProps> = ({
  isVisible,
  mensagem = 'Analisando seu texto...',
  posicao = 'bottom-right'
}) => {
  // Definir classes com base na posição
  const posicaoClasses = {
    'top-right': 'top-4 right-24',
    'bottom-right': 'bottom-24 right-6',
    'bottom-left': 'bottom-24 left-6',
    'top-left': 'top-4 left-6'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed ${posicaoClasses[posicao]} z-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-3 px-4 flex items-center max-w-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Animação de "pulsação" do cérebro */}
          <motion.div
            className="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-full mr-3 flex-shrink-0"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </motion.div>
          
          <div className="flex-1">
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {mensagem}
            </div>
            
            {/* Barra de progresso animada */}
            <div className="mt-2 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500 rounded-full"
                animate={{
                  width: ['0%', '30%', '70%', '90%', '60%', '90%', '100%'],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnalysisIndicator; 