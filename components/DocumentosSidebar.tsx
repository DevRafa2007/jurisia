import { useState, useEffect } from 'react';
import { Documento, carregarDocumentos, excluirDocumento, marcarDocumentoComoFavorito } from '../utils/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

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
    <div className={`
      h-full flex flex-col bg-gray-50 dark:bg-gray-900 shadow-sm overflow-hidden
      ${isMobile ? 'fixed inset-0 z-50 rounded-none w-full' : 'rounded-r-lg relative w-72 min-w-[18rem] max-w-xs border-r border-gray-200/70 dark:border-gray-700/50'}
    `}>
      <div className="p-3 sm:p-4 border-b border-gray-200/70 dark:border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center">
          {/* Botão para fechar o menu em dispositivos móveis */}
          {onFecharSidebar && (
            <button 
              onClick={onFecharSidebar}
              className="md:hidden mr-2 p-1.5 rounded-md hover:bg-gray-100/70 dark:hover:bg-gray-800/70 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-300"
              aria-label="Fechar menu de documentos"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-600 dark:text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Documentos</h2>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={atualizarDocumentos}
            className="p-1.5 rounded-md hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-colors duration-200"
            aria-label="Atualizar documentos"
            title="Atualizar lista"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${carregando ? 'animate-spin' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button 
            onClick={onNovoDocumento}
            className="ml-1 p-1.5 rounded-md hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-colors duration-200 text-primary-600 dark:text-primary-400"
            aria-label="Criar novo documento"
            title="Novo documento"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Botão de Novo Documento */}
      <div className="px-3 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
        <button
          onClick={onNovoDocumento}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md border border-gray-200 dark:border-gray-700 transition-colors text-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Novo documento</span>
        </button>
      </div>
      
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full py-2 px-3 pr-8 text-sm bg-transparent border border-gray-200/70 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-gray-800 dark:text-gray-200"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 text-gray-500 dark:text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex mt-2 border-b border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => setVisualizacao('todos')}
            className={`flex-1 py-2 px-1 text-sm font-medium text-center transition-colors duration-200 border-b-2 ${
              visualizacao === 'todos'
                ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setVisualizacao('favoritos')}
            className={`flex-1 py-2 px-1 text-sm font-medium text-center transition-colors duration-200 border-b-2 ${
              visualizacao === 'favoritos'
                ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Favoritos
          </button>
        </div>
      </div>
      
      {/* Lista de documentos */}
      <div className="flex-1 overflow-y-auto pb-4 px-2 pt-2 scrollbar-custom">
        {erro && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 text-sm rounded-lg mb-3 mx-1">
            <p>{erro}</p>
            <button 
              onClick={atualizarDocumentos}
              className="text-red-700 dark:text-red-300 underline mt-1 text-xs font-medium"
            >
              Tentar novamente
            </button>
          </div>
        )}
        
        {/* Mensagem de carregamento */}
        {carregando && documentos.length === 0 && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 mb-2 rounded-full border-2 border-t-primary-500 dark:border-t-primary-400 border-gray-200 dark:border-gray-700 animate-spin"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando documentos...</p>
            </div>
          </div>
        )}
        
        {/* Mensagem de nenhum documento */}
        {!carregando && documentosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            {filtro || visualizacao === 'favoritos' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10h2"></path>
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {visualizacao === 'favoritos' ? 'Nenhum documento favorito encontrado' : 'Nenhum resultado para esta busca'}
                </p>
                <button 
                  onClick={() => {
                    setFiltro('');
                    setVisualizacao('todos');
                  }}
                  className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nenhum documento criado</p>
                <button 
                  onClick={onNovoDocumento}
                  className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  Criar seu primeiro documento
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Lista de documentos */}
        <div className="space-y-1">
          {documentosFiltrados.map((documento) => (
            <div 
              key={documento.id}
              onClick={() => onSelecionarDocumento(documento.id)}
              className={`
                relative rounded-lg p-3 cursor-pointer transition-all duration-200
                ${documentoAtual === documento.id 
                  ? 'bg-primary-50/60 dark:bg-primary-900/20 border-l-2 border-primary-500 dark:border-primary-400' 
                  : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/60 border-l-2 border-transparent'}
              `}
            >
              <div className="flex justify-between">
                <div className="pr-6 flex-1 min-w-0">
                  <div className="flex items-center">
                    {/* Ícone de tipo de documento */}
                    <div className={`
                      flex-shrink-0 mr-2 text-gray-600 dark:text-gray-400
                      ${documento.favorito ? 'text-amber-500 dark:text-amber-400' : ''}
                    `}>
                      {documento.favorito ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Título e tipo do documento */}
                    <div className="truncate">
                      <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {documento.titulo || 'Documento sem título'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {
                          TIPOS_DOCUMENTOS.find(t => t.id === documento.tipo)?.nome || 
                          documento.tipo?.charAt(0).toUpperCase() + documento.tipo?.slice(1) || 
                          'Tipo desconhecido'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Data de atualização */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatarData(documento.atualizado_em || documento.criado_em)}
                  </p>
                </div>
                
                {/* Botão de opções */}
                <div className="absolute right-2 top-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMostraOpcoes(mostraOpcoes === documento.id ? null : documento.id);
                    }}
                    className="p-1 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Menu de opções */}
                  {mostraOpcoes === documento.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200/70 dark:border-gray-700/50 py-1 z-10">
                      <button 
                        onClick={(e) => handleFavorito(e, documento.id, documento.favorito || false)}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100/70 dark:hover:bg-gray-700/70 text-gray-700 dark:text-gray-300 transition-colors duration-200 flex items-center"
                      >
                        {documento.favorito ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Remover favorito
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Marcar favorito
                          </>
                        )}
                      </button>
                      <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-1"></div>
                      <button 
                        onClick={(e) => handleExcluirDocumento(e, documento.id)}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100/70 dark:hover:bg-gray-700/70 text-red-600 dark:text-red-400 transition-colors duration-200 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Excluir documento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentosSidebar; 