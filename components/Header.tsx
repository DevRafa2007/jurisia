import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Image from 'next/image';

interface HeaderProps {
  toggleSidebar?: () => void;
  sidebarAberta?: boolean;
}

export default function Header({ toggleSidebar, sidebarAberta }: HeaderProps) {
  const { user, perfil, isLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-3 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 isolate transition-colors duration-300">
      <div className="flex items-center">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar}
            className="mr-3 sm:mr-4 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
            aria-label={sidebarAberta ? "Fechar menu lateral" : "Abrir menu lateral"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300 transition-colors duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {sidebarAberta ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                  className="transition-transform duration-300 ease-in-out origin-center"
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M4 6h16M4 12h16M4 18h16" 
                  className="transition-all duration-500 ease-in-out origin-center" 
                />
              )}
            </svg>
          </button>
        )}
        
        <Link href="/" className="text-xl sm:text-2xl font-bold text-primary-700 dark:text-primary-400 transition-colors duration-300">
          JurisIA
        </Link>
        <span className="ml-1 sm:ml-2 text-xs sm:text-sm bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-300 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors duration-300">
          Beta
        </span>
      </div>
      
      <div className="flex items-center">
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mr-2 sm:mr-4 hidden sm:block transition-colors duration-300">
          Assistente Jurídico
        </div>
        
        {!isLoading && (
          user ? (
            <div className="relative flex items-center">
              <button 
                className="flex items-center space-x-1 sm:space-x-2 focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {perfil?.url_foto ? (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden relative">
                    <Image 
                      src={perfil.url_foto} 
                      alt="Foto de perfil" 
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-full"
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary-600 dark:bg-primary-700 flex items-center justify-center text-white transition-colors duration-300">
                    {(perfil?.nome_completo?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                  </div>
                )}
                <span className="hidden md:block text-xs sm:text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  {perfil?.nome_completo || user.email?.split('@')[0]}
                </span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform text-gray-700 dark:text-gray-300 ${menuOpen ? 'rotate-180' : ''} transition-colors duration-300`} 
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
                className="ml-2 sm:ml-4 p-1 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 active:scale-95"
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 sm:mt-2 w-40 sm:w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-[100] border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                  <div className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 break-all">
                    {perfil?.nome_completo && (
                      <div className="font-semibold mb-1">{perfil.nome_completo}</div>
                    )}
                    <div className="text-xs text-gray-600 dark:text-gray-400">{user.email}</div>
                  </div>
                  <Link
                    href="/perfil"
                    className="block px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Perfil
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <Link href="/login" className="btn btn-primary text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3 dark:bg-primary-700 dark:hover:bg-primary-800 transition-colors duration-300">
                Entrar
              </Link>
              
              {/* Botão de Modo Escuro (quando usuário não está logado) */}
              <button 
                onClick={toggleTheme}
                className="ml-2 sm:ml-4 p-1 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 active:scale-95"
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          )
        )}
      </div>
    </header>
  );
} 