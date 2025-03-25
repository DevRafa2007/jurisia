import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from 'next-themes';
import { AnimatePresence } from 'framer-motion';
import ToastManager from '../components/ToastManager';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Importar o componente de loading dinamicamente para evitar problemas de SSR
const LoadingScreen = dynamic(() => import('../components/LoadingScreen'), {
  ssr: false,
});

// Componente wrapper que verifica a autenticação
function AuthenticatedApp({ Component, pageProps }: AppProps) {
  const { isLoading, authChecked } = useAuth();
  
  // Mostrar tela de carregamento enquanto verifica a autenticação
  if (isLoading && !authChecked) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </Head>
      {/* AnimatePresence permite animar componentes quando entram/saem do DOM */}
      <AnimatePresence mode="wait">
        <Component {...pageProps} />
      </AnimatePresence>
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  // Usar o useState para garantir que não aconteça renderização no servidor
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Renderizar um layout mínimo enquanto o componente não estiver montado no cliente
  if (!isMounted) {
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        </Head>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700"></div>
        </div>
      </>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AuthenticatedApp Component={Component} pageProps={pageProps} />
        {/* Gerenciador de notificações toast */}
        <ToastManager />
      </AuthProvider>
    </ThemeProvider>
  );
} 