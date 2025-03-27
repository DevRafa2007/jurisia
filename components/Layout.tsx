import React, { ReactNode, useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Header from './Header';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '../contexts/AuthContext';

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
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  
  // Referência para o header
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Verificar se estamos na página principal
  const isHomePage = router.pathname === '/';

  useEffect(() => {
    setMounted(true);
    
    // Detectar se é dispositivo móvel
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
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

    // Prevenir rolagem na página inicial apenas se for a página principal
    const preventScrolling = () => {
      if (isHomePage) {
        window.scrollTo(0, 0);
      }
    };

    // Adicione um evento para manter a página no topo apenas se for a página principal
    if (isHomePage) {
      window.addEventListener('scroll', preventScrolling, { passive: false });
      
      // Adicionar classe no-scroll apenas na página principal
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
    } else {
      // Remover classe no-scroll em outras páginas
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    }

    // Limpar o evento ao desmontar o componente
    return () => {
      window.removeEventListener('resize', handleResize);
      if (isHomePage) {
        window.removeEventListener('scroll', preventScrolling);
      }
      // Remover classe no-scroll ao desmontar
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    };
  }, [isHomePage]);

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/landing-nova');
  };

  // Esta função será passada para o botão Nova Conversa no header
  const handleNovaConversaClick = () => {
    // Verificar se estamos na página de chat
    if (router.pathname === '/') {
      // Procuramos por uma função handleNovaConversa no contexto pai (página de chat)
      if (window && typeof (window as any).handleNovaConversa === 'function') {
        (window as any).handleNovaConversa();
      } else {
        // Fallback: se a função não existir, apenas recarregamos a página
        router.push('/?new=true');
      }
    } else {
      // Se não estamos na página de chat, navegamos para lá com parâmetro para nova conversa
      router.push('/?new=true');
    }
  };

  // Não renderizar o tema até que o componente esteja montado
  // para evitar inconsistência entre servidor e cliente
  if (!mounted) return null;

  return (
    <div className={`flex flex-col bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300 min-h-screen ${isHomePage ? 'h-screen overflow-hidden' : ''}`}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Padrão de fundo */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      {router.pathname !== '/landing-nova' && router.pathname !== '/login' && router.pathname !== '/cadastro' && (
        <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border-b border-gray-200/40 dark:border-gray-800/40 py-2 px-4 flex items-center justify-between sticky top-0 left-0 right-0 z-[100] sm:z-50">
          <div className="flex items-center gap-2">
            {/* Botão de abrir/fechar sidebar (somente na página inicial) ou botão de voltar */}
            {router.pathname === '/' && toggleSidebar ? (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300 transition-colors duration-200"
                aria-label={sidebarAberta ? "Fechar barra lateral" : "Abrir barra lateral"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            ) : router.pathname !== '/' && (
              <Link
                href="/"
                className="p-2 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300 transition-colors duration-200"
                aria-label="Voltar para o chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
            )}
            
            {/* Texto "Nova conversa" (somente na página inicial) */}
            {router.pathname === '/' && (
              <button
                onClick={handleNovaConversaClick}
                className="flex items-center gap-2 py-2 px-3 text-sm rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300 transition-colors duration-200 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {!isMobile && "Nova conversa"}
              </button>
            )}
          </div>
          
          {/* Logo centralizado */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="text-primary-700 dark:text-primary-300 font-serif text-xl font-medium">
              JurisIA
            </Link>
          </div>
          
          <div className="flex items-center">
            {mounted && (
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-800/70 text-gray-600 dark:text-gray-300 transition-colors duration-200"
                aria-label="Alternar modo escuro"
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}
            
            {/* Botão de documentos */}
            <Link 
              href="/documentos"
              className="p-2 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-800/70 text-gray-600 dark:text-gray-300 transition-colors duration-200 ml-1"
              aria-label="Acessar documentos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </Link>
            
            {user && (
              <div className="relative ml-2">
                <button 
                  onClick={() => setMenuAberto(!menuAberto)}
                  className="flex items-center p-1 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-800/70 transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-200 font-medium">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                <AnimatePresence>
                  {menuAberto && (
                    <motion.div 
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-elegant border border-gray-200 dark:border-gray-700 py-1 z-50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">{user.email}</p>
                      </div>
                      <Link 
                        href="/perfil"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Perfil
                      </Link>
                      <Link 
                        href="/sobre"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Sobre
                      </Link>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Sair
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>
      )}

      <main className="flex-grow flex flex-col overflow-auto h-[calc(100vh-60px)] transition-all duration-300 ease-in-out relative">
        {children}
      </main>
    </div>
  );
};

export default Layout; 