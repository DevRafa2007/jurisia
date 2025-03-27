import { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-auto">
      <div className="relative">
        {/* Padrão de fundo */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
        
        {/* Conteúdo principal */}
        <div className="relative min-h-screen flex flex-col">
          {/* Cabeçalho */}
          <header className="flex items-center justify-between p-6">
            <Link href="/landing-nova" className="flex items-center">
              <span className="text-3xl font-extrabold tracking-tight text-primary-600 dark:text-primary-400 font-display">
                JurisIA
              </span>
            </Link>
          </header>

          {/* Conteúdo central */}
          <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
            <div className="w-full max-w-md">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative z-10">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {subtitle}
                    </p>
                  )}
                </div>

                {children}
              </div>
            </div>
          </main>

          {/* Rodapé */}
          <footer className="py-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} JurisIA. Todos os direitos reservados.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
} 