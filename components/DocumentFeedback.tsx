import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface DocumentFeedbackProps {
  interacaoId: string;
  foiUtil?: boolean;
  avaliacaoInicial?: number;
}

const DocumentFeedback: React.FC<DocumentFeedbackProps> = ({
  interacaoId,
  foiUtil,
  avaliacaoInicial = 0
}) => {
  const [utilidade, setUtilidade] = useState<boolean | undefined>(foiUtil);
  const [avaliacao, setAvaliacao] = useState<number>(avaliacaoInicial);
  const [comentario, setComentario] = useState<string>('');
  const [mostrarComentario, setMostrarComentario] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);

  const handleUtilClick = async (util: boolean) => {
    if (enviando) return;
    
    setUtilidade(util);
    await enviarFeedback({ foi_util: util });
    
    // Se a classificação for negativa, mostrar campo de comentário
    if (!util) {
      setMostrarComentario(true);
    }
  };

  const handleStarClick = async (valor: number) => {
    if (enviando) return;
    
    setAvaliacao(valor);
    await enviarFeedback({ avaliacao: valor });
    
    // Se a avaliação for menor que 3, mostrar campo de comentário
    if (valor < 3) {
      setMostrarComentario(true);
    }
  };

  const handleComentarioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComentario(e.target.value);
  };

  const handleComentarioSubmit = async () => {
    if (enviando || !comentario.trim()) return;
    
    await enviarFeedback({ comentario });
    setMostrarComentario(false);
    toast.success('Obrigado pelo seu feedback!');
  };

  const enviarFeedback = async (dados: { 
    foi_util?: boolean; 
    avaliacao?: number; 
    comentario?: string 
  }) => {
    setEnviando(true);
    
    try {
      await axios.put(`/api/documento-historico?interacao_id=${interacaoId}`, dados);
      
      // Não mostrar toast para atualizações silenciosas (utilidade e estrelas)
      if (dados.comentario) {
        toast.success('Feedback enviado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Não foi possível enviar seu feedback. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-3 border-t pt-2 text-sm">
      <div className="text-gray-500 mb-2">Esta resposta foi útil?</div>
      
      <div className="flex items-center space-x-4">
        {/* Botões de utilidade */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleUtilClick(true)}
            className={`p-1 rounded-full ${
              utilidade === true 
                ? 'bg-green-100 text-green-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label="Útil"
            disabled={enviando}
          >
            <HandThumbUpIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => handleUtilClick(false)}
            className={`p-1 rounded-full ${
              utilidade === false 
                ? 'bg-red-100 text-red-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label="Não útil"
            disabled={enviando}
          >
            <HandThumbDownIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Avaliação por estrelas */}
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((valor) => (
            <button
              key={valor}
              onClick={() => handleStarClick(valor)}
              className={`focus:outline-none ${
                avaliacao >= valor 
                  ? 'text-yellow-500' 
                  : 'text-gray-300 hover:text-gray-400'
              }`}
              aria-label={`${valor} estrelas`}
              disabled={enviando}
            >
              <StarIcon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>
      
      {/* Campo de comentário */}
      {mostrarComentario && (
        <div className="mt-3">
          <textarea
            value={comentario}
            onChange={handleComentarioChange}
            placeholder="Conte-nos como podemos melhorar esta resposta..."
            className="w-full p-2 border rounded-md text-sm h-20 focus:ring-blue-500 focus:border-blue-500"
            disabled={enviando}
          />
          
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setMostrarComentario(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 mr-2"
              disabled={enviando}
            >
              Cancelar
            </button>
            
            <button
              onClick={handleComentarioSubmit}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={enviando || !comentario.trim()}
            >
              {enviando ? 'Enviando...' : 'Enviar feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentFeedback; 