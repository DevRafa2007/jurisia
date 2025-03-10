import React from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

const Sobre: React.FC = () => {
  return (
    <Layout
      title="Sobre JurisIA | Assistente Jurídico com IA"
      description="Conheça o JurisIA, um assistente jurídico inteligente para advogados brasileiros"
    >
      <div className="container-custom py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-primary-700 mb-6">Sobre o JurisIA</h1>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-primary-600 mb-4">O que é o JurisIA?</h2>
            <p className="mb-4">
              O JurisIA é um assistente jurídico alimentado por inteligência artificial, 
              desenvolvido especificamente para advogados brasileiros. Utilizando 
              a tecnologia avançada de IA do Groq, o JurisIA ajuda profissionais 
              do direito a acessar rapidamente informações jurídicas relevantes.
            </p>
            <p className="mb-4">
              Nosso sistema foi treinado com vasto conhecimento sobre legislação brasileira,
              incluindo códigos, leis, jurisprudências e doutrinas jurídicas, permitindo
              que advogados obtenham respostas precisas e atualizadas para suas consultas.
            </p>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-primary-600 mb-4">Recursos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Respostas baseadas em legislação brasileira atualizada</li>
              <li>Citações de leis, códigos e jurisprudências relevantes</li>
              <li>Interpretação de textos legais e análise de casos</li>
              <li>Interface amigável e fácil de usar</li>
              <li>Histórico de conversas para referência futura</li>
              <li>Respostas rápidas através da tecnologia Groq</li>
            </ul>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-primary-600 mb-4">Como usar</h2>
            <p className="mb-4">
              Simplesmente digite sua dúvida jurídica na caixa de texto e o JurisIA
              processará sua consulta, fornecendo uma resposta baseada no conhecimento
              jurídico brasileiro. Você pode fazer perguntas sobre legislação específica,
              interpretação de leis, precedentes judiciais ou questões processuais.
            </p>
            <div className="mt-6">
              <Link href="/" className="btn btn-primary inline-block">
                Voltar para o chat
              </Link>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-primary-600 mb-4">Limitações</h2>
            <p className="mb-4">
              O JurisIA é uma ferramenta de assistência e não substitui a opinião de um
              advogado qualificado. As respostas fornecidas devem ser usadas como ponto
              de partida para pesquisas mais aprofundadas. Sempre consulte as fontes
              originais das leis e jurisprudências antes de tomar decisões jurídicas.
            </p>
            <p>
              Este é um sistema em constante desenvolvimento e aprimoramento. Agradecemos
              feedback sobre a precisão e utilidade das respostas fornecidas.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Sobre; 