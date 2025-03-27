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
    <div 
      className={`bg-white dark:bg-slate-800 h-full flex flex-col border-r border-gray-200 dark:border-slate-600 
        ${isMobile ? 'fixed inset-0 w-full z-[2000]' : 'relative'}`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <svg 
            className="w-5 h-5 mr-2 text-primary-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          Documentos
        </h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onNovoDocumento}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 
              transition-colors duration-200 text-primary-600 dark:text-primary-400"
            title="Novo documento"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
          </button>
          
          {isMobile && (
            <button
              onClick={onFecharSidebar}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 
                transition-colors duration-200 text-gray-600 dark:text-gray-300"
              title="Fechar"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Novo botão de criar documento, mais visível */}
      <button
        onClick={onNovoDocumento}
        className="flex items-center justify-center w-full py-3 px-4 bg-primary-50 dark:bg-slate-700 
          text-primary-700 dark:text-primary-300 font-medium border-b border-gray-200 dark:border-slate-600
          hover:bg-primary-100 dark:hover:bg-slate-600 transition-colors duration-200"
      >
        <svg 
          className="w-5 h-5 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
          />
        </svg>
        Criar Novo Documento
      </button>
      
      <div className="overflow-y-auto flex-1 py-1 px-1 bg-gray-50 dark:bg-slate-900">
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
                    <>
                      {/* Overlay para fechar o menu em dispositivos móveis */}
                      {isMobile && (
                        <div 
                          className="fixed inset-0 bg-black/50 z-[999]"
                          onClick={() => setMostraOpcoes(null)}
                        />
                      )}
                      <div
                        className={`
                          absolute bg-white dark:bg-slate-700 rounded-md shadow-lg border border-gray-200 dark:border-slate-600
                          ${isMobile 
                            ? 'fixed left-[50%] -translate-x-[50%] top-[50%] -translate-y-[50%] z-[1000] w-44 sm:w-36' 
                            : 'right-0 mt-1 z-50 w-36'
                          }
                        `}
                      >
                        <ul className="py-1">
                          <li>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFavorito(e, documento.id, documento.favorito || false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center"
                            >
                              <svg
                                className={`w-4 h-4 mr-2 ${documento.favorito ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}
                                fill={documento.favorito ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={documento.favorito ? 0 : 2}
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                              {documento.favorito ? 'Remover favorito' : 'Marcar favorito'}
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExcluirDocumento(e, documento.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Excluir
                            </button>
                          </li>
                        </ul>
                      </div>
                    </>
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