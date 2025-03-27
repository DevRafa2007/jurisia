import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';

export default function LandingNova() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Garantir que estamos no cliente antes de acessar o tema
  useEffect(() => {
    setMounted(true);
  }, []);

  // Array de depoimentos
  const testimonials = [
    {
      quote: "O JurisIA transformou completamente minha produtividade. Reduzi o tempo de elaboração de documentos em 70%.",
      author: "Dra. Fernanda Santos",
      position: "Advogada Tributarista",
      avatar: "🧑‍⚖️"
    },
    {
      quote: "A precisão e velocidade nas pesquisas jurídicas me impressionam. É como ter um assistente trabalhando 24 horas por dia.",
      author: "Dr. Marcelo Lima",
      position: "Sócio de Escritório de Advocacia",
      avatar: "👨‍⚖️"
    },
    {
      quote: "Economizei horas de trabalho e melhorei a qualidade das minhas petições. Recomendo para todos os profissionais do direito.",
      author: "Dra. Carolina Mendes",
      position: "Advogada Trabalhista",
      avatar: "👩‍⚖️"
    }
  ];

  // Efeito de rotação automática dos depoimentos a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Alternar entre tema claro e escuro
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Variantes de animação para elementos que aparecem na tela
  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.4
      }
    }
  };

  // Variante para elementos que aparecem com delay baseado no índice
  const staggerFadeIn = (delay = 0) => ({
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        delay: delay,
        ease: "easeOut"
      } 
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-y-auto">
      <Head>
        <title>JurisIA - Assistente Jurídico com Inteligência Artificial</title>
        <meta name="description" content="JurisIA: A plataforma definitiva para profissionais do direito otimizarem seu trabalho com tecnologias de inteligência artificial." />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Elementos de fundo decorativos para imersão */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[30%] -right-[10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-primary-400/10 to-sky-400/10 dark:from-primary-500/10 dark:to-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-[10%] -left-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-sky-400/10 to-primary-400/10 dark:from-sky-500/10 dark:to-primary-500/10 blur-3xl" />
      </div>

      {/* Header elegante e minimalista */}
      <header className="py-8 px-4 sm:px-6 lg:px-8 sticky top-0 z-50 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-3xl font-serif font-bold bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-400 dark:to-sky-400 text-transparent bg-clip-text">
              JurisIA
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Botão de tema */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-300"
                aria-label={theme === 'dark' ? "Mudar para modo claro" : "Mudar para modo escuro"}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}
            
            <Link 
              href="/login" 
              className="hidden sm:inline-block px-5 py-2 rounded-lg bg-white text-primary-600 border border-primary-600 hover:bg-primary-50 dark:bg-transparent dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-900/30 transition-all duration-300 shadow-sm"
            >
              Entrar
            </Link>
            <Link 
              href="/login#auth-sign-up" 
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-700 hover:to-sky-600 dark:from-primary-500 dark:to-sky-400 text-white shadow-md transition-all duration-300"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative z-10 overflow-visible mt-5">
        {/* Hero Section imersiva e elegante */}
        <section className="flex flex-col md:flex-row items-center justify-between py-16 mb-28">
          <motion.div 
            className="w-full md:w-1/2 mb-12 md:mb-0 md:pr-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInUpVariants}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8 font-serif leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-400 dark:to-sky-400 text-transparent bg-clip-text">Tecnologia jurídica</span> ao seu alcance
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
              Otimize seu trabalho jurídico com nossa plataforma de IA especializada. Desde pesquisa jurídica até geração de documentos, o JurisIA é seu assistente jurídico digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link 
                href="/login" 
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-700 hover:to-sky-600 dark:from-primary-500 dark:to-sky-400 text-white font-medium text-center shadow-lg transition-all duration-300 block"
              >
                Começar Agora
              </Link>
              <Link 
                href="#recursos" 
                className="px-8 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 rounded-lg font-medium text-center hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-300 shadow-sm block"
              >
                Saiba Mais
              </Link>
            </div>
          </motion.div>
          <motion.div 
            className="w-full md:w-1/2 flex justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInUpVariants}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-5 max-w-lg w-full relative transition-all duration-500 hover:shadow-2xl">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary-100 dark:bg-primary-900/20 rounded-full opacity-50"></div>
              <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-sky-100 dark:bg-sky-900/20 rounded-full opacity-50"></div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-6 h-80 flex items-center justify-center relative z-10">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4 relative shadow-lg">
                    <span className="text-4xl text-primary-600 dark:text-primary-400">⚖️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Assistente Jurídico IA</h3>
                  <p className="text-gray-600 dark:text-gray-300">Respostas inteligentes para suas dúvidas jurídicas</p>
                  
                  {/* Indicador de digitação minimalista */}
                  <div className="mt-6 flex justify-center">
                    <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-70"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Recursos Section com design elegante */}
        <section id="recursos" className="mb-28">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInUpVariants}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Principais <span className="text-primary-600 dark:text-primary-400">Recursos</span>
            </h2>
            <div className="h-1 w-20 bg-primary-600 dark:bg-primary-400 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: "⚖️",
                title: "Assistente Jurídico IA",
                description: "Tire dúvidas, peça análises jurídicas e receba orientações precisas com nosso assistente virtual especializado."
              },
              {
                icon: "📝",
                title: "Gerador de Documentos",
                description: "Crie petições, contratos e pareceres em minutos com modelos inteligentes adaptados às suas necessidades."
              },
              {
                icon: "🔍",
                title: "Pesquisa Jurídica",
                description: "Encontre jurisprudência, doutrina e legislação relevantes para seu caso com nosso sistema de pesquisa inteligente."
              }
            ].map((recurso, index) => (
              <motion.div 
                key={index} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center text-center h-full relative group hover:shadow-xl transition-all duration-500"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
                variants={staggerFadeIn(index * 0.1)}
                exit="exit"
              >
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-primary-100/50 dark:bg-primary-900/20 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-sky-100/50 dark:bg-sky-900/20 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                
                <div className="text-primary-600 mb-5 text-4xl relative z-10">
                  {recurso.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white relative z-10">{recurso.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 relative z-10">{recurso.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Depoimentos com design elegante */}
        <section className="mb-28">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInUpVariants}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              O que <span className="text-primary-600 dark:text-primary-400">Dizem</span> Sobre Nós
            </h2>
            <div className="h-1 w-20 bg-primary-600 dark:bg-primary-400 mx-auto rounded-full"></div>
          </motion.div>
          
          <motion.div 
            className="relative max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInUpVariants}
          >
            <div className="absolute inset-0 bg-primary-500/5 dark:bg-primary-500/10 rounded-2xl transform -rotate-1"></div>
            
            <div className="relative mx-auto min-h-[250px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 relative"
                >
                  <div className="absolute top-4 left-4 text-primary-400 text-5xl opacity-20">❝</div>
                  <div className="absolute bottom-4 right-4 text-primary-400 text-5xl opacity-20">❞</div>
                  
                  <p className="text-gray-700 dark:text-gray-200 text-lg italic mb-6 relative z-10 leading-relaxed px-4">
                    &quot;{testimonials[currentTestimonial].quote}&quot;
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl">
                      {testimonials[currentTestimonial].avatar}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {testimonials[currentTestimonial].author}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {testimonials[currentTestimonial].position}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentTestimonial === index 
                      ? "bg-primary-600 dark:bg-primary-400 w-8" 
                      : "bg-gray-300 dark:bg-gray-600 w-2.5"
                  }`}
                  aria-label={`Ver depoimento ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </section>

        {/* Como Funciona com design elegante */}
        <section className="mb-28 bg-primary-50 dark:bg-primary-900/20 rounded-3xl py-16 px-6 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          <motion.div 
            className="text-center mb-16 relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInUpVariants}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Como <span className="text-primary-600 dark:text-primary-400">Funciona</span>
            </h2>
            <div className="h-1 w-20 bg-primary-600 dark:bg-primary-400 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-14 relative z-10 max-w-5xl mx-auto">
            {[
              {
                number: "01",
                title: "Faça seu cadastro",
                description: "Crie sua conta gratuitamente e tenha acesso imediato à plataforma.",
                icon: "🔐"
              },
              {
                number: "02",
                title: "Utilize o assistente IA",
                description: "Faça perguntas jurídicas, peça análises ou gere documentos através de nossa interface.",
                icon: "💬"
              },
              {
                number: "03",
                title: "Otimize seu trabalho",
                description: "Economize tempo, reduza erros e aumente sua produtividade com nossas ferramentas.",
                icon: "🚀"
              }
            ].map((step, index) => (
              <motion.div 
                key={index} 
                className="relative pl-16"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
                variants={staggerFadeIn(index * 0.1)}
              >
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-sky-500 dark:from-primary-500 dark:to-sky-400 flex items-center justify-center text-white font-bold shadow-md">
                  {step.icon}
                </div>
                <div className="ml-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Linha conectora elegante */}
          <motion.div 
            className="hidden md:block absolute top-[7.5rem] left-[5rem] right-[5rem] h-0.5 bg-gradient-to-r from-primary-200 to-sky-200 dark:from-primary-700 dark:to-sky-700 z-0"
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 1, delay: 0.2 }}
          ></motion.div>
        </section>

        {/* Planos e Preços com design elegante */}
        <section className="mb-28">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInUpVariants}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              <span className="text-primary-600 dark:text-primary-400">Planos</span> e Preços
            </h2>
            <div className="h-1 w-20 bg-primary-600 dark:bg-primary-400 mx-auto rounded-full mb-4"></div>
            <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Escolha o plano ideal para suas necessidades, desde profissionais autônomos até grandes escritórios.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Básico",
                price: "Gratuito",
                features: [
                  "Assistente IA com limite diário",
                  "Geração de documentos básicos",
                  "Pesquisa jurídica limitada",
                  "Armazenamento de 5 documentos"
                ],
                cta: "Começar Grátis",
                popular: false
              },
              {
                name: "Profissional",
                price: "R$ 99/mês",
                features: [
                  "Assistente IA ilimitado",
                  "Todos os modelos de documentos",
                  "Pesquisa jurídica avançada",
                  "Armazenamento de 100 documentos",
                  "Suporte prioritário"
                ],
                cta: "Começar Agora",
                popular: true
              },
              {
                name: "Escritório",
                price: "R$ 249/mês",
                features: [
                  "Tudo do plano Profissional",
                  "Acesso para até 5 usuários",
                  "Armazenamento ilimitado",
                  "Integrações avançadas",
                  "Treinamento personalizado"
                ],
                cta: "Contate Vendas",
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-500 hover:shadow-xl hover:translate-y-[-0.5rem] ${plan.popular ? 'ring-2 ring-primary-500 dark:ring-primary-400 transform scale-105 md:-translate-y-2' : ''}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
                variants={staggerFadeIn(index * 0.1)}
              >
                {plan.popular && (
                  <div className="bg-primary-500 text-white py-1.5 text-center text-sm font-medium">
                    Mais Popular
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li 
                        key={i} 
                        className="flex items-center text-gray-600 dark:text-gray-300"
                      >
                        <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href={plan.name === "Escritório" ? "#contato" : "/login"}
                    className={`block w-full py-3 rounded-lg text-center font-bold transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-md' 
                        : 'bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Final com design imersivo */}
        <section id="contato">
          <motion.div 
            className="bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-700 dark:to-sky-600 rounded-xl p-10 sm:p-14 shadow-2xl text-center relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInUpVariants}
          >
            {/* Efeitos visuais de fundo */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mt-24 -mr-24"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -mb-24 -ml-24"></div>
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white opacity-5 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            
            <div className="relative z-10">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-white mb-6 font-serif"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                viewport={{ once: false }}
              >
                Pronto para transformar sua prática jurídica?
              </motion.h2>
              <motion.p 
                className="text-primary-100 mb-10 max-w-2xl mx-auto text-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                viewport={{ once: false }}
              >
                Junte-se a milhares de profissionais que já estão economizando tempo e aumentando sua produtividade com o JurisIA.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                viewport={{ once: false }}
              >
                <Link 
                  href="/login"
                  className="bg-white text-primary-700 px-10 py-4 rounded-lg font-bold shadow-md inline-block hover:bg-gray-100 transition-all duration-300 hover:shadow-xl"
                >
                  Cadastre-se Gratuitamente
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-white dark:bg-slate-800 py-14 px-4 shadow-inner relative z-10 mt-20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <div className="text-2xl font-serif font-bold bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-400 dark:to-sky-400 text-transparent bg-clip-text mb-6 md:mb-0">
              JurisIA
            </div>
            <div className="flex space-x-8">
              {['Termos', 'Privacidade', 'Contato'].map((item, index) => (
                <a 
                  key={index}
                  href="#" 
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} JurisIA. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* CSS Adicional para padrão de grade no fundo */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
      
      {/* CSS adicional para garantir rolagem em dispositivos móveis */}
      <style jsx global>{`
        @media (max-width: 640px) {
          html, body {
            overflow-x: hidden;
            overflow-y: auto !important;
            height: auto !important;
            position: relative;
          }
          body {
            min-height: 100vh;
            height: auto !important;
          }
          #__next {
            height: auto !important;
            min-height: 100vh;
            position: static;
          }
          /* Correção para o posicionamento do header em dispositivos móveis */
          header {
            position: sticky !important;
            top: 0 !important;
            width: 100% !important;
            z-index: 50 !important;
          }
          
          /* Garantir espaçamento correto após o header */
          main {
            margin-top: 0;
            padding-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
} 