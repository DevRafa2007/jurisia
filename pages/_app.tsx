import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function App({ Component, pageProps }: AppProps) {
  // Usar o useState para garantir que não aconteça renderização no servidor
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Não renderizar os providers até que o componente esteja montado no cliente
  if (!isMounted) {
    return null; // ou um loading state
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </AuthProvider>
  );
} 