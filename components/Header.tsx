import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';

interface HeaderProps {
  sidebarAberta?: boolean;
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarAberta, toggleSidebar }) => {
  const { user, signOut, isLoading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Efeito para garantir renderização apenas no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    // Aqui você pode adicionar lógica para esconder elementos da UI para um modo de foco
    document.body.classList.toggle('focus-mode');
  };

  // Função para alternar entre temas
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // O tema atual para exibir os ícones corretos
  const currentTheme = mounted ? resolvedTheme : 'light';

  return (
    <header 
      className={`bg-white dark:bg-law-900 transition-all duration-300 fixed top-0 left-0 right-0 z-50 ${
        scrolled 
          ? 'shadow-elegant' 
          : 'shadow-sm'
      }`}
    >
      <div className="w-full mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 max-w-[98%] xl:max-w-[95%] 2xl:max-w-[90%]">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {/* Botão de menu para dispositivos móveis */}
            {toggleSidebar && (
              <button
                className="md:hidden mr-2 p-1.5 rounded-md hover:bg-law-200 dark:hover:bg-law-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300"
                onClick={toggleSidebar}
                aria-label={sidebarAberta ? "Fechar menu de conversas" : "Abrir menu de conversas"}
              >
                <div className="relative w-5 h-5 flex flex-col justify-center items-center">
                  <span className={`absolute block w-5 h-0.5 bg-primary-600 dark:bg-secondary-400 rounded-full transform transition-transform duration-300 ease-in-out ${sidebarAberta ? 'rotate-45' : '-translate-y-1.5'}`}></span>
                  <span className={`absolute block w-5 h-0.5 bg-primary-600 dark:bg-secondary-400 rounded-full transition-opacity duration-300 ease-in-out ${sidebarAberta ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`absolute block w-5 h-0.5 bg-primary-600 dark:bg-secondary-400 rounded-full transform transition-transform duration-300 ease-in-out ${sidebarAberta ? '-rotate-45' : 'translate-y-1.5'}`}></span>
                </div>
              </button>
            )}
            
            <Link href="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-serif font-bold text-primary-800 dark:text-primary-300 transition-colors duration-300">
                JurisIA
              </span>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-300 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium transition-colors duration-300">
                Beta
              </span>
            </Link>
          </div>
          
          <div className="flex items-center">
            <div className="text-xs sm:text-sm text-primary-700 dark:text-law-400 mr-2 sm:mr-4 hidden sm:block transition-colors duration-300 font-serif italic">
              Assistente Jurídico Inteligente
            </div>
            
            {/* Botão de modo foco */}
            <button 
              onClick={toggleFocusMode}
              className="hidden sm:block mr-2 p-1.5 rounded-md hover:bg-law-200 dark:hover:bg-law-800 transition-colors duration-300"
              title={focusMode ? "Sair do modo foco" : "Modo foco"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={focusMode 
                  ? "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" 
                  : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"} />
              </svg>
            </button>
            
            {!isLoading && (
              user ? (
                <div className="relative flex items-center">
                  <button 
                    className="flex items-center space-x-1 sm:space-x-2 focus:outline-none"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary-700 dark:bg-primary-800 flex items-center justify-center text-white transition-colors duration-300 shadow-sm">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block text-xs sm:text-sm text-primary-800 dark:text-law-300 transition-colors duration-300 font-medium">
                      {user.email?.split('@')[0]}
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform text-primary-700 dark:text-law-400 ${menuOpen ? 'rotate-180' : ''} transition-colors duration-300`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Botão de Modo Escuro (agora posicionado após o nome do usuário) */}
                  <button 
                    onClick={toggleTheme}
                    className="ml-2 sm:ml-4 p-1.5 rounded-md hover:bg-law-200 dark:hover:bg-law-800 transition-colors duration-300"
                    aria-label={currentTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                  >
                    {currentTheme === 'dark' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-primary-700 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Menu Dropdown do Perfil com animação */}
                  <div 
                    className={`absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white dark:bg-law-800 rounded-md shadow-elegant py-1 z-50 border border-law-200 dark:border-law-700 transition-all duration-300 transform origin-top-right ${
                      menuOpen 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
                  >
                    <div className="px-4 py-2 sm:py-3 text-xs sm:text-sm text-primary-800 dark:text-law-300 border-b border-law-200 dark:border-law-700 transition-colors duration-300 break-all font-medium">
                      {user.email}
                    </div>
                    <Link
                      href="/perfil"
                      className="block px-4 py-2 text-xs sm:text-sm text-primary-700 dark:text-law-300 hover:bg-law-100 dark:hover:bg-law-700 transition-colors duration-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-600 dark:text-law-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Perfil
                      </div>
                    </Link>
                    <Link
                      href="/favoritos"
                      className="block px-4 py-2 text-xs sm:text-sm text-primary-700 dark:text-law-300 hover:bg-law-100 dark:hover:bg-law-700 transition-colors duration-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Favoritos
                      </div>
                    </Link>
                    <Link
                      href="/sobre"
                      className="block px-4 py-2 text-xs sm:text-sm text-primary-700 dark:text-law-300 hover:bg-law-100 dark:hover:bg-law-700 transition-colors duration-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary-600 dark:text-law-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Sobre
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-law-100 dark:hover:bg-law-700 transition-colors duration-300 border-t border-law-200 dark:border-law-700 mt-1"
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sair
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <Link href="/login" className="btn btn-primary text-xs sm:text-sm py-1.5 px-3 sm:py-2 sm:px-4 dark:bg-primary-800 dark:hover:bg-primary-700 transition-colors duration-300 font-medium shadow-sm">
                    Entrar
                  </Link>
                  
                  {/* Botão de Modo Escuro (quando usuário não está logado) */}
                  <button 
                    onClick={toggleTheme}
                    className="ml-2 sm:ml-4 p-1.5 rounded-md hover:bg-law-200 dark:hover:bg-law-800 transition-colors duration-300"
                    aria-label={currentTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                  >
                    {currentTheme === 'dark' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-primary-700 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 