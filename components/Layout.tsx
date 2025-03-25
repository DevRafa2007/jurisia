import React, { ReactNode, useEffect, useState } from 'react';
import Head from 'next/head';
import Header from './Header';
import { useRouter } from 'next/router';

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  sidebarAberta?: boolean;
  toggleSidebar?: () => void;
};

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'JurisIA - Assistente Jurídico com IA',
  description = 'Assistente jurídico inteligente para advogados brasileiros, powered by Groq',
  sidebarAberta,
  toggleSidebar
}) => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const router = useRouter();
  
  // Verificar se estamos na página principal
  const isHomePage = router.pathname === '/';

  useEffect(() => {
    // Garantir que a página comece no topo - tanto na montagem inicial quanto em atualizações
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      // Para navegadores modernos
      document.documentElement.scrollTop = 0;
      // Para dispositivos móveis
      document.body.scrollTop = 0;
    }
    
    // Função para calcular a altura do header
    const calcHeaderHeight = () => {
      const headerElement = document.querySelector('header');
      if (headerElement) {
        setHeaderHeight(headerElement.offsetHeight);
      }
    };

    // Calcular a altura inicial
    calcHeaderHeight();

    // Recalcular ao redimensionar a janela
    const handleResize = () => {
      calcHeaderHeight();
    };

    window.addEventListener('resize', handleResize);

    // Prevenir rolagem na página inicial
    const preventScrolling = () => {
      if (isHomePage) {
        window.scrollTo(0, 0);
      }
    };

    // Adicione um evento para manter a página no topo
    if (isHomePage) {
      window.addEventListener('scroll', preventScrolling, { passive: false });
    }

    // Limpar o evento ao desmontar o componente
    return () => {
      window.removeEventListener('resize', handleResize);
      if (isHomePage) {
        window.removeEventListener('scroll', preventScrolling);
      }
    };
  }, [isHomePage]);

  return (
    <div className="flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300 min-h-screen">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Padrão de fundo */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      <Header sidebarAberta={sidebarAberta} toggleSidebar={toggleSidebar} />

      <main 
        className="relative w-full mx-auto px-1 sm:px-2 md:px-4 max-w-[98%] xl:max-w-[95%] 2xl:max-w-[90%] flex-grow"
        style={{ 
          marginTop: `calc(${headerHeight}px + 0.75rem)`,
          paddingTop: '0.25rem',
          paddingBottom: '1rem', // Reduzido para compensar a remoção do footer
          minHeight: `calc(100vh - ${headerHeight}px - 1rem)`
        }}
      >
        {children}
      </main>
      
      <div className="bg-gray-50 dark:bg-gray-900 w-full h-1"></div>
    </div>
  );
};

export default Layout; 