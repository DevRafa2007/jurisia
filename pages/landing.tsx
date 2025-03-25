import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Importação dinâmica do componente DashboardPreview para evitar problemas de SSR
const DashboardPreview = dynamic(() => import('../components/DashboardPreview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-800 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        <p className="mt-4 text-sky-500">Carregando preview...</p>
      </div>
    </div>
  ),
});

// Componente para botão animado
const AnimatedButton = ({ 
  children, 
  className = '', 
  href, 
  onClick 
}: { 
  children: React.ReactNode; 
  className?: string; 
  href?: string; 
  onClick?: () => void;
}) => (
  <motion.a
    href={href}
    onClick={onClick}
    className={`relative overflow-hidden rounded-lg bg-primary-600 px-6 py-3 text-white font-medium inline-block ${className}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.span
      className="absolute inset-0 bg-primary-700"
      initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
      whileHover={{ scale: 1.5, opacity: 0.3 }}
      transition={{ duration: 0.4 }}
      style={{ borderRadius: '100%', transformOrigin: 'center', zIndex: 0 }}
    />
    <span className="relative z-10">{children}</span>
  </motion.a>
);

// Seção que aparece com animação
const AnimatedSection = ({ 
  children, 
  delay = 0, 
  className = '' 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// Feature card com animação
const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  delay?: number;
}) => (
  <motion.div
    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -10, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
  >
    <div className="text-primary-600 mb-4 text-4xl">{icon}</div>
    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

// Componente para depoimentos
const Testimonial = ({ 
  text, 
  author, 
  position, 
  delay = 0 
}: { 
  text: string; 
  author: string; 
  position: string; 
  delay?: number;
}) => (
  <motion.div
    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
  >
    <p className="text-gray-600 dark:text-gray-300 italic mb-4">"{text}"</p>
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300">
        {author.charAt(0)}
      </div>
      <div className="ml-3">
        <p className="font-medium text-gray-900 dark:text-white">{author}</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{position}</p>
      </div>
    </div>
  </motion.div>
);

export default function Landing() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirecionar para página principal se estiver autenticado
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Head>
        <title>JurisIA - Assistente Jurídico com Inteligência Artificial</title>
        <meta name="description" content="JurisIA: A plataforma definitiva para profissionais do direito otimizarem seu trabalho com tecnologias de inteligência artificial." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header com animação */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 mb-6 relative z-10">
        <div className="container mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <div className="text-3xl font-serif font-bold bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-400 dark:to-sky-400 text-transparent bg-clip-text">
              JurisIA
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/login" legacyBehavior>
              <AnimatedButton href="/login" className="hidden sm:inline-block mr-4 bg-white text-primary-600 border border-primary-600 hover:bg-primary-50 dark:bg-transparent dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-900/30">
                Entrar
              </AnimatedButton>
            </Link>
            <Link href="/login#auth-sign-up" legacyBehavior>
              <AnimatedButton href="/login#auth-sign-up" className="bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-700 hover:to-sky-600 dark:from-primary-500 dark:to-sky-400">
                Cadastrar
              </AnimatedButton>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Círculos decorativos de fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <motion.div 
          className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-b from-primary-500/10 to-primary-500/5 dark:from-primary-500/20 dark:to-primary-500/10"
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        <motion.div 
          className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-gradient-to-t from-sky-500/10 to-sky-500/5 dark:from-sky-500/20 dark:to-sky-500/10"
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24 relative z-0">
        {/* Hero Section */}
        <section className="text-center mb-32">
          <AnimatedSection>
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif leading-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-400 dark:to-sky-400 text-transparent bg-clip-text">Tecnologia jurídica</span> ao <br className="hidden sm:block"/> seu alcance
            </motion.h1>
          </AnimatedSection>
          
          <AnimatedSection delay={0.4}>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Otimize seu trabalho jurídico com nossa plataforma de IA especializada. Desde pesquisa jurídica até geração de documentos, o JurisIA é seu assistente jurídico digital.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={0.6}>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link href="/login" legacyBehavior>
                <AnimatedButton 
                  href="/login" 
                  className="w-full sm:w-auto bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-700 hover:to-sky-600 dark:from-primary-500 dark:to-sky-400"
                >
                  Começar Agora
                </AnimatedButton>
              </Link>
              <motion.a
                href="#features"
                className="w-full sm:w-auto inline-block px-6 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 rounded-lg font-medium"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(37, 99, 235, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Saiba Mais
              </motion.a>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={0.8}>
            <div className="relative mt-16">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-600/30 to-sky-500/30 dark:from-primary-600/20 dark:to-sky-500/20 rounded-xl blur-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              />
              <motion.div
                className="relative z-10"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <DashboardPreview />
              </motion.div>
            </div>
          </AnimatedSection>
        </section>

        {/* Benefits Section */}
        <section id="features" className="mb-32">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16 font-serif">
              Benefícios da nossa <span className="bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-400 dark:to-sky-400 text-transparent bg-clip-text">Plataforma</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <FeatureCard 
              icon="⚖️"
              title="Assistente Jurídico IA"
              description="Tire dúvidas, peça análises jurídicas e receba orientações precisas com nosso assistente virtual especializado em direito brasileiro."
              delay={0.2}
            />
            <FeatureCard
              icon="📝"
              title="Gerador de Documentos"
              description="Crie petições, contratos e pareceres em minutos com modelos inteligentes que se adaptam às suas necessidades específicas."
              delay={0.4}
            />
            <FeatureCard
              icon="🔍"
              title="Pesquisa Jurídica Avançada"
              description="Encontre jurisprudência, doutrina e legislação relevantes para seu caso com nosso sistema de pesquisa inteligente."
              delay={0.6}
            />
          </div>
        </section>

        {/* How It Works Section - updated to be more visually appealing */}
        <section className="mb-32 relative">
          <div className="absolute left-0 right-0 h-full bg-primary-50 dark:bg-primary-900/20 -mx-4 sm:-mx-6 lg:-mx-8 -z-10 rounded-3xl"></div>
          <div className="py-16">
            <AnimatedSection>
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16 font-serif">
                Como <span className="bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-400 dark:to-sky-400 text-transparent bg-clip-text">Funciona</span>
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 px-4">
              {[
                {
                  number: "01",
                  title: "Faça seu cadastro",
                  description: "Crie sua conta gratuitamente e tenha acesso imediato à plataforma.",
                  delay: 0.2,
                  icon: "🔐"
                },
                {
                  number: "02",
                  title: "Utilize o assistente IA",
                  description: "Faça perguntas jurídicas, peça análises ou gere documentos através de nossa interface intuitiva.",
                  delay: 0.4,
                  icon: "💬"
                },
                {
                  number: "03",
                  title: "Otimize seu trabalho",
                  description: "Economize tempo, reduza erros e aumente sua produtividade com nossas ferramentas inteligentes.",
                  delay: 0.6,
                  icon: "🚀"
                }
              ].map((step, index) => (
                <AnimatedSection key={index} delay={step.delay} className="relative pl-12">
                  <motion.div 
                    className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-sky-500 dark:from-primary-500 dark:to-sky-400 flex items-center justify-center text-white font-bold"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {step.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-20">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12 font-serif">
              O que <span className="text-primary-600 dark:text-primary-400">Dizem</span> sobre nós
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Testimonial 
              text="O JurisIA revolucionou minha forma de trabalhar. Consigo preparar documentos em metade do tempo que gastava antes."
              author="Dra. Ana Lima"
              position="Advogada, Direito Civil"
              delay={0.2}
            />
            <Testimonial 
              text="A ferramenta de pesquisa jurídica é excepcional. Encontra jurisprudências relevantes que eu provavelmente perderia em buscas tradicionais."
              author="Dr. Carlos Mendes"
              position="Advogado, Direito Tributário"
              delay={0.4}
            />
            <Testimonial 
              text="Como advogada iniciante, o JurisIA tem sido essencial para meu aprendizado e produtividade. É como ter um mentor 24 horas por dia."
              author="Dra. Juliana Santos"
              position="Advogada, Direito do Trabalho"
              delay={0.6}
            />
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mb-20">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6 font-serif">
              <span className="text-primary-600 dark:text-primary-400">Planos</span> e Preços
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              Escolha o plano ideal para suas necessidades, desde profissionais autônomos até grandes escritórios de advocacia.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                popular: false,
                delay: 0.2
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
                popular: true,
                delay: 0.4
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
                popular: false,
                delay: 0.6
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: plan.delay }}
                whileHover={{ y: -10 }}
              >
                {plan.popular && (
                  <div className="bg-primary-500 text-white py-1 text-center text-sm font-medium">
                    Mais Popular
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  </div>
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-gray-600 dark:text-gray-300">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.name === "Escritório" ? "#contact" : "/login"} legacyBehavior>
                    <AnimatedButton 
                      href={plan.name === "Escritório" ? "#contact" : "/login"}
                      className={`w-full ${plan.popular ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600'}`}
                    >
                      {plan.cta}
                    </AnimatedButton>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12 font-serif">
              Perguntas <span className="text-primary-600 dark:text-primary-400">Frequentes</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                question: "Como o JurisIA garante a precisão das informações jurídicas?",
                answer: "Nossa plataforma utiliza algoritmos avançados treinados com milhares de documentos jurídicos e está em constante atualização com as mudanças na legislação brasileira. Além disso, contamos com uma equipe de advogados que supervisionam o sistema.",
                delay: 0.2
              },
              {
                question: "Os documentos gerados são juridicamente válidos?",
                answer: "Sim, os documentos gerados seguem todos os requisitos legais e formais. No entanto, recomendamos sempre uma revisão final por um profissional do direito antes de sua utilização oficial.",
                delay: 0.3
              },
              {
                question: "Qual é o nível de segurança dos dados na plataforma?",
                answer: "Utilizamos criptografia de ponta a ponta e seguimos rigorosos protocolos de segurança, em conformidade com a LGPD. Seus dados são tratados com o máximo de confidencialidade e nunca compartilhados com terceiros.",
                delay: 0.4
              },
              {
                question: "Posso cancelar minha assinatura a qualquer momento?",
                answer: "Sim, você pode cancelar sua assinatura a qualquer momento sem taxas adicionais. Após o cancelamento, você ainda terá acesso ao serviço até o final do período faturado.",
                delay: 0.5
              }
            ].map((faq, index) => (
              <AnimatedSection key={index} delay={faq.delay} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </AnimatedSection>
            ))}
          </div>
        </section>

        {/* Call to Action - enhanced */}
        <section id="contact">
          <motion.div
            className="bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-700 dark:to-sky-600 rounded-xl p-8 sm:p-12 shadow-2xl text-center overflow-hidden relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative elements */}
            <motion.div 
              className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.2, 0.3] 
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div 
              className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/4 translate-y-1/4"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2] 
              }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            
            <h2 className="text-3xl font-bold text-white mb-4 font-serif relative z-10">
              Pronto para transformar sua prática jurídica?
            </h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto relative z-10">
              Junte-se a milhares de profissionais que já estão economizando tempo e aumentando sua produtividade com o JurisIA.
            </p>
            <Link href="/login" legacyBehavior>
              <motion.button
                className="relative z-10 bg-white text-primary-700 px-8 py-3 rounded-lg font-bold shadow-md overflow-hidden group"
                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Cadastre-se Gratuitamente</span>
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-sky-400 to-primary-400"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.button>
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="bg-white dark:bg-slate-800 py-12 px-4 shadow-inner">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="text-2xl font-serif font-bold bg-gradient-to-r from-primary-600 to-sky-500 dark:from-primary-400 dark:to-sky-400 text-transparent bg-clip-text mb-4 md:mb-0">
              JurisIA
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition">Termos</a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition">Privacidade</a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition">Contato</a>
            </div>
          </div>
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} JurisIA. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
} 