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
  disableScrollLock?: boolean;
};

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'JurisIA - Assistente Jurídico com IA',
  description = 'Assistente jurídico inteligente para advogados brasileiros, powered by Groq',
  sidebarAberta,
  toggleSidebar,
  disableScrollLock = false
}) => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  
  // Verificar se estamos na página principal
  const isHomePage = router.pathname === '/';
  
  // Determinar se o scroll deve ser travado (apenas na página principal e em celulares)
  const shouldLockScroll = isMobile && isHomePage && !disableScrollLock;

  useEffect(() => {
    // Função para calcular a altura do header
    const calcHeaderHeight = () => {
      const headerElement = document.querySelector('header');
      if (headerElement) {
        setHeaderHeight(headerElement.offsetHeight);
      }
    };

    // Função para verificar se é dispositivo móvel
    const checkMobile = () => {
      const mobileBreakpoint = 640; // sm breakpoint do Tailwind
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    // Calcular a altura inicial e verificar dispositivo
    calcHeaderHeight();
    checkMobile();

    // Recalcular ao redimensionar a janela
    const handleResize = () => {
      calcHeaderHeight();
      checkMobile();
    };

    window.addEventListener('resize', handleResize);

    // Aplicar CSS para o modo móvel
    const applyMobileStyles = () => {
      if (shouldLockScroll) {
        // Adicionar regra de estilo para permitir scroll apenas em elementos específicos
        const styleElement = document.createElement('style');
        styleElement.id = 'mobileScrollLock';
        styleElement.innerHTML = `
          body {
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100%;
          }
          /* Permitir scroll nos elementos internos específicos */
          .overflow-y-auto {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
          }
        `;
        document.head.appendChild(styleElement);
      } else {
        // Remover regras quando não estiver no modo móvel ou não for a página principal
        const existingStyle = document.getElementById('mobileScrollLock');
        if (existingStyle) {
          existingStyle.remove();
        }
      }
    };

    applyMobileStyles();

    // Limpar o evento ao desmontar o componente
    return () => {
      window.removeEventListener('resize', handleResize);
      // Remover estilos ao desmontar
      const existingStyle = document.getElementById('mobileScrollLock');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isMobile, shouldLockScroll]);

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header sidebarAberta={sidebarAberta} toggleSidebar={toggleSidebar} />

      <main 
        className="w-full mx-auto px-1 sm:px-2 md:px-4 max-w-[98%] xl:max-w-[95%] 2xl:max-w-[90%]"
        style={{ 
          marginTop: `calc(${headerHeight}px + 0.75rem)`,
          paddingTop: '0.25rem',
          paddingBottom: '3rem',
          minHeight: `calc(100vh - ${headerHeight}px - 0.75rem)`,
          height: shouldLockScroll ? '100vh' : 'auto'
        }}
      >
        {children}
      </main>

      <footer className="hidden sm:block bg-white dark:bg-gray-800 py-1 sm:py-2 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 shadow-inner transition-colors duration-300">
        <div className="w-full mx-auto px-1 sm:px-2 md:px-4 max-w-[98%] xl:max-w-[95%] 2xl:max-w-[90%]">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-1 sm:space-y-0">
            <div className="text-center sm:text-left">
              © {new Date().getFullYear()} JurisIA
            </div>
            <div className="text-center text-[9px] sm:text-xs text-gray-500 dark:text-gray-500">
              Desenvolvido por: Rafael Fonseca
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:inline">Versão Beta</span>
              <a
                href="mailto:webdevrafaelf@gmail.com"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-300"
              >
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 