import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, signOut, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-700">
              JurisIA
            </Link>
            <span className="ml-2 text-sm bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full">
              Beta
            </span>
          </div>
          
          <div className="flex items-center">
            <div className="text-sm text-gray-600 mr-4 hidden md:block">
              Assistente Jurídico com IA
            </div>
            
            {!isLoading && (
              user ? (
                <div className="relative">
                  <button 
                    className="flex items-center space-x-2 focus:outline-none"
                    onClick={() => setMenuOpen(!menuOpen)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block text-sm text-gray-700">
                      {user.email?.split('@')[0]}
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        {user.email}
                      </div>
                      <Link
                        href="/perfil"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setMenuOpen(false)}
                      >
                        Perfil
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="btn btn-primary text-sm">
                  Entrar
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 