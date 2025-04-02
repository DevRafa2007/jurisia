import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Head from 'next/head';
import DocumentosSidebar from '../components/DocumentosSidebar';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { 
  carregarDocumento as fetchDocumento, 
  criarDocumento, 
  atualizarDocumento
} from '../utils/supabase';
// Importar componentes do assistente IA
import EditorAssistant from '../components/EditorAssistant';
import TextSuggestionTooltip from '../components/TextSuggestionTooltip';
import AnalysisIndicator from '../components/AnalysisIndicator';

// Importação dinâmica do React Quill para evitar problemas de SSR
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Tipos de documentos suportados
const TIPOS_DOCUMENTOS = [
  { id: 'peticao_inicial', nome: 'Petição Inicial' },
  { id: 'contestacao', nome: 'Contestação' },
  { id: 'recurso', nome: 'Recurso' },
  { id: 'parecer', nome: 'Parecer Jurídico' },
  { id: 'contrato', nome: 'Contrato' },
  { id: 'procuracao', nome: 'Procuração' },
  { id: 'notificacao', nome: 'Notificação Extrajudicial' },
  { id: 'acordo', nome: 'Acordo' },
];

// Interfaces para os formulários dinâmicos
interface CampoFormulario {
  id: string;
  label: string;
  tipo: 'texto' | 'textarea' | 'select' | 'numero' | 'data';
  opcoes?: { valor: string; texto: string }[];
  obrigatorio: boolean;
}

interface ConfiguracaoFormulario {
  id: string;
  nome: string;
  campos: CampoFormulario[];
}

// Configurações de formulário para cada tipo de documento
const CONFIGURACOES_FORMULARIOS: Record<string, ConfiguracaoFormulario> = {
  peticao_inicial: {
    id: 'peticao_inicial',
    nome: 'Petição Inicial',
    campos: [
      { id: 'vara', label: 'Vara', tipo: 'texto', obrigatorio: true },
      { id: 'comarca', label: 'Comarca', tipo: 'texto', obrigatorio: true },
      { id: 'cliente', label: 'Nome do Cliente', tipo: 'texto', obrigatorio: true },
      { id: 'parte_contraria', label: 'Parte Contrária', tipo: 'texto', obrigatorio: true },
      { id: 'valor_causa', label: 'Valor da Causa', tipo: 'numero', obrigatorio: true },
      { id: 'tipo_acao', label: 'Tipo de Ação', tipo: 'select', obrigatorio: true, 
        opcoes: [
          { valor: 'condenatoria', texto: 'Condenatória' },
          { valor: 'declaratoria', texto: 'Declaratória' },
          { valor: 'constitutiva', texto: 'Constitutiva' },
          { valor: 'mandamental', texto: 'Mandamental' },
          { valor: 'executiva', texto: 'Executiva' },
        ] 
      },
      { id: 'fatos', label: 'Fatos', tipo: 'textarea', obrigatorio: true },
      { id: 'fundamentos', label: 'Fundamentos Jurídicos', tipo: 'textarea', obrigatorio: true },
      { id: 'pedidos', label: 'Pedidos', tipo: 'textarea', obrigatorio: true },
    ]
  },
  contestacao: {
    id: 'contestacao',
    nome: 'Contestação',
    campos: [
      { id: 'numero_processo', label: 'Número do Processo', tipo: 'texto', obrigatorio: true },
      { id: 'vara', label: 'Vara', tipo: 'texto', obrigatorio: true },
      { id: 'comarca', label: 'Comarca', tipo: 'texto', obrigatorio: true },
      { id: 'cliente', label: 'Nome do Cliente (Réu)', tipo: 'texto', obrigatorio: true },
      { id: 'parte_contraria', label: 'Parte Contrária (Autor)', tipo: 'texto', obrigatorio: true },
      { id: 'preliminares', label: 'Preliminares', tipo: 'textarea', obrigatorio: false },
      { id: 'merito', label: 'Mérito', tipo: 'textarea', obrigatorio: true },
      { id: 'pedidos', label: 'Pedidos', tipo: 'textarea', obrigatorio: true },
    ]
  },
  recurso: {
    id: 'recurso',
    nome: 'Recurso',
    campos: [
      { id: 'numero_processo', label: 'Número do Processo', tipo: 'texto', obrigatorio: true },
      { id: 'vara', label: 'Vara', tipo: 'texto', obrigatorio: true },
      { id: 'tribunal', label: 'Tribunal', tipo: 'texto', obrigatorio: true },
      { id: 'cliente', label: 'Nome do Cliente (Recorrente)', tipo: 'texto', obrigatorio: true },
      { id: 'parte_contraria', label: 'Parte Contrária (Recorrida)', tipo: 'texto', obrigatorio: true },
      { id: 'tipo_recurso', label: 'Tipo de Recurso', tipo: 'select', obrigatorio: true,
        opcoes: [
          { valor: 'apelacao', texto: 'Apelação' },
          { valor: 'agravo', texto: 'Agravo de Instrumento' },
          { valor: 'embargos', texto: 'Embargos de Declaração' },
          { valor: 'especial', texto: 'Recurso Especial' },
          { valor: 'extraordinario', texto: 'Recurso Extraordinário' },
        ]
      },
      { id: 'fundamentos', label: 'Fundamentos do Recurso', tipo: 'textarea', obrigatorio: true },
      { id: 'pedidos', label: 'Pedidos', tipo: 'textarea', obrigatorio: true },
    ]
  },
  // Adicionando configurações para os outros tipos de documentos
  parecer: {
    id: 'parecer',
    nome: 'Parecer Jurídico',
    campos: [
      { id: 'cliente', label: 'Cliente', tipo: 'texto', obrigatorio: true },
      { id: 'tema', label: 'Tema do Parecer', tipo: 'texto', obrigatorio: true },
      { id: 'questoes', label: 'Questões Jurídicas', tipo: 'textarea', obrigatorio: true },
      { id: 'analise', label: 'Análise Jurídica', tipo: 'textarea', obrigatorio: true },
      { id: 'conclusao', label: 'Conclusão', tipo: 'textarea', obrigatorio: true },
    ]
  },
  contrato: {
    id: 'contrato',
    nome: 'Contrato',
    campos: [
      { id: 'tipo_contrato', label: 'Tipo de Contrato', tipo: 'select', obrigatorio: true,
        opcoes: [
          { valor: 'prestacao_servicos', texto: 'Prestação de Serviços' },
          { valor: 'compra_venda', texto: 'Compra e Venda' },
          { valor: 'locacao', texto: 'Locação' },
          { valor: 'trabalho', texto: 'Trabalho' },
          { valor: 'outro', texto: 'Outro' },
        ]
      },
      { id: 'parte1', label: 'Contratante', tipo: 'texto', obrigatorio: true },
      { id: 'parte2', label: 'Contratado', tipo: 'texto', obrigatorio: true },
      { id: 'objeto', label: 'Objeto do Contrato', tipo: 'textarea', obrigatorio: true },
      { id: 'valor', label: 'Valor', tipo: 'numero', obrigatorio: true },
      { id: 'prazo', label: 'Prazo de Vigência', tipo: 'texto', obrigatorio: true },
      { id: 'obrigacoes', label: 'Obrigações das Partes', tipo: 'textarea', obrigatorio: true },
      { id: 'clausulas_adicionais', label: 'Cláusulas Adicionais', tipo: 'textarea', obrigatorio: false },
    ]
  },
  procuracao: {
    id: 'procuracao',
    nome: 'Procuração',
    campos: [
      { id: 'outorgante', label: 'Outorgante', tipo: 'texto', obrigatorio: true },
      { id: 'outorgado', label: 'Outorgado', tipo: 'texto', obrigatorio: true },
      { id: 'finalidade', label: 'Finalidade', tipo: 'textarea', obrigatorio: true },
      { id: 'poderes', label: 'Poderes Específicos', tipo: 'textarea', obrigatorio: true },
      { id: 'validade', label: 'Validade', tipo: 'texto', obrigatorio: false },
    ]
  },
  notificacao: {
    id: 'notificacao',
    nome: 'Notificação Extrajudicial',
    campos: [
      { id: 'remetente', label: 'Remetente', tipo: 'texto', obrigatorio: true },
      { id: 'destinatario', label: 'Destinatário', tipo: 'texto', obrigatorio: true },
      { id: 'assunto', label: 'Assunto', tipo: 'texto', obrigatorio: true },
      { id: 'conteudo', label: 'Conteúdo da Notificação', tipo: 'textarea', obrigatorio: true },
      { id: 'prazo', label: 'Prazo para Resposta', tipo: 'texto', obrigatorio: false },
    ]
  },
  acordo: {
    id: 'acordo',
    nome: 'Acordo',
    campos: [
      { id: 'parte1', label: 'Primeira Parte', tipo: 'texto', obrigatorio: true },
      { id: 'parte2', label: 'Segunda Parte', tipo: 'texto', obrigatorio: true },
      { id: 'objeto', label: 'Objeto do Acordo', tipo: 'textarea', obrigatorio: true },
      { id: 'obrigacoes_parte1', label: 'Obrigações da Primeira Parte', tipo: 'textarea', obrigatorio: true },
      { id: 'obrigacoes_parte2', label: 'Obrigações da Segunda Parte', tipo: 'textarea', obrigatorio: true },
      { id: 'prazo', label: 'Prazo de Cumprimento', tipo: 'texto', obrigatorio: true },
      { id: 'clausulas_adicionais', label: 'Cláusulas Adicionais', tipo: 'textarea', obrigatorio: false },
    ]
  },
};

export default function Documentos() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tipoDocumentoSelecionado, setTipoDocumentoSelecionado] = useState<string>('');
  const [etapa, setEtapa] = useState<'selecao' | 'formulario' | 'verificacao' | 'editor'>('selecao');
  const [valoresFormulario, setValoresFormulario] = useState<Record<string, any>>({});
  const [documentoGerado, setDocumentoGerado] = useState<string>('');
  const [isGerandoDocumento, setIsGerandoDocumento] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [documentoAtual, setDocumentoAtual] = useState<string | null>(null);
  const [tituloDocumento, setTituloDocumento] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const [ultimoSalvamento, setUltimoSalvamento] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const documentoModificado = useRef(false);
  const [dicaExibida, setDicaExibida] = useState(false);
  // Estados para a verificação de usabilidade
  const [fontesRecomendadas, setFontesRecomendadas] = useState<string[]>([]);
  const [jurisprudenciasRecomendadas, setJurisprudenciasRecomendadas] = useState<string[]>([]);
  const [leisRecomendadas, setLeisRecomendadas] = useState<string[]>([]);
  const [isAnalisandoReferencias, setIsAnalisandoReferencias] = useState(false);
  const [analiseReferencias, setAnaliseReferencias] = useState<string>('');

  // Estados para o assistente IA
  const [textoSelecionado, setTextoSelecionado] = useState('');
  const [posicaoSelecao, setPosicaoSelecao] = useState<{ index: number, length: number } | null>(null);
  const [sugestaoTexto, setSugestaoTexto] = useState('');
  const [tooltipPosicao, setTooltipPosicao] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const editorRef = useRef<any>(null);

  const [isCarregandoSugestoes, setIsCarregandoSugestoes] = useState(false);
  const [trechosSugeridos, setTrechosSugeridos] = useState<Array<{titulo: string, texto: string, explicacao: string}>>([]);
  const [exibirModalSugestoes, setExibirModalSugestoes] = useState(false);

  const [mostrarTooltip, setMostrarTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [analisando, setAnalisando] = useState(false);

  // Função para sugerir trechos com base no tipo de documento
  const sugerirTrechos = async () => {
    if (!tipoDocumentoSelecionado) return;
    
    setIsCarregandoSugestoes(true);
    try {
      const tipDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].nome;
      const promptSugestao = `Sugira 3 exemplos de trechos jurídicos prontos para um documento do tipo "${tipDoc}" com base nos seguintes dados:
      
${Object.entries(valoresFormulario)
  .filter(([_, valor]) => valor)
  .map(([campo, valor]) => {
    const campoConfig = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].campos.find(c => c.id === campo);
    return campoConfig ? `${campoConfig.label}: ${valor}` : `${campo}: ${valor}`;
  })
  .join('\n')}

Para cada trecho, forneça:
1. Um título descritivo
2. O texto pronto para ser aplicado ao documento
3. Uma breve explicação da finalidade e relevância deste trecho

Retorne os trechos em formato markdown, com cabeçalhos para cada seção.`;

      try {
        // Aqui faria a chamada à API
        // Por enquanto, vamos simular a resposta
        toast.success("Gerando sugestões de trechos...");
        
        setTimeout(() => {
          const sugestoes = gerarSugestoesTrecho(tipoDocumentoSelecionado, valoresFormulario);
          
          // Atualizar o estado com as sugestões
          setTrechosSugeridos(sugestoes);
          
          // Exibir modal ou componente com sugestões
          setExibirModalSugestoes(true);
          
          setIsCarregandoSugestoes(false);
        }, 1500);
        
      } catch (error) {
        console.error("Erro ao obter sugestões:", error);
        toast.error("Erro ao gerar sugestões de trechos");
        setIsCarregandoSugestoes(false);
      }
    } catch (error) {
      console.error("Erro ao processar sugestões:", error);
      toast.error("Erro ao processar os dados para sugestões");
      setIsCarregandoSugestoes(false);
    }
  };
  
  // Função para gerar sugestões de trechos específicos para diferentes tipos de documentos
  const gerarSugestoesTrecho = (tipoDoc: string, dados: Record<string, any>): Array<{titulo: string, texto: string, explicacao: string}> => {
    const sugestoes = [];
    
    // Modelos para diferentes tipos de documento
    if (tipoDoc === 'peticao-inicial') {
      sugestoes.push({
        titulo: "DOS FATOS",
        texto: `DOS FATOS

1. O(A) Autor(a) é ${dados.profissao || 'profissional'} residente e domiciliado(a) no endereço constante na qualificação inicial.

2. Em ${dados.dataOcorrencia || '[data do ocorrido]'}, o(a) Autor(a) ${dados.descricaoFato || 'descrever brevemente o fato ocorrido'}.

3. Diante dos fatos narrados, não restou alternativa ao(à) Autor(a) senão buscar a tutela jurisdicional para salvaguardar seus direitos.`,
        explicacao: "Este trecho apresenta a narrativa fática de forma clara e objetiva, elemento essencial de qualquer petição inicial."
      });
      
      sugestoes.push({
        titulo: "DO DIREITO",
        texto: `DO DIREITO

1. O caso em tela encontra amparo legal no art. 5º, inciso XXXV da Constituição Federal, que assegura o acesso à justiça.

2. Ademais, o Código Civil Brasileiro, em seu art. 186, estabelece que "aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, ainda que exclusivamente moral, comete ato ilícito."

3. Outrossim, o art. 927 do mesmo diploma legal determina que "aquele que, por ato ilícito, causar dano a outrem, fica obrigado a repará-lo."`,
        explicacao: "Fundamentação jurídica básica para casos de responsabilidade civil, adequada para diversos tipos de petições iniciais."
      });
      
      sugestoes.push({
        titulo: "DOS PEDIDOS",
        texto: `DOS PEDIDOS

Ante o exposto, requer a Vossa Excelência:

a) O recebimento da presente ação, com a citação do(a) Réu(Ré) para, querendo, apresentar resposta no prazo legal, sob pena de revelia;

b) A procedência dos pedidos, condenando-se o(a) Réu(Ré) ao pagamento de indenização por danos ${dados.tipoDano || 'materiais e morais'} no valor de R$ ${dados.valorDano || '[valor do dano]'};

c) A condenação do(a) Réu(Ré) ao pagamento das custas processuais e honorários advocatícios, a serem arbitrados em 20% sobre o valor da causa;

d) A produção de todas as provas admitidas em direito, especialmente documental, testemunhal e pericial.

Dá-se à causa o valor de R$ ${dados.valorCausa || '[valor da causa]'}.`,
        explicacao: "Estrutura padrão da seção de pedidos, adaptável conforme as especificidades do caso concreto."
      });
    } 
    else if (tipoDoc === 'contrato') {
      sugestoes.push({
        titulo: "CLÁUSULA DE RESCISÃO",
        texto: `CLÁUSULA ${dados.numeroClausula || 'X'} – DA RESCISÃO

O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação prévia e por escrito, com antecedência mínima de ${dados.prazoPrevioRescisao || '30 (trinta)'} dias, nas seguintes hipóteses:

a) por comum acordo entre as partes;
b) pelo inadimplemento de qualquer cláusula ou condição estabelecida neste contrato;
c) pela impossibilidade de execução, ainda que temporária, do objeto do contrato;
d) por determinação judicial, legal ou administrativa que impeça a continuidade da prestação dos serviços.

Parágrafo Único: Em caso de rescisão por infração contratual, a parte infratora ficará sujeita ao pagamento de multa de ${dados.valorMulta || '20% (vinte por cento)'} sobre o valor total do contrato, sem prejuízo de indenização complementar por perdas e danos.`,
        explicacao: "Cláusula de rescisão contratual que prevê as hipóteses de término antecipado do contrato, com previsão de multa, essencial para proteger as partes."
      });
      
      sugestoes.push({
        titulo: "CLÁUSULA DE FORO",
        texto: `CLÁUSULA ${dados.numeroClausula ? Number(dados.numeroClausula) + 1 : 'Y'} – DO FORO

As partes elegem o Foro da Comarca de ${dados.comarca || '[cidade/estado]'} para dirimir quaisquer controvérsias oriundas do presente contrato, renunciando a qualquer outro, por mais privilegiado que seja.

Parágrafo Único: Antes de recorrer ao Poder Judiciário, as partes envidarão seus melhores esforços para solucionar amigavelmente eventuais controvérsias, podendo, inclusive, utilizar-se de mediação ou arbitragem, conforme ajustarem oportunamente.`,
        explicacao: "Cláusula de eleição de foro, determinando qual será o juízo competente para resolver litígios decorrentes do contrato, com previsão de tentativa de resolução amigável."
      });
      
      sugestoes.push({
        titulo: "CLÁUSULA DE CONFIDENCIALIDADE",
        texto: `CLÁUSULA ${dados.numeroClausula ? Number(dados.numeroClausula) + 2 : 'Z'} – DA CONFIDENCIALIDADE

As partes comprometem-se a manter em absoluto sigilo todas as informações, dados, documentos e especificações técnicas a que tiverem acesso em razão deste contrato, obrigando-se a não divulgar, reproduzir, ceder ou transferir, sob qualquer forma, as informações a terceiros.

§1º. A obrigação de confidencialidade ora pactuada permanecerá vigente durante todo o prazo de vigência deste contrato e por mais ${dados.prazoConfidencialidade || '5 (cinco) anos'} após o seu término.

§2º. O descumprimento da obrigação de confidencialidade sujeitará a parte infratora ao pagamento de multa no valor de ${dados.valorMultaConfidencialidade || 'R$ 50.000,00 (cinquenta mil reais)'}, sem prejuízo da responsabilização por perdas e danos suplementares.`,
        explicacao: "Cláusula de confidencialidade que protege informações sensíveis compartilhadas durante a relação contratual, com previsão de multa específica em caso de violação."
      });
    }
    else if (tipoDoc === 'recurso') {
      sugestoes.push({
        titulo: "PRELIMINAR DE TEMPESTIVIDADE",
        texto: `PRELIMINAR DE TEMPESTIVIDADE

Inicialmente, cumpre demonstrar a tempestividade do presente recurso.

A r. sentença/decisão foi publicada no Diário de Justiça Eletrônico em ${dados.dataPublicacao || '[data da publicação]'}, tendo o prazo para recurso iniciado em ${dados.dataInicialPrazo || '[data do início do prazo]'}.

Considerando que o prazo para interposição do ${dados.tipoRecurso || 'recurso'} é de ${dados.prazoRecurso || '[prazo legal]'} dias úteis, conforme disposto no art. ${dados.artigoPrazo || '[artigo do CPC]'} do Código de Processo Civil, e tendo sido observados os feriados e dias não úteis, o termo final para apresentação do recurso ocorre em ${dados.dataFinalPrazo || '[data final do prazo]'}.

Assim, interposto nesta data, resta demonstrada a tempestividade do presente recurso.`,
        explicacao: "Preliminar essencial em recursos para demonstrar o cumprimento do prazo recursal, evitando o não conhecimento por intempestividade."
      });
      
      sugestoes.push({
        titulo: "DAS RAZÕES DE REFORMA",
        texto: `DAS RAZÕES DE REFORMA

A r. sentença/decisão recorrida merece reforma pelos fundamentos fáticos e jurídicos a seguir expostos.

1. DA INCORRETA APRECIAÇÃO DAS PROVAS

Data maxima venia, o MM. Juízo a quo não considerou adequadamente as provas produzidas nos autos, especialmente ${dados.provasIgnoradas || '[especificar as provas não consideradas adequadamente]'}.

Conforme se verifica às fls. ${dados.folhasProva || 'XX'} dos autos, restou demonstrado que ${dados.fato || '[descrever o fato provado, mas ignorado na decisão]'}, o que, por si só, seria suficiente para conduzir a julgamento diverso.

2. DA INCORRETA APLICAÇÃO DO DIREITO

Além da equivocada análise probatória, verifica-se erro in judicando na aplicação do direito ao caso concreto. Isto porque a r. sentença/decisão aplicou o dispositivo ${dados.dispositivoIncorreto || '[artigo/lei aplicado incorretamente]'}, quando, na realidade, a hipótese dos autos atrai a incidência do art. ${dados.dispositivoCorreto || '[artigo/lei que deveria ter sido aplicado]'}.

A jurisprudência dos Tribunais Superiores é pacífica no sentido de que ${dados.entendimentoJurisprudencial || '[citar entendimento jurisprudencial favorável à tese do recurso]'}. Nesse sentido, confira-se o seguinte julgado: ${dados.precedente || '[citar precedente]'}.`,
        explicacao: "Estrutura base para o mérito recursal, focando na incorreta apreciação das provas e na incorreta aplicação do direito pela decisão recorrida."
      });
      
      sugestoes.push({
        titulo: "DO PEDIDO",
        texto: `DO PEDIDO

Ante o exposto, requer-se:

a) O conhecimento do presente ${dados.tipoRecurso || 'recurso'}, dada a presença dos pressupostos de admissibilidade recursal;

b) No mérito, o provimento do recurso para reformar a r. sentença/decisão recorrida, julgando-se ${dados.pedidoRecurso || '[procedente/improcedente]'} o pedido inicial, condenando-se a parte recorrida ao pagamento das custas processuais e honorários advocatícios recursais;

c) Caso assim não entenda V. Exa., o que se admite apenas por amor ao debate, requer-se ${dados.pedidoAlternativo || '[especificar pedido alternativo]'}.

Nestes termos,
Pede deferimento.

${dados.local || '[Local]'}, ${dados.data || '[data]'}.


${dados.advogado || '[Nome do(a) Advogado(a)]'}
OAB/${dados.estadoOAB || 'XX'} nº ${dados.numeroOAB || 'XXXXX'}`,
        explicacao: "Seção final do recurso contendo os pedidos, com estrutura que contempla pedido principal e alternativo, além de formatação adequada para a peça recursal."
      });
    }
    else if (tipoDoc === 'declaracao') {
      sugestoes.push({
        titulo: "CABEÇALHO DA DECLARAÇÃO",
        texto: `DECLARAÇÃO ${dados.tipoDeclaracao || ''}

DECLARANTE: ${dados.nomeDeclarante || '[Nome completo]'}, ${dados.nacionalidadeDeclarante || 'brasileiro(a)'}, ${dados.estadoCivilDeclarante || '[estado civil]'}, portador(a) do RG nº ${dados.rgDeclarante || '[número do RG]'}, inscrito(a) no CPF sob o nº ${dados.cpfDeclarante || '[número do CPF]'}, residente e domiciliado(a) na ${dados.enderecoDeclarante || '[endereço completo]'}.`,
        explicacao: "Cabeçalho padronizado para declarações, contendo a qualificação completa do declarante, conferindo formalidade e segurança jurídica ao documento."
      });
      
      sugestoes.push({
        titulo: "CORPO DA DECLARAÇÃO",
        texto: `DECLARO, sob as penas da lei, para os devidos fins e a quem possa interessar, que ${dados.conteudoDeclaracao || '[conteúdo da declaração]'}.

DECLARO, ainda, estar ciente das sanções civis, administrativas e criminais previstas para o caso de falsidade ou omissão de informações, conforme disposto nos artigos 171 e 299 do Código Penal Brasileiro.

Para que produza os efeitos legais, firmo a presente declaração.`,
        explicacao: "Corpo principal da declaração com menção expressa às consequências legais por falsidade, garantindo força jurídica ao documento através da responsabilização do declarante."
      });
      
      sugestoes.push({
        titulo: "ENCERRAMENTO DA DECLARAÇÃO",
        texto: `${dados.local || '[Local]'}, ${dados.data || '[data por extenso]'}.


_________________________________________
${dados.nomeDeclarante || '[Nome do Declarante]'}
CPF: ${dados.cpfDeclarante || '[número do CPF]'}


TESTEMUNHAS:

1. _________________________________________
   Nome: ${dados.nomeTestemunha1 || '[Nome da Testemunha 1]'}
   CPF: ${dados.cpfTestemunha1 || '[número do CPF]'}

2. _________________________________________
   Nome: ${dados.nomeTestemunha2 || '[Nome da Testemunha 2]'}
   CPF: ${dados.cpfTestemunha2 || '[número do CPF]'}`,
        explicacao: "Encerramento formal da declaração com espaço para assinatura do declarante e de testemunhas, aumentando a validade jurídica do documento em caso de contestação."
      });
    }
    else {
      // Sugestões genéricas para outros tipos de documento
      sugestoes.push({
        titulo: "Fundamentação Legal Básica",
        texto: `FUNDAMENTAÇÃO LEGAL

Conforme estabelecido pelo art. 5º da Constituição Federal, que garante a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade, o presente documento encontra amparo legal nos seguintes dispositivos:

1. Código Civil (Lei nº 10.406/2002), especialmente em seus artigos 186, 187 e 927, que estabelecem a responsabilidade civil;

2. Código de Processo Civil (Lei nº 13.105/2015), notadamente em seus artigos referentes ao devido processo legal, contraditório e ampla defesa;

3. Lei nº ${dados.leiEspecifica || '[número da lei específica aplicável ao caso]'}, que dispõe sobre ${dados.assuntoLei || '[assunto da lei]'}.`,
        explicacao: "Fundamentação legal básica aplicável a diversos tipos de documentos jurídicos, mencionando a Constituição Federal e os principais códigos."
      });
      
      sugestoes.push({
        titulo: "Cláusula de Eleição de Foro",
        texto: `CLÁUSULA DE ELEIÇÃO DE FORO

As partes elegem o Foro da Comarca de ${dados.comarca || '[cidade/estado]'} para dirimir quaisquer questões oriundas do presente documento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

Parágrafo único. As partes comprometem-se a tentar solucionar amigavelmente qualquer controvérsia antes de recorrer às medidas judiciais, podendo valer-se de métodos adequados de solução de conflitos, como mediação e arbitragem.`,
        explicacao: "Cláusula padrão para definição do foro competente para resolução de litígios, aplicável a contratos e outros documentos que envolvam mais de uma parte."
      });
      
      sugestoes.push({
        titulo: "Disposições Finais",
        texto: `DISPOSIÇÕES FINAIS

E, por estarem assim justas e contratadas, as partes assinam o presente documento em ${dados.numVias || '2 (duas)'} vias de igual teor e forma, para um só efeito, na presença das testemunhas abaixo identificadas.

Todas as comunicações relacionadas a este documento deverão ser feitas por escrito e enviadas para os endereços indicados no preâmbulo ou por e-mail para ${dados.emailParte1 || '[e-mail da parte 1]'} e ${dados.emailParte2 || '[e-mail da parte 2]'}.

Qualquer alteração neste documento somente terá validade se formalizada por escrito e assinada por todas as partes envolvidas.

O presente documento constitui o acordo integral entre as partes, substituindo todas as negociações, compromissos e entendimentos anteriores sobre o assunto nele tratado.`,
        explicacao: "Disposições finais padronizadas para diversos tipos de documentos, contemplando forma de comunicação, alterações e integralidade do documento."
      });
    }
    
    return sugestoes;
  };
  
  // Função para aplicar um trecho sugerido ao documento
  const aplicarTrechoSugerido = (texto: string) => {
    if (!editorRef.current) return;
    
    try {
      // Tentar obter o editor
      const editor = editorRef.current.getEditor();
      
      if (editor) {
        // Verificar se há texto selecionado
        const selection = editor.getSelection();
        
        if (selection && selection.length > 0) {
          // Substituir texto selecionado
          editor.deleteText(selection.index, selection.length);
          editor.insertText(selection.index, texto);
        } else {
          // Inserir no cursor
          const range = editor.getSelection();
          if (range) {
            editor.insertText(range.index, texto);
          }
        }
        
        // Fechar o modal
        setExibirModalSugestoes(false);
        toast.success("Trecho aplicado com sucesso!");
      } else {
        // Tentar método alternativo
        aplicarSugestaoAssistente(texto);
      }
    } catch (error) {
      console.error("Erro ao aplicar trecho:", error);
      
      // Usar método alternativo
      aplicarSugestaoAssistente(texto);
    }
  };
  
  // Componente Modal para exibir os trechos sugeridos
  const ModalTrechosSugeridos = () => {
    if (!exibirModalSugestoes) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Trechos Sugeridos</h3>
            <button 
              onClick={() => setExibirModalSugestoes(false)}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {trechosSugeridos.map((trecho, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">{trecho.titulo}</h4>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 mb-3">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">{trecho.texto}</pre>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{trecho.explicacao}</p>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      // Copiar para a área de transferência
                      navigator.clipboard.writeText(trecho.texto);
                      toast.success("Texto copiado para a área de transferência");
                    }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={() => aplicarTrechoSugerido(trecho.texto)}
                    className="px-3 py-1.5 bg-primary-500 text-white rounded hover:bg-primary-600 text-sm font-medium transition-colors"
                  >
                    Aplicar ao Documento
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => setExibirModalSugestoes(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Função para capturar seleção de texto no editor
  const handleTextSelection = () => {
    if (!editorRef.current) return;
    
    const quill = editorRef.current.getEditor();
    const selection = quill.getSelection();
    
    if (selection && selection.length > 0) {
      const text = quill.getText(selection.index, selection.length);
      if (text.trim()) {
        setTextoSelecionado(text);
        setPosicaoSelecao({ index: selection.index, length: selection.length });
        
        // Calcular posição para o tooltip
        const bounds = quill.getBounds(selection.index, selection.length);
        const editorPosition = quill.container.getBoundingClientRect();
        
        setTooltipPosicao({
          x: editorPosition.left + bounds.left + bounds.width / 2,
          y: editorPosition.top + bounds.top - 10
        });
        
        // Exibir o botão de análise
        const botaoAnalise = document.getElementById('botao-analise-texto');
        if (botaoAnalise) {
          botaoAnalise.style.display = 'block';
          botaoAnalise.style.left = `${editorPosition.left + bounds.left + bounds.width / 2}px`;
          botaoAnalise.style.top = `${editorPosition.top + bounds.top - 40}px`;
        }
      }
    } else {
      const botaoAnalise = document.getElementById('botao-analise-texto');
      if (botaoAnalise) {
        botaoAnalise.style.display = 'none';
      }
    }
  };
  
  // Função para analisar texto selecionado
  const analisarTextoSelecionado = async () => {
    if (!textoSelecionado) return;
    
    setIsAnalysisVisible(true);
    
    try {
      // Simular chamada à API (será substituída por chamada real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Resposta simulada
      const sugestao = textoSelecionado.replace(
        /(\w+)([.,])/g, 
        (match, word, punctuation) => word + ' ' + punctuation
      ) + ' (Incluir referência ao Art. 5º da CF)';
      
      setSugestaoTexto(sugestao);
      setIsTooltipVisible(true);
    } catch (error) {
      console.error('Erro ao analisar texto:', error);
      toast.error('Não foi possível analisar o texto selecionado.');
    } finally {
      setIsAnalysisVisible(false);
    }
  };

  // Função para aceitar sugestão de texto
  const aceitarSugestao = () => {
    if (!editorRef.current || !posicaoSelecao) return;
    
    try {
      // Tentar diferentes maneiras de acessar o editor
      let quill = null;
      
      if (editorRef.current.getEditor && typeof editorRef.current.getEditor === 'function') {
        quill = editorRef.current.getEditor();
      } else if (editorRef.current.editor) {
        quill = editorRef.current.editor;
      }
      
      if (quill && typeof quill.deleteText === 'function') {
        quill.deleteText(posicaoSelecao.index, posicaoSelecao.length);
        quill.insertText(posicaoSelecao.index, sugestaoTexto);
        
        // Fechar tooltip após aplicar
        setIsTooltipVisible(false);
        toast.success('Sugestão aplicada!');
      } else {
        // Fallback usando contenteditable
        const editorElement = document.querySelector('.ql-editor');
        if (editorElement && window.getSelection) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(sugestaoTexto));
            
            // Fechar tooltip após aplicar
            setIsTooltipVisible(false);
            toast.success('Sugestão aplicada!');
            
            // Atualizar o conteúdo do editor
            if (editorElement.innerHTML) {
              setDocumentoGerado(editorElement.innerHTML);
              documentoModificado.current = true;
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao aplicar sugestão:', error);
      toast.error('Não foi possível aplicar a sugestão.');
    }
  };

  // Função para aplicar sugestão do assistente ao editor
  const aplicarSugestaoAssistente = (texto: string, selecao?: { index: number, length: number }) => {
    if (!editorRef.current) return;
    
    try {
      // Tentar diferentes maneiras de acessar o editor
      let quill = null;
      
      if (editorRef.current.getEditor && typeof editorRef.current.getEditor === 'function') {
        quill = editorRef.current.getEditor();
      } else if (editorRef.current.editor) {
        quill = editorRef.current.editor;
      }
      
      if (quill && typeof quill.insertText === 'function') {
        if (selecao) {
          // Substituir texto selecionado
          quill.deleteText(selecao.index, selecao.length);
          quill.insertText(selecao.index, texto);
        } else {
          // Inserir no cursor atual ou no final
          const selection = quill.getSelection();
          if (selection) {
            quill.insertText(selection.index, texto);
          } else {
            quill.insertText(quill.getLength() - 1, texto);
          }
        }
        
        documentoModificado.current = true;
      } else {
        // Fallback usando contenteditable
        const editorElement = document.querySelector('.ql-editor');
        if (editorElement) {
          // Se não temos seleção, inserir no final
          if (editorElement.innerHTML) {
            editorElement.innerHTML += `<p>${texto}</p>`;
            setDocumentoGerado(editorElement.innerHTML);
            documentoModificado.current = true;
            toast.success('Texto inserido no documento.');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao aplicar sugestão:', error);
      toast.error('Não foi possível aplicar a sugestão do assistente.');
    }
  };
  
  // Função alterada para conectar o editorRef quando o ReactQuill é montado
  const handleEditorRef = (ref: any) => {
    editorRef.current = ref;
    
    if (ref) {
      // A API mudou ou a referência não está acessando o editor corretamente
      // Vamos verificar se o editor está acessível de outras formas
      if (typeof ref.getEditor === 'function') {
        const quill = ref.getEditor();
        quill.on('selection-change', handleTextSelection);
      } else if (ref.editor) {
        // Algumas versões do ReactQuill expõem o editor diretamente
        ref.editor.on('selection-change', handleTextSelection);
      } else if (ref.el && ref.el.querySelector('.ql-editor')) {
        // Como fallback, podemos obter o editor a partir do DOM
        // mas não podemos adicionar o listener desta forma
        console.log('Editor encontrado via DOM, mas não é possível adicionar listeners.');
        // Vamos tentar usar um MutationObserver para capturar seleções
        setupSelectionObserver(ref.el.querySelector('.ql-editor'));
      } else {
        console.error('Não foi possível acessar o editor Quill.');
      }
    }
  };

  // Função para configurar um observer para capturar seleções (fallback)
  const setupSelectionObserver = (editorElement: Element | null) => {
    if (!editorElement) return;
    
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Verificar se a seleção está dentro do editor
        if (editorElement.contains(range.commonAncestorContainer)) {
          const text = selection.toString();
          if (text && text.trim()) {
            setTextoSelecionado(text);
            
            // Calcular posição para o tooltip e botão
            const rect = range.getBoundingClientRect();
            
            setTooltipPosicao({
              x: rect.left + rect.width / 2,
              y: rect.top
            });
            
            // Exibir o botão de análise
            const botaoAnalise = document.getElementById('botao-analise-texto');
            if (botaoAnalise) {
              botaoAnalise.style.display = 'block';
              botaoAnalise.style.left = `${rect.left + rect.width / 2}px`;
              botaoAnalise.style.top = `${rect.top - 40}px`;
            }
          }
        }
      }
    });
  };

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar inicialmente
    checkMobile();
    
    // Adicionar listener para redimensionamento da janela
    window.addEventListener('resize', checkMobile);
    
    // Limpar listener ao desmontar
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Mostrar dica para usuários de dispositivos móveis
  useEffect(() => {
    if (isMobile && etapa === 'editor' && documentoGerado.length > 2000 && !dicaExibida) {
      toast.success(
        'Dica: Para melhor experiência ao editar documentos grandes, gire o dispositivo para modo paisagem.',
        { duration: 5000, icon: '📱' }
      );
      setDicaExibida(true);
    }
  }, [isMobile, etapa, documentoGerado, dicaExibida]);

  // Função para atualizar os valores do formulário
  const handleInputChange = (campoId: string, valor: any) => {
    setValoresFormulario(prev => ({
      ...prev,
      [campoId]: valor
    }));
  };

  // Função para selecionar o tipo de documento
  const handleSelecionarTipoDocumento = (tipo: string) => {
    setTipoDocumentoSelecionado(tipo);
    setValoresFormulario({});
    setEtapa('formulario');
    
    // Fechar sidebar quando seleciona um tipo em dispositivos móveis
    if (isMobile && sidebarAberta) {
      setSidebarAberta(false);
    }
    
    // Gerar um título padrão para o documento
    const tipoDoc = CONFIGURACOES_FORMULARIOS[tipo].nome;
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    setTituloDocumento(`${tipoDoc} - ${dataAtual}`);
  };

  // Função para enviar o formulário
  const handleSubmitFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    const config = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado];
    const camposObrigatorios = config.campos.filter(c => c.obrigatorio);
    
    for (const campo of camposObrigatorios) {
      if (!valoresFormulario[campo.id] || valoresFormulario[campo.id].trim() === '') {
        toast.error(`O campo "${campo.label}" é obrigatório.`);
        return;
      }
    }
    
    // Analisar referências antes de gerar o documento
    await analisarReferencias();
  };

  // Nova função para analisar referências e fontes
  const analisarReferencias = async () => {
    setIsAnalisandoReferencias(true);
    
    try {
      const tipoDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].nome;
      const camposDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].campos;
      
      // Preparar mensagem para a API
      const promptTexto = `Analise e recomende fontes jurídicas para um documento "${tipoDoc}" com os seguintes dados:
${camposDoc.map(campo => {
  const valor = valoresFormulario[campo.id] || '';
  return `${campo.label}: ${valor}`;
}).join('\n')}

Por favor, responda apenas com uma análise jurídica clara e bem estruturada, dividida exatamente nas seguintes seções:

LEIS E ARTIGOS:
(Liste as principais leis e artigos aplicáveis a este caso, com número da lei, artigo específico e uma breve explicação)

JURISPRUDÊNCIA:
(Liste jurisprudências relevantes sobre o tema, indicando o tribunal, número do processo ou súmula, e o entendimento principal)

DOUTRINA:
(Indique fontes doutrinárias recomendadas, com autor, obra e ano)

ANÁLISE JURÍDICA:
(Análise breve de como essas fontes se aplicam ao caso concreto)

Mantenha cada seção claramente separada para facilitar a extração das informações.`;
      
      // Chamar a API
      const response = await axios.post('/api/juridica', {
        consulta: promptTexto,
        historico: []
      });
      
      if (response.data && response.data.resposta) {
        const analise = response.data.resposta;
        setAnaliseReferencias(analise);
        
        // Expressões regulares melhoradas para extração
        
        // Leis - captura leis como "Lei nº 8.112/90", "Artigo 5º da Constituição Federal", etc.
        const leisRegex = /(?:Lei(?:\s+n[º°.]?\s*\d+[\d.,/\s]*(?:\/\d+)?)|Artigo\s+\d+[°º,.]?(?:\s*(?:d[aoe]|,|\s)\s*[\wÀ-ú\s]+)?|C(?:ódigo|F|PC|PP|DC|LT)\s+[\wÀ-ú\s,.]+\d+|Decreto[\w\d\s-]+)/gi;
        const leisMatch = Array.from(new Set(analise.match(leisRegex) || []));
        
        // Jurisprudência - captura referências a decisões de tribunais
        const jurisprudenciaRegex = /(?:(?:STF|STJ|TST|TSE|TRF\d?|TJ[A-Z]{2}|TRT\d{1,2})[\s:-]+(?:.*?)(?=\n|$)|Súmula(?:\s+n[°º.]?)?\s*\d+(?:\s*d[oe]\s*[\wÀ-ú\s]+)?|(?:Recurso|Agravo|Apelação|Habeas|Mandado)\s+[\w\d\s-]+\d+)/gi;
        const jurisprudenciaMatch = Array.from(new Set(analise.match(jurisprudenciaRegex) || []));
        
        // Doutrina - captura referências a autores e obras
        const doutrinaRegex = /(?:[A-ZÀ-Ú][a-zà-ú]+,\s+[A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*\.?(?:\s+[\wÀ-ú\s,.:()]+)?(?:\(\d{4}\)|\d{4}))/gi;
        const doutrinaMatch = Array.from(new Set(analise.match(doutrinaRegex) || []));
        
        // Extrair também pela estrutura do texto (seções)
        const leisSection = analise.match(/LEIS E ARTIGOS:[\s\S]*?(?=JURISPRUDÊNCIA:|DOUTRINA:|ANÁLISE JURÍDICA:|$)/i);
        const jurisprudenciaSection = analise.match(/JURISPRUDÊNCIA:[\s\S]*?(?=DOUTRINA:|ANÁLISE JURÍDICA:|LEIS E ARTIGOS:|$)/i);
        const doutrinaSection = analise.match(/DOUTRINA:[\s\S]*?(?=ANÁLISE JURÍDICA:|LEIS E ARTIGOS:|JURISPRUDÊNCIA:|$)/i);
        
        // Processar seções para extrair itens por linha
        const processSection = (section: RegExpMatchArray | null): string[] => {
          if (!section) return [];
          return section[0]
            .split('\n')
            .slice(1) // Remover a linha do título da seção
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 5); // Filtrar linhas muito curtas/vazias
        };
        
        // Combinar resultados das expressões regulares com a extração por seção
        const leis = [...leisMatch, ...processSection(leisSection)];
        const jurisprudencias = [...jurisprudenciaMatch, ...processSection(jurisprudenciaSection)];
        const doutrinas = [...doutrinaMatch, ...processSection(doutrinaSection)];
        
        // Remover duplicatas e itens vazios
        setLeisRecomendadas(Array.from(new Set(leis.filter(item => typeof item === 'string' && item.trim().length > 0))) as string[]);
        setJurisprudenciasRecomendadas(Array.from(new Set(jurisprudencias.filter(item => typeof item === 'string' && item.trim().length > 0))) as string[]);
        setFontesRecomendadas(Array.from(new Set(doutrinas.filter(item => typeof item === 'string' && item.trim().length > 0))) as string[]);
        
        // Avançar para a etapa de verificação
        setEtapa('verificacao');
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('Erro ao analisar referências:', error);
      toast.error('Erro ao analisar referências. Tentando gerar o documento diretamente...');
      // Em caso de erro, prossegue diretamente para geração do documento
      await gerarDocumento();
    } finally {
      setIsAnalisandoReferencias(false);
    }
  };

  // Modificar a função gerarDocumento para aceitar parâmetros
  const gerarDocumento = async () => {
    setIsGerandoDocumento(true);
    
    try {
      const tipoDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].nome;
      const camposDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].campos;
      
      // Preparar mensagem para a API
      const promptTexto = `Crie um documento jurídico do tipo "${tipoDoc}" com os seguintes dados:
${camposDoc.map(campo => {
  const valor = valoresFormulario[campo.id] || '';
  return `${campo.label}: ${valor}`;
}).join('\n')}`;
      
      // Chamar a API correta que já está funcionando no chat
      const response = await axios.post('/api/juridica', {
        consulta: promptTexto,
        historico: []
      });
      
      if (response.data && response.data.resposta) {
        // Converter texto para HTML com formatação adequada
        // 1. Quebrar o texto em linhas
        const linhas = response.data.resposta.split('\n');
        
        // 2. Verificar se a primeira linha é um título
        let processado = '';
        let comecouConteudo = false;
        
        for (let i = 0; i < linhas.length; i++) {
          const linha = linhas[i].trim();
          
          if (linha === '') {
            // Linha vazia - adicionar quebra de parágrafo se já tiver conteúdo
            if (comecouConteudo) {
              processado += '<p>&nbsp;</p>';
            }
            continue;
          }
          
          if (!comecouConteudo) {
            // Primeira linha não vazia - tratar como título
            processado = `<p class="titulo-centralizado">${linha}</p>`;
            comecouConteudo = true;
            continue;
          }
          
          // Substituir asteriscos por tags de negrito
          const linhaProcessada = linha.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<strong>$1</strong>');
          
          // Adicionar como parágrafo
          processado += `<p>${linhaProcessada}</p>`;
        }
        
        setDocumentoGerado(processado);
        setEtapa('editor');
        setDocumentoAtual(null); // Novo documento não está salvo ainda
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      toast.error('Erro ao gerar documento. Tente novamente.');
    } finally {
      setIsGerandoDocumento(false);
    }
  };

  // Atualizar função voltarEtapa para incluir a nova etapa
  const voltarEtapa = () => {
    if (etapa === 'editor') {
      setEtapa('verificacao');
    } else if (etapa === 'verificacao') {
      setEtapa('formulario');
    } else if (etapa === 'formulario') {
      setEtapa('selecao');
      setTipoDocumentoSelecionado('');
      setDocumentoAtual(null);
    }
  };

  // Função para imprimir o documento
  const imprimirDocumento = () => {
    // Preparar o conteúdo para impressão
    const conteudoParaImprimir = documentoGerado;
    
    // Criar um novo documento para impressão
    const janelaImpressao = window.open('', '_blank');
    
    if (janelaImpressao) {
      janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${tituloDocumento || 'Documento Jurídico'}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.5;
              background-color: white;
              color: black;
            }
            .pagina-a4 {
              width: 21cm;
              min-height: 29.7cm;
              margin: 0 auto;
              padding: 2.54cm;
              box-sizing: border-box;
              background-color: white;
              position: relative;
              page-break-after: always;
              overflow: visible;
            }
            p {
              margin: 0 0 0.8em 0;
              text-align: justify;
            }
            /* Estilos para títulos */
            h1, h2, h3, .titulo-centralizado, p.titulo, p:first-child {
              text-align: center;
              font-weight: bold;
              margin: 1.2em 0;
            }
            h1, .titulo-principal {
              font-size: 14pt;
              margin-top: 2em;
              margin-bottom: 2.5em;
            }
            /* Garantir que elementos com a classe de título centralizado mantenham a formatação */
            .titulo-centralizado {
              text-align: center !important;
              font-weight: bold;
              margin: 1.5em 0;
            }
            /* Estilos para texto em negrito */
            strong, b {
              font-weight: bold;
            }
            /* Estilos para texto em itálico */
            em, i {
              font-style: italic;
            }
            /* Estilos para texto sublinhado */
            u {
              text-decoration: underline;
            }
            /* Alinhamentos específicos */
            .text-center, [align="center"] {
              text-align: center;
            }
            .text-right, [align="right"] {
              text-align: right;
            }
            .text-left, [align="left"] {
              text-align: left;
            }
            .text-justify, [align="justify"] {
              text-align: justify;
            }
            /* Espaçamento entre parágrafos */
            p + p {
              margin-top: 0.5em;
            }
            /* Preservar quebras de linha */
            br {
              line-height: 150%;
            }
            /* Estilo para parágrafo com assinatura */
            p.assinatura {
              text-align: center;
              margin-top: 3em;
              margin-bottom: 1em;
            }
            /* Quebra de página */
            .quebra-pagina {
              page-break-before: always;
            }
            /* Listas */
            ul, ol {
              margin: 0.5em 0;
              padding-left: 2em;
            }
            li {
              margin-bottom: 0.3em;
            }
          </style>
        </head>
        <body>
          <div class="pagina-a4">
            ${conteudoParaImprimir}
          </div>
          <script>
            // Aplicar formatações adicionais após o carregamento
            document.addEventListener('DOMContentLoaded', function() {
              // Identificar e formatar elementos especiais
              const paragrafos = document.querySelectorAll('p');
              
              // Verificar se o primeiro parágrafo é um título
              if (paragrafos.length > 0) {
                const primeiroParagrafo = paragrafos[0];
                const texto = primeiroParagrafo.textContent || '';
                
                // Se o texto está todo em maiúsculas, provavelmente é um título
                if (texto === texto.toUpperCase() && texto.length > 3) {
                  primeiroParagrafo.classList.add('titulo-principal');
                }
              }
              
              // Formatar parágrafos com texto todo em maiúsculas como títulos
              paragrafos.forEach(p => {
                const texto = p.textContent || '';
                if (texto === texto.toUpperCase() && texto.length > 3) {
                  p.classList.add('titulo-centralizado');
                }
                
                // Verificar se é um parágrafo de assinatura
                if (texto.includes('__________________') || 
                    texto.toLowerCase().includes('assinatura') ||
                    texto.match(/[a-zA-Z ]+,\\s+\\d{1,2}\\s+de\\s+[a-zA-Z]+\\s+de\\s+\\d{4}/)) {
                  p.classList.add('assinatura');
                }
              });
              
              // Permitir que o conteúdo seja renderizado
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 750);
              }, 300);
            });
          </script>
        </body>
        </html>
      `);
      
      janelaImpressao.document.close();
    } else {
      // Fallback se não conseguir abrir uma nova janela
      toast.error('Não foi possível abrir a janela de impressão. Verifique as configurações do seu navegador.');
    }
  };

  // Função para copiar o documento para a área de transferência
  const copiarDocumento = () => {
    if (documentoGerado) {
      try {
        // Criar um elemento temporário para extrair apenas o texto sem formatação HTML
        const tempElement = document.createElement('div');
        tempElement.innerHTML = documentoGerado;
        
        // Extrair o texto puro sem marcações HTML
        const textoPuro = tempElement.innerText || tempElement.textContent || '';
        
        // Copiar o texto puro para a área de transferência
        navigator.clipboard.writeText(textoPuro)
          .then(() => toast.success('Documento copiado para a área de transferência!'))
          .catch(() => toast.error('Erro ao copiar documento.'));
      } catch (error) {
        console.error('Erro ao processar texto para cópia:', error);
        toast.error('Erro ao copiar documento.');
      }
    }
  };

  // Configurações do editor Quill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align', 'list', 'indent',
    'link', 'image'
  ];

  // Adaptação da função de edição para o Quill
  const handleDocumentoChange = (content: string) => {
    setDocumentoGerado(content);
    documentoModificado.current = true;
  };

  // Salvamento automático
  useEffect(() => {
    // Configurar salvamento automático a cada 30 segundos se houver alterações
    const configurarSalvamentoAutomatico = () => {
      // Limpar qualquer timer existente
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Configurar novo timer
      timerRef.current = setInterval(() => {
        if (documentoModificado.current && user && documentoGerado && tipoDocumentoSelecionado) {
          salvarDocumentoAutomatico();
        }
      }, 30000); // 30 segundos
    };

    // Iniciar o temporizador quando o documento estiver no modo de edição
    if (etapa === 'editor') {
      configurarSalvamentoAutomatico();
    }

    // Limpar temporizador ao desmontar o componente ou mudar de etapa
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, user, documentoGerado, tipoDocumentoSelecionado]);

  // Função para salvamento automático (sem feedback visual de toast)
  const salvarDocumentoAutomatico = async () => {
    if (!user || !documentoGerado || !tipoDocumentoSelecionado || salvando) {
      return;
    }
    
    try {
      setSalvando(true);
      
      // Verificar se a configuração do formulário existe antes de acessar a propriedade 'nome'
      let tipoDoc = '';
      if (CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado]) {
        tipoDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].nome;
      } else {
        tipoDoc = tipoDocumentoSelecionado; // Usar o ID como fallback
      }
      
      if (documentoAtual) {
        // Atualizar documento existente
        await atualizarDocumento(documentoAtual, {
          titulo: tituloDocumento,
          conteudo: documentoGerado
        });
      } else {
        // Criar novo documento
        const novoDocumento = await criarDocumento(
          user.id,
          tituloDocumento,
          tipoDoc,
          documentoGerado
        );
        
        // Atualizar o ID do documento atual
        setDocumentoAtual(novoDocumento.id || null);
      }
      
      // Resetar flag de modificação e atualizar hora do último salvamento
      documentoModificado.current = false;
      setUltimoSalvamento(new Date());
      
      // Feedback sutil de salvamento
      const statusElement = document.getElementById('status-salvamento');
      if (statusElement) {
        statusElement.textContent = 'Salvo automaticamente';
        setTimeout(() => {
          if (statusElement) {
            statusElement.textContent = 'Todas as alterações salvas';
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao salvar documento automaticamente:', error);
      // Sem toast para não interromper o usuário
    } finally {
      setSalvando(false);
    }
  };

  // Função para salvar o documento no banco de dados (com feedback visual)
  const salvarDocumento = async () => {
    if (!user || !documentoGerado || !tipoDocumentoSelecionado) {
      toast.error('Não foi possível salvar o documento.');
      return;
    }
    
    try {
      setSalvando(true);
      
      // Verificar se a configuração do formulário existe antes de acessar a propriedade 'nome'
      let tipoDoc = '';
      if (CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado]) {
        tipoDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].nome;
      } else {
        tipoDoc = tipoDocumentoSelecionado; // Usar o ID como fallback
      }
      
      if (documentoAtual) {
        // Atualizar documento existente
        await atualizarDocumento(documentoAtual, {
          titulo: tituloDocumento,
          conteudo: documentoGerado
        });
        
        toast.success('Documento atualizado com sucesso!');
      } else {
        // Criar novo documento
        const novoDocumento = await criarDocumento(
          user.id,
          tituloDocumento,
          tipoDoc,
          documentoGerado
        );
        
        // Atualizar o ID do documento atual
        setDocumentoAtual(novoDocumento.id || null);
        
        toast.success('Documento salvo com sucesso!');
      }
      
      // Resetar flag de modificação e atualizar hora do último salvamento
      documentoModificado.current = false;
      setUltimoSalvamento(new Date());
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast.error('Erro ao salvar documento. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  // Função para carregar um documento existente
  const carregarDocumento = async (documentoId: string) => {
    try {
      const documento = await fetchDocumento(documentoId);
      
      if (documento) {
        setTituloDocumento(documento.titulo || 'Documento sem título');
        setDocumentoGerado(documento.conteudo || '');
        setDocumentoAtual(documentoId);
        
        // Configurar o tipo de documento com base no documento carregado
        setTipoDocumentoSelecionado(documento.tipo || '');
        
        // Ir diretamente para a etapa de editor (sem passar pela verificação)
        setEtapa('editor');
        
        // Fechar a sidebar em dispositivos móveis
        if (isMobile) {
          setSidebarAberta(false);
        }
        
        // Notificar usuário
        toast.success('Documento carregado com sucesso!');
      } else {
        toast.error('Não foi possível carregar o documento.');
      }
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      toast.error('Erro ao carregar o documento. Tente novamente.');
    }
  };

  // Função para criar um novo documento
  const criarNovoDocumento = () => {
    // Resetar estados
    setDocumentoGerado('');
    setTipoDocumentoSelecionado('');
    setValoresFormulario({});
    setDocumentoAtual(null);
    setTituloDocumento('');
    setEtapa('selecao');
    
    // Resetar estados de verificação
    setFontesRecomendadas([]);
    setJurisprudenciasRecomendadas([]);
    setLeisRecomendadas([]);
    setAnaliseReferencias('');
    
    // Fechar a sidebar em dispositivos móveis
    if (isMobile) {
      setSidebarAberta(false);
    }
  };

  // Função para alterar o título do documento
  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTituloDocumento(e.target.value);
  };

  // Renderiza o seletor de tipo de documento
  const renderSeletorTipoDocumento = () => (
    <motion.div 
      className="max-w-4xl mx-auto p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary-800 dark:text-primary-300 mb-6">
        Selecione o tipo de documento
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {TIPOS_DOCUMENTOS.map((tipo) => (
          <motion.button
            key={tipo.id}
            className="p-4 rounded-lg border-2 border-law-200 dark:border-law-700 hover:border-primary-500 dark:hover:border-primary-500 bg-white dark:bg-law-800 shadow-sm hover:shadow-md transition-all text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelecionarTipoDocumento(tipo.id)}
          >
            <h3 className="font-medium text-primary-700 dark:text-primary-300">{tipo.nome}</h3>
            <p className="text-sm text-law-500 dark:text-law-400 mt-1">
              Gerar um documento de {tipo.nome.toLowerCase()}
            </p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  // Renderiza o formulário dinâmico
  const renderFormulario = () => {
    const config = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado];
    if (!config) return null;

    return (
      <motion.div 
        className="max-w-4xl mx-auto p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex items-center mb-6">
          <button 
            onClick={voltarEtapa}
            className="mr-4 p-2 rounded-full hover:bg-law-100 dark:hover:bg-law-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-700 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary-800 dark:text-primary-300">
            {config.nome}
          </h2>
        </div>
        
        <form onSubmit={handleSubmitFormulario} className="space-y-4">
          {config.campos.map((campo) => (
            <div key={campo.id} className="form-group">
              <label 
                htmlFor={campo.id} 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {campo.label}
                {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {campo.tipo === 'texto' && (
                <input
                  type="text"
                  id={campo.id}
                  value={valoresFormulario[campo.id] || ''}
                  onChange={(e) => handleInputChange(campo.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                />
              )}
              
              {campo.tipo === 'textarea' && (
                <textarea
                  id={campo.id}
                  value={valoresFormulario[campo.id] || ''}
                  onChange={(e) => handleInputChange(campo.id, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                />
              )}
              
              {campo.tipo === 'select' && campo.opcoes && (
                <select
                  id={campo.id}
                  value={valoresFormulario[campo.id] || ''}
                  onChange={(e) => handleInputChange(campo.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {campo.opcoes.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.texto}
                    </option>
                  ))}
                </select>
              )}
              
              {campo.tipo === 'numero' && (
                <input
                  type="number"
                  id={campo.id}
                  value={valoresFormulario[campo.id] || ''}
                  onChange={(e) => handleInputChange(campo.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                />
              )}
              
              {campo.tipo === 'data' && (
                <input
                  type="date"
                  id={campo.id}
                  value={valoresFormulario[campo.id] || ''}
                  onChange={(e) => handleInputChange(campo.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                />
              )}
            </div>
          ))}
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isAnalisandoReferencias}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalisandoReferencias ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analisando Referências...
                </>
              ) : 'Prosseguir'}
            </button>
          </div>
        </form>
      </motion.div>
    );
  };

  // Renderiza a etapa de verificação de usabilidade
  const renderVerificacao = () => (
    <motion.div 
      className="max-w-4xl mx-auto p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center mb-6">
        <button 
          onClick={voltarEtapa}
          className="mr-4 p-2 rounded-full hover:bg-law-100 dark:hover:bg-law-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-700 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary-800 dark:text-primary-300">
          Verificação de Referências Jurídicas
        </h2>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Revise as referências jurídicas que a IA sugere utilizar para este documento. 
          Você pode continuar com estas referências ou voltar para ajustar os dados do formulário.
        </p>
        
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                <strong>Atenção:</strong> A IA pode sugerir referências que precisam ser verificadas. Como profissional do direito, é sua responsabilidade confirmar a aplicabilidade e atualidade das fontes jurídicas antes de utilizá-las em documentos oficiais.
              </p>
            </div>
          </div>
        </div>
        
        {/* Leis e Artigos */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-2">
            Leis e Artigos Aplicáveis
          </h3>
          {leisRecomendadas.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {leisRecomendadas.map((lei, idx) => (
                <li key={idx} className="ml-2">{lei}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma referência específica identificada</p>
          )}
        </div>
        
        {/* Jurisprudências */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-2">
            Jurisprudências Relevantes
          </h3>
          {jurisprudenciasRecomendadas.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {jurisprudenciasRecomendadas.map((jurisprudencia, idx) => (
                <li key={idx} className="ml-2">{jurisprudencia}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma jurisprudência específica identificada</p>
          )}
        </div>
        
        {/* Fontes Doutrinárias */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-2">
            Fontes Doutrinárias
          </h3>
          {fontesRecomendadas.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {fontesRecomendadas.map((fonte, idx) => (
                <li key={idx} className="ml-2">{fonte}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma fonte doutrinária específica identificada</p>
          )}
        </div>
        
        {/* Análise Completa */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-2">
            Análise Jurídica Completa
          </h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm">
            {analiseReferencias}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={voltarEtapa}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Ajustar Formulário
        </button>
        
        <button
          onClick={gerarDocumento}
          disabled={isGerandoDocumento}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGerandoDocumento ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Gerando...
            </>
          ) : 'Continuar com Essas Referências'}
        </button>
      </div>
    </motion.div>
  );

  // Funções para manipulação de texto
  const substituirTextoEditor = (inicio: number, fim: number, novoTexto: string): boolean => {
    try {
      const editor = editorRef.current?.getEditor();
      if (editor) {
        editor.deleteText(inicio, fim - inicio);
        editor.insertText(inicio, novoTexto);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao substituir texto no editor:', error);
      return false;
    }
  };

  const moverConteudoEditor = (origem: {inicio: number, fim: number}, destino: number): boolean => {
    try {
      const editor = editorRef.current?.getEditor();
      if (editor) {
        // Obter o texto a ser movido
        const textoMover = editor.getText(origem.inicio, origem.fim - origem.inicio);
        
        // Ajustar o índice de destino se estiver após a origem
        const destinoAjustado = destino > origem.inicio ? destino - (origem.fim - origem.inicio) : destino;
        
        // Inserir no destino
        editor.insertText(destinoAjustado, textoMover);
        
        // Remover da origem (ajustar índices se necessário)
        const ajuste = destino < origem.inicio ? textoMover.length : 0;
        editor.deleteText(origem.inicio + ajuste, origem.fim - origem.inicio);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao mover conteúdo no editor:', error);
      return false;
    }
  };

  // Modificar o renderEditor para corrigir a visibilidade
  const renderEditor = () => (
    <div className="flex-1 flex flex-col relative mt-4 sm:mt-6 overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 flex items-center">
        <button
          onClick={voltarEtapa}
          className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Voltar para etapa anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        <input
          type="text"
          value={tituloDocumento}
          onChange={handleTituloChange}
          placeholder="Título do documento"
          className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 px-2 py-1 text-lg font-medium text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
        />
        
        <div className="flex items-center ml-auto space-x-2">
          {ultimoSalvamento && (
            <span id="status-salvamento" className="text-xs text-gray-500 dark:text-gray-400 mr-2">
              {salvando ? 'Salvando...' : 'Todas as alterações salvas'}
            </span>
          )}
          
          <button
            onClick={salvarDocumento}
            disabled={salvando}
            className={`px-3 py-1.5 rounded-md ${
              salvando 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            } text-sm font-medium transition-colors`}
            title="Salvar documento"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          
          <button
            onClick={() => {
              // Exportar documento como DOCX
              const loadingToast = toast.loading('Preparando documento para download...');
              
              try {
                // Criar elemento temporário para analisar o HTML do Quill
                const tempElement = document.createElement('div');
                tempElement.innerHTML = documentoGerado;
                
                // Extrair texto e formatação básica do HTML
                const paragraphs: Paragraph[] = [];
                const elements = Array.from(tempElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, div'));
                
                for (const element of elements) {
                  // Pular elementos aninhados para evitar duplicação
                  if (element.parentElement && elements.includes(element.parentElement)) {
                    continue;
                  }
                  
                  // Obter texto simples do elemento
                  const text = element.textContent || '';
                  
                  // Determinar alinhamento
                  let alignment;
                  const computedStyle = window.getComputedStyle(element);
                  const textAlign = computedStyle.textAlign;
                  
                  // Mapear valores de alinhamento entre CSS e docx
                  if (textAlign === 'center') {
                    alignment = AlignmentType.CENTER;
                  } else if (textAlign === 'right') {
                    alignment = AlignmentType.RIGHT;
                  } else if (textAlign === 'left') {
                    alignment = AlignmentType.LEFT;
                  } else {
                    alignment = AlignmentType.JUSTIFIED;
                  }
                  
                  // Determinar se é título
                  let heading = undefined;
                  if (element.tagName.match(/^H[1-6]$/)) {
                    const level = parseInt(element.tagName.substring(1));
                    switch (level) {
                      case 1: heading = HeadingLevel.HEADING_1; break;
                      case 2: heading = HeadingLevel.HEADING_2; break;
                      case 3: heading = HeadingLevel.HEADING_3; break;
                      case 4: heading = HeadingLevel.HEADING_4; break;
                      case 5: heading = HeadingLevel.HEADING_5; break;
                      case 6: heading = HeadingLevel.HEADING_6; break;
                    }
                  }
                  
                  // Criar TextRun simples
                  const textRun = new TextRun({
                    text: text
                  });
                  
                  // Criar parágrafo com o TextRun
                  paragraphs.push(new Paragraph({
                    heading,
                    alignment,
                    children: [textRun],
                    spacing: {
                      after: 200,
                    }
                  }));
                }
                
                // Criar título se existir
                if (tituloDocumento) {
                  paragraphs.unshift(new Paragraph({
                    text: tituloDocumento,
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: {
                      before: 400,
                      after: 400
                    }
                  }));
                }
                
                // Criar documento
                const doc = new Document({
                  sections: [{
                    properties: {
                      page: {
                        margin: {
                          top: convertInchesToTwip(1),
                          right: convertInchesToTwip(1),
                          bottom: convertInchesToTwip(1),
                          left: convertInchesToTwip(1)
                        }
                      }
                    },
                    children: paragraphs
                  }]
                });
                
                // Gerar arquivo
                Packer.toBuffer(doc).then(buffer => {
                  const blob = new Blob([buffer], { 
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                  });
                  saveAs(blob, `${tituloDocumento || 'documento'}.docx`);
                  toast.success('Documento DOCX gerado com sucesso!', { id: loadingToast });
                });
              } catch (error) {
                console.error('Erro ao gerar documento:', error);
                toast.error('Falha ao exportar o documento. Tente novamente.', { id: loadingToast });
              }
            }}
            className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-md text-sm font-medium transition-colors"
            title="Exportar como DOCX"
          >
            Exportar
          </button>
          
          <button
            onClick={imprimirDocumento}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors"
            title="Imprimir documento"
          >
            Imprimir
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900 z-10">
        <div className="relative h-full">
  const renderEditor = () => {
    return (
      <div
        className="flex-1 flex flex-col relative mt-4 sm:mt-6 overflow-hidden"
      >
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 flex items-center">
          <button
            onClick={voltarEtapa}
            className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Voltar para etapa anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          <input
            type="text"
            value={tituloDocumento}
            onChange={handleTituloChange}
            placeholder="Título do documento"
            className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 px-2 py-1 text-lg font-medium text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
          />
          
          <div className="flex items-center ml-auto space-x-2">
            {ultimoSalvamento && (
              <span id="status-salvamento" className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                {salvando ? 'Salvando...' : 'Todas as alterações salvas'}
              </span>
            )}
            
            <button
              onClick={salvarDocumento}
              disabled={salvando}
              className={`px-3 py-1.5 rounded-md ${
                salvando 
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              } text-sm font-medium transition-colors`}
              title="Salvar documento"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            
            <button
              onClick={() => {
                // Exportar documento como DOCX
                const loadingToast = toast.loading('Preparando documento para download...');
                
                try {
                  // Criar elemento temporário para analisar o HTML do Quill
                  const tempElement = document.createElement('div');
                  tempElement.innerHTML = documentoGerado;
                  
                  // Extrair texto e formatação básica do HTML
                  const paragraphs: Paragraph[] = [];
                  const elements = Array.from(tempElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, div'));
                  
                  for (const element of elements) {
                    // Pular elementos aninhados para evitar duplicação
                    if (element.parentElement && elements.includes(element.parentElement)) {
                      continue;
                    }
                    
                    // Obter texto simples do elemento
                    const text = element.textContent || '';
                    
                    // Determinar alinhamento
                    let alignment;
                    const computedStyle = window.getComputedStyle(element);
                    const textAlign = computedStyle.textAlign;
                    
                    // Mapear valores de alinhamento entre CSS e docx
                    if (textAlign === 'center') {
                      alignment = AlignmentType.CENTER;
                    } else if (textAlign === 'right') {
                      alignment = AlignmentType.RIGHT;
                    } else if (textAlign === 'left') {
                      alignment = AlignmentType.LEFT;
                    } else {
                      alignment = AlignmentType.JUSTIFIED;
                    }
                    
                    // Determinar se é título
                    let heading = undefined;
                    if (element.tagName.match(/^H[1-6]$/)) {
                      const level = parseInt(element.tagName.substring(1));
                      switch (level) {
                        case 1: heading = HeadingLevel.HEADING_1; break;
                        case 2: heading = HeadingLevel.HEADING_2; break;
                        case 3: heading = HeadingLevel.HEADING_3; break;
                        case 4: heading = HeadingLevel.HEADING_4; break;
                        case 5: heading = HeadingLevel.HEADING_5; break;
                        case 6: heading = HeadingLevel.HEADING_6; break;
                      }
                    }
                    
                    // Criar TextRun simples
                    const textRun = new TextRun({
                      text: text
                    });
                    
                    // Criar parágrafo com o TextRun
                    paragraphs.push(new Paragraph({
                      heading,
                      alignment,
                      children: [textRun],
                      spacing: {
                        after: 200,
                      }
                    }));
                  }
                  
                  // Criar título se existir
                  if (tituloDocumento) {
                    paragraphs.unshift(new Paragraph({
                      text: tituloDocumento,
                      heading: HeadingLevel.HEADING_1,
                      alignment: AlignmentType.CENTER,
                      spacing: {
                        before: 400,
                        after: 400
                      }
                    }));
                  }
                  
                  // Criar documento
                  const doc = new Document({
                    sections: [{
                      properties: {
                        page: {
                          margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1)
                          }
                        }
                      },
                      children: paragraphs
                    }]
                  });
                  
                  // Gerar arquivo
                  Packer.toBuffer(doc).then(buffer => {
                    const blob = new Blob([buffer], { 
                      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                    });
                    saveAs(blob, `${tituloDocumento || 'documento'}.docx`);
                    toast.success('Documento DOCX gerado com sucesso!', { id: loadingToast });
                  });
                } catch (error) {
                  console.error('Erro ao gerar documento:', error);
                  toast.error('Falha ao exportar o documento. Tente novamente.', { id: loadingToast });
                }
              }}
              className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-md text-sm font-medium transition-colors"
              title="Exportar como DOCX"
            >
              Exportar
            </button>
            
            <button
              onClick={imprimirDocumento}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors"
              title="Imprimir documento"
            >
              Imprimir
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900 z-10">
          <div className="relative h-full">
            <div className="flex-1 h-full print-content bg-white dark:bg-white z-20" id="documento-para-impressao">
              <ReactQuill
                ref={handleEditorRef}
                theme="snow"
                value={documentoGerado}
                onChange={(value) => {
                  setDocumentoGerado(value);
                  documentoModificado.current = true;
                }}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ indent: '-1' }, { indent: '+1' }],
                    [{ align: [] }],
                    ['clean'],
                  ],
                  clipboard: {
                    matchVisual: false,
                  },
                }}
                onInit={() => {
                  const editorElement = document.querySelector('.ql-editor');
                  setupSelectionObserver(editorElement);
                  
                  // Adicionar evento para capturar selection-change
                  if (editorRef.current) {
                    const editor = editorRef.current.getEditor();
                    editor.on('selection-change', (range) => {
                      if (range && range.length > 0) {
                        // Texto selecionado
                        const selectedText = editor.getText(range.index, range.length);
                        if (selectedText.trim().length > 0) {
                          setTextoSelecionado(selectedText);
                          setPosicaoSelecao({ index: range.index, length: range.length });
                          
                          // Calcular posição para tooltip
                          const bounds = editor.getBounds(range.index, range.length);
                          const tooltipPosition = {
                            x: bounds.left + bounds.width / 2,
                            y: bounds.top,
                          };
                          setTooltipPosition(tooltipPosition);
                          setMostrarTooltip(true);
                        }
                      } else {
                        // Sem seleção
                        setMostrarTooltip(false);
                      }
                    });
                  }
                }}
                className="z-30 relative" // Adicionando z-index e relative ao editor
              />
            </div>
          </div>
        </div>
        
        {/* Tooltip para analisar texto selecionado */}
        <AnimatePresence>
          {mostrarTooltip && textoSelecionado && tooltipPosition && (
            <TextSuggestionTooltip 
              position={tooltipPosition} 
              onAnalyze={analisarTextoSelecionado}
            />
          )}
        </AnimatePresence>
        
        {/* Animação temporária de análise */}
        <AnimatePresence>
          {analisando && (
            <AnalysisIndicator />
          )}
        </AnimatePresence>
        
        {/* Assistente do editor - passar a referência do editor */}
        <EditorAssistant
          documentoId={documentoAtual || 'temp_doc_id'}
          tipoDocumento={tipoDocumentoSelecionado}
          conteudoAtual={documentoGerado}
          onAplicarSugestao={aplicarSugestaoAssistente}
          editorRef={editorRef} // Passar a referência
          onSubstituirTexto={substituirTextoEditor}
          onMoverConteudo={moverConteudoEditor}
        />
      </div>
    </div>
  );
};

  // Modificar o layout para exibir a barra lateral fixa
  return (
    <Layout title="Gerador de Documentos">
      <Head>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content .ql-editor, .print-content .ql-editor * {
              visibility: visible;
            }
            .print-content .ql-editor {
              position: absolute;
              left: 0;
              top: 0;
              width: 21cm;
              height: auto;
              margin: 0;
              padding: 2.54cm;
              box-sizing: border-box;
              overflow: visible;
              page-break-inside: avoid;
            }
            .ql-toolbar {
              display: none !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
            html, body {
              width: 21cm;
              height: 29.7cm;
              background-color: white;
            }
            .no-print {
              display: none !important;
            }
          }
          
          /* Estilos Quill personalizados */
          .ql-editor {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            padding: 1.5cm;
            text-align: justify;
          }
          
          .ql-editor p, .ql-editor ol, .ql-editor ul, .ql-editor pre, .ql-editor blockquote {
            margin-bottom: 1em;
          }
          
          /* Estilos para impressão */
          .print-content .ql-editor {
            height: auto !important;
            min-height: 29.7cm;
            box-shadow: none;
          }
          
          .ql-snow .ql-toolbar {
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            background-color: #f9fafb;
          }
          
          .dark .ql-snow .ql-toolbar {
            background-color: #1e293b;
            border-color: #334155;
          }
          
          /* Garantir que o texto seja sempre visível */
          .ql-snow .ql-editor {
            color: #111827 !important; /* Texto escuro para modo claro */
          }
          
          .dark .ql-snow .ql-editor {
            color: #111827 !important; /* Mantém o texto escuro mesmo no modo escuro */
          }
          
          /* Consertar cores para os elementos dentro do editor */
          .ql-snow .ql-editor h1, 
          .ql-snow .ql-editor h2, 
          .ql-snow .ql-editor h3, 
          .ql-snow .ql-editor h4, 
          .ql-snow .ql-editor h5, 
          .ql-snow .ql-editor h6, 
          .ql-snow .ql-editor p, 
          .ql-snow .ql-editor span, 
          .ql-snow .ql-editor strong, 
          .ql-snow .ql-editor em, 
          .ql-snow .ql-editor u, 
          .ql-snow .ql-editor ol, 
          .ql-snow .ql-editor ul, 
          .ql-snow .ql-editor li {
            color: #111827 !important;
          }
          
          .dark .ql-snow.ql-container {
            border-color: #334155;
          }
          
          /* Ajusta altura do container para incluir a barra de ferramentas */
          .ql-container {
            min-height: calc(29.7cm - 42px);
          }
          
          /* Melhorias para dispositivos móveis */
          @media screen and (max-width: 768px) {
            .ql-editor {
              padding: 1cm;
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch !important;
              touch-action: auto !important;
            }
            
            .print-content {
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch !important;
              touch-action: auto !important;
              max-height: calc(100vh - 200px) !important;
            }
            
            .ql-container {
              min-height: auto !important;
              height: auto !important;
              overflow: visible !important;
            }
            
            #documento-para-impressao {
              min-height: auto !important;
              overflow: visible !important;
            }
            
            .bg-white.shadow-lg {
              overflow: visible !important;
              max-height: none !important;
            }
          }
          
          /* Estilos para o botão de análise de texto */
          #botao-analise-texto {
            position: fixed;
            display: none;
            z-index: 1000;
            transform: translate(-50%, -100%);
          }
          
          /* Garantir que o editor esteja sempre visível */
          .react-quill {
            z-index: 20 !important;
            position: relative !important;
            background-color: white !important;
          }
          
          .ql-container {
            z-index: 20 !important;
            position: relative !important;
            background-color: white !important;
          }
          
          .ql-editor {
            z-index: 20 !important;
            position: relative !important;
            background-color: white !important;
          }
          
          .ql-toolbar {
            z-index: 21 !important;
            position: relative !important;
            background-color: #f9fafb !important;
          }
          
          .dark .ql-toolbar {
            background-color: #1e293b !important;
          }
          
          /* Garantir que o degradê fique abaixo do editor */
          .bg-gray-100, .dark .bg-gray-800 {
            z-index: 1 !important;
          }
        `}</style>
      </Head>
      
      <div className="h-full flex flex-col md:flex-row">
        {/* Overlay para fechar a sidebar em mobile (deve vir antes no DOM para ficar abaixo da sidebar) */}
        {isMobile && sidebarAberta && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarAberta(false)}
          />
        )}
        
        {/* Sidebar com documentos salvos - versão mobile gerenciada pelo próprio componente */}
        {(sidebarAberta || !isMobile) && (
          <div className={isMobile ? '' : 'w-72 min-w-[18rem] max-w-xs'}>
            <DocumentosSidebar 
              documentoAtual={documentoAtual}
              onSelecionarDocumento={carregarDocumento}
              onNovoDocumento={criarNovoDocumento}
              onFecharSidebar={() => setSidebarAberta(false)}
              isMobile={isMobile}
            />
          </div>
        )}
        
        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col h-full overflow-visible">
          {/* Toggle sidebar apenas em dispositivos móveis */}
          <div className="md:hidden p-4 border-b border-law-200 dark:border-law-700 bg-white dark:bg-gray-900">
            <button
              onClick={() => setSidebarAberta(!sidebarAberta)}
              className="flex items-center text-primary-600 dark:text-primary-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Documentos
            </button>
          </div>
          
          {/* Remover botão toggle da sidebar no desktop, já que ela será fixa */}
          
          {/* Área de conteúdo principal */}
          <div className="flex-1 overflow-auto p-0 documentos-content-container scrollbar-custom">
            <AnimatePresence mode="wait">
              {etapa === 'selecao' && renderSeletorTipoDocumento()}
              {etapa === 'formulario' && renderFormulario()}
              {etapa === 'verificacao' && renderVerificacao()}
              {etapa === 'editor' && renderEditor()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
} 