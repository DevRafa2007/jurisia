import type { NextApiRequest, NextApiResponse } from 'next';
import { obterRespostaJuridica } from '../../utils/groq';

type ErrorResponse = {
  erro: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | ErrorResponse>
) {
  // Apenas aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { consulta, historico } = req.body;

    // Valida a consulta
    if (!consulta || typeof consulta !== 'string') {
      return res.status(400).json({ erro: 'A consulta é obrigatória e deve ser uma string' });
    }

    // Valida o histórico se fornecido
    if (historico && !Array.isArray(historico)) {
      return res.status(400).json({ erro: 'O histórico deve ser um array de mensagens' });
    }

    // Processa a consulta jurídica
    const resposta = await obterRespostaJuridica({ consulta, historico });
    
    // Retorna a resposta
    res.status(200).json(resposta);
  } catch (erro: any) {
    console.error('Erro ao processar a consulta jurídica:', erro);
    res.status(500).json({ erro: erro.message || 'Erro ao processar a consulta jurídica' });
  }
} 