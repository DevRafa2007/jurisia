import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';

// Variantes de animação para elementos
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeInOut"
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

// Componente Feature Card
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    variants={fadeIn}
    className="bg-white dark:bg-law-900 p-6 rounded-lg shadow-elegant hover:shadow-elegant-lg transition-all duration-300 border border-law-200 dark:border-law-800"
  >
    <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
      {icon}
    </div>
    <h3 className="mb-2 text-lg font-serif font-bold text-primary-800 dark:text-primary-300">{title}</h3>
    <p className="text-law-700 dark:text-law-400 text-sm">{description}</p>
  </motion.div>
);

// Componente Testimonial
const Testimonial = ({ quote, author, role }: { quote: string, author: string, role: string }) => (
  <motion.div 
    variants={fadeIn}
    className="bg-white dark:bg-law-900 p-6 rounded-lg shadow-elegant border border-law-200 dark:border-law-800"
  >
    <svg className="h-8 w-8 text-secondary-500 mb-4" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
    </svg>
    <p className="text-law-700 dark:text-law-400 italic mb-4">{quote}</p>
    <div className="font-medium text-primary-800 dark:text-primary-300 font-serif">{author}</div>
    <div className="text-sm text-law-500 dark:text-law-500">{role}</div>
  </motion.div>
);

export default function Landing() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // Efeito para verificar montagem (para tema)
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Efeito para verificar parâmetro de logout
  useEffect(() => {
    const handleLogoutParameter = async () => {
      if (typeof window !== 'undefined' && window.location.search.includes('logout=true')) {
        console.log('Detectado parâmetro de logout, limpando cookies...');
        
        // Limpar cookie do Supabase manualmente
        document.cookie = 'supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        
        // Limpar localStorage
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refreshToken');
        
        // Remover os parâmetros da URL para evitar loops
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Recarregar a página para garantir estado limpo
        window.location.reload();
      }
    };
    
    handleLogoutParameter();
  }, [router.query]);

  // Redirecionar para a página principal se já estiver logado
  useEffect(() => {
    if (!isLoading && user && user.id) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // O tema atual para exibir os ícones corretos
  const currentTheme = mounted ? resolvedTheme : 'light';
  
  // Função para alternar entre temas
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Se estiver carregando, mostra um loading simples
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-law-50 dark:bg-law-900">
        <div className="loading">
          <div className="loading-dot bg-primary-600 dark:bg-primary-400"></div>
          <div className="loading-dot bg-primary-600 dark:bg-primary-400"></div>
          <div className="loading-dot bg-primary-600 dark:bg-primary-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-law-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <Head>
        <title>JurisIA - Assistente Jurídico Inteligente</title>
        <meta 
          name="description" 
          content="JurisIA: Assistente jurídico inteligente com IA para advogados brasileiros. Geração de documentos, pesquisa jurídica e muito mais." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="relative z-10 bg-white dark:bg-law-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-serif font-bold text-primary-800 dark:text-primary-300">
              JurisIA
            </span>
            <span className="ml-1 sm:ml-2 text-xs sm:text-sm bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-300 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
              Beta
            </span>
          </div>
          
          <div className="flex items-center">
            {/* Botão de tema */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-law-200 dark:hover:bg-law-800 transition-colors duration-300 mr-4"
              aria-label={currentTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {currentTheme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <Link 
              href="/login" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-300"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
        {/* Padrões decorativos de fundo */}
        <div className="absolute inset-0 z-0 opacity-30 dark:opacity-10">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-primary-400 dark:bg-primary-700 blur-3xl"></div>
          <div className="absolute left-0 bottom-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-secondary-400 dark:bg-secondary-700 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 
              variants={fadeIn}
              className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-primary-800 dark:text-primary-300 mb-6 leading-tight"
            >
              Inteligência Artificial <br className="hidden sm:block" />
              a serviço da <span className="text-secondary-600 dark:text-secondary-400">advocacia</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="max-w-2xl mx-auto text-lg text-law-700 dark:text-law-300 mb-8"
            >
              Potencialize sua prática jurídica com nosso assistente de IA especializado na legislação brasileira.
              Economize tempo, aumente sua produtividade e ofereça um atendimento superior.
            </motion.p>
            
            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-300"
              >
                Começar agora
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link 
                href="/sobre" 
                className="inline-flex items-center justify-center px-5 py-3 border border-law-300 dark:border-law-700 text-base font-medium rounded-md shadow-sm text-primary-700 dark:text-primary-300 bg-white dark:bg-law-900 hover:bg-law-100 dark:hover:bg-law-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-300"
              >
                Saiba mais
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Imagem/Mockup do aplicativo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.8,
                ease: "easeOut",
                delay: 0.5
              }
            }}
            className="mt-20 mx-auto max-w-4xl relative"
          >
            <div className="relative w-full overflow-hidden rounded-lg shadow-2xl bg-white dark:bg-law-900 border border-law-200 dark:border-law-700">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <div className="flex space-x-1.5 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 h-4 bg-white dark:bg-gray-700 rounded-md"></div>
              </div>
              <div className="p-4 h-96 flex justify-between">
                <div className="w-1/4 bg-law-100 dark:bg-law-800 rounded-md opacity-60"></div>
                <div className="w-3/4 pl-4 flex flex-col">
                  <div className="h-8 w-3/4 bg-primary-100 dark:bg-primary-900 rounded-md mb-4 opacity-60"></div>
                  <div className="flex-1 bg-law-100 dark:bg-law-800 rounded-md opacity-60"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-law-100 dark:bg-law-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeIn}
              className="text-2xl sm:text-3xl font-serif font-bold text-primary-800 dark:text-primary-300 mb-4"
            >
              Recursos que transformam sua rotina jurídica
            </motion.h2>
            <motion.p 
              variants={fadeIn}
              className="max-w-3xl mx-auto text-law-700 dark:text-law-400"
            >
              JurisIA combina inteligência artificial avançada com conhecimento jurídico brasileiro para oferecer ferramentas que realmente fazem diferença no seu dia a dia.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Geração de Documentos"
              description="Crie petições, contratos e pareceres em segundos com base em inputs simples. Economize horas de trabalho manual."
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              title="Pesquisa Inteligente"
              description="Encontre leis, jurisprudências e doutrinas relevantes através de linguagem natural. Obtenha referências precisas e atualizadas."
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
              title="Assistente Jurídico"
              description="Esclareça dúvidas jurídicas complexas com nosso assistente especializado em direito brasileiro. Respostas fundamentadas e contextualizadas."
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              title="Análise de Contratos"
              description="Identifique riscos, cláusulas prejudiciais e inconsistências em contratos com precisão. Economize tempo na revisão documental."
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              title="Organização Inteligente"
              description="Mantenha todos os seus documentos organizados com categorização automática e acesso rápido aos mais importantes."
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Economia de Tempo"
              description="Reduza drasticamente o tempo gasto em tarefas repetitivas e foque no que realmente importa: a estratégia jurídica e o atendimento ao cliente."
            />
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeIn}
              className="text-2xl sm:text-3xl font-serif font-bold text-primary-800 dark:text-primary-300 mb-4"
            >
              O que nossos usuários dizem
            </motion.h2>
            <motion.p 
              variants={fadeIn}
              className="max-w-3xl mx-auto text-law-700 dark:text-law-400"
            >
              Advogados e profissionais do direito já estão transformando sua prática com JurisIA.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <Testimonial 
              quote="O JurisIA revolucionou minha forma de trabalhar. Economizo horas na elaboração de documentos e pesquisas jurídicas."
              author="Dr. Ricardo Almeida"
              role="Advogado Tributarista"
            />
            
            <Testimonial 
              quote="Como advogada solo, o JurisIA é como ter um assistente jurídico disponível 24/7. A geração de documentos é impressionante."
              author="Dra. Camila Santos"
              role="Advogada Civilista"
            />
            
            <Testimonial 
              quote="A precisão das pesquisas e citações jurídicas é notável. Ferramenta indispensável para qualquer escritório moderno."
              author="Dr. Marcos Oliveira"
              role="Sócio de Escritório"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-primary-700 dark:bg-primary-900 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-primary-500 dark:bg-primary-700 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-secondary-500 dark:bg-secondary-700 opacity-20 blur-3xl"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeIn}
              className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6"
            >
              Pronto para transformar sua advocacia?
            </motion.h2>
            
            <motion.p 
              variants={fadeIn}
              className="text-primary-100 mb-8 text-lg"
            >
              Experimente o JurisIA hoje e descubra como a inteligência artificial pode potencializar sua prática jurídica.
            </motion.p>
            
            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-700 focus:ring-white transition-colors duration-300"
              >
                Criar minha conta
              </Link>
              <Link 
                href="/contato" 
                className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-700 focus:ring-white transition-colors duration-300"
              >
                Fale conosco
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-law-900 border-t border-law-200 dark:border-law-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-lg font-serif font-bold text-primary-800 dark:text-primary-300">
                JurisIA
              </span>
              <span className="ml-1 text-xs bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-300 px-1 py-0.5 rounded-full font-medium">
                Beta
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-law-700 dark:text-law-400">
              <Link href="/sobre" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Sobre
              </Link>
              <Link href="/contato" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Contato
              </Link>
              <Link href="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Login
              </Link>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-law-200 dark:border-law-800 text-xs text-center text-law-500 dark:text-law-500">
            © {new Date().getFullYear()} JurisIA. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
} 