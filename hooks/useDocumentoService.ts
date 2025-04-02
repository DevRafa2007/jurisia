import { useState, useEffect, useRef } from 'react';
import DocumentoService from '../utils/DocumentoService';
import { useRouter } from 'next/router';

// Tipos para análise contextual
export interface SecaoDocumento {
  tipo: 'introducao' | 'desenvolvimento' | 'conclusao' | 'argumentacao' | 'citacao' | 'outro';
  titulo: string;
  indice: number;
  conteudo: string;
  nivel: number;
}

export interface ProblemaDocumento {
  tipo: 'inconsistencia' | 'falta_secao' | 'ordem_incorreta' | 'citacao_invalida' | 'terminologia';
  descricao: string;
  localizacao: number;
  sugestao?: string;
  severidade: 'alta' | 'media' | 'baixa';
}

export interface AnaliseEstrutura {
  secoes: SecaoDocumento[];
  problemas: ProblemaDocumento[];
}

export interface ResumoDocumento {
  resumoGeral: string;
  pontosPrincipais: string[];
  estrutura: {
    introducao?: string;
    argumentosPrincipais: string[];
    conclusao?: string;
  };
}

export interface AnaliseContextual {
  analiseEstrutura?: AnaliseEstrutura;
  resumoDocumento?: ResumoDocumento;
  sugestoesAprimoramento?: string[];
}

export interface DocumentoServiceHook {
  documentoService: DocumentoService | null;
  conteudoEditor: string;
  analisarContexto: () => Promise<AnaliseContextual | null>;
  salvarAlteracoes: () => Promise<boolean>;
  aplicarSugestao: (sugestao: string, posicao?: number) => Promise<boolean>;
  irParaPosicao: (posicao: number) => void;
  detectarAlteracoesSignificativas: () => boolean;
  atualizarCache: () => void;
}

/**
 * Hook personalizado para gerenciar o DocumentoService
 * @param editorRef Referência ao editor Quill
 * @param documentId ID do documento (opcional)
 * @returns Métodos e propriedades para interagir com o DocumentoService
 */
export function useDocumentoService(editorRef: any, documentId?: string): DocumentoServiceHook {
  const [documentoService, setDocumentoService] = useState<DocumentoService | null>(null);
  const [conteudoEditor, setConteudoEditor] = useState<string>('');
  const router = useRouter();
  const conteudoAnteriorRef = useRef<string>('');
  
  // Inicializa o serviço quando o editor estiver disponível
  useEffect(() => {
    if (editorRef?.current?.getEditor) {
      const editorInstance = editorRef.current.getEditor();
      const service = new DocumentoService(editorInstance, documentId);
      setDocumentoService(service);
      
      // Configura um observador para mudanças no editor
      const observador = () => {
        const novoConteudo = service.obterConteudoEditor();
        setConteudoEditor(novoConteudo);
      };
      
      service.configurarObservadorMudancas(observador);
      observador(); // Captura o conteúdo inicial
      
      return () => {
        service.removerObservadores();
      };
    }
  }, [editorRef, documentId]);
  
  // Atualiza a referência do conteúdo anterior quando o conteúdo muda
  useEffect(() => {
    // Só armazena se já tiver um valor inicial e for diferente
    if (conteudoEditor && conteudoEditor !== conteudoAnteriorRef.current) {
      conteudoAnteriorRef.current = conteudoEditor;
    }
  }, [conteudoEditor]);
  
  /**
   * Solicita uma análise contextual do documento atual
   */
  const analisarContexto = async (): Promise<AnaliseContextual | null> => {
    if (!documentoService) return null;
    
    try {
      const resposta = await fetch('/api/documento-analise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conteudo: conteudoEditor,
          documentoNome: router.query.nome || 'Documento sem título',
          documento_id: documentId
        }),
      });

      if (!resposta.ok) {
        throw new Error(`Erro na API: ${resposta.status}`);
      }

      return await resposta.json();
    } catch (erro) {
      console.error('Erro ao realizar análise contextual:', erro);
      return null;
    }
  };
  
  /**
   * Salva as alterações do documento
   */
  const salvarAlteracoes = async (): Promise<boolean> => {
    if (!documentoService || !documentId) return false;
    
    try {
      const resposta = await fetch('/api/documentos/salvar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: documentId,
          conteudo: conteudoEditor
        }),
      });

      if (!resposta.ok) {
        throw new Error(`Erro ao salvar: ${resposta.status}`);
      }

      documentoService.atualizarCache();
      return true;
    } catch (erro) {
      console.error('Erro ao salvar documento:', erro);
      return false;
    }
  };
  
  /**
   * Aplica uma sugestão ao editor
   * @param sugestao Texto da sugestão a ser aplicada
   * @param posicao Posição opcional onde inserir a sugestão
   */
  const aplicarSugestao = async (sugestao: string, posicao?: number): Promise<boolean> => {
    if (!documentoService) return false;
    
    try {
      if (posicao !== undefined) {
        return documentoService.substituirTextoEditor(posicao, posicao, sugestao);
      } else {
        const editor = documentoService.getEditor();
        const selection = editor.getSelection();
        
        if (selection) {
          return documentoService.substituirTextoEditor(selection.index, selection.index + selection.length, sugestao);
        } else {
          // Insere no final do documento
          const length = editor.getLength();
          return documentoService.substituirTextoEditor(length - 1, length - 1, '\n\n' + sugestao);
        }
      }
    } catch (erro) {
      console.error('Erro ao aplicar sugestão:', erro);
      return false;
    }
  };
  
  /**
   * Navega para uma posição específica no editor
   * @param posicao Índice onde posicionar o cursor
   */
  const irParaPosicao = (posicao: number): void => {
    if (!documentoService) return;
    
    try {
      const editor = documentoService.getEditor();
      editor.setSelection(posicao, 0);
      editor.scrollIntoView();
    } catch (erro) {
      console.error('Erro ao navegar para posição:', erro);
    }
  };
  
  /**
   * Verifica se o documento sofreu alterações significativas desde a última análise
   */
  const detectarAlteracoesSignificativas = (): boolean => {
    if (!documentoService) return false;
    return documentoService.verificarAlteracoesSignificativas(conteudoAnteriorRef.current, conteudoEditor);
  };
  
  /**
   * Atualiza o cache do serviço com o conteúdo atual
   */
  const atualizarCache = (): void => {
    if (!documentoService) return;
    documentoService.atualizarCache();
    conteudoAnteriorRef.current = conteudoEditor;
  };
  
  return {
    documentoService,
    conteudoEditor,
    analisarContexto,
    salvarAlteracoes,
    aplicarSugestao,
    irParaPosicao,
    detectarAlteracoesSignificativas,
    atualizarCache
  };
} 