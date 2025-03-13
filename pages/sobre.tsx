import Layout from '../components/Layout';

const SobrePage = () => {
  return (
    <Layout
      title="Sobre | JurisIA - Assistente Jurídico com IA"
      description="Conheça mais sobre o JurisIA, assistente jurídico inteligente para advogados brasileiros"
      disableScrollLock={true}
    >
      <div className="container-custom py-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-400 mb-8 text-center">
            Sobre o JurisIA
          </h1>
          
          <div className="mb-12 p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Nossa Proposta</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-base sm:text-lg">
              O JurisIA é um assistente jurídico inteligente desenvolvido para auxiliar advogados brasileiros em suas atividades diárias.
              Utilizando tecnologia de inteligência artificial avançada, nosso objetivo é otimizar o trabalho jurídico, fornecendo
              respostas rápidas e precisas para consultas relacionadas à legislação, jurisprudência e doutrina brasileira.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-base sm:text-lg">
              Nossa plataforma integra modelos de linguagem de última geração para análise de documentos jurídicos, elaboração de peças
              e pesquisa jurídica, tudo isso com uma interface intuitiva e amigável que torna a tecnologia acessível a todos os profissionais do direito.
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">
              Estamos constantemente aprimorando nossas funcionalidades para oferecer a melhor experiência possível, mantendo sempre o compromisso
              com a ética, privacidade e segurança das informações.
            </p>
          </div>
          
          <div className="mb-8 p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Tecnologias</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-base sm:text-lg">
              O JurisIA foi construído utilizando tecnologias modernas para garantir desempenho, segurança e uma experiência de usuário excepcional:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 text-base sm:text-lg space-y-2">
              <li>Framework Next.js para renderização eficiente e experiência responsiva</li>
              <li>Interface de usuário com Tailwind CSS para um design moderno e adaptável</li>
              <li>Autenticação segura e armazenamento de dados com Supabase</li>
              <li>Integração com modelos de linguagem avançados para processamento de linguagem natural</li>
              <li>Tema claro/escuro para conforto visual em diferentes ambientes</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Créditos</h2>
            <div className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">
              <p className="mb-4">© {new Date().getFullYear()} JurisIA</p>
              <p className="mb-4 font-medium">Desenvolvido por: Rafael Fonseca</p>
              <p className="mb-4">Versão Beta</p>
              <div className="mt-8">
                <a 
                  href="mailto:webdevrafaelf@gmail.com"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-300 text-base sm:text-lg"
                >
                  webdevrafaelf@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SobrePage; 