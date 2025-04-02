import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API de teste - Inicializando handler');
  
  // Responder com sucesso
  return res.status(200).json({ 
    status: 'ok',
    message: 'API de teste funcionando corretamente',
    method: req.method,
    body: req.body || 'Sem corpo',
    time: new Date().toISOString()
  });
} 