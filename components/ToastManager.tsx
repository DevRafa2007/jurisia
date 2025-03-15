import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastManager: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Estilo padrão para todos os toasts
        style: {
          borderRadius: '8px',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
        },
        // Configurações específicas para cada tipo de toast
        success: {
          duration: 4000,
          style: {
            background: '#E9F6F0',
            color: '#166534',
            border: '1px solid #DCFCE7',
          },
          iconTheme: {
            primary: '#22C55E',
            secondary: '#ffffff',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FEE2E2',
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: '#ffffff',
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #DBEAFE',
          },
        },
      }}
    />
  );
};

export default ToastManager; 