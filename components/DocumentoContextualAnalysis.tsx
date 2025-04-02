import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Tipagens para análise contextual
interface SecaoDocumento {
  tipo: 'introducao' | 'desenvolvimento' | 'conclusao' | 'argumentacao' | 'citacao' | 'outro';
  titulo: string;
  indice: number;
  conteudo: string;
  nivel: number;
}

interface ProblemaDocumento {
  tipo: 'inconsistencia' | 'falta_secao' | 'ordem_incorreta' | 'citacao_invalida' | 'terminologia';
  descricao: string;
  localizacao: number;
  sugestao?: string;
  severidade: 'alta' | 'media' | 'baixa';
}

interface AnaliseEstrutura {
  secoes: SecaoDocumento[];
  problemas: ProblemaDocumento[];
}

interface ResumoDocumento {
  resumoGeral: string;
  pontosPrincipais: string[];
  estrutura: {
    introducao?: string;
    argumentosPrincipais: string[];
    conclusao?: string;
  };
}

interface AnaliseContextual {
  analiseEstrutura?: AnaliseEstrutura;
  resumoDocumento?: ResumoDocumento;
  sugestoesAprimoramento?: string[];
}

interface DocumentoContextualAnalysisProps {
  analise: AnaliseContextual;
  onAplicarSugestao?: (sugestao: string) => void;
  onIrPara?: (indice: number) => void;
}

const DocumentoContextualAnalysis: React.FC<DocumentoContextualAnalysisProps> = ({
  analise,
  onAplicarSugestao,
  onIrPara
}) => {
  const [abaSelecionada, setAbaSelecionada] = useState<'resumo' | 'estrutura' | 'problemas' | 'sugestoes'>('resumo');
  const [secaoExpandida, setSecaoExpandida] = useState<number | null>(null);
  const [problemaExpandido, setProblemaExpandido] = useState<number | null>(null);
  
  const { analiseEstrutura, resumoDocumento, sugestoesAprimoramento } = analise;
  
  // Função para mapear tipo de seção para texto amigável
  const tipoSecaoParaTexto = (tipo: SecaoDocumento['tipo']): string => {
    const mapeamento = {
      introducao: 'Introdução',
      desenvolvimento: 'Desenvolvimento',
      conclusao: 'Conclusão',
      argumentacao: 'Argumentação',
      citacao: 'Citação',
      outro: 'Outro'
    };
    return mapeamento[tipo] || 'Seção';
  };
  
  // Função para mapear tipo de problema para texto amigável
  const tipoProblemaParaTexto = (tipo: ProblemaDocumento['tipo']): string => {
    const mapeamento = {
      inconsistencia: 'Inconsistência',
      falta_secao: 'Falta de Seção',
      ordem_incorreta: 'Ordem Incorreta',
      citacao_invalida: 'Citação Inválida',
      terminologia: 'Terminologia Incorreta'
    };
    return mapeamento[tipo] || 'Problema';
  };
  
  // Função para mapear severidade para classe CSS
  const severidadeParaClasse = (severidade: ProblemaDocumento['severidade']): string => {
    const mapeamento = {
      alta: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      baixa: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    return mapeamento[severidade] || '';
  };
  
  // Função para truncar texto
  const truncarTexto = (texto: string, limite: number = 150): string => {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {/* Abas de navegação */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            abaSelecionada === 'resumo'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setAbaSelecionada('resumo')}
        >
          Resumo
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            abaSelecionada === 'estrutura'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setAbaSelecionada('estrutura')}
        >
          Estrutura
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            abaSelecionada === 'problemas'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setAbaSelecionada('problemas')}
        >
          Problemas
          {analiseEstrutura?.problemas && analiseEstrutura.problemas.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              {analiseEstrutura.problemas.length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            abaSelecionada === 'sugestoes'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setAbaSelecionada('sugestoes')}
        >
          Sugestões
          {sugestoesAprimoramento && sugestoesAprimoramento.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {sugestoesAprimoramento.length}
            </span>
          )}
        </button>
      </div>
      
      {/* Conteúdo das abas */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Aba de Resumo */}
          {abaSelecionada === 'resumo' && resumoDocumento && (
            <motion.div
              key="resumo"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Resumo Geral
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                    {resumoDocumento.resumoGeral}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pontos Principais
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5">
                    {resumoDocumento.pontosPrincipais.map((ponto, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        {ponto}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estrutura
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md space-y-3">
                    {resumoDocumento.estrutura.introducao && (
                      <div>
                        <span className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">
                          Introdução:
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {resumoDocumento.estrutura.introducao}
                        </p>
                      </div>
                    )}
                    
                    {resumoDocumento.estrutura.argumentosPrincipais && resumoDocumento.estrutura.argumentosPrincipais.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">
                          Argumentos Principais:
                        </span>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                          {resumoDocumento.estrutura.argumentosPrincipais.map((arg, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-1.5 text-primary-500">•</span>
                              <span>{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {resumoDocumento.estrutura.conclusao && (
                      <div>
                        <span className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">
                          Conclusão:
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {resumoDocumento.estrutura.conclusao}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Aba de Estrutura */}
          {abaSelecionada === 'estrutura' && analiseEstrutura && (
            <motion.div
              key="estrutura"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2">
                {analiseEstrutura.secoes.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Não foi possível identificar seções definidas neste documento.
                  </p>
                ) : (
                  analiseEstrutura.secoes.map((secao, index) => (
                    <div 
                      key={index}
                      className={`border rounded-md overflow-hidden ${
                        secao.nivel === 1 
                          ? 'border-gray-200 dark:border-gray-700' 
                          : 'border-gray-100 dark:border-gray-800 ml-4'
                      }`}
                    >
                      <div 
                        className={`flex items-center justify-between p-3 cursor-pointer ${
                          secao.nivel === 1 
                            ? 'bg-gray-50 dark:bg-gray-800' 
                            : 'bg-gray-50/50 dark:bg-gray-800/50'
                        }`}
                        onClick={() => setSecaoExpandida(secaoExpandida === index ? null : index)}
                      >
                        <div className="flex items-center">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            secao.tipo === 'introducao' 
                              ? 'bg-blue-500' 
                              : secao.tipo === 'desenvolvimento' 
                                ? 'bg-green-500' 
                                : secao.tipo === 'conclusao' 
                                  ? 'bg-purple-500' 
                                  : secao.tipo === 'argumentacao'
                                    ? 'bg-yellow-500'
                                    : 'bg-gray-500'
                          }`}></span>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              {tipoSecaoParaTexto(secao.tipo)}
                            </span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {secao.titulo}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          {onIrPara && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onIrPara(secao.indice);
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mr-2"
                              title="Ir para esta seção no documento"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                          )}
                          
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 text-gray-400 transform transition-transform ${
                              secaoExpandida === index ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {secaoExpandida === index && (
                        <div className="p-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                          <p>{truncarTexto(secao.conteudo, 300)}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
          
          {/* Aba de Problemas */}
          {abaSelecionada === 'problemas' && analiseEstrutura && (
            <motion.div
              key="problemas"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-3">
                {analiseEstrutura.problemas.length === 0 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-100 dark:border-green-900/30">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Nenhum problema significativo foi detectado neste documento.
                      </p>
                    </div>
                  </div>
                ) : (
                  analiseEstrutura.problemas.map((problema, index) => (
                    <div 
                      key={index}
                      className={`border rounded-md overflow-hidden ${severidadeParaClasse(problema.severidade)}`}
                    >
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => setProblemaExpandido(problemaExpandido === index ? null : index)}
                      >
                        <div className="flex items-center">
                          <span className="text-sm font-medium">
                            {problema.descricao}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className={`text-xs px-2 py-1 rounded-full mr-2 ${
                            problema.severidade === 'alta'
                              ? 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              : problema.severidade === 'media'
                                ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                : 'bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}>
                            {problema.severidade === 'alta' ? 'Alta' : problema.severidade === 'media' ? 'Média' : 'Baixa'}
                          </span>
                          
                          {onIrPara && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onIrPara(problema.localizacao);
                              }}
                              className="text-xs hover:underline mr-2"
                              title="Ir para este problema no documento"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                          )}
                          
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transform transition-transform ${
                              problemaExpandido === index ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {problemaExpandido === index && problema.sugestao && (
                        <div className="p-3 text-sm border-t border-opacity-20">
                          <div className="flex flex-col">
                            <span className="font-medium mb-1">Sugestão:</span>
                            <p>{problema.sugestao}</p>
                            
                            {onAplicarSugestao && (
                              <button
                                onClick={() => onAplicarSugestao(problema.sugestao || '')}
                                className="self-end mt-2 px-3 py-1 text-xs rounded-md bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                              >
                                Aplicar sugestão
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
          
          {/* Aba de Sugestões */}
          {abaSelecionada === 'sugestoes' && sugestoesAprimoramento && (
            <motion.div
              key="sugestoes"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-3">
                {sugestoesAprimoramento.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Não há sugestões adicionais para este documento.
                  </p>
                ) : (
                  sugestoesAprimoramento.map((sugestao, index) => (
                    <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900/30">
                      <div className="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {sugestao}
                          </p>
                          
                          {onAplicarSugestao && (
                            <button
                              onClick={() => onAplicarSugestao(sugestao)}
                              className="mt-2 px-3 py-1 text-xs rounded-md bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                            >
                              Aplicar esta sugestão
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DocumentoContextualAnalysis; 