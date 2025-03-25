import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ref para elementos que precisam de animação ao entrar na viewport
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);

  // Animation controls para cada seção
  const heroControls = useAnimation();
  const featuresControls = useAnimation();
  const benefitsControls = useAnimation();
  const testimonialsControls = useAnimation();
  const pricingControls = useAnimation();
  const ctaControls = useAnimation();

  // Verificar se está na vista
  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const benefitsInView = useInView(benefitsRef, { once: true, amount: 0.2 });
  const testimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.2 });
  const pricingInView = useInView(pricingRef, { once: true, amount: 0.2 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.2 });

  // Efeito para garantir que estamos no lado do cliente
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Redirecionar para a página principal se já estiver autenticado
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Efeitos para disparar animações quando elementos entram na viewport
  useEffect(() => {
    if (heroInView) {
      heroControls.start('visible');
    }
    if (featuresInView) {
      featuresControls.start('visible');
    }
    if (benefitsInView) {
      benefitsControls.start('visible');
    }
    if (testimonialsInView) {
      testimonialsControls.start('visible');
    }
    if (pricingInView) {
      pricingControls.start('visible');
    }
    if (ctaInView) {
      ctaControls.start('visible');
    }
  }, [
    heroInView, heroControls, 
    featuresInView, featuresControls, 
    benefitsInView, benefitsControls,
    testimonialsInView, testimonialsControls,
    pricingInView, pricingControls,
    ctaInView, ctaControls
  ]);

  // Variantes de animação
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: "easeOut"
      }
    }
  };

  // Renderizar somente no cliente
  if (!mounted) {
    return null;
  }

  // Tema da página
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <Head>
        <title>JurisIA - Assistente Jurídico Inteligente</title>
        <meta name="description" content="JurisIA - Seu assistente jurídico com inteligência artificial para advogados brasileiros" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <link rel="icon" href="/favicon.ico" />
        <style>{`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes float-slow {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          .animate-float-slow {
            animation: float-slow 6s ease-in-out infinite;
          }
          
          /* Força cores básicas em caso de problemas com Tailwind */
          .text-primary-800 { color: #1f3666; }
          .dark .dark\:text-primary-300 { color: #92b9e3; }
          .text-secondary-600 { color: #bd842f; }
          .dark .dark\:text-secondary-400 { color: #dcb765; }
          .text-gray-700 { color: #374151; }
          .dark .dark\:text-gray-300 { color: #d1d5db; }
          .bg-primary-600 { background-color: #2f569e; }
          .text-white { color: #ffffff; }
        `}</style>
      </Head>

      <div className="bg-gradient-to-br from-white to-law-50 dark:from-law-900 dark:to-law-950 min-h-screen">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-80 dark:bg-law-900 dark:bg-opacity-80 backdrop-blur-md border-b border-law-200 dark:border-law-700 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo */}
              <div className="flex items-center">
                <div className="text-2xl font-serif font-bold text-primary-800 dark:text-primary-300 transition-colors duration-300">
                  JurisIA
                  <span className="ml-2 text-xs bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-300 px-2 py-1 rounded-full font-medium transition-colors duration-300">
                    Beta
                  </span>
                </div>
              </div>
              
              {/* Navegação e ações */}
              <div className="flex items-center space-x-1 sm:space-x-4">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-2 rounded-full hover:bg-law-100 dark:hover:bg-law-800 transition-colors duration-300"
                  aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                >
                  {isDark ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                
                <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300">
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Seção Hero */}
        <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24" ref={heroRef}>
          {/* Background shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-100 dark:bg-primary-900/20 opacity-50 blur-3xl"></div>
            <div className="absolute top-1/3 left-0 w-72 h-72 rounded-full bg-secondary-100 dark:bg-secondary-900/20 opacity-40 blur-3xl"></div>
            <div className="absolute -bottom-24 right-1/4 w-60 h-60 rounded-full bg-indigo-100 dark:bg-indigo-900/20 opacity-30 blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden"
              animate={heroControls}
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary-800 dark:text-primary-300 mb-6 leading-tight"
              >
                Seu <span className="text-secondary-600 dark:text-secondary-400">Assistente Jurídico</span> Impulsionado por Inteligência Artificial
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
              >
                Revolucione sua prática jurídica com um assistente inteligente que entende o direito brasileiro, gera documentos profissionais e responde suas consultas com precisão.
              </motion.p>
              
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <Link 
                  href="/login"
                  className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Começar agora
                </Link>
                <a 
                  href="#beneficios"
                  className="px-8 py-4 bg-white dark:bg-law-800 text-primary-600 dark:text-primary-400 hover:bg-law-50 dark:hover:bg-law-700 border border-primary-200 dark:border-law-700 font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  Conheça os benefícios
                </a>
              </motion.div>
              
              {/* Badges/Stats */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-wrap justify-center gap-6 mt-16"
              >
                <div className="flex items-center bg-white dark:bg-law-800 rounded-full px-5 py-2 shadow-md">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Mais de 1.000 usuários</span>
                </div>
                <div className="flex items-center bg-white dark:bg-law-800 rounded-full px-5 py-2 shadow-md">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Documentos 100% personalizáveis</span>
                </div>
                <div className="flex items-center bg-white dark:bg-law-800 rounded-full px-5 py-2 shadow-md">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Inteligência jurídica especializada</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-16 relative max-w-4xl mx-auto"
            >
              <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-law-200 dark:border-law-700">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                
                {/* Placeholder para imagem do dashboard */}
                <div className="aspect-[16/9] bg-gradient-to-br from-primary-100 to-secondary-50 dark:from-primary-900 dark:to-secondary-900 flex items-center justify-center">
                  <div className="p-6 max-w-lg text-center">
                    <div className="flex items-center mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="ml-auto w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="flex space-x-4">
                      <div className="w-1/3 bg-gray-100 dark:bg-gray-900 rounded-lg p-2">
                        <div className="h-2 bg-primary-200 dark:bg-primary-700 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                      <div className="w-2/3 bg-white dark:bg-law-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                        <div className="h-2 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2 mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Marcadores flutuantes */}
              <div className="absolute top-10 -right-6 bg-white dark:bg-law-800 rounded-lg shadow-lg p-3 animate-float-slow">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-secondary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Inteligência jurídica</span>
                </div>
              </div>
              
              <div className="absolute bottom-10 -left-6 bg-white dark:bg-law-800 rounded-lg shadow-lg p-3 animate-float">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Crie documentos em minutos</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Seção de Recursos */}
        <section className="py-16 md:py-24 relative overflow-hidden" ref={featuresRef}>
          {/* Background pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
            <div className="absolute inset-0" style={{ 
              backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden"
              animate={featuresControls}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-serif font-bold text-primary-800 dark:text-primary-300 mb-4"
              >
                Recursos <span className="text-secondary-600 dark:text-secondary-400">Poderosos</span>
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto"
              >
                Desfrute de ferramentas avançadas projetadas especificamente para profissionais jurídicos.
              </motion.p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              animate={featuresControls}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Recurso 1 */}
              <motion.div 
                variants={item}
                className="bg-white dark:bg-law-800 rounded-xl shadow-xl p-6 transition-transform duration-300 hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-primary-800 dark:text-primary-300 mb-2 text-center">Assistente Jurídico IA</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Dialogue com um assistente de IA treinado no direito brasileiro, capaz de responder consultas jurídicas complexas com referências precisas.
                </p>
              </motion.div>
              
              {/* Recurso 2 */}
              <motion.div 
                variants={item}
                className="bg-white dark:bg-law-800 rounded-xl shadow-xl p-6 transition-transform duration-300 hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-7 h-7 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-primary-800 dark:text-primary-300 mb-2 text-center">Gerador de Documentos</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Crie petições, contratos e documentos jurídicos em minutos com modelos pré-configurados e totalmente personalizáveis.
                </p>
              </motion.div>
              
              {/* Recurso 3 */}
              <motion.div 
                variants={item}
                className="bg-white dark:bg-law-800 rounded-xl shadow-xl p-6 transition-transform duration-300 hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-primary-800 dark:text-primary-300 mb-2 text-center">Pesquisa Jurídica</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Encontre jurisprudência, doutrina e legislação relevantes para seus casos com nossa pesquisa inteligente e contextual.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* Seção de Benefícios */}
        <section id="beneficios" className="py-16 md:py-24 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 relative" ref={benefitsRef}>
          {/* Elementos decorativos */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-300 dark:via-primary-700 to-transparent opacity-70"></div>
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-300 dark:via-primary-700 to-transparent opacity-70"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden"
              animate={benefitsControls}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-serif font-bold text-primary-800 dark:text-primary-300 mb-4"
              >
                Por que escolher o <span className="text-secondary-600 dark:text-secondary-400">JurisIA</span>?
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto"
              >
                Transforme sua prática jurídica com uma ferramenta que realmente entende suas necessidades.
              </motion.p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              animate={benefitsControls}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16"
            >
              <motion.div variants={item} className="relative">
                <div className="sticky top-24">
                  {/* Placeholder para imagem de benefícios */}
                  <div 
                    className="rounded-xl shadow-2xl w-full bg-gradient-to-br from-primary-100 to-secondary-50 dark:from-primary-900 dark:to-secondary-900 aspect-[4/3] flex items-center justify-center"
                  >
                    <div className="p-8 text-center">
                      <div className="w-full h-full bg-white dark:bg-law-800 rounded-lg shadow-lg p-6 opacity-90">
                        <div className="flex justify-between mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div className="flex space-x-1">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <div className="px-4 py-2 bg-primary-600 dark:bg-primary-700 rounded text-white text-xs">
                            Gerar Documento
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-primary-800 dark:text-primary-300 font-medium">
                        Interface amigável, resultados profissionais
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                variants={staggerContainer}
                className="space-y-8"
              >
                {/* Benefício 1 */}
                <motion.div 
                  variants={item}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-800 dark:text-primary-300 mb-2">Economize Tempo Precioso</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Reduza drasticamente o tempo gasto em pesquisas jurídicas e na redação de documentos. O que levaria horas agora pode ser feito em minutos.
                    </p>
                  </div>
                </motion.div>
                
                {/* Benefício 2 */}
                <motion.div 
                  variants={item}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-800 dark:text-primary-300 mb-2">Informação Jurídica Confiável</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Acesse conhecimento jurídico atualizado e preciso, baseado na legislação brasileira vigente e com referências às fontes consultadas.
                    </p>
                  </div>
                </motion.div>
                
                {/* Benefício 3 */}
                <motion.div 
                  variants={item}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-800 dark:text-primary-300 mb-2">Aumento de Produtividade</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Atenda mais clientes e entregue trabalhos de maior qualidade. Com JurisIA, você pode focar no que realmente importa: a estratégia jurídica.
                    </p>
                  </div>
                </motion.div>
                
                {/* Benefício 4 */}
                <motion.div 
                  variants={item}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-800 dark:text-primary-300 mb-2">Versatilidade Documental</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Crie diversos tipos de documentos jurídicos: petições, contratos, pareceres, recursos e muito mais, tudo com formatação profissional e linguagem adequada.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* Seção de Depoimentos */}
        <section className="py-16 md:py-24 relative overflow-hidden" ref={testimonialsRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden"
              animate={testimonialsControls}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-serif font-bold text-primary-800 dark:text-primary-300 mb-4"
              >
                O que dizem <span className="text-secondary-600 dark:text-secondary-400">nossos clientes</span>
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto"
              >
                Advogados de todo o Brasil já transformaram suas práticas jurídicas com o JurisIA.
              </motion.p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              animate={testimonialsControls}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Depoimento 1 */}
              <motion.div 
                variants={item}
                className="bg-white dark:bg-law-800 rounded-xl shadow-xl p-6 transition-transform duration-300 hover:-translate-y-2"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl font-serif font-bold text-primary-600 dark:text-primary-400">
                    RM
                  </div>
                </div>
                <div className="mb-4 text-yellow-500 flex justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 italic mb-6 text-center">
                  "O JurisIA revolucionou minha prática jurídica. Economizo horas na preparação de documentos e as consultas jurídicas são precisas e bem fundamentadas."
                </p>
                <div className="text-center">
                  <p className="font-bold text-primary-800 dark:text-primary-300">Dr. Ricardo Mendes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Advogado Tributarista</p>
                </div>
              </motion.div>
              
              {/* Depoimento 2 */}
              <motion.div 
                variants={item}
                className="bg-white dark:bg-law-800 rounded-xl shadow-xl p-6 transition-transform duration-300 hover:-translate-y-2"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center text-2xl font-serif font-bold text-secondary-600 dark:text-secondary-400">
                    CS
                  </div>
                </div>
                <div className="mb-4 text-yellow-500 flex justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 italic mb-6 text-center">
                  "O JurisIA se tornou indispensável em nosso escritório. Tivemos 70% mais eficiência na geração de documentos e maior segurança jurídica."
                </p>
                <div className="text-center">
                  <p className="font-bold text-primary-800 dark:text-primary-300">Dra. Camila Santos</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Sócia em Santos Advocacia</p>
                </div>
              </motion.div>
              
              {/* Depoimento 3 */}
              <motion.div 
                variants={item}
                className="bg-white dark:bg-law-800 rounded-xl shadow-xl p-6 transition-transform duration-300 hover:-translate-y-2"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl font-serif font-bold text-indigo-600 dark:text-indigo-400">
                    FL
                  </div>
                </div>
                <div className="mb-4 text-yellow-500 flex justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 italic mb-6 text-center">
                  "Como advogado em início de carreira, o JurisIA tem sido essencial para ganhar confiança nas consultas jurídicas e criar documentos profissionais."
                </p>
                <div className="text-center">
                  <p className="font-bold text-primary-800 dark:text-primary-300">Dr. Felipe Lima</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Advogado Generalista</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* Seção CTA */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-900 relative overflow-hidden" ref={ctaRef}>
          {/* Elementos decorativos */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <svg className="absolute right-0 top-0 transform translate-x-1/4 -translate-y-1/4" width="404" height="404" fill="none" viewBox="0 0 404 404">
              <defs>
                <pattern id="85737c0e-0916-41d7-917f-596dc7edfa29" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" className="text-white" fill="currentColor" fillOpacity="0.1" />
                </pattern>
              </defs>
              <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa29)" />
            </svg>
            <svg className="absolute bottom-0 left-0 transform -translate-x-1/4 translate-y-1/4" width="404" height="404" fill="none" viewBox="0 0 404 404">
              <defs>
                <pattern id="85737c0e-0916-41d7-917f-596dc7edfa30" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" className="text-white" fill="currentColor" fillOpacity="0.1" />
                </pattern>
              </defs>
              <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa30)" />
            </svg>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden"
              animate={ctaControls}
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-serif font-bold text-white mb-6"
              >
                Pronto para revolucionar sua <span className="text-secondary-300">prática jurídica</span>?
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-primary-100 mb-10 max-w-3xl mx-auto"
              >
                Junte-se a milhares de advogados que já estão economizando tempo e entregando trabalhos de maior qualidade com o JurisIA.
              </motion.p>
              
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <Link 
                  href="/login"
                  className="px-8 py-4 bg-white text-primary-700 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Começar agora
                </Link>
                <Link 
                  href="/login#auth-sign-up"
                  className="px-8 py-4 bg-transparent text-white hover:bg-white/10 border border-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  Criar uma conta
                </Link>
              </motion.div>
              
              {/* Features Highlights */}
              <motion.div 
                variants={fadeInUp}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white font-medium">Cadastro gratuito</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-white font-medium">Configuração em minutos</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-white font-medium">Suporte especializado</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* Rodapé */}
        <footer className="bg-white dark:bg-law-900 border-t border-law-200 dark:border-law-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-4">
                  <div className="text-2xl font-serif font-bold text-primary-800 dark:text-primary-300">
                    JurisIA
                    <span className="ml-2 text-xs bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-300 px-2 py-1 rounded-full font-medium">
                      Beta
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  Assistente jurídico inteligente para advogados brasileiros, combinando IA avançada com conhecimento jurídico especializado.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <span className="sr-only">GitHub</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Plataforma
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/login#auth-sign-up" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      Cadastro
                    </Link>
                  </li>
                  <li>
                    <Link href="/sobre" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      Sobre
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Legal
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      Termos de uso
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      Política de privacidade
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} JurisIA. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 