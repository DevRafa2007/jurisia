import { NextApiRequest, NextApiResponse } from 'next';
import { processarEventoLegal } from '../../utils/groq';
import { logError, logInfo } from '../../utils/logger';

/**
 * API endpoint para receber webhooks de atualizações legais
 * Esta API recebe notificações de sistemas externos sobre alterações legislativas
 * 
 * @param req Requisição da API Next.js
 * @param res Resposta da API Next.js
 */
export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Somente permitir método POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ 
      sucesso: false,
      mensagem: 'Método não permitido' 
    });
    return;
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        sucesso: false,
        mensagem: 'Autenticação inválida' 
      });
      return;
    }

    // Extrair token
    const token = authHeader.substring(7);
    
    // Validar token (implementação simulada)
    // Em produção, verificar com segredo compartilhado ou JWT
    if (token !== process.env.WEBHOOK_SECRET) {
      logError('Token de webhook inválido');
      res.status(403).json({ 
        sucesso: false,
        mensagem: 'Token inválido' 
      });
      return;
    }

    // Validar dados recebidos
    const dados = req.body;
    if (!dados || !dados.tipo || !dados.dados) {
      res.status(400).json({ 
        sucesso: false,
        mensagem: 'Formato de dados inválido' 
      });
      return;
    }

    // Registrar recebimento do webhook
    logInfo(`Webhook recebido: ${dados.tipo}`);

    // Processar evento legal
    const resultado = await processarEventoLegal({
      tipo: dados.tipo,
      dados: dados.dados
    });

    // Retornar resposta de sucesso
    res.status(200).json({ 
      sucesso: true,
      mensagem: 'Evento processado com sucesso',
      eventoProcessado: resultado
    });
  } catch (erro) {
    // Registrar erro
    logError('Erro ao processar webhook', erro instanceof Error ? erro : new Error(String(erro)));
    
    // Retornar erro 500
    res.status(500).json({ 
      sucesso: false,
      mensagem: 'Erro interno ao processar webhook' 
    });
  }
} 