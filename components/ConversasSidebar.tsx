import { useState, useEffect, useRef } from 'react';
import { Conversa, carregarConversas, excluirConversa, marcarComoFavorito, exportarConversa, exportarTodasConversas, Mensagem } from '../utils/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface ConversasSidebarProps {
  usuarioId?: string;
  conversaAtual: string | null;
  onSelecionarConversa: (conversaId: string) => void;
  onNovaConversa: () => void;
  toggleSidebar?: () => void;
  isMobile?: boolean;
  onFecharSidebar?: () => void;
}

// Adicionando interface para dados exportados
interface ExportData {
  conversa: Conversa;
  mensagens: Mensagem[];
}

type ExportDataCollection = { [key: string]: ExportData };

const ConversasSidebar: React.FC<ConversasSidebarProps> = ({
  usuarioId,
  conversaAtual,
  onSelecionarConversa,
  onNovaConversa,
  toggleSidebar,
  isMobile = false,
  onFecharSidebar
}) => {
  const { user } = useAuth();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [visualizacao, setVisualizacao] = useState<'todas' | 'favoritas'>('todas');
  const [mostraOpcoes, setMostraOpcoes] = useState<string | null>(null);
  const [mostrarModalExportar, setMostrarModalExportar] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [selecaoConversas, setSelecaoConversas] = useState<string[]>([]);
  
  // Referências para download
  const downloadRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const carregarDados = async (tentativa = 0) => {
      // Usar o ID do usuário do contexto se não for fornecido como prop
      const userId = usuarioId || (user?.id);
      if (!userId) return;
      
      try {
        setCarregando(true);
        const dados = await carregarConversas(userId);
        setConversas(dados);
        setErro(null);
      } catch (error) {
        console.error(`Erro ao carregar conversas (tentativa ${tentativa + 1}):`, error);
        
        // Tentar novamente até 3 vezes com delay progressivo
        if (tentativa < 2) {
          const delay = (tentativa + 1) * 1000; // 1s, 2s
          setTimeout(() => carregarDados(tentativa + 1), delay);
          return;
        }
        
        setErro('Falha ao carregar conversas. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [usuarioId, user]);

  const handleExcluirConversa = async (e: React.MouseEvent, conversaId: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;

    try {
      await excluirConversa(conversaId);
      setConversas(conversas.filter(c => c.id !== conversaId));
      setMostraOpcoes(null);
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      setErro('Falha ao excluir conversa. Tente novamente.');
    }
  };

  const toggleFavorito = async (e: React.MouseEvent, conversaId: string) => {
    e.stopPropagation();
    
    try {
      // Encontrar a conversa atual
      const conversa = conversas.find(c => c.id === conversaId);
      if (!conversa) return;
      
      // Novo estado de favorito (invertido)
      const novoFavorito = !conversa.favorito;
      
      // Atualizar no banco de dados
      await marcarComoFavorito(conversaId, novoFavorito);
      
      // Atualizar no estado local
      setConversas(conversas.map(c => 
        c.id === conversaId 
          ? { ...c, favorito: novoFavorito } 
          : c
      ));
      
      // Feedback visual
      toast.success(novoFavorito 
        ? 'Conversa adicionada aos atalhos' 
        : 'Conversa removida dos atalhos'
      );
      
      setMostraOpcoes(null);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      toast.error('Falha ao atualizar atalho. Tente novamente.');
    }
  };

  const formatarData = (dataString?: string) => {
    if (!dataString) return '';
    
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const conversasFiltradas = conversas
    .filter(conversa => {
      // Filtro por texto
      const tituloMatch = conversa.titulo?.toLowerCase().includes(filtro.toLowerCase()) || false;
      
      // Filtro por favoritas
      if (visualizacao === 'favoritas' && !conversa.favorito) {
        return false;
      }
      
      return tituloMatch || filtro === '';
    })
    .sort((a, b) => {
      // Ordenar por favoritas primeiro, depois por data
      if (a.favorito && !b.favorito) return -1;
      if (!a.favorito && b.favorito) return 1;
      
      // Se ambas são favoritas ou não, ordenar por data
      const dataA = a.atualizado_em ? new Date(a.atualizado_em).getTime() : 0;
      const dataB = b.atualizado_em ? new Date(b.atualizado_em).getTime() : 0;
      return dataB - dataA;
    });

  // Função para exportar conversa(s)
  const handleExportar = async (formato: 'json' | 'markdown' | 'text', todas: boolean = false) => {
    try {
      setExportando(true);
      
      let dadosExportados: ExportData | ExportDataCollection;
      let nomeArquivo: string;
      
      // Determinar quais conversas exportar
      const conversasParaExportar = todas 
        ? [] // Todas as conversas do usuário
        : selecaoConversas.length > 0 
          ? selecaoConversas // Conversas selecionadas
          : conversaAtual 
            ? [conversaAtual] // Conversa atual
            : []; // Nenhuma selecionada
      
      // Se nenhuma conversa foi selecionada e estamos tentando exportar seleção
      if (!todas && conversasParaExportar.length === 0) {
        toast.error('Selecione pelo menos uma conversa para exportar');
        setExportando(false);
        return;
      }
      
      // Usar o ID do usuário do contexto se não for fornecido como prop
      const userId = usuarioId || (user?.id);
      if (!userId) {
        toast.error('Usuário não identificado');
        setExportando(false);
        return;
      }
      
      // Exportar todas as conversas
      if (todas) {
        dadosExportados = await exportarTodasConversas(userId);
        nomeArquivo = `todas_conversas_${new Date().toISOString().split('T')[0]}`;
      } 
      // Exportar conversas selecionadas
      else if (conversasParaExportar.length === 1) {
        const { conversa, mensagens } = await exportarConversa(conversasParaExportar[0]);
        dadosExportados = { conversa, mensagens };
        nomeArquivo = `conversa_${conversa.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
      }
      // Exportar múltiplas conversas selecionadas
      else {
        dadosExportados = {};
        for (const id of conversasParaExportar) {
          try {
            const result = await exportarConversa(id);
            dadosExportados[id] = result;
          } catch (error) {
            console.error(`Erro ao exportar conversa ${id}:`, error);
          }
        }
        nomeArquivo = `conversas_selecionadas_${new Date().toISOString().split('T')[0]}`;
      }
      
      // Converter para o formato desejado
      let conteudoArquivo: string;
      let tipoArquivo: string;
      
      switch (formato) {
        case 'json':
          conteudoArquivo = JSON.stringify(dadosExportados, null, 2);
          tipoArquivo = 'application/json';
          nomeArquivo += '.json';
          break;
        
        case 'markdown':
          conteudoArquivo = converterParaMarkdown(dadosExportados);
          tipoArquivo = 'text/markdown';
          nomeArquivo += '.md';
          break;
        
        case 'text':
          conteudoArquivo = converterParaTexto(dadosExportados);
          tipoArquivo = 'text/plain';
          nomeArquivo += '.txt';
          break;
          
        default:
          conteudoArquivo = JSON.stringify(dadosExportados, null, 2);
          tipoArquivo = 'application/json';
          nomeArquivo += '.json';
      }
      
      // Criar blob e link para download
      const blob = new Blob([conteudoArquivo], { type: tipoArquivo });
      const url = URL.createObjectURL(blob);
      
      if (downloadRef.current) {
        downloadRef.current.href = url;
        downloadRef.current.download = nomeArquivo;
        downloadRef.current.click();
        
        // Limpar URL após o download
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
      
      toast.success('Exportação concluída com sucesso!');
      setMostrarModalExportar(false);
      setSelecaoConversas([]);
    } catch (error) {
      console.error('Erro ao exportar conversas:', error);
      toast.error('Falha ao exportar conversas. Tente novamente.');
    } finally {
      setExportando(false);
    }
  };
  
  // Funções auxiliares para converter os dados exportados
  const converterParaMarkdown = (dados: ExportData | ExportDataCollection): string => {
    let markdown = '# Conversas Exportadas\n\n';
    
    // Processar uma única conversa
    if ('conversa' in dados && 'mensagens' in dados) {
      markdown += `## ${dados.conversa.titulo}\n\n`;
      markdown += `Data: ${formatarData(dados.conversa.criado_em)}\n\n`;
      
      dados.mensagens.forEach((msg: Mensagem) => {
        const autor = msg.tipo === 'usuario' ? '👨‍💼 Você' : '🤖 JurisIA';
        markdown += `### ${autor} - ${new Date(msg.criado_em || '').toLocaleString('pt-BR')}\n\n`;
        markdown += `${msg.conteudo}\n\n`;
      });
    } 
    // Processar múltiplas conversas
    else {
      Object.entries(dados).forEach(([_, data]) => {
        markdown += `## ${data.conversa.titulo}\n\n`;
        markdown += `Data: ${formatarData(data.conversa.criado_em)}\n\n`;
        
        data.mensagens.forEach((msg: Mensagem) => {
          const autor = msg.tipo === 'usuario' ? '👨‍💼 Você' : '🤖 JurisIA';
          markdown += `### ${autor} - ${new Date(msg.criado_em || '').toLocaleString('pt-BR')}\n\n`;
          markdown += `${msg.conteudo}\n\n`;
        });
        
        markdown += '---\n\n';
      });
    }
    
    return markdown;
  };
  
  const converterParaTexto = (dados: ExportData | ExportDataCollection): string => {
    let texto = 'CONVERSAS EXPORTADAS\n\n';
    
    // Processar uma única conversa
    if ('conversa' in dados && 'mensagens' in dados) {
      texto += `CONVERSA: ${dados.conversa.titulo}\n`;
      texto += `Data: ${formatarData(dados.conversa.criado_em)}\n\n`;
      
      dados.mensagens.forEach((msg: Mensagem) => {
        const autor = msg.tipo === 'usuario' ? 'Você' : 'JurisIA';
        texto += `[${autor} - ${new Date(msg.criado_em || '').toLocaleString('pt-BR')}]\n`;
        texto += `${msg.conteudo}\n\n`;
      });
    } 
    // Processar múltiplas conversas
    else {
      Object.entries(dados).forEach(([_, data]) => {
        texto += `CONVERSA: ${data.conversa.titulo}\n`;
        texto += `Data: ${formatarData(data.conversa.criado_em)}\n\n`;
        
        data.mensagens.forEach((msg: Mensagem) => {
          const autor = msg.tipo === 'usuario' ? 'Você' : 'JurisIA';
          texto += `[${autor} - ${new Date(msg.criado_em || '').toLocaleString('pt-BR')}]\n`;
          texto += `${msg.conteudo}\n\n`;
        });
        
        texto += '----------------------------------------\n\n';
      });
    }
    
    return texto;
  };
  
  // Função para alternar seleção de uma conversa para exportação
  const toggleSelecaoConversa = (conversaId: string) => {
    setSelecaoConversas(prev => 
      prev.includes(conversaId)
        ? prev.filter(id => id !== conversaId)
        : [...prev, conversaId]
    );
  };

  // Função para atualizar manualmente as conversas
  const atualizarConversas = async () => {
    const userId = usuarioId || (user?.id);
    if (!userId) return;
    
    try {
      setCarregando(true);
      
      // Força o carregamento ignorando o cache
      if (typeof window !== 'undefined') {
        // Adicionar um parâmetro de tempo para forçar o recarregamento
        const timestamp = Date.now();
        const dados = await carregarConversas(userId + `?nocache=${timestamp}`);
        setConversas(dados);
        setErro(null);
        toast.success('Conversas atualizadas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao atualizar conversas:', error);
      setErro('Falha ao atualizar conversas. Tente novamente.');
      toast.error('Falha ao atualizar conversas.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-law-900 shadow-elegant rounded-r-lg overflow-hidden">
      {/* Cabeçalho */}
      <div className="p-3 sm:p-4 border-b border-law-200 dark:border-law-700 flex items-center justify-between">
        <div className="flex items-center">
          {/* Botão para fechar o menu em dispositivos móveis */}
          {isMobile && onFecharSidebar && (
            <button 
              onClick={onFecharSidebar}
              className="md:hidden mr-2 p-1.5 rounded-md bg-law-100 hover:bg-law-200 dark:bg-law-800 dark:hover:bg-law-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300"
              aria-label="Fechar menu de conversas"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-primary-600 dark:text-primary-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <h2 className="font-medium text-base sm:text-lg text-primary-800 dark:text-law-200 font-serif">
            Conversas
          </h2>
        </div>
        
        <div className="flex items-center">
          {/* Botão de atualizar conversas */}
          <button
            onClick={atualizarConversas}
            disabled={carregando}
            className="p-1.5 rounded-md bg-law-100 hover:bg-law-200 dark:bg-law-800 dark:hover:bg-law-700 focus:outline-none transition-colors duration-300"
            aria-label="Atualizar conversas"
            title="Atualizar conversas"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 text-primary-600 dark:text-primary-400 ${carregando ? 'animate-spin' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Botão Nova Conversa */}
      <div className="px-3 py-2 border-b border-law-200 dark:border-law-700">
        <button
          onClick={onNovaConversa}
          className="w-full flex items-center justify-center px-3 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300"
          aria-label="Nova conversa"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium text-sm">Nova Conversa</span>
        </button>
      </div>
      
      {/* Campo de busca */}
      <div className="px-3 py-2 border-b border-law-200 dark:border-law-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full px-3 py-2 pl-9 text-xs sm:text-sm border rounded-md border-law-300 dark:border-law-600 bg-white dark:bg-law-800 text-primary-900 dark:text-law-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 dark:text-law-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {filtro && (
            <button
              onClick={() => setFiltro('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-law-500 hover:text-law-700 dark:hover:text-law-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        {carregando ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : erro ? (
          <div className="p-4 text-red-600 dark:text-red-400 text-xs sm:text-sm">
            Erro ao carregar conversas.
          </div>
        ) : conversasFiltradas.length === 0 ? (
          <div className="p-4 text-law-500 dark:text-law-400 text-xs sm:text-sm text-center">
            {filtro ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa iniciada. Clique no botão + para iniciar uma nova conversa.'}
          </div>
        ) : (
          <ul className="divide-y divide-law-200 dark:divide-law-700">
            {conversasFiltradas.map((conversa) => (
              <li 
                key={conversa.id} 
                className={`p-3 hover:bg-law-100 dark:hover:bg-law-800 cursor-pointer relative group ${
                  conversa.id === conversaAtual ? 'bg-law-100 dark:bg-law-800 border-l-4 border-primary-500 dark:border-primary-600 pl-2' : 'border-l-4 border-transparent'
                }`}
                onClick={() => onSelecionarConversa(conversa.id)}
              >
                <div className="flex items-start">
                  <div className="flex-grow truncate pr-10">
                    <div className="flex items-center mb-1">
                      {conversa.favorito && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-secondary-500 dark:text-secondary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      )}
                      <div className="font-medium text-xs sm:text-sm text-primary-800 dark:text-law-200 truncate">
                        {conversa.titulo || 'Nova Conversa'}
                      </div>
                    </div>
                    <div className="text-xs text-law-500 dark:text-law-500 truncate">
                      {formatarData(conversa.criado_em)}
                    </div>
                  </div>
                  
                  {/* Botão de opções */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMostraOpcoes(mostraOpcoes === conversa.id ? null : conversa.id);
                    }}
                    className="absolute right-3 top-3 text-law-400 hover:text-law-600 dark:hover:text-law-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-law-200 dark:hover:bg-law-700"
                    title="Opções"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Menu de opções */}
                  {mostraOpcoes === conversa.id && (
                    <div className="absolute right-0 top-8 mt-1 w-36 bg-white dark:bg-law-800 rounded-md shadow-elegant py-1 z-10 border border-law-200 dark:border-law-700 text-xs sm:text-sm">
                      <button
                        onClick={(e) => toggleFavorito(e, conversa.id)}
                        className="flex items-center w-full text-left px-3 py-1.5 hover:bg-law-100 dark:hover:bg-law-700 text-primary-700 dark:text-law-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 mr-2 ${conversa.favorito ? 'text-secondary-500 dark:text-secondary-400' : 'text-law-500 dark:text-law-400'}`} 
                          fill={conversa.favorito ? "currentColor" : "none"} 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {conversa.favorito ? 'Remover favorito' : 'Adicionar favorito'}
                      </button>
                      <button
                        onClick={(e) => handleExcluirConversa(e, conversa.id)}
                        className="flex items-center w-full text-left px-3 py-1.5 hover:bg-law-100 dark:hover:bg-law-700 text-red-600 dark:text-red-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Link oculto para download */}
      <a ref={downloadRef} className="hidden"></a>
      
      {/* Modal de Exportação */}
      {mostrarModalExportar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-law-800 rounded-lg shadow-elegant p-4 sm:p-6 max-w-md w-full mx-4 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-400 mb-4">Exportar Conversas</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-primary-800 dark:text-law-300 mb-2">O que deseja exportar?</label>
                <div className="space-y-2">
                  <button 
                    className={`w-full p-2 text-left rounded-md ${
                      selecaoConversas.length === 0
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-400 dark:border-primary-600'
                        : 'bg-law-100 dark:bg-law-800 border border-law-300 dark:border-law-700 hover:bg-law-200 dark:hover:bg-law-700'
                    } transition-colors duration-200`}
                    onClick={() => setSelecaoConversas([])}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">
                        {conversaAtual ? '📝' : '📚'}
                      </span>
                      <span>
                        {conversaAtual 
                          ? 'Conversa Atual' 
                          : 'Todas as Conversas'}
                      </span>
                    </div>
                  </button>
                  
                  <button 
                    className={`w-full p-2 text-left rounded-md ${
                      selecaoConversas.length > 0
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-400 dark:border-primary-600'
                        : 'bg-law-100 dark:bg-law-800 border border-law-300 dark:border-law-700 hover:bg-law-200 dark:hover:bg-law-700'
                    } transition-colors duration-200`}
                    onClick={() => setSelecaoConversas(conversas.map(c => c.id || ''))}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">📋</span>
                      <span>Selecionar Conversas Específicas</span>
                    </div>
                  </button>
                </div>
              </div>
              
              {selecaoConversas.length > 0 && (
                <div className="max-h-40 overflow-y-auto p-2 border border-law-200 dark:border-law-700 rounded-md">
                  {conversas.map(conversa => (
                    <div 
                      key={conversa.id} 
                      className="flex items-center mb-2 last:mb-0"
                    >
                      <input 
                        type="checkbox" 
                        id={`sel-${conversa.id}`}
                        checked={selecaoConversas.includes(conversa.id || '')}
                        onChange={() => toggleSelecaoConversa(conversa.id || '')}
                        className="mr-2"
                      />
                      <label htmlFor={`sel-${conversa.id}`} className="text-sm text-primary-800 dark:text-law-300 truncate">
                        {conversa.titulo}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              <div>
                <label className="block text-sm text-primary-800 dark:text-law-300 mb-2">Formato de Exportação:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    className="p-2 text-center bg-law-100 dark:bg-law-800 rounded-md border border-law-300 dark:border-law-700 hover:bg-law-200 dark:hover:bg-law-700 transition-colors duration-200"
                    onClick={() => handleExportar('json', selecaoConversas.length === 0 && !conversaAtual)}
                    disabled={exportando}
                  >
                    <span className="block text-xl mb-1">📄</span>
                    <span className="text-xs">JSON</span>
                  </button>
                  <button 
                    className="p-2 text-center bg-law-100 dark:bg-law-800 rounded-md border border-law-300 dark:border-law-700 hover:bg-law-200 dark:hover:bg-law-700 transition-colors duration-200"
                    onClick={() => handleExportar('markdown', selecaoConversas.length === 0 && !conversaAtual)}
                    disabled={exportando}
                  >
                    <span className="block text-xl mb-1">📝</span>
                    <span className="text-xs">Markdown</span>
                  </button>
                  <button 
                    className="p-2 text-center bg-law-100 dark:bg-law-800 rounded-md border border-law-300 dark:border-law-700 hover:bg-law-200 dark:hover:bg-law-700 transition-colors duration-200"
                    onClick={() => handleExportar('text', selecaoConversas.length === 0 && !conversaAtual)}
                    disabled={exportando}
                  >
                    <span className="block text-xl mb-1">📃</span>
                    <span className="text-xs">Texto</span>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-law-200 dark:border-law-700">
                <button 
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setMostrarModalExportar(false)}
                  disabled={exportando}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Rodapé da barra lateral apenas com opção de exportação */}
      <div className="p-3 border-t border-law-200 dark:border-law-700 flex justify-center items-center">
        <button 
          className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center transition-colors duration-300"
          title="Exportar conversas"
          onClick={() => setMostrarModalExportar(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Exportar
        </button>
      </div>
    </div>
  );
};

export default ConversasSidebar; 