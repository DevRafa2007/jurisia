import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';
import { supabase } from '../utils/supabase';

interface HeaderProps {
  sidebarAberta?: boolean;
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarAberta, toggleSidebar }) => {
  const { user, signOut, isLoading } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Efeito para garantir renderização apenas no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Efeito para buscar o nome do usuário
  useEffect(() => {
    const getUserName = async () => {
      if (!user) return;
      
      try {
        // Verificar primeiro se o nome está nos metadados do usuário
        const userMetadata = user.user_metadata as { nome_completo?: string } | null;
        if (userMetadata?.nome_completo) {
          setUserName(userMetadata.nome_completo);
          return;
        }
        
        // Se não estiver nos metadados, tenta buscar na tabela de perfis
        const { data, error } = await supabase
          .from('perfis')
          .select('nome_completo')
          .eq('usuario_id', user.id)
          .single();
        
        if (error) {
          console.error('Erro ao buscar perfil:', error);
          return;
        }
        
        if (data?.nome_completo) {
          setUserName(data.nome_completo);
        }
      } catch (error) {
        console.error('Erro ao buscar nome do usuário:', error);
      }
    };
    
    getUserName();
  }, [user]);

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

  // Função para alternar entre temas
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // O tema atual para exibir os ícones corretos
  const currentTheme = mounted ? resolvedTheme : 'light';

  // Função para fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (menuOpen && !target.closest('.user-menu-container')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Função para formatar o nome do usuário para exibição
  const formatDisplayName = () => {
    if (userName) {
      // Se houver um nome, exibe apenas o primeiro nome
      const firstName = userName.split(' ')[0];
      return firstName;
    }
    
    // Fallback para o email como antes
    return user?.email?.split('@')[0] || '';
  };

  // Função para obter a inicial para o avatar
  const getInitial = () => {
    if (userName) {
      return userName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

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
            {/* Botão de menu para dispositivos móveis com feedback tátil */}
            {toggleSidebar && (
              <button
                className="md:hidden mr-2 p-1.5 rounded-md hover:bg-law-200 dark:hover:bg-law-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300 active:scale-95"
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
            
            <Link href="/" className="flex items-center group">
              <span className="text-xl sm:text-2xl font-serif font-bold text-primary-800 dark:text-primary-300 transition-colors duration-300 group-hover:text-primary-600 dark:group-hover:text-primary-200">
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
            
            {!isLoading && (
              user ? (
                <div className="relative flex items-center user-menu-container">
                  <button 
                    className="flex items-center space-x-1 sm:space-x-2 focus:outline-none"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary-700 dark:bg-primary-800 flex items-center justify-center text-white transition-colors duration-300 shadow-sm hover:bg-primary-600 dark:hover:bg-primary-700">
                      {getInitial()}
                    </div>
                    <span className="hidden md:block text-xs sm:text-sm text-primary-800 dark:text-law-300 transition-colors duration-300 font-medium">
                      {formatDisplayName()}
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
                  
                  {/* Botão de Modo Escuro com tooltip */}
                  <div className="relative">
                    <button 
                      onClick={toggleTheme}
                      className="ml-2 sm:ml-4 p-1.5 rounded-md hover:bg-law-200 dark:hover:bg-law-800 transition-colors duration-300 active:scale-95"
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
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-law-800 text-white rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {currentTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                    </div>
                  </div>
                  
                  {/* Menu Dropdown do Perfil com animação */}
                  <div 
                    className={`absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white dark:bg-law-800 rounded-md shadow-elegant py-1 z-50 border border-law-200 dark:border-law-700 transition-all duration-300 transform origin-top-right ${
                      menuOpen 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
                  >
                    <div className="px-4 py-2 sm:py-3 text-xs sm:text-sm text-primary-800 dark:text-law-300 border-b border-law-200 dark:border-law-700 transition-colors duration-300 break-all font-medium">
                      {userName ? (
                        <div>
                          <div className="font-semibold text-primary-700 dark:text-primary-400">{userName}</div>
                          <div className="text-xs mt-1 text-law-500 dark:text-law-400">{user.email}</div>
                        </div>
                      ) : (
                        user.email
                      )}
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
                  
                  {/* Botão de Modo Escuro com tooltip */}
                  <div className="relative group">
                    <button 
                      onClick={toggleTheme}
                      className="ml-2 sm:ml-4 p-1.5 rounded-md hover:bg-law-200 dark:hover:bg-law-800 transition-colors duration-300 active:scale-95"
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
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-law-800 text-white rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {currentTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                    </div>
                  </div>
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