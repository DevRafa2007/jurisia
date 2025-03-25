import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <motion.div 
            className="w-16 h-16 border-t-4 border-b-4 border-primary-600 dark:border-primary-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <h2 className="text-xl font-bold text-primary-700 dark:text-primary-400 mb-2">
          JurisIA
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Verificando sua autenticação...
        </p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen; 