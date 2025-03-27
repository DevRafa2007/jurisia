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

  // Fechar menu de opções quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setMostraOpcoes(null);
    };
    
    // Adicionar listener para clicks no documento
    document.addEventListener('click', handleClickOutside);
    
    // Remover listener quando o componente for desmontado
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Barra de pesquisa e filtros */}
      <div className="px-4 py-3 space-y-3 border-b border-gray-200/70 dark:border-gray-700/50">
        {/* Botão de destaque para criar novo documento */}
        <button
          onClick={onNovoDocumento}
          className="w-full flex items-center justify-center gap-2 p-3 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/40 dark:hover:bg-primary-800/60 text-primary-700 dark:text-primary-300 rounded-lg font-medium transition-colors duration-200 border border-primary-200 dark:border-primary-800"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Criar Novo Documento</span>
        </button>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input 
            type="text" 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar documento..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200"
          />
          {filtro && (
            <button 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setFiltro('')}
              aria-label="Limpar busca"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setVisualizacao('todos')}
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors duration-200 ${
              visualizacao === 'todos' 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          <button 
            onClick={() => setVisualizacao('favoritos')}
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors duration-200 ${
              visualizacao === 'favoritos' 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Favoritos
          </button>
        </div>
      </div>
      
      {/* Lista de documentos */}
      <div className="flex-grow overflow-y-auto p-2">
        {carregando ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400 space-y-3">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
            <p className="text-sm">Carregando documentos...</p>
          </div>
        ) : erro ? (
          <div className="p-4 text-center text-red-600 dark:text-red-400 space-y-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{erro}</p>
            <button 
              onClick={atualizarDocumentos}
              className="px-4 py-1.5 bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-600 text-white text-sm font-medium rounded-md transition-colors duration-200"
            >
              Tentar novamente
            </button>
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400 text-center space-y-3 p-4">
            {filtro ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Nenhum documento encontrado para: <strong>"{filtro}"</strong></p>
                <button 
                  onClick={() => setFiltro('')}
                  className="text-primary-600 dark:text-primary-400 text-sm hover:underline"
                >
                  Limpar busca
                </button>
              </>
            ) : visualizacao === 'favoritos' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p>Você ainda não tem documentos favoritos.</p>
                <button 
                  onClick={() => setVisualizacao('todos')}
                  className="text-primary-600 dark:text-primary-400 text-sm hover:underline"
                >
                  Ver todos os documentos
                </button>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Você ainda não tem documentos. Crie seu primeiro documento agora!</p>
                <button 
                  onClick={onNovoDocumento}
                  className="px-4 py-1.5 bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-600 text-white text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Criar documento
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {documentosFiltrados.map((documento) => (
              <div 
                key={documento.id} 
                className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                  documentoAtual === documento.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 dark:border-primary-400 pl-2'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent pl-2'
                }`}
                onClick={() => documento.id && onSelecionarDocumento(documento.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3 overflow-hidden">
                    {/* Ícone do tipo de documento */}
                    <div className="flex-shrink-0 mt-0.5">
                      {documento.favorito ? (
                        <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Título e detalhes */}
                    <div className="min-w-0 flex-1">
                      <h3 
                        className={`text-sm font-medium truncate ${
                          documentoAtual === documento.id 
                            ? 'text-primary-700 dark:text-primary-300' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {documento.titulo || 'Documento sem título'}
                      </h3>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {TIPOS_DOCUMENTOS.find(t => t.id === documento.tipo)?.nome || documento.tipo}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {formatarData(documento.atualizado_em || documento.criado_em)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botão de opções */}
                  <div className="ml-2 flex-shrink-0 relative">
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMostraOpcoes(mostraOpcoes === documento.id ? null : documento.id);
                      }}
                      aria-label="Opções do documento"
                    >
                      <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    
                    {/* Menu de opções */}
                    {mostraOpcoes === documento.id && documento.id && (
                      <div 
                        className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-[1000] border border-gray-200 dark:border-gray-700 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
                          onClick={(e) => documento.id && handleFavorito(e, documento.id, !!documento.favorito)}
                        >
                          {documento.favorito ? (
                            <>
                              <svg className="h-4 w-4 mr-2 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Remover dos favoritos
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              Adicionar aos favoritos
                            </>
                          )}
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        <button
                          className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
                          onClick={(e) => documento.id && handleExcluirDocumento(e, documento.id)}
                        >
                          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        )}
      </div>
    </div>
  );
};

export default DocumentosSidebar; 