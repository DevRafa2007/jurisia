import React, { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'JurisIA - Assistente Jurídico com IA',
  description = 'Assistente jurídico inteligente para advogados brasileiros, powered by Groq',
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">{children}</main>
        <footer className="bg-gray-100 py-4 text-center text-sm text-gray-600">
          <div className="container-custom">
            JurisIA &copy; {new Date().getFullYear()} - Assistente Jurídico com IA para advogados brasileiros
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout; 