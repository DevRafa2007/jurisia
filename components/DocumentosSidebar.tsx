import { useState, useEffect } from 'react';
import { Documento, carregarDocumentos, excluirDocumento, marcarDocumentoComoFavorito } from '../utils/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface DocumentosSidebarProps {
  documentoAtual: string | null;
  onSelecionarDocumento: (documentoId: string) => void;
  onNovoDocumento: () => void;
  onFecharSidebar?: () => void;
  isMobile?: boolean;
}

const DocumentosSidebar: React.FC<DocumentosSidebarProps> = ({
  documentoAtual,
  onSelecionarDocumento,
  onNovoDocumento,
  onFecharSidebar,
  isMobile = false
}) => {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [visualizacao, setVisualizacao] = useState<'todos' | 'favoritos'>('todos');
  const [mostraOpcoes, setMostraOpcoes] = useState<string | null>(null);

  useEffect(() => {
    const carregarDados = async (tentativa = 0) => {
      // Usar o ID do usuário do contexto
      const userId = user?.id;
      if (!userId) return;
      
      try {
        setCarregando(true);
        const dados = await carregarDocumentos(userId);
        setDocumentos(dados);
        setErro(null);
      } catch (error) {
        console.error(`Erro ao carregar documentos (tentativa ${tentativa + 1}):`, error);
        
        // Tentar novamente até 3 vezes com delay progressivo
        if (tentativa < 2) {
          const delay = (tentativa + 1) * 1000; // 1s, 2s
          setTimeout(() => carregarDados(tentativa + 1), delay);
          return;
        }
        
        setErro('Falha ao carregar documentos. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [user]);

  // Função para atualizar manualmente os documentos
  const atualizarDocumentos = async () => {
    const userId = user?.id;
    if (!userId) return;
    
    try {
      setCarregando(true);
      
      // Força o carregamento ignorando o cache
      if (typeof window !== 'undefined') {
        // Adicionar um parâmetro de tempo para forçar o recarregamento
        const timestamp = Date.now();
        const dados = await carregarDocumentos(userId + `?nocache=${timestamp}`);
        setDocumentos(dados);
        setErro(null);
        toast.success('Documentos atualizados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao atualizar documentos:', error);
      setErro('Falha ao atualizar documentos. Tente novamente.');
      toast.error('Falha ao atualizar documentos.');
    } finally {
      setCarregando(false);
    }
  };

  // Função para excluir documento
  const handleExcluirDocumento = async (e: React.MouseEvent, documentoId: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      await excluirDocumento(documentoId);
      setDocumentos(documentos.filter(d => d.id !== documentoId));
      setMostraOpcoes(null);
      toast.success('Documento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      toast.error('Falha ao excluir documento. Tente novamente.');
    }
  };

  // Função para marcar/desmarcar como favorito
  const handleFavorito = async (e: React.MouseEvent, documentoId: string, favorito: boolean) => {
    e.stopPropagation();
    try {
      await marcarDocumentoComoFavorito(documentoId, !favorito);
      
      // Atualizar a lista de documentos localmente
      setDocumentos(documentos.map(doc => 
        doc.id === documentoId 
          ? { ...doc, favorito: !favorito } 
          : doc
      ));
      
      setMostraOpcoes(null);
      
      toast.success(
        !favorito 
          ? 'Documento adicionado aos favoritos!' 
          : 'Documento removido dos favoritos!'
      );
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      toast.error('Falha ao atualizar favorito. Tente novamente.');
    }
  };

  // Filtrar e ordenar documentos
  const documentosFiltrados = documentos
    .filter(documento => {
      // Filtro por texto
      const tituloMatch = documento.titulo?.toLowerCase().includes(filtro.toLowerCase()) || false;
      const tipoMatch = documento.tipo?.toLowerCase().includes(filtro.toLowerCase()) || false;
      
      // Filtro por favoritos
      if (visualizacao === 'favoritos' && !documento.favorito) {
        return false;
      }
      
      return (tituloMatch || tipoMatch) || filtro === '';
    })
    .sort((a, b) => {
      // Ordenar por favoritos primeiro, depois por data
      if (a.favorito && !b.favorito) return -1;
      if (!a.favorito && b.favorito) return 1;
      
      // Se ambos são favoritos ou não, ordenar por data
      const dataA = a.atualizado_em ? new Date(a.atualizado_em).getTime() : 0;
      const dataB = b.atualizado_em ? new Date(b.atualizado_em).getTime() : 0;
      return dataB - dataA;
    });

  // Função para formatar data
  const formatarData = (dataString?: string): string => {
    if (!dataString) return 'Data desconhecida';
    
    const data = new Date(dataString);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    
    // Verificar se é hoje
    if (data.toDateString() === hoje.toDateString()) {
      return `Hoje, ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Verificar se é ontem
    if (data.toDateString() === ontem.toDateString()) {
      return `Ontem, ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Caso contrário, retornar data completa
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-law-900 shadow-elegant rounded-r-lg overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-law-200 dark:border-law-700 flex items-center justify-between">
        <div className="flex items-center">
          {/* Botão para fechar o menu em dispositivos móveis */}
          {onFecharSidebar && (
            <button 
              onClick={onFecharSidebar}
              className="md:hidden mr-2 p-1.5 rounded-md bg-law-100 hover:bg-law-200 dark:bg-law-800 dark:hover:bg-law-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300"
              aria-label="Fechar menu de documentos"
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
            Meus Documentos
          </h2>
        </div>
        
        <div className="flex items-center">
          {/* Botão de atualizar documentos */}
          <button
            onClick={atualizarDocumentos}
            disabled={carregando}
            className="p-1.5 rounded-md bg-law-100 hover:bg-law-200 dark:bg-law-800 dark:hover:bg-law-700 focus:outline-none transition-colors duration-300 mr-2"
            aria-label="Atualizar documentos"
            title="Atualizar documentos"
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
          
          {/* Botão de filtrar favoritos */}
          <button
            onClick={() => setVisualizacao(visualizacao === 'todos' ? 'favoritos' : 'todos')}
            className={`p-1.5 rounded-md mr-2 transition-colors duration-300 ${
              visualizacao === 'favoritos' 
                ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300' 
                : 'bg-law-100 hover:bg-law-200 text-primary-700 dark:bg-law-800 dark:hover:bg-law-700 dark:text-law-300'
            }`}
            title={visualizacao === 'favoritos' ? 'Mostrar todos' : 'Mostrar favoritos'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={visualizacao === 'favoritos' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          
          {/* Botão de novo documento */}
          <button
            onClick={onNovoDocumento}
            className="p-1.5 rounded-md bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 focus:outline-none transition-colors duration-300"
            aria-label="Novo documento"
            title="Novo documento"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 text-primary-600 dark:text-primary-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Campo de busca */}
      <div className="p-3 sm:p-4 border-b border-law-200 dark:border-law-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-primary-500 dark:focus:border-primary-600 bg-white dark:bg-law-800 text-gray-700 dark:text-gray-200 transition-colors duration-300"
          />
        </div>
      </div>
      
      {/* Lista de documentos */}
      <div className="flex-grow overflow-y-auto">
        {carregando ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : erro ? (
          <div className="p-4 text-red-600 dark:text-red-400 text-xs sm:text-sm">
            Erro ao carregar documentos.
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="p-4 text-law-500 dark:text-law-400 text-xs sm:text-sm text-center">
            {filtro ? 'Nenhum documento encontrado.' : 'Nenhum documento criado. Clique no botão + para criar um novo documento.'}
          </div>
        ) : (
          <ul className="divide-y divide-law-200 dark:divide-law-700">
            {documentosFiltrados.map((documento) => (
              <li 
                key={documento.id} 
                className={`p-3 hover:bg-law-100 dark:hover:bg-law-800 cursor-pointer relative group ${
                  documento.id === documentoAtual ? 'bg-law-100 dark:bg-law-800 border-l-4 border-primary-500 dark:border-primary-600 pl-2' : 'border-l-4 border-transparent'
                }`}
                onClick={() => onSelecionarDocumento(documento.id || '')}
              >
                <div className="flex items-start">
                  <div className="flex-grow truncate pr-10">
                    <div className="flex items-center mb-1">
                      {documento.favorito && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-secondary-500 dark:text-secondary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      )}
                      <div className="font-medium text-xs sm:text-sm text-primary-800 dark:text-law-200 truncate">
                        {documento.titulo || 'Documento sem título'}
                      </div>
                    </div>
                    <div className="text-xs text-law-500 dark:text-law-500 flex items-center">
                      <span className="truncate">{documento.tipo}</span>
                      <span className="mx-1 text-law-400">•</span>
                      <span className="truncate">{formatarData(documento.criado_em)}</span>
                    </div>
                  </div>
                  
                  {/* Botão de opções */}
                  <div className={`absolute right-2 top-2 ${
                    isMobile 
                      ? 'opacity-100' // Sempre visível em dispositivos móveis
                      : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200' // Visível apenas no hover em desktop
                  }`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMostraOpcoes(mostraOpcoes === documento.id ? null : documento.id);
                      }}
                      className="p-1 rounded-md hover:bg-law-200 dark:hover:bg-law-700 focus:outline-none transition-colors duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-law-500 dark:text-law-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    
                    {/* Menu de opções */}
                    {mostraOpcoes === documento.id && (
                      <div 
                        className="absolute right-0 top-6 w-36 bg-white dark:bg-law-800 shadow-lg rounded-md overflow-hidden z-10 border border-law-200 dark:border-law-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          className="w-full text-left px-3 py-2 text-xs hover:bg-law-100 dark:hover:bg-law-700 transition-colors duration-300 flex items-center"
                          onClick={(e) => handleFavorito(e, documento.id || '', !!documento.favorito)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2" fill={documento.favorito ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          {documento.favorito ? 'Remover favorito' : 'Marcar favorito'}
                        </button>
                        
                        <button 
                          className="w-full text-left px-3 py-2 text-xs hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors duration-300 flex items-center"
                          onClick={(e) => handleExcluirDocumento(e, documento.id || '')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DocumentosSidebar; 