import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from 'next-themes';
import { AnimatePresence } from 'framer-motion';
import ToastManager from '../components/ToastManager';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Wrapper para redirecionamento baseado em autenticação
function AuthWrapper({ Component, pageProps }: AppProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [redirectionChecked, setRedirectionChecked] = useState(false);
  
  useEffect(() => {
    if (isLoading) return; // Aguarda a conclusão do carregamento da autenticação
    
    // Atrasa ligeiramente o redirecionamento para garantir que a página tenha tempo de carregar
    const redirectionTimeout = setTimeout(() => {
      // Se o usuário não estiver logado e tentar acessar a página inicial, redirecionar para landing
      if (!user && router.pathname === '/') {
        router.replace('/landing');
      }
      
      // Se o usuário estiver logado e tentar acessar a landing page, redirecionar para home
      if (user && router.pathname === '/landing') {
        router.replace('/');
      }
      
      setRedirectionChecked(true);
    }, 200);
    
    return () => clearTimeout(redirectionTimeout);
  }, [user, isLoading, router]);

  // Renderizar a página normalmente
  return <Component {...pageProps} />;
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
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        </Head>
        {/* AnimatePresence permite animar componentes quando entram/saem do DOM */}
        <AnimatePresence mode="wait">
          <AuthWrapper Component={Component} {...pageProps} />
        </AnimatePresence>
        {/* Gerenciador de notificações toast */}
        <ToastManager />
      </AuthProvider>
    </ThemeProvider>
  );
} 