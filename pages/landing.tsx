import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

// Componente para botão animado
const AnimatedButton = ({ children, className = '', href, onClick }) => (
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
const AnimatedSection = ({ children, delay = 0, className = '' }) => (
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
const FeatureCard = ({ icon, title, description, delay = 0 }) => (
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
const Testimonial = ({ text, author, position, delay = 0 }) => (
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
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <Head>
        <title>JurisIA - Assistente Jurídico com Inteligência Artificial</title>
        <meta name="description" content="JurisIA: A plataforma definitiva para profissionais do direito otimizarem seu trabalho com tecnologias de inteligência artificial." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header com animação */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 mb-6">
        <div className="container mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <div className="text-3xl font-serif font-bold text-primary-700 dark:text-primary-400">
              JurisIA
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/login">
              <AnimatedButton href="/login" className="hidden sm:inline-block mr-4">
                Entrar
              </AnimatedButton>
            </Link>
            <Link href="/login#auth-sign-up">
              <AnimatedButton href="/login#auth-sign-up">
                Cadastrar
              </AnimatedButton>
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <AnimatedSection>
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-primary-600 dark:text-primary-400">Tecnologia jurídica</span> ao <br className="hidden sm:block"/> seu alcance
            </motion.h1>
          </AnimatedSection>
          
          <AnimatedSection delay={0.4}>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Otimize seu trabalho jurídico com nossa plataforma de IA especializada. Desde pesquisa jurídica até geração de documentos, o JurisIA é seu assistente jurídico digital.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={0.6}>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link href="/login">
                <AnimatedButton href="/login" className="w-full sm:w-auto">
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
            <motion.div
              className="relative rounded-xl overflow-hidden shadow-2xl max-w-4xl mx-auto mt-12 bg-white dark:bg-gray-800"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600/30 to-primary-400/30 z-10 rounded-xl"></div>
              <img 
                src="https://placehold.co/800x400/0369a1/FFFFFF?text=JurisIA+Dashboard" 
                alt="JurisIA Dashboard Preview"
                className="w-full h-auto object-cover"
              />
            </motion.div>
          </AnimatedSection>
        </section>

        {/* Benefits Section */}
        <section id="features" className="mb-20">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12 font-serif">
              Benefícios da nossa <span className="text-primary-600 dark:text-primary-400">Plataforma</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

        {/* How It Works Section */}
        <section className="mb-20">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12 font-serif">
              Como <span className="text-primary-600 dark:text-primary-400">Funciona</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
            {[
              {
                number: "01",
                title: "Faça seu cadastro",
                description: "Crie sua conta gratuitamente e tenha acesso imediato à plataforma.",
                delay: 0.2
              },
              {
                number: "02",
                title: "Utilize o assistente IA",
                description: "Faça perguntas jurídicas, peça análises ou gere documentos através de nossa interface intuitiva.",
                delay: 0.4
              },
              {
                number: "03",
                title: "Otimize seu trabalho",
                description: "Economize tempo, reduza erros e aumente sua produtividade com nossas ferramentas inteligentes.",
                delay: 0.6
              }
            ].map((step, index) => (
              <AnimatedSection key={index} delay={step.delay} className="relative pl-12">
                <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
              </AnimatedSection>
            ))}
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
                  <Link href="/login">
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

        {/* Call to Action */}
        <section id="contact">
          <motion.div
            className="bg-primary-600 dark:bg-primary-700 rounded-xl p-8 sm:p-12 shadow-xl text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4 font-serif">
              Pronto para transformar sua prática jurídica?
            </h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de profissionais que já estão economizando tempo e aumentando sua produtividade com o JurisIA.
            </p>
            <Link href="/login">
              <motion.button
                className="bg-white text-primary-700 px-8 py-3 rounded-lg font-bold shadow-md"
                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                whileTap={{ scale: 0.95 }}
              >
                Cadastre-se Gratuitamente
              </motion.button>
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-800 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="text-2xl font-serif font-bold text-primary-700 dark:text-primary-400 mb-4 md:mb-0">
              JurisIA
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">Termos</a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">Privacidade</a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">Contato</a>
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