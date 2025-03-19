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
  const editorRef = useRef<HTMLDivElement>(null);

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
      navigator.clipboard.writeText(documentoGerado)
        .then(() => toast.success('Documento copiado para a área de transferência!'))
        .catch(() => toast.error('Erro ao copiar documento.'));
    }
  };

  // Função para baixar o documento como DOCX
  const baixarComoDocx = async () => {
    if (!documentoGerado) return;
    
    try {
      // Mostrar que o download está sendo processado
      toast.loading('Preparando documento para download...', { id: 'docx-loading' });
      
      // Criar uma versão temporária em HTML para processamento
      const tempElement = document.createElement('div');
      tempElement.innerHTML = documentoGerado;
      
      // Iniciar a criação do documento DOCX com parágrafos
      const docxParagrafos = [];
      
      // Adicionar o título como um parágrafo centralizado em negrito
      docxParagrafos.push(
        new Paragraph({
          text: tituloDocumento || 'Documento Jurídico',
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
            before: 400,
          },
          bold: true,
        })
      );
      
      // Processar corretamente cada parágrafo convertendo HTML em estilos DOCX
      const paragrafos = Array.from(tempElement.querySelectorAll('p'));
      
      if (paragrafos.length === 0) {
        // Se não encontrar parágrafos, tratar o texto como um único parágrafo
        const textoCompleto = tempElement.textContent || '';
        docxParagrafos.push(
          new Paragraph({
            text: textoCompleto,
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      } else {
        // Processar cada parágrafo corretamente
        for (let i = 0; i < paragrafos.length; i++) {
          const paragrafo = paragrafos[i];
          
          // Determinar se é um título
          const ehTitulo = paragrafo.textContent === paragrafo.textContent?.toUpperCase() && 
                           paragrafo.textContent.trim().length > 3;
          
          // Verificar o alinhamento
          let alinhamento = AlignmentType.JUSTIFIED;
          if (paragrafo.style.textAlign === 'center' || paragrafo.classList.contains('titulo-centralizado')) {
            alinhamento = AlignmentType.CENTER;
          } else if (paragrafo.style.textAlign === 'right') {
            alinhamento = AlignmentType.RIGHT;
          } else if (paragrafo.style.textAlign === 'left') {
            alinhamento = AlignmentType.LEFT;
          }
          
          // Processar o conteúdo do parágrafo incluindo formatação
          if (paragrafo.innerHTML.includes('<strong>') || 
              paragrafo.innerHTML.includes('<b>') || 
              paragrafo.innerHTML.includes('<em>') || 
              paragrafo.innerHTML.includes('<u>')) {
            
            // Parágrafo com formatação interna (negrito, itálico, etc.)
            const textRuns = [];
            
            // Converter o HTML para um formato que possamos processar
            const tempSpan = document.createElement('span');
            tempSpan.innerHTML = paragrafo.innerHTML;
            
            // Processar cada nó filho
            Array.from(tempSpan.childNodes).forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                // Texto simples
                textRuns.push({
                  text: child.textContent || '',
                  bold: ehTitulo,
                });
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const elemento = child as HTMLElement;
                
                // Extrair o texto
                const texto = elemento.textContent || '';
                
                // Determinar a formatação
                const ehNegrito = elemento.tagName === 'STRONG' || 
                                  elemento.tagName === 'B' || 
                                  elemento.style.fontWeight === 'bold' ||
                                  ehTitulo;
                                  
                const ehItalico = elemento.tagName === 'EM' || 
                                  elemento.tagName === 'I' || 
                                  elemento.style.fontStyle === 'italic';
                                  
                const ehSublinhado = elemento.tagName === 'U' || 
                                    elemento.style.textDecoration === 'underline';
                
                // Adicionar o texto com a formatação correta
                textRuns.push({
                  text: texto,
                  bold: ehNegrito,
                  italic: ehItalico,
                  underline: ehSublinhado,
                });
              }
            });
            
            // Criar o parágrafo com os Text Runs
            docxParagrafos.push(
              new Paragraph({
                children: textRuns.map(run => new TextRun(run)),
                alignment: alinhamento,
                spacing: {
                  after: 240,
                  before: ehTitulo ? 400 : 0,
                }
              })
            );
          } else {
            // Parágrafo simples sem formatação interna
            docxParagrafos.push(
              new Paragraph({
                text: paragrafo.textContent || '',
                alignment: alinhamento,
                bold: ehTitulo,
                spacing: {
                  after: 240,
                  before: ehTitulo ? 400 : 0,
                }
              })
            );
          }
          
          // Adicionar espaçamento extra entre parágrafos
          if (i < paragrafos.length - 1) {
            // Se o próximo parágrafo for um título, adicionar mais espaço
            const proximoEhTitulo = paragrafos[i+1].textContent === paragrafos[i+1].textContent?.toUpperCase() && 
                                  paragrafos[i+1].textContent.trim().length > 3;
                                  
            if (proximoEhTitulo) {
              docxParagrafos.push(new Paragraph({ text: '', spacing: { before: 240, after: 240 } }));
            }
          }
        }
      }
      
      // Criar o documento final
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440,    // Margem superior: 1 polegada (1440 twips)
                right: 1440,  // Margem direita: 1 polegada
                bottom: 1440, // Margem inferior: 1 polegada
                left: 1440,   // Margem esquerda: 1 polegada
              },
              size: {
                width: 11906, // Largura A4: 8.27" (8.27 * 1440 = 11906 twips)
                height: 16838, // Altura A4: 11.69" (11.69 * 1440 = 16838 twips)
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
            ${documentoGerado}
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

  // Função para editar o documento diretamente no editor
  const handleDocumentoChange = (e: React.FormEvent<HTMLDivElement>) => {
    // Obter a div do editor
    const editorDiv = e.currentTarget;
    
    // Capturar o estado atual da seleção antes de qualquer atualização
    const selection = window.getSelection();
    
    // Armazenar informações completas da seleção
    let savedSelection = null;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelection = {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        collapsed: range.collapsed
      };
    }
    
    // Obter o novo conteúdo antes de qualquer atualização de estado
    const novoConteudo = editorDiv.innerHTML;
    
    // Ignorar atualizações desnecessárias (otimização)
    if (documentoGerado === novoConteudo) return;
    
    // Atualizar o estado
    setDocumentoGerado(novoConteudo);
    
    // Restaurar a seleção após a atualização do estado
    setTimeout(() => {
      if (editorRef.current && savedSelection) {
        try {
          // Focar o editor primeiro
          editorRef.current.focus();
          
          // Verificar se os containers ainda estão no DOM
          const docContainsStart = document.contains(savedSelection.startContainer);
          const docContainsEnd = document.contains(savedSelection.endContainer);
          
          if (docContainsStart && docContainsEnd) {
            // Criar uma nova seleção
            const newRange = document.createRange();
            const sel = window.getSelection();
            
            // Configurar a seleção exatamente como estava antes
            newRange.setStart(savedSelection.startContainer, savedSelection.startOffset);
            newRange.setEnd(savedSelection.endContainer, savedSelection.endOffset);
            
            // Aplicar a seleção
            sel?.removeAllRanges();
            sel?.addRange(newRange);
          } else {
            // Fallback para o nó do editor se os containers originais não estiverem mais disponíveis
            // Este é um último recurso para pelo menos manter o foco no editor
            const textNodes = [];
            
            function collectTextNodes(node) {
              if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                for (let i = 0; i < node.childNodes.length; i++) {
                  collectTextNodes(node.childNodes[i]);
                }
              }
            }
            
            collectTextNodes(editorRef.current);
            
            if (textNodes.length > 0) {
              const range = document.createRange();
              const sel = window.getSelection();
              
              range.setStart(textNodes[0], 0);
              range.setEnd(textNodes[0], 0);
              
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        } catch (error) {
          console.error("Erro ao restaurar a seleção:", error);
        }
      }
    }, 0);
  };

  // Função para alterar o título do documento
  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTituloDocumento(e.target.value);
  };

  // Adicionar funções de formatação de texto
  const executarComando = (comando: string, valor: string = '') => {
    document.execCommand(comando, false, valor);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const formatarTexto = (estilo: string) => {
    switch (estilo) {
      case 'negrito':
        executarComando('bold');
        break;
      case 'italico':
        executarComando('italic');
        break;
      case 'sublinhado':
        executarComando('underline');
        break;
      case 'tachado':
        executarComando('strikeThrough');
        break;
      case 'justificar':
        executarComando('justifyFull');
        break;
      case 'alinhar-esquerda':
        executarComando('justifyLeft');
        break;
      case 'alinhar-centro':
        executarComando('justifyCenter');
        break;
      case 'alinhar-direita':
        executarComando('justifyRight');
        break;
      case 'lista-ordenada':
        executarComando('insertOrderedList');
        break;
      case 'lista-nao-ordenada':
        executarComando('insertUnorderedList');
        break;
      case 'recuo':
        executarComando('indent');
        break;
      case 'reduzir-recuo':
        executarComando('outdent');
        break;
      default:
        break;
    }
    // Atualizar o estado documentoGerado após a formatação
    if (editorRef.current) {
      setDocumentoGerado(editorRef.current.innerHTML);
    }
  };

  const alterarFonte = (evento: React.ChangeEvent<HTMLSelectElement>) => {
    executarComando('fontName', evento.target.value);
    if (editorRef.current) {
      setDocumentoGerado(editorRef.current.innerHTML);
    }
  };

  const alterarTamanhoFonte = (evento: React.ChangeEvent<HTMLSelectElement>) => {
    executarComando('fontSize', evento.target.value);
    if (editorRef.current) {
      setDocumentoGerado(editorRef.current.innerHTML);
    }
  };

  const alterarCorTexto = (evento: React.ChangeEvent<HTMLInputElement>) => {
    executarComando('foreColor', evento.target.value);
    if (editorRef.current) {
      setDocumentoGerado(editorRef.current.innerHTML);
    }
  };

  const inserirLink = () => {
    const url = prompt('Digite o URL do link:');
    if (url) {
      executarComando('createLink', url);
      if (editorRef.current) {
        setDocumentoGerado(editorRef.current.innerHTML);
      }
    }
  };

  const inserirImagem = () => {
    const url = prompt('Digite o URL da imagem:');
    if (url) {
      executarComando('insertImage', url);
      if (editorRef.current) {
        setDocumentoGerado(editorRef.current.innerHTML);
      }
    }
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

      {/* Barra de ferramentas de formatação */}
      <div className="mb-4 p-2 bg-gray-100 dark:bg-law-800 rounded-lg border border-gray-300 dark:border-law-700 overflow-x-auto no-print">
        <div className="flex flex-wrap items-center gap-1 min-w-max">
          {/* Grupo de estilo de texto */}
          <div className="flex border-r border-gray-300 dark:border-law-700 pr-2 gap-1">
            <button 
              onClick={() => formatarTexto('negrito')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Negrito"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            <button 
              onClick={() => formatarTexto('italico')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Itálico"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button 
              onClick={() => formatarTexto('sublinhado')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Sublinhado"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                <line x1="4" y1="21" x2="20" y2="21"></line>
              </svg>
            </button>
            <button 
              onClick={() => formatarTexto('tachado')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Tachado"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 9V5H7v4"></path>
                <path d="M7 15v4h10v-4"></path>
                <line x1="4" y1="12" x2="20" y2="12"></line>
              </svg>
            </button>
          </div>

          {/* Grupo de alinhamento */}
          <div className="flex border-r border-gray-300 dark:border-law-700 pr-2 gap-1">
            <button 
              onClick={() => formatarTexto('alinhar-esquerda')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Alinhar à esquerda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="17" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="17" y1="18" x2="3" y2="18"></line>
              </svg>
            </button>
            <button 
              onClick={() => formatarTexto('alinhar-centro')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Centralizar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="10" x2="6" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="18" y1="18" x2="6" y2="18"></line>
              </svg>
            </button>
            <button 
              onClick={() => formatarTexto('alinhar-direita')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Alinhar à direita"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="7" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="7" y2="18"></line>
              </svg>
            </button>
            <button 
              onClick={() => formatarTexto('justificar')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Justificar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="3" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Grupo de listas */}
          <div className="flex border-r border-gray-300 dark:border-law-700 pr-2 gap-1">
            <button 
              onClick={() => formatarTexto('lista-ordenada')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Lista numerada"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="9" y1="6" x2="20" y2="6"></line>
                <line x1="9" y1="12" x2="20" y2="12"></line>
                <line x1="9" y1="18" x2="20" y2="18"></line>
                <line x1="5" y1="6" x2="5" y2="6"></line>
                <line x1="5" y1="12" x2="5" y2="12"></line>
                <line x1="5" y1="18" x2="5" y2="18"></line>
              </svg>
            </button>
            <button 
              onClick={() => formatarTexto('lista-nao-ordenada')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Lista com marcadores"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="9" y1="6" x2="20" y2="6"></line>
                <line x1="9" y1="12" x2="20" y2="12"></line>
                <line x1="9" y1="18" x2="20" y2="18"></line>
                <circle cx="5" cy="6" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
                <circle cx="5" cy="18" r="1"></circle>
              </svg>
            </button>
            <button 
              onClick={() => formatarTexto('recuo')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Aumentar recuo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="20" y1="6" x2="9" y2="6"></line>
                <line x1="20" y1="12" x2="9" y2="12"></line>
                <line x1="20" y1="18" x2="9" y2="18"></line>
                <polyline points="5 8 1 12 5 16"></polyline>
              </svg>
            </button>
            <button 
              onClick={() => formatarTexto('reduzir-recuo')} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Diminuir recuo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="20" y1="6" x2="9" y2="6"></line>
                <line x1="20" y1="12" x2="9" y2="12"></line>
                <line x1="20" y1="18" x2="9" y2="18"></line>
                <polyline points="1 8 5 12 1 16"></polyline>
              </svg>
            </button>
          </div>

          {/* Seletor de fonte */}
          <div className="flex border-r border-gray-300 dark:border-law-700 pr-2 gap-1">
            <select 
              onChange={alterarFonte} 
              className="p-1 text-xs rounded border border-gray-300 dark:border-law-700 bg-white dark:bg-law-900 text-gray-800 dark:text-gray-300"
              title="Tipo de fonte"
            >
              <option value="">Fonte</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Courier New">Courier New</option>
            </select>
            
            <select 
              onChange={alterarTamanhoFonte} 
              className="p-1 text-xs rounded border border-gray-300 dark:border-law-700 bg-white dark:bg-law-900 text-gray-800 dark:text-gray-300"
              title="Tamanho da fonte"
            >
              <option value="">Tamanho</option>
              <option value="1">Pequeno</option>
              <option value="3">Normal</option>
              <option value="5">Grande</option>
              <option value="7">Muito grande</option>
            </select>

            <div className="flex items-center">
              <input 
                type="color" 
                onChange={alterarCorTexto} 
                className="w-6 h-6 rounded cursor-pointer"
                title="Cor do texto"
              />
            </div>
          </div>

          {/* Inserir elementos */}
          <div className="flex gap-1">
            <button 
              onClick={inserirLink} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Inserir link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
            <button 
              onClick={inserirImagem} 
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-law-700 text-gray-800 dark:text-gray-300"
              title="Inserir imagem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Editor estilo A4 */}
      <div className="bg-white shadow-lg mx-auto rounded-sm overflow-y-auto print:shadow-none mb-10">
        <div 
          ref={editorRef}
          contentEditable={true}
          onInput={handleDocumentoChange}
          className="min-h-[29.7cm] w-full max-w-[21cm] mx-auto bg-white p-4 sm:p-[2.54cm] text-black border border-gray-200 outline-none font-serif text-sm leading-relaxed break-words"
          style={{ 
            boxSizing: 'border-box',
            whiteSpace: 'pre-wrap',
            width: '100%',
            maxWidth: '21cm',
            minHeight: '29.7cm',
            padding: '1.5cm',
            margin: '0 auto',
            lineHeight: '1.5',
            fontSize: '12pt',
            fontFamily: 'Times New Roman, Times, serif',
            textAlign: 'justify'
          }}
          dangerouslySetInnerHTML={{ __html: documentoGerado }}
          id="documento-para-impressao"
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