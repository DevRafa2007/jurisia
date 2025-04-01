import { useEffect, useRef } from 'react';

/**
 * Interface para o cache do documento
 */
export interface DocumentoCache {
  conteudoHTML: string;
  conteudoTexto: string;
  timestamp: number;
  secoes: Array<{
    titulo: string;
    indice: number;
    conteudo: string;
  }>;
}

/**
 * Serviço para gerenciar a interação com o editor de documentos,
 * fornecendo uma API unificada para leitura e manipulação.
 */
export class DocumentoService {
  private editorRef: React.RefObject<any>;
  private cache: DocumentoCache | null = null;
  private lastUpdateTimestamp: number = 0;
  private observerAttached: boolean = false;
  
  constructor(editorRef: React.RefObject<any>) {
    this.editorRef = editorRef;
    this.setupObservers();
  }
  
  /**
   * Configura observadores para manter o cache atualizado
   */
  private setupObservers(): void {
    if (this.observerAttached || !this.editorRef.current) return;
    
    try {
      const editor = this.getEditor();
      if (editor) {
        editor.on('text-change', this.handleTextChange);
        this.observerAttached = true;
        console.log('DocumentoService: Observadores configurados com sucesso');
      }
    } catch (error) {
      console.error('Erro ao configurar observadores:', error);
    }
  }
  
  /**
   * Manipulador de eventos para mudanças no texto
   */
  private handleTextChange = (delta: any, oldDelta: any, source: string): void => {
    if (source === 'user') {
      this.updateCache();
    }
  };
  
  /**
   * Atualiza o cache do documento
   */
  private updateCache(): void {
    try {
      const editor = this.getEditor();
      if (!editor) return;
      
      this.cache = {
        conteudoHTML: editor.root.innerHTML,
        conteudoTexto: editor.getText(),
        timestamp: Date.now(),
        secoes: this.analisarSecoes(editor.root.innerHTML)
      };
      
      this.lastUpdateTimestamp = Date.now();
    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
    }
  }
  
  /**
   * Analisa o conteúdo HTML para identificar seções do documento
   */
  private analisarSecoes(html: string): Array<{ titulo: string; indice: number; conteudo: string }> {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const secoes = [];
      
      // Identificar cabeçalhos como possíveis títulos de seções
      const headers = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      headers.forEach((header) => {
        const titulo = header.textContent || '';
        
        // Encontrar o índice deste cabeçalho no texto original
        const editorElement = document.querySelector('.ql-editor');
        const textoCompleto = editorElement?.textContent || '';
        const indice = textoCompleto.indexOf(titulo);
        
        if (indice >= 0) {
          // Encontrar o conteúdo desta seção (até o próximo cabeçalho ou fim do documento)
          let conteudo = '';
          let elemento = header.nextElementSibling;
          
          while (elemento && !(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(elemento.tagName))) {
            conteudo += elemento.textContent || '';
            elemento = elemento.nextElementSibling;
          }
          
          secoes.push({
            titulo,
            indice,
            conteudo: conteudo.trim()
          });
        }
      });
      
      return secoes;
    } catch (error) {
      console.error('Erro ao analisar seções:', error);
      return [];
    }
  }
  
  /**
   * Obtém o editor Quill
   * Tenta diferentes métodos para acessar o editor, com fallbacks
   */
  private getEditor(): any {
    try {
      if (!this.editorRef.current) return null;
      
      // Tentar método getEditor() (comum em algumas versões)
      if (typeof this.editorRef.current.getEditor === 'function') {
        return this.editorRef.current.getEditor();
      }
      
      // Tentar acessar a propriedade editor diretamente
      if (this.editorRef.current.editor) {
        return this.editorRef.current.editor;
      }
      
      // Tentar encontrar através do DOM
      const editorElement = document.querySelector('.ql-editor');
      if (editorElement) {
        // Quill armazena a instância no elemento como __quill
        return (editorElement as any).__quill;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao acessar o editor:', error);
      return null;
    }
  }
  
  /**
   * Verifica se o editor está disponível e inicializado
   */
  public isEditorReady(): boolean {
    return !!this.getEditor();
  }
  
  /**
   * Obtém o conteúdo completo do documento em HTML
   */
  public getConteudoHTML(): string {
    if (this.cache && Date.now() - this.lastUpdateTimestamp < 5000) {
      return this.cache.conteudoHTML;
    }
    
    const editor = this.getEditor();
    if (!editor) return '';
    
    try {
      return editor.root.innerHTML;
    } catch (error) {
      console.error('Erro ao obter conteúdo HTML:', error);
      return '';
    }
  }
  
  /**
   * Obtém o conteúdo completo do documento como texto simples
   */
  public getConteudoTexto(): string {
    if (this.cache && Date.now() - this.lastUpdateTimestamp < 5000) {
      return this.cache.conteudoTexto;
    }
    
    const editor = this.getEditor();
    if (!editor) return '';
    
    try {
      return editor.getText();
    } catch (error) {
      console.error('Erro ao obter conteúdo de texto:', error);
      
      // Fallback: tentar extrair texto do DOM
      try {
        const editorElement = document.querySelector('.ql-editor');
        return editorElement ? editorElement.textContent || '' : '';
      } catch (domError) {
        console.error('Erro no fallback para obter texto:', domError);
        return '';
      }
    }
  }
  
  /**
   * Obtém uma seção específica do documento
   */
  public getSecao(inicio: number, fim: number): string {
    const editor = this.getEditor();
    if (!editor) return '';
    
    try {
      return editor.getText(inicio, fim - inicio);
    } catch (error) {
      console.error('Erro ao obter seção:', error);
      return '';
    }
  }
  
  /**
   * Busca ocorrências de texto no documento
   */
  public buscarTexto(texto: string, regex: boolean = false): Array<{indice: number, texto: string, comprimento: number}> {
    const conteudo = this.getConteudoTexto();
    const resultados = [];
    
    if (regex) {
      try {
        const regexp = new RegExp(texto, 'g');
        let match;
        
        while ((match = regexp.exec(conteudo)) !== null) {
          resultados.push({
            indice: match.index,
            texto: match[0],
            comprimento: match[0].length
          });
        }
      } catch (error) {
        console.error('Erro na busca com regex:', error);
      }
    } else {
      let indice = conteudo.indexOf(texto);
      while (indice !== -1) {
        resultados.push({
          indice,
          texto,
          comprimento: texto.length
        });
        indice = conteudo.indexOf(texto, indice + 1);
      }
    }
    
    return resultados;
  }
  
  /**
   * Substitui texto no documento
   */
  public substituirTexto(inicio: number, fim: number, novoTexto: string): boolean {
    const editor = this.getEditor();
    if (!editor) return false;
    
    try {
      editor.deleteText(inicio, fim - inicio);
      editor.insertText(inicio, novoTexto);
      this.updateCache();
      return true;
    } catch (error) {
      console.error('Erro ao substituir texto:', error);
      
      // Fallback: tentar manipular o DOM diretamente
      try {
        const editorElement = document.querySelector('.ql-editor');
        if (!editorElement) return false;
        
        const selection = window.getSelection();
        if (!selection) return false;
        
        const range = document.createRange();
        const textNodes = this.getTextNodes(editorElement);
        
        let charCount = 0;
        let startNode = null, startOffset = 0;
        let endNode = null, endOffset = 0;
        
        // Encontrar os nós de texto e offsets correspondentes às posições
        for (const node of textNodes) {
          const nodeTextLength = node.textContent?.length || 0;
          
          if (!startNode && charCount + nodeTextLength > inicio) {
            startNode = node;
            startOffset = inicio - charCount;
          }
          
          if (!endNode && charCount + nodeTextLength >= fim) {
            endNode = node;
            endOffset = fim - charCount;
            break;
          }
          
          charCount += nodeTextLength;
        }
        
        if (startNode && endNode) {
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
          selection.removeAllRanges();
          selection.addRange(range);
          
          document.execCommand('insertText', false, novoTexto);
          this.updateCache();
          return true;
        }
        
        return false;
      } catch (domError) {
        console.error('Erro no fallback para substituir texto:', domError);
        return false;
      }
    }
  }
  
  /**
   * Auxiliar para obter todos os nós de texto dentro de um elemento
   */
  private getTextNodes(node: Node): Text[] {
    const textNodes: Text[] = [];
    
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentNode: Node | null;
    while (currentNode = walker.nextNode()) {
      textNodes.push(currentNode as Text);
    }
    
    return textNodes;
  }
  
  /**
   * Move conteúdo de uma posição para outra
   */
  public moverConteudo(origem: {inicio: number, fim: number}, destino: number): boolean {
    const editor = this.getEditor();
    if (!editor) return false;
    
    try {
      const conteudo = editor.getText(origem.inicio, origem.fim - origem.inicio);
      
      // Ajustar o índice de destino se estiver após a origem
      const destinoAjustado = destino > origem.inicio ? destino - (origem.fim - origem.inicio) : destino;
      
      editor.deleteText(origem.inicio, origem.fim - origem.inicio);
      editor.insertText(destinoAjustado, conteudo);
      this.updateCache();
      return true;
    } catch (error) {
      console.error('Erro ao mover conteúdo:', error);
      return false;
    }
  }
  
  /**
   * Aplica formatação a um trecho de texto
   */
  public formatarTexto(inicio: number, fim: number, formato: 'bold' | 'italic' | 'underline' | 'header', valor: any): boolean {
    const editor = this.getEditor();
    if (!editor) return false;
    
    try {
      editor.formatText(inicio, fim - inicio, formato, valor);
      this.updateCache();
      return true;
    } catch (error) {
      console.error('Erro ao formatar texto:', error);
      return false;
    }
  }
}

/**
 * Hook para usar o DocumentoService em componentes funcionais
 */
export function useDocumentoService(editorRef: React.RefObject<any>) {
  const serviceRef = useRef<DocumentoService | null>(null);
  
  useEffect(() => {
    if (editorRef.current && !serviceRef.current) {
      serviceRef.current = new DocumentoService(editorRef);
    }
  }, [editorRef.current]);
  
  return serviceRef.current;
} 