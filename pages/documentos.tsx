import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Head from 'next/head';
import DocumentosSidebar from '../components/DocumentosSidebar';
import { Document, Packer, Paragraph, AlignmentType, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Editor } from '@tinymce/tinymce-react';
import { 
  carregarDocumento as fetchDocumento, 
  criarDocumento, 
  atualizarDocumento
} from '../utils/supabase';

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
  const [etapa, setEtapa] = useState<'selecao' | 'formulario' | 'editor'>('selecao');
  const [valoresFormulario, setValoresFormulario] = useState<Record<string, any>>({});
  const [documentoGerado, setDocumentoGerado] = useState<string>('');
  const [isGerandoDocumento, setIsGerandoDocumento] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [documentoAtual, setDocumentoAtual] = useState<string | null>(null);
  const [tituloDocumento, setTituloDocumento] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const editorRef = useRef<any>(null);

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar inicialmente
    checkIsMobile();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkIsMobile);
    
    // Limpar listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Mostrar dica para usuários de dispositivos móveis
  useEffect(() => {
    if (isMobile && etapa === 'editor' && documentoGerado.length > 2000) {
      toast.success(
        'Dica: Para melhor experiência ao editar documentos grandes, gire o dispositivo para modo paisagem.',
        { duration: 5000, icon: '📱' }
      );
    }
  }, [isMobile, etapa, documentoGerado]);

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
    
    // Gerar documento
    await gerarDocumento();
  };

  // Função para gerar o documento com a IA
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

  // Função para voltar à etapa anterior
  const voltarEtapa = () => {
    if (etapa === 'editor') {
      setEtapa('formulario');
    } else if (etapa === 'formulario') {
      setEtapa('selecao');
      setTipoDocumentoSelecionado('');
      setDocumentoAtual(null);
    }
  };

  // Função para imprimir o documento
  const imprimirDocumento = () => {
    if (!editorRef.current) return;
    
    // Preparar o conteúdo para impressão
    const conteudoParaImprimir = editorRef.current.getContent();
    
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
    if (editorRef.current) {
      const conteudo = editorRef.current.getContent();
      
      // Criar um elemento temporário para extrair o texto
      const temp = document.createElement('div');
      temp.innerHTML = conteudo;
      const texto = temp.textContent || temp.innerText || '';
      
      navigator.clipboard.writeText(texto)
        .then(() => toast.success('Documento copiado para a área de transferência!'))
        .catch(() => toast.error('Erro ao copiar documento.'));
    }
  };

  // Função para baixar o documento como DOCX
  const baixarComoDocx = async () => {
    if (!editorRef.current) return;
    
    try {
      // Mostrar que o download está sendo processado
      toast.loading('Preparando documento para download...', { id: 'docx-loading' });
      
      // Configurações para a conversão
      const docxParagrafos = [];
      
      // Adicionar o título como um parágrafo centralizado em negrito
      docxParagrafos.push(
        new Paragraph({
          text: tituloDocumento || 'Documento Jurídico',
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 400,
            after: 400,
          },
          bold: true,
        })
      );
      
      // Criar uma versão temporária em HTML para processamento
      const tempElement = document.createElement('div');
      tempElement.innerHTML = editorRef.current.getContent();
      
      // Processar cada parágrafo do documento
      const paragrafos = Array.from(tempElement.querySelectorAll('p'));
      
      // Se não houver parágrafos, processar o texto bruto
      if (paragrafos.length === 0) {
        docxParagrafos.push(
          new Paragraph({
            text: tempElement.textContent || '',
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      } else {
        // Processar cada parágrafo, preservando formatação
        for (let i = 0; i < paragrafos.length; i++) {
          const paragrafo = paragrafos[i];
          
          // Determinar alinhamento
          let alinhamento = AlignmentType.JUSTIFIED;
          if (paragrafo.style.textAlign === 'center' || paragrafo.classList.contains('titulo-centralizado')) {
            alinhamento = AlignmentType.CENTER;
          } else if (paragrafo.style.textAlign === 'right') {
            alinhamento = AlignmentType.RIGHT;
          } else if (paragrafo.style.textAlign === 'left') {
            alinhamento = AlignmentType.LEFT;
          }
          
          // Verificar se é um título
          const ehTitulo = paragrafo.textContent === paragrafo.textContent?.toUpperCase() && 
                           paragrafo.textContent.trim().length > 3;
          
          // Verificar se o parágrafo tem formatação interna
          if (paragrafo.querySelector('strong, b, em, i, u, span[style]')) {
            // Processar parágrafo com formatação
            const textRuns = [];
            
            // Função para processar nós de texto e elementos com formatação
            function processarNos(node) {
              if (node.nodeType === Node.TEXT_NODE) {
                // Texto simples sem formatação específica
                if (node.textContent && node.textContent.trim()) {
                  textRuns.push(new TextRun({
                    text: node.textContent,
                    bold: ehTitulo,
                  }));
                }
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const elemento = node;
                
                if (elemento.nodeName === 'BR') {
                  // Quebra de linha
                  textRuns.push(new TextRun({ text: '\n' }));
                } else if (['STRONG', 'B', 'EM', 'I', 'U', 'SPAN'].includes(elemento.nodeName)) {
                  // Elemento com possível formatação
                  
                  // Verificar formatações
                  const ehNegrito = elemento.nodeName === 'STRONG' || 
                                   elemento.nodeName === 'B' || 
                                   elemento.style.fontWeight === 'bold' || 
                                   elemento.style.fontWeight >= '600' ||
                                   ehTitulo;
                                   
                  const ehItalico = elemento.nodeName === 'EM' || 
                                   elemento.nodeName === 'I' || 
                                   elemento.style.fontStyle === 'italic';
                                   
                  const ehSublinhado = elemento.nodeName === 'U' || 
                                     elemento.style.textDecoration === 'underline' ||
                                     elemento.style.textDecoration.includes('underline');
                  
                  // Verificar se tem conteúdo aninhado
                  if (elemento.childNodes.length > 0) {
                    // Processar nós filhos com a formatação do pai
                    for (const filho of Array.from(elemento.childNodes)) {
                      if (filho.nodeType === Node.TEXT_NODE) {
                        if (filho.textContent && filho.textContent.trim()) {
                          textRuns.push(new TextRun({
                            text: filho.textContent,
                            bold: ehNegrito,
                            italic: ehItalico,
                            underline: ehSublinhado,
                          }));
                        }
                      } else {
                        // Processar elementos aninhados recursivamente
                        processarNos(filho);
                      }
                    }
                  } else if (elemento.textContent && elemento.textContent.trim()) {
                    // Elemento sem filhos, apenas texto
                    textRuns.push(new TextRun({
                      text: elemento.textContent,
                      bold: ehNegrito,
                      italic: ehItalico,
                      underline: ehSublinhado,
                    }));
                  }
                } else {
                  // Outros elementos, processar os filhos
                  for (const filho of Array.from(elemento.childNodes)) {
                    processarNos(filho);
                  }
                }
              }
            }
            
            // Processar todos os nós filhos do parágrafo
            for (const node of Array.from(paragrafo.childNodes)) {
              processarNos(node);
            }
            
            // Adicionar o parágrafo com todas as formatações
            docxParagrafos.push(
              new Paragraph({
                children: textRuns,
                alignment: alinhamento,
                spacing: {
                  before: ehTitulo ? 400 : 120,
                  after: ehTitulo ? 400 : 240,
                },
              })
            );
          } else {
            // Parágrafo sem formatação interna
            docxParagrafos.push(
              new Paragraph({
                text: paragrafo.textContent || '',
                alignment: alinhamento,
                bold: ehTitulo,
                spacing: {
                  before: ehTitulo ? 400 : 120,
                  after: ehTitulo ? 400 : 240,
                },
              })
            );
          }
        }
      }
      
      // Criar o documento final
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
              size: {
                width: 11906,  // A4 width in twips
                height: 16838, // A4 height in twips
              },
            },
          },
          children: docxParagrafos,
        }],
      });
      
      // Gerar o blob do documento
      const buffer = await Packer.toBlob(doc);
      
      // Salvar o documento
      saveAs(buffer, `${tituloDocumento || 'Documento Jurídico'}.docx`);
      
      // Fechar notificação de carregamento e mostrar sucesso
      toast.dismiss('docx-loading');
      toast.success('Documento DOCX baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar documento DOCX:', error);
      toast.dismiss('docx-loading');
      toast.error('Erro ao baixar documento. Tentando método alternativo...');
      
      try {
        // Método alternativo usando o HTML diretamente
        const htmlBlob = new Blob([`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>${tituloDocumento || 'Documento Jurídico'}</title>
            <style>
              @page {
                size: A4;
                margin: 2.54cm;
              }
              body {
                font-family: 'Times New Roman', Times, serif;
                font-size: 12pt;
                line-height: 1.5;
                margin: 0;
                padding: 0;
              }
              p {
                margin: 0 0 10pt 0;
                text-align: justify;
              }
              .titulo-centralizado, p:first-child, p strong {
                text-align: center;
                font-weight: bold;
                font-size: 12pt;
                margin-bottom: 12pt;
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
            </style>
          </head>
          <body>
            ${editorRef.current.getContent()}
          </body>
          </html>
        `], { type: 'text/html' });
        
        saveAs(htmlBlob, `${tituloDocumento || 'Documento Jurídico'}.html`);
        toast.success('Documento salvo como HTML. Você pode abrir este arquivo no Word.');
      } catch (htmlError) {
        console.error('Erro ao salvar como HTML:', htmlError);
        toast.error('Não foi possível baixar o documento. Por favor, tente usar a opção de imprimir.');
      }
    }
  };

  // Função para salvar o documento no banco de dados
  const salvarDocumento = async () => {
    if (!user || !editorRef.current || !tipoDocumentoSelecionado) {
      toast.error('Não foi possível salvar o documento.');
      return;
    }
    
    try {
      setSalvando(true);
      
      const tipoDoc = CONFIGURACOES_FORMULARIOS[tipoDocumentoSelecionado].nome;
      const conteudoAtual = editorRef.current.getContent();
      
      if (documentoAtual) {
        // Atualizar documento existente
        await atualizarDocumento(documentoAtual, {
          titulo: tituloDocumento,
          conteudo: conteudoAtual
        });
        
        toast.success('Documento atualizado com sucesso!');
      } else {
        // Criar novo documento
        const novoDocumento = await criarDocumento(
          user.id,
          tituloDocumento,
          tipoDoc,
          conteudoAtual
        );
        
        // Atualizar o ID do documento atual
        setDocumentoAtual(novoDocumento.id || null);
        
        toast.success('Documento salvo com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast.error('Erro ao salvar documento. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  // Função para carregar um documento
  const carregarDocumento = async (documentoId: string) => {
    try {
      setIsGerandoDocumento(true);
      
      const documento = await fetchDocumento(documentoId);
      
      if (documento) {
        // Encontrar o tipo de documento com base no nome
        const tipoEncontrado = Object.keys(CONFIGURACOES_FORMULARIOS).find(
          key => CONFIGURACOES_FORMULARIOS[key].nome === documento.tipo
        );
        
        if (tipoEncontrado) {
          setTipoDocumentoSelecionado(tipoEncontrado);
        } else {
          // Se não encontrar, usar o primeiro tipo como fallback
          setTipoDocumentoSelecionado(TIPOS_DOCUMENTOS[0].id);
        }
        
        setTituloDocumento(documento.titulo);
        setDocumentoGerado(documento.conteudo);
        setDocumentoAtual(documentoId);
        setEtapa('editor');
        
        // Fechar sidebar automaticamente em dispositivos móveis após carregar o documento
        if (isMobile) {
          setSidebarAberta(false);
        }
      } else {
        throw new Error('Documento não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      toast.error('Erro ao carregar documento. Tente novamente.');
    } finally {
      setIsGerandoDocumento(false);
    }
  };

  // Função para criar um novo documento
  const criarNovoDocumento = () => {
    // Resetar estados
    setDocumentoAtual(null);
    setDocumentoGerado('');
    setTituloDocumento('');
    setValoresFormulario({});
    setTipoDocumentoSelecionado('');
    setEtapa('selecao');
    
    // Fechar sidebar em dispositivos móveis
    if (isMobile) {
      setSidebarAberta(false);
    }
  };

  // Função para alterar o título do documento
  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTituloDocumento(e.target.value);
  };

  // Handler para o TinyMCE
  const handleEditorChange = (content: string) => {
    setDocumentoGerado(content);
  };

  // Inicializar o TinyMCE
  const handleEditorInit = (evt: any, editor: any) => {
    editorRef.current = editor;
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
              ) : 'Gerar Documento'}
            </button>
          </div>
        </form>
      </motion.div>
    );
  };

  // Renderiza o editor de documento estilo A4
  const renderEditor = () => (
    <motion.div 
      className="max-w-5xl mx-auto p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center mb-4">
        <button 
          onClick={voltarEtapa}
          className="mr-4 p-2 rounded-full hover:bg-law-100 dark:hover:bg-law-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-700 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary-800 dark:text-primary-300">
          Editor de Documento
        </h2>
      </div>
      
      {/* Campo para título do documento */}
      <div className="mb-4">
        <label htmlFor="documento-titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 no-print">
          Título do Documento
        </label>
        <input
          type="text"
          id="documento-titulo"
          value={tituloDocumento}
          onChange={handleTituloChange}
          placeholder="Insira um título para o documento"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white no-print"
        />
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2 no-print">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          <button
            onClick={imprimirDocumento}
            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="whitespace-nowrap">Imprimir</span>
          </button>
          
          <button
            onClick={baixarComoDocx}
            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="whitespace-nowrap">Baixar DOCX</span>
          </button>
          
          <button
            onClick={copiarDocumento}
            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span className="whitespace-nowrap">Copiar</span>
          </button>
          
          <button
            onClick={salvarDocumento}
            disabled={salvando}
            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="whitespace-nowrap">Salvando...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span className="whitespace-nowrap">Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dica para o usuário */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-700 dark:text-blue-300 no-print">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">Dica para melhor formatação:</p>
            <p>Para edição avançada do documento, recomendamos baixar como DOCX e utilizar o Microsoft Word ou Google Docs para ajustes finais na formatação e estilo.</p>
          </div>
        </div>
      </div>

      {/* TinyMCE Editor */}
      <div className="bg-white shadow-lg mx-auto rounded-sm overflow-hidden print:shadow-none mb-10 w-full">
        <Editor
          apiKey="g0cfoz0z2qtdpt5houf4r9gi87dkagespb9zik46bf6cyxtp"
          onInit={handleEditorInit}
          initialValue={documentoGerado}
          value={documentoGerado}
          onEditorChange={handleEditorChange}
          id="documento-para-impressao"
          init={{
            height: 842, // A4 height in pixels at 96dpi
            width: '100%',
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
              'paste', 'print', 'pagebreak'
            ],
            toolbar: 'undo redo | formatselect | ' +
              'bold italic underline strikethrough | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help | print',
            content_style: `
              body {
                font-family: 'Times New Roman', Times, serif;
                font-size: 12pt;
                line-height: 1.5;
                max-width: 21cm;
                min-height: 29.7cm;
                padding: 2.54cm;
                margin: 0 auto;
                box-sizing: border-box;
                background-color: white;
                color: black;
              }
              p {
                margin: 0 0 0.8em 0;
                text-align: justify;
              }
              /* Estilos para títulos */
              h1, h2, h3, .titulo-centralizado {
                text-align: center;
                font-weight: bold;
                margin: 1.2em 0;
              }
              h1 {
                font-size: 14pt;
                margin-top: 2em;
                margin-bottom: 2.5em;
              }
              /* Garantir que elementos com alinhamento específico mantenham a formatação */
              p[style*="text-align: center"], .titulo-centralizado {
                text-align: center !important;
                font-weight: bold;
              }
              p[style*="text-align: right"] {
                text-align: right !important;
              }
              p[style*="text-align: justify"] {
                text-align: justify !important;
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
            `,
            branding: false,
            language: 'pt_BR',
            forced_root_block: 'p',
            setup: function(editor) {
              editor.on('init', function() {
                // Sobrescrever estilos do TinyMCE para parecer com documento A4
                const iframe = document.querySelector('.tox-edit-area__iframe');
                if (iframe) {
                  const iframeDocument = iframe.contentDocument;
                  if (iframeDocument) {
                    const style = iframeDocument.createElement('style');
                    style.innerHTML = `
                      html, body {
                        background-color: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: 100% !important;
                      }
                      body {
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1) !important;
                        background-color: white !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        overflow-y: auto !important;
                      }
                    `;
                    iframeDocument.head.appendChild(style);
                  }
                }
              });
            }
          }}
        />
      </div>
    </motion.div>
  );

  return (
    <Layout title="Documentos | JurisIA">
      <Head>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #documento-para-impressao, #documento-para-impressao * {
              visibility: visible;
            }
            #documento-para-impressao {
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
          
          /* Estilos para o editor */
          #documento-para-impressao p {
            margin: 0 0 0.5em 0;
            text-align: justify;
          }
          
          #documento-para-impressao .titulo-centralizado,
          #documento-para-impressao p:first-child {
            text-align: center !important;
            font-weight: bold;
            font-size: 14pt;
            margin-bottom: 2em;
          }
          
          #documento-para-impressao strong {
            font-weight: bold;
          }
        `}</style>
      </Head>
      
      <div className="h-full flex flex-col sm:flex-row">
        {/* Sidebar de documentos */}
        <AnimatePresence>
          {sidebarAberta && user && (
            <motion.div
              key="sidebar"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`
                fixed inset-y-0 left-0 z-40 w-full sm:w-80 max-w-full sm:max-w-[280px] 
                bg-white dark:bg-law-900 border-r border-gray-200 dark:border-law-700
              `}
              style={{ top: isMobile ? "0" : "64px" }}
            >
              <div className="w-full h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-law-700">
                <h2 className="font-medium text-lg text-primary-700 dark:text-primary-200">Documentos</h2>
                <button 
                  onClick={() => setSidebarAberta(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-law-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DocumentosSidebar 
                documentoAtual={documentoAtual}
                onSelecionarDocumento={carregarDocumento}
                onNovoDocumento={criarNovoDocumento}
                onFecharSidebar={() => setSidebarAberta(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Área principal de conteúdo */}
        <motion.div 
          className="flex-grow h-full overflow-y-auto flex flex-col relative"
          animate={{ 
            opacity: isMobile && sidebarAberta ? 0.5 : 1
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Botão para abrir sidebar (estilo igual ao do chat) */}
          {user && (
            <div className="absolute top-4 left-4 z-30">
              <button
                onClick={() => setSidebarAberta(!sidebarAberta)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-law-800 transition-colors focus:outline-none"
                aria-label={sidebarAberta ? "Fechar menu" : "Abrir menu"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700 dark:text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="container mx-auto py-6 pb-20 pt-16">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary-800 dark:text-primary-300 mb-6 text-center">
              Gerador de Documentos Jurídicos
            </h1>
            
            <AnimatePresence mode="wait">
              {etapa === 'selecao' && renderSeletorTipoDocumento()}
              {etapa === 'formulario' && renderFormulario()}
              {etapa === 'editor' && renderEditor()}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
} 