/**
 * Serviço para gerenciar a interação com o editor de documentos,
 * fornecendo uma API unificada para leitura, manipulação e análise contextual.
 */

import { logError, logInfo, logWarning } from './logger';

// Interfaces para estrutura de documento
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

interface DocumentoCache {
  conteudo: string;
  analiseContextual?: AnaliseContextual;
  ultimaAtualizacao: Date;
}

export default class DocumentoService {
  private editor: any;
  private documentoId?: string;
  private cache: DocumentoCache;
  private observadores: Array<() => void> = [];
  
  /**
   * Cria uma nova instância do DocumentoService
   * @param editor Instância do editor Quill
   * @param documentoId ID opcional do documento
   */
  constructor(editor: any, documentoId?: string) {
    this.editor = editor;
    this.documentoId = documentoId;
    this.cache = {
      conteudo: '',
      ultimaAtualizacao: new Date()
    };
    
    // Inicializa o cache com o conteúdo atual
    this.atualizarCache();
  }
  
  /**
   * Configura um observador para mudanças no editor
   * @param callback Função a ser chamada quando o conteúdo mudar
   */
  public configurarObservadorMudancas(callback: () => void): void {
    if (!this.editor) return;
    
    const observadorTexto = () => {
      callback();
    };
    
    this.editor.on('text-change', observadorTexto);
    this.observadores.push(observadorTexto);
  }
  
  /**
   * Remove todos os observadores configurados
   */
  public removerObservadores(): void {
    if (!this.editor) return;
    
    this.observadores.forEach(observador => {
      this.editor.off('text-change', observador);
    });
    
    this.observadores = [];
  }
  
  /**
   * Obtém o conteúdo atual do editor
   * @returns Conteúdo do editor como texto
   */
  public obterConteudoEditor(): string {
    if (!this.editor) return '';
    
    try {
      return this.editor.getText();
    } catch (erro) {
      console.error('Erro ao obter conteúdo do editor:', erro);
      return '';
    }
  }
  
  /**
   * Obtém o conteúdo formatado do editor (com HTML)
   * @returns Conteúdo formatado do editor
   */
  public obterConteudoFormatado(): string {
    if (!this.editor) return '';
    
    try {
      const delta = this.editor.getContents();
      return JSON.stringify(delta);
    } catch (erro) {
      console.error('Erro ao obter conteúdo formatado:', erro);
      return '';
    }
  }
  
  /**
   * Atualiza o cache com o conteúdo atual do editor
   */
  public atualizarCache(): void {
    const conteudoAtual = this.obterConteudoEditor();
    
    this.cache = {
      conteudo: conteudoAtual,
      analiseContextual: this.cache.analiseContextual,
      ultimaAtualizacao: new Date()
    };
  }
  
  /**
   * Verifica se houve alterações significativas no documento
   * @param conteudoAnterior Conteúdo anterior para comparação
   * @param conteudoAtual Conteúdo atual para comparação
   * @returns true se as alterações forem significativas
   */
  public verificarAlteracoesSignificativas(conteudoAnterior: string, conteudoAtual: string): boolean {
    if (!conteudoAnterior || !conteudoAtual) return true;
    
    // Verifica se a diferença de tamanho é significativa
    const diferencaTamanho = Math.abs(conteudoAtual.length - conteudoAnterior.length);
    const percentualDiferenca = diferencaTamanho / conteudoAnterior.length;
    
    // Se a diferença for maior que 10%, considera significativa
    if (percentualDiferenca > 0.1) return true;
    
    // Verifica se houve modificação em parágrafos importantes
    const paragrafosAnteriores = conteudoAnterior.split(/\n\s*\n/);
    const paragrafosAtuais = conteudoAtual.split(/\n\s*\n/);
    
    // Se o número de parágrafos mudou significativamente
    if (Math.abs(paragrafosAtuais.length - paragrafosAnteriores.length) > 2) return true;
    
    // Análise de parágrafos importantes (início, meio e fim)
    const verificarParagrafo = (indice: number) => {
      const anteriorIdx = Math.min(indice, paragrafosAnteriores.length - 1);
      const atualIdx = Math.min(indice, paragrafosAtuais.length - 1);
      
      const anterior = paragrafosAnteriores[anteriorIdx];
      const atual = paragrafosAtuais[atualIdx];
      
      if (!anterior || !atual) return true;
      
      // Calcula similaridade usando coeficiente de Jaccard simplificado
      const palavrasAnteriores = new Set(anterior.split(/\s+/).filter(p => p.length > 3));
      const palavrasAtuais = new Set(atual.split(/\s+/).filter(p => p.length > 3));
      
      const intersecao = new Set([...palavrasAnteriores].filter(x => palavrasAtuais.has(x)));
      const uniao = new Set([...palavrasAnteriores, ...palavrasAtuais]);
      
      const similaridade = intersecao.size / uniao.size;
      
      // Se a similaridade for menor que 80%, considera significativa
      return similaridade < 0.8;
    };
    
    // Verifica introdução, meio e conclusão
    return verificarParagrafo(0) || 
           verificarParagrafo(Math.floor(paragrafosAnteriores.length / 2)) || 
           verificarParagrafo(paragrafosAnteriores.length - 1);
  }
  
  /**
   * Obtém a instância do editor
   * @returns Instância do editor Quill
   */
  public getEditor(): any {
    return this.editor;
  }
  
  /**
   * Substitui texto no editor entre os índices especificados
   * @param inicio Índice de início
   * @param fim Índice de fim
   * @param novoTexto Novo texto a ser inserido
   * @returns true se a operação for bem-sucedida
   */
  public substituirTextoEditor(inicio: number, fim: number, novoTexto: string): boolean {
    if (!this.editor) return false;
    
    try {
      this.editor.deleteText(inicio, fim - inicio);
      this.editor.insertText(inicio, novoTexto);
      return true;
    } catch (erro) {
      console.error('Erro ao substituir texto no editor:', erro);
      return false;
    }
  }
  
  /**
   * Move conteúdo de uma posição para outra no editor
   * @param inicioOrigem Índice de início da origem
   * @param fimOrigem Índice de fim da origem
   * @param destinoIndice Índice de destino
   * @returns true se a operação for bem-sucedida
   */
  public moverConteudoEditor(inicioOrigem: number, fimOrigem: number, destinoIndice: number): boolean {
    if (!this.editor) return false;
    
    try {
      // Ajusta o índice de destino se estiver após a região de origem
      const destinoAjustado = destinoIndice > fimOrigem 
        ? destinoIndice - (fimOrigem - inicioOrigem) 
        : destinoIndice;
      
      // Obtém o conteúdo a ser movido
      const texto = this.editor.getText(inicioOrigem, fimOrigem - inicioOrigem);
      
      // Remove o conteúdo da origem
      this.editor.deleteText(inicioOrigem, fimOrigem - inicioOrigem);
      
      // Insere no destino
      this.editor.insertText(destinoAjustado, texto);
      
      return true;
    } catch (erro) {
      console.error('Erro ao mover conteúdo no editor:', erro);
      return false;
    }
  }
  
  /**
   * Realiza análise semântica de seções do documento
   * Esta é uma implementação cliente-side que pode ser usada para
   * processamento local antes de enviar para a API
   * @returns Array de seções identificadas
   */
  public analisarSecoesDocumento(): SecaoDocumento[] {
    const conteudo = this.obterConteudoEditor();
    if (!conteudo) return [];
    
    const secoes: SecaoDocumento[] = [];
    
    // Expressões regulares para detecção básica de seções
    const padroes = [
      // Introdução
      { 
        regex: /\b(INTRO[DU][UÇC][ÃA]O|CONSIDERAÇÕES\s+INICIAIS)\b/i, 
        tipo: 'introducao' as const 
      },
      // Desenvolvimento/Argumentação
      { 
        regex: /\b(DESENVOLVIMENTO|ARGUMENTOS?|FUNDAMENTA[CÇ][AÃ]O|ANÁLISE|MÉRITO)\b/i, 
        tipo: 'desenvolvimento' as const 
      },
      // Conclusão
      { 
        regex: /\b(CONCLUS[ÃA]O|CONSIDERAÇÕES\s+FINAIS|DISPOSITIVO)\b/i, 
        tipo: 'conclusao' as const 
      },
      // Citações
      { 
        regex: /[""]([^""]{15,})[""]|['']([^'']{15,})['']|\b(CITANDO|SEGUNDO|CONFORME|DE ACORDO COM)\b/i, 
        tipo: 'citacao' as const 
      }
    ];
    
    // Divide o texto em parágrafos
    const paragrafos = conteudo.split(/\n\s*\n/);
    
    // Analisa cada parágrafo buscando por padrões de seção
    let indiceAtual = 0;
    paragrafos.forEach((paragrafo, idx) => {
      // Pula parágrafos vazios
      if (!paragrafo.trim()) {
        indiceAtual += paragrafo.length + 2; // +2 para os dois \n
        return;
      }
      
      // Verifica se o parágrafo começa com um título potencial
      const ehTitulo = /^[A-Z\d][\w\s\-—–\.,:;)(\d]+$/.test(paragrafo.trim().split('\n')[0]);
      
      // Busca por padrões específicos
      for (const padrao of padroes) {
        if (padrao.regex.test(paragrafo)) {
          // Extrai um título do parágrafo ou usa o texto inicial
          const titulo = ehTitulo 
            ? paragrafo.trim().split('\n')[0]
            : paragrafo.trim().substring(0, Math.min(50, paragrafo.length)) + (paragrafo.length > 50 ? '...' : '');
          
          secoes.push({
            tipo: padrao.tipo,
            titulo: titulo,
            indice: indiceAtual,
            conteudo: paragrafo,
            nivel: ehTitulo ? 1 : 2
          });
          
          break;
        }
      }
      
      // Se não encontrou padrão mas é um título potencial, marca como seção "outro"
      if (ehTitulo && !secoes.find(s => s.indice === indiceAtual)) {
        secoes.push({
          tipo: 'outro',
          titulo: paragrafo.trim().split('\n')[0],
          indice: indiceAtual,
          conteudo: paragrafo,
          nivel: 1
        });
      }
      
      // Atualiza o índice atual
      indiceAtual += paragrafo.length + 2; // +2 para os dois \n
    });
    
    return secoes;
  }
  
  /**
   * Detecta problemas básicos no documento
   * @returns Lista de problemas detectados
   */
  public detectarProblemasDocumento(): ProblemaDocumento[] {
    const conteudo = this.obterConteudoEditor();
    if (!conteudo) return [];
    
    const problemas: ProblemaDocumento[] = [];
    
    // Verifica problemas básicos
    
    // 1. Verifica se há introdução
    if (!conteudo.match(/\b(INTRO[DU][UÇC][ÃA]O|CONSIDERAÇÕES\s+INICIAIS)\b/i)) {
      problemas.push({
        tipo: 'falta_secao',
        descricao: 'O documento não possui uma introdução clara',
        localizacao: 0,
        sugestao: 'Adicione uma seção introdutória que contextualize o documento',
        severidade: 'media'
      });
    }
    
    // 2. Verifica se há conclusão
    if (!conteudo.match(/\b(CONCLUS[ÃA]O|CONSIDERAÇÕES\s+FINAIS|DISPOSITIVO)\b/i)) {
      problemas.push({
        tipo: 'falta_secao',
        descricao: 'O documento não possui uma conclusão',
        localizacao: conteudo.length - 1,
        sugestao: 'Adicione uma seção de conclusão resumindo os pontos principais',
        severidade: 'media'
      });
    }
    
    // 3. Verifica citações incompletas ou sem referência
    const citacoesSemReferencia = [...conteudo.matchAll(/[""]([^""]{15,})[""](?!\s+\([^)]+\))/g)];
    if (citacoesSemReferencia.length > 0) {
      citacoesSemReferencia.forEach(match => {
        problemas.push({
          tipo: 'citacao_invalida',
          descricao: 'Citação sem referência à fonte',
          localizacao: match.index || 0,
          sugestao: 'Adicione a referência à fonte desta citação',
          severidade: 'alta'
        });
      });
    }
    
    // 4. Verifica inconsistências terminológicas
    const verificarInconsistenciaTerminologica = (termo1: string, termo2: string) => {
      const regex1 = new RegExp('\\b' + termo1 + '\\b', 'ig');
      const regex2 = new RegExp('\\b' + termo2 + '\\b', 'ig');
      
      const ocorrencias1 = (conteudo.match(regex1) || []).length;
      const ocorrencias2 = (conteudo.match(regex2) || []).length;
      
      // Se ambos os termos ocorrem, pode haver inconsistência
      if (ocorrencias1 > 0 && ocorrencias2 > 0) {
        const match = conteudo.match(regex2);
        if (match && match.index) {
          problemas.push({
            tipo: 'terminologia',
            descricao: `Inconsistência terminológica: uso de "${termo1}" e "${termo2}"`,
            localizacao: match.index,
            sugestao: `Padronize o uso para "${ocorrencias1 > ocorrencias2 ? termo1 : termo2}" em todo o documento`,
            severidade: 'baixa'
          });
        }
      }
    };
    
    // Exemplos de termos que devem ser consistentes
    verificarInconsistenciaTerminologica('autor', 'requerente');
    verificarInconsistenciaTerminologica('réu', 'requerido');
    verificarInconsistenciaTerminologica('processo', 'ação');
    
    return problemas;
  }
  
  /**
   * Analisa ordem lógica das seções
   * @returns Array de problemas relacionados à ordem
   */
  public verificarOrdemLogica(): ProblemaDocumento[] {
    const secoes = this.analisarSecoesDocumento();
    const problemas: ProblemaDocumento[] = [];
    
    // Verifica se as seções estão em ordem lógica
    const ordemEsperada = ['introducao', 'desenvolvimento', 'argumentacao', 'conclusao'];
    let ultimoTipoEncontrado = '';
    
    secoes.forEach((secao, idx) => {
      const idxEsperado = ordemEsperada.indexOf(secao.tipo);
      
      // Se for um tipo sem ordem específica, pula
      if (idxEsperado === -1) return;
      
      const ultimoIdxEsperado = ordemEsperada.indexOf(ultimoTipoEncontrado as any);
      
      // Se a seção atual vier antes da última na ordem esperada
      if (ultimoTipoEncontrado && idxEsperado < ultimoIdxEsperado) {
        problemas.push({
          tipo: 'ordem_incorreta',
          descricao: `A seção "${secao.titulo}" está fora da ordem lógica esperada`,
          localizacao: secao.indice,
          sugestao: `Considere mover esta seção para depois da seção de ${ultimoTipoEncontrado}`,
          severidade: 'media'
        });
      }
      
      ultimoTipoEncontrado = secao.tipo;
    });
    
    return problemas;
  }
  
  /**
   * Verifica a consistência terminológica do documento
   * @returns Array de problemas de terminologia
   */
  public verificarConsistenciaTerminologica(): ProblemaDocumento[] {
    const conteudo = this.obterConteudoEditor();
    const problemas: ProblemaDocumento[] = [];
    
    // Pares de termos que devem ser consistentes
    const paresTermos = [
      ['autor', 'requerente', 'demandante', 'postulante'],
      ['réu', 'requerido', 'demandado', 'pólo passivo'],
      ['sentença', 'decisão', 'acórdão'],
      ['recurso', 'apelação', 'agravo'],
      ['processo', 'ação', 'demanda', 'lide'],
      ['juiz', 'magistrado', 'julgador']
    ];
    
    paresTermos.forEach(grupo => {
      const ocorrencias = grupo.map(termo => {
        const regex = new RegExp('\\b' + termo + '\\b', 'ig');
        const matches = conteudo.match(regex) || [];
        return {
          termo,
          count: matches.length,
          index: conteudo.search(regex)
        };
      }).filter(o => o.count > 0);
      
      // Se mais de um termo do grupo for usado, verifica qual é o predominante
      if (ocorrencias.length > 1) {
        ocorrencias.sort((a, b) => b.count - a.count);
        const termoPredominante = ocorrencias[0].termo;
        
        // Adiciona problema para os termos menos usados
        for (let i = 1; i < ocorrencias.length; i++) {
          const termo = ocorrencias[i];
          problemas.push({
            tipo: 'terminologia',
            descricao: `Inconsistência terminológica: uso de "${termo.termo}" e "${termoPredominante}"`,
            localizacao: termo.index >= 0 ? termo.index : 0,
            sugestao: `Padronize o uso para "${termoPredominante}" em todo o documento`,
            severidade: 'baixa'
          });
        }
      }
    });
    
    return problemas;
  }
  
  /**
   * Valida citações e referências no documento
   * @returns Array de problemas de citação
   */
  public validarCitacoes(): ProblemaDocumento[] {
    const conteudo = this.obterConteudoEditor();
    const problemas: ProblemaDocumento[] = [];
    
    // Encontra citações entre aspas
    const citacoes = [
      ...conteudo.matchAll(/[""]([^""]{15,})[""](?!\s+\([^)]+\))/g),
      ...conteudo.matchAll(/['']([^'']{15,})[''](?!\s+\([^)]+\))/g)
    ];
    
    citacoes.forEach(match => {
      if (match.index !== undefined) {
        problemas.push({
          tipo: 'citacao_invalida',
          descricao: 'Citação sem referência clara à fonte',
          localizacao: match.index,
          sugestao: 'Adicione a referência completa após a citação, indicando autor, obra e página',
          severidade: 'alta'
        });
      }
    });
    
    // Encontra menções a leis e artigos sem numeração específica
    const leisSemNumero = [
      ...conteudo.matchAll(/\bartigos?\b(?!\s+\d)/gi),
      ...conteudo.matchAll(/\bleis?\b(?!\s+\d)/gi),
      ...conteudo.matchAll(/\bdecretos?\b(?!\s+\d)/gi)
    ];
    
    leisSemNumero.forEach(match => {
      if (match.index !== undefined) {
        problemas.push({
          tipo: 'citacao_invalida',
          descricao: 'Referência a dispositivo legal sem número específico',
          localizacao: match.index,
          sugestao: 'Especifique o número do dispositivo legal mencionado',
          severidade: 'media'
        });
      }
    });
    
    return problemas;
  }
  
  /**
   * Verifica completude de seções essenciais
   * @returns Array de problemas de completude
   */
  public verificarCompletude(): ProblemaDocumento[] {
    const secoes = this.analisarSecoesDocumento();
    const problemas: ProblemaDocumento[] = [];
    
    // Tipos de seções essenciais
    const secoesEssenciais = ['introducao', 'desenvolvimento', 'conclusao'];
    
    // Verifica quais seções essenciais estão faltando
    secoesEssenciais.forEach(tipo => {
      if (!secoes.some(s => s.tipo === tipo)) {
        let descricao, sugestao;
        let localizacao = 0;
        
        switch (tipo) {
          case 'introducao':
            descricao = 'O documento não possui uma introdução clara';
            sugestao = 'Adicione uma seção introdutória que contextualize o documento';
            localizacao = 0;
            break;
          case 'desenvolvimento':
            descricao = 'O documento não possui um desenvolvimento consistente';
            sugestao = 'Adicione uma seção de desenvolvimento com a argumentação principal';
            localizacao = Math.floor(this.obterConteudoEditor().length / 3);
            break;
          case 'conclusao':
            descricao = 'O documento não possui uma conclusão';
            sugestao = 'Adicione uma seção de conclusão resumindo os pontos principais';
            localizacao = this.obterConteudoEditor().length - 1;
            break;
        }
        
        problemas.push({
          tipo: 'falta_secao',
          descricao: descricao || `Falta a seção de ${tipo}`,
          localizacao,
          sugestao,
          severidade: 'alta'
        });
      }
    });
    
    return problemas;
  }
  
  /**
   * Gera um resumo simples do documento
   * @returns Objeto com resumo do documento
   */
  public gerarResumoSimples(): ResumoDocumento | null {
    const conteudo = this.obterConteudoEditor();
    if (!conteudo || conteudo.length < 100) return null;
    
    // Divide o texto em parágrafos
    const paragrafos = conteudo.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragrafos.length === 0) return null;
    
    // Extrai introdução e conclusão baseado na posição
    const introducao = paragrafos.slice(0, Math.min(2, paragrafos.length)).join(' ');
    const conclusao = paragrafos.slice(Math.max(0, paragrafos.length - 2)).join(' ');
    
    // Extrai pontos principais (parágrafos do meio)
    const pontosMeio = paragrafos.slice(
      Math.min(2, paragrafos.length),
      Math.max(0, paragrafos.length - 2)
    );
    
    // Extrai pontos principais ao dividir parágrafos longos e selecionar as primeiras frases
    const extrairPontosPrincipais = () => {
      const pontos: string[] = [];
      
      pontosMeio.forEach(paragrafo => {
        // Se o parágrafo for longo, considera-o relevante
        if (paragrafo.length > 100) {
          // Divide em frases e pega a primeira
          const frases = paragrafo.split(/[.!?]+/).filter(f => f.trim().length > 0);
          if (frases.length > 0) {
            pontos.push(frases[0].trim() + '.');
          }
        }
      });
      
      // Se encontramos menos de 3 pontos, adiciona mais
      if (pontos.length < 3 && pontosMeio.length > 0) {
        // Adiciona parágrafos curtos como pontos adicionais
        pontosMeio.forEach(paragrafo => {
          if (paragrafo.length <= 100 && paragrafo.length > 30 && pontos.length < 5) {
            pontos.push(paragrafo.trim());
          }
        });
      }
      
      return pontos.slice(0, 5); // Limita a 5 pontos
    };
    
    // Extrai argumentos principais
    const argumentos = pontosMeio
      .filter(p => p.length > 80)
      .map(p => p.substring(0, Math.min(150, p.length)) + (p.length > 150 ? '...' : ''))
      .slice(0, 3);
    
    // Gera um resumo geral baseado no início e fim do documento
    const resumoGeral = `${introducao.substring(0, 100)}... ${conclusao.substring(0, 100)}...`;
    
    return {
      resumoGeral: resumoGeral.trim(),
      pontosPrincipais: extrairPontosPrincipais(),
      estrutura: {
        introducao: introducao.substring(0, 200) + (introducao.length > 200 ? '...' : ''),
        argumentosPrincipais: argumentos,
        conclusao: conclusao.substring(0, 200) + (conclusao.length > 200 ? '...' : '')
      }
    };
  }
  
  /**
   * Realiza análise completa do documento no lado do cliente
   * Esta é uma análise simplificada que não requer API
   * @returns Objeto de análise contextual
   */
  public analisarDocumentoLocal(): AnaliseContextual {
    // Analisa seções
    const secoes = this.analisarSecoesDocumento();
    
    // Combina todos os problemas
    const problemas = [
      ...this.detectarProblemasDocumento(),
      ...this.verificarOrdemLogica(),
      ...this.verificarConsistenciaTerminologica(),
      ...this.validarCitacoes(),
      ...this.verificarCompletude()
    ];
    
    // Gera resumo simples
    const resumo = this.gerarResumoSimples();
    
    // Gera algumas sugestões básicas
    const gerarSugestoes = () => {
      const sugestoes: string[] = [];
      
      // Analisa problemas por tipo
      const problemasPorTipo = problemas.reduce((acc, problema) => {
        if (!acc[problema.tipo]) {
          acc[problema.tipo] = [];
        }
        acc[problema.tipo].push(problema);
        return acc;
      }, {} as Record<string, ProblemaDocumento[]>);
      
      // Gera sugestões gerais baseadas nos tipos de problemas mais comuns
      if (problemasPorTipo.terminologia && problemasPorTipo.terminologia.length > 2) {
        sugestoes.push('Considere revisar a terminologia utilizada em todo o documento para manter consistência e precisão técnica.');
      }
      
      if (problemasPorTipo.citacao_invalida && problemasPorTipo.citacao_invalida.length > 0) {
        sugestoes.push('Verifique todas as citações e referências para garantir que estejam completas e sigam o padrão correto.');
      }
      
      if (problemasPorTipo.ordem_incorreta && problemasPorTipo.ordem_incorreta.length > 0) {
        sugestoes.push('Reorganize as seções do documento para seguir uma ordem lógica que facilite a compreensão.');
      }
      
      // Verifica o tamanho do documento para sugestões sobre extensão
      const conteudo = this.obterConteudoEditor();
      if (conteudo.length < 1000) {
        sugestoes.push('O documento é relativamente curto. Considere expandir a argumentação com mais detalhes e referências.');
      } else if (conteudo.length > 10000) {
        sugestoes.push('O documento é extenso. Considere revisar para remover redundâncias e tornar o texto mais conciso.');
      }
      
      // Garante pelo menos algumas sugestões
      if (sugestoes.length < 2) {
        sugestoes.push('Considere adicionar mais referências a jurisprudência relevante para fortalecer seus argumentos.');
        sugestoes.push('Revise o documento para garantir que todos os termos técnicos estejam corretos e apropriados ao contexto.');
      }
      
      return sugestoes;
    };
    
    return {
      analiseEstrutura: {
        secoes,
        problemas
      },
      resumoDocumento: resumo || undefined,
      sugestoesAprimoramento: gerarSugestoes()
    };
  }
} 