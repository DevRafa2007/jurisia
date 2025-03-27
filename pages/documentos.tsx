import React, { useState, useEffect, useCallback, useRef } from 'react';
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

export default function DocumentosPage() {
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

  // Verificar se é dispositivo móvel
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verifica quando o componente monta
    checkIsMobile();
    
    // Fecha sidebar em mobile, mantém aberta em desktop
    setSidebarAberta(window.innerWidth >= 768);
    
    // Adiciona listener para quando a janela é redimensionada
    window.addEventListener('resize', checkIsMobile);
    
    // Limpa o listener quando o componente desmonta
    return () => {
      window.removeEventListener('resize', checkIsMobile);
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
      const tipoDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].nome;
      
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
      
      const tipoDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].nome;
      
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

  // Renderiza o editor de documento estilo A4
  const renderEditor = () => (
    <motion.div 
      className="min-h-full flex flex-col overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-law-200 dark:border-law-700">
        <div className="flex items-center mb-2 sm:mb-0">
          <button 
            onClick={voltarEtapa}
            className="mr-4 p-2 rounded-full hover:bg-law-100 dark:hover:bg-law-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-700 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="text"
            value={tituloDocumento}
            onChange={handleTituloChange}
            placeholder="Título do documento"
            className="font-serif text-xl font-bold bg-transparent border-b border-transparent focus:border-primary-500 focus:outline-none dark:text-white w-full max-w-[200px] sm:max-w-none truncate"
          />
        </div>
        
        <div className="flex items-center">
          <span id="status-salvamento" className="text-sm text-gray-500 dark:text-gray-400 hidden md:inline-block mr-2">
            {ultimoSalvamento 
              ? `Última alteração salva: ${ultimoSalvamento.toLocaleTimeString()}` 
              : 'Documento não salvo'}
          </span>
          
          <button
            onClick={salvarDocumento}
            disabled={salvando}
            className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors flex items-center"
          >
            {salvando ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando
              </>
            ) : (
              <>
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Barra de ferramentas do documento */}
      <div className="flex flex-wrap gap-2 p-4 border-b border-law-200 dark:border-law-700 no-print">
        <button
          onClick={imprimirDocumento}
          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir
        </button>
        
        <button
          onClick={baixarComoDocx}
          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Baixar DOCX
        </button>
        
        <button
          onClick={copiarDocumento}
          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copiar
        </button>
        
        {/* Dica para melhor experiência de edição */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-2 w-full no-print">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Dica:</strong> Para melhor experiência e formatação completa, recomendamos baixar o documento em formato DOCX e editá-lo no Microsoft Word ou Google Docs.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Editor Quill */}
      <div className="bg-white shadow-lg mx-auto rounded-sm overflow-hidden print:shadow-none mb-10">
        <div id="documento-para-impressao" className="min-h-[29.7cm] w-full max-w-[21cm] mx-auto bg-white border border-gray-200 outline-none md:min-h-[29.7cm] min-h-auto">
          <ReactQuill
            value={documentoGerado}
            onChange={handleDocumentoChange}
            modules={quillModules}
            formats={quillFormats}
            className="print-content"
            theme="snow"
            style={{
              width: '100%',
              maxWidth: '21cm',
              minHeight: isMobile ? 'auto' : '27cm',  // Remover altura mínima fixa em dispositivos móveis
              fontFamily: 'Times New Roman, Times, serif'
            }}
          />
        </div>
      </div>
    </motion.div>
  );

  // Baixar como DOCX com preservação de formatação
  const baixarComoDocx = async () => {
    // Mostrar toast de carregamento
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
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, `${tituloDocumento || 'documento'}.docx`);

      toast.success('Documento DOCX gerado com sucesso! Para melhor experiência, edite-o no Word ou Google Docs.', { id: loadingToast, duration: 5000 });
    } catch (error) {
      console.error('Erro ao gerar DOCX:', error);
      toast.error('Não foi possível gerar o documento DOCX. Tentando alternativa...', { id: loadingToast });
      
      try {
        // Fallback: exportar como HTML que pode ser aberto no Word
        const htmlContent = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${tituloDocumento || 'Documento Jurídico'}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.5;
              margin: 0;
              padding: 0;
            }
            .documento {
              padding: 2.54cm;
              width: 21cm;
              min-height: 29.7cm;
              box-sizing: border-box;
            }
            h1, h2, h3, h4 {
              font-weight: bold;
            }
            h1 {
              font-size: 14pt;
              text-align: center;
              margin-bottom: 24pt;
            }
            p {
              margin-bottom: 10pt;
              text-align: justify;
            }
            .ql-align-center {
              text-align: center;
            }
            .ql-align-right {
              text-align: right;
            }
            .ql-align-left {
              text-align: left;
            }
            strong, b {
              font-weight: bold;
            }
            em, i {
              font-style: italic;
            }
            u {
              text-decoration: underline;
            }
            ol, ul {
              padding-left: 2em;
              margin-bottom: 10pt;
            }
            li {
              margin-bottom: 5pt;
            }
          </style>
        </head>
        <body>
          <div class="documento">
            <h1>${tituloDocumento}</h1>
            ${documentoGerado}
          </div>
        </body>
        </html>`;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        saveAs(blob, `${tituloDocumento || 'documento'}.html`);
        toast.success('Documento salvo como HTML. Abra no Word e salve como DOCX para melhor compatibilidade.', { id: loadingToast });
      } catch (e) {
        console.error('Erro ao salvar como HTML:', e);
        toast.error('Falha ao salvar o documento. Tente novamente.', { id: loadingToast });
      }
    }
  };

  // Modificar o layout para exibir a barra lateral fixa
  return (
    <Layout title="Gerador de Documentos">
      <Head>
        <title>JurisIA - Editor de Documentos</title>
        <meta name="description" content="Editor de documentos jurídicos com inteligência artificial" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <style jsx global>{`
          .no-print {
            @media print {
              display: none !important;
            }
          }
          .documentos-content-container {
            overflow-y: auto !important;
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
        
        {/* Botão flutuante para abrir a sidebar em dispositivos móveis */}
        {isMobile && !sidebarAberta && (
          <button
            onClick={() => setSidebarAberta(true)}
            className="fixed left-4 bottom-4 w-12 h-12 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center z-30 no-print"
            aria-label="Abrir lista de documentos"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
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