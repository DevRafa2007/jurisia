import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';

// Importar outros componentes do framer-motion individualmente para evitar problemas de compatibilidade
const useAnimation = motion.useAnimation;
const useInView = motion.useInView;
const AnimatePresence = motion.AnimatePresence;

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
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    );
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
        `}</style>
      </Head>

      <div className="bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center">
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                  JurisIA
                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                    Beta
                  </span>
                </div>
              </div>
              
              {/* Navegação e ações */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                >
                  {isDark ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                
                <Link 
                  href="/login" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Seção Hero */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-24" ref={heroRef}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-800 dark:text-blue-300 mb-6">
              Seu <span className="text-purple-600 dark:text-purple-400">Assistente Jurídico</span> Impulsionado por Inteligência Artificial
            </h1>
            
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolucione sua prática jurídica com um assistente inteligente que entende o direito brasileiro, gera documentos profissionais e responde suas consultas com precisão.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/login"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg"
              >
                Começar agora
              </Link>
              <a 
                href="#beneficios"
                className="px-8 py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-blue-200 dark:border-gray-700 font-medium rounded-xl shadow-md"
              >
                Conheça os benefícios
              </a>
            </div>
            
            {/* Badges/Stats */}
            <div className="flex flex-wrap justify-center gap-6 mt-16">
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-5 py-2 shadow-md">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Mais de 1.000 usuários</span>
              </div>
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-5 py-2 shadow-md">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Documentos 100% personalizáveis</span>
              </div>
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-5 py-2 shadow-md">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Inteligência jurídica especializada</span>
              </div>
            </div>
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
          {/* Content exists... */}
        </section>
        
        {/* Seção CTA */}
        <section className="py-16 md:py-24 bg-blue-600 dark:bg-blue-800">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para revolucionar sua <span className="text-yellow-300">prática jurídica</span>?
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
              Junte-se a milhares de advogados que já estão economizando tempo e entregando trabalhos de maior qualidade com o JurisIA.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/login"
                className="px-8 py-4 bg-white text-blue-700 font-medium rounded-xl shadow-lg"
              >
                Começar agora
              </Link>
              <Link 
                href="/login#auth-sign-up"
                className="px-8 py-4 bg-transparent text-white hover:bg-white/10 border border-white font-medium rounded-xl shadow-md"
              >
                Criar uma conta
              </Link>
            </div>
          </div>
        </section>
        
        {/* Rodapé simples */}
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                JurisIA
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                  Beta
                </span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Assistente jurídico inteligente para advogados brasileiros
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} JurisIA. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
} 