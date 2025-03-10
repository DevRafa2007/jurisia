import { useState, useEffect } from 'react';
import { Conversa, carregarConversas, excluirConversa } from '../utils/supabase';

interface ConversasSidebarProps {
  usuarioId: string;
  conversaAtual: string | null;
  onSelecionarConversa: (conversaId: string) => void;
  onNovaConversa: () => void;
}

const ConversasSidebar: React.FC<ConversasSidebarProps> = ({
  usuarioId,
  conversaAtual,
  onSelecionarConversa,
  onNovaConversa,
}) => {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuarioId) return;
      
      try {
        setCarregando(true);
        const dados = await carregarConversas(usuarioId);
        setConversas(dados);
        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        setErro('Falha ao carregar conversas. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [usuarioId]);

  const handleExcluirConversa = async (e: React.MouseEvent, conversaId: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;

    try {
      await excluirConversa(conversaId);
      setConversas(conversas.filter(c => c.id !== conversaId));
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      setErro('Falha ao excluir conversa. Tente novamente.');
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

  return (
    <div className="bg-gray-100 w-80 flex flex-col h-full border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">Suas Consultas</h2>
        <button
          onClick={onNovaConversa}
          className="btn btn-primary text-sm px-3 py-1 flex items-center"
          aria-label="Nova conversa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        {carregando ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-700"></div>
          </div>
        ) : erro ? (
          <div className="p-4 text-red-500 text-center">{erro}</div>
        ) : conversas.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="mb-4">Nenhuma conversa encontrada</p>
            <button
              onClick={onNovaConversa}
              className="btn btn-secondary text-sm"
            >
              Iniciar uma nova consulta
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {conversas.map((conversa) => (
              <li
                key={conversa.id}
                className={`cursor-pointer hover:bg-gray-200 transition-colors ${
                  conversaAtual === conversa.id ? 'bg-gray-200' : ''
                }`}
                onClick={() => conversa.id && onSelecionarConversa(conversa.id)}
              >
                <div className="px-4 py-3 flex justify-between items-center">
                  <div className="overflow-hidden">
                    <h3 className="font-medium text-gray-800 truncate">{conversa.titulo}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatarData(conversa.atualizado_em)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => conversa.id && handleExcluirConversa(e, conversa.id)}
                    className="text-gray-500 hover:text-red-500 p-1"
                    aria-label="Excluir conversa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversasSidebar; 