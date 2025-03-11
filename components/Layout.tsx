import React, { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';

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
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header sidebarAberta={sidebarAberta} toggleSidebar={toggleSidebar} />

      <main className="flex-grow w-full mx-auto px-1 sm:px-2 md:px-4 my-2 sm:my-4 md:my-6 max-w-[98%] xl:max-w-[95%] 2xl:max-w-[90%]">
        {children}
      </main>

      <footer className="bg-white dark:bg-gray-800 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 shadow-inner transition-colors duration-300">
        <div className="w-full mx-auto px-1 sm:px-2 md:px-4 max-w-[98%] xl:max-w-[95%] 2xl:max-w-[90%]">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-1 sm:mb-0 text-center sm:text-left">
              © {new Date().getFullYear()} JurisIA - Assistente Jurídico com IA
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span>Versão Beta</span>
              <a
                href="mailto:contato@jurisia.com.br"
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