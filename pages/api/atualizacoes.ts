import { NextApiRequest, NextApiResponse } from 'next';
import { logError, logInfo } from '../../utils/logger';

// Importação simulada de uma função para verificar atualizações legais
// Esta função seria a mesma usada internamente pelo sistema de IA
import { verificarAtualizacoesLegais } from '../../utils/atualizacoes-legais';

/**
 * API endpoint para consultar atualizações legais mais recentes
 * 
 * @param req Requisição da API Next.js
 * @param res Resposta da API Next.js
 */
export default async function atualizacoesHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Somente permitir método GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ 
      sucesso: false,
      mensagem: 'Método não permitido' 
    });
    return;
  }

  try {
    // Obter parâmetros opcionais
    const tipoLegislacao = req.query.tipo as string | undefined;
    const desde = req.query.desde as string | undefined;
    
    // Registrar consulta
    logInfo(`Consultando atualizações legais${tipoLegislacao ? ` do tipo ${tipoLegislacao}` : ''}`);

    // Obter atualizações legais
    const atualizacoes = await verificarAtualizacoesLegais({
      tipo: tipoLegislacao,
      desde: desde ? new Date(desde) : undefined
    });
    
    // Retornar resultado
    res.status(200).json({
      sucesso: true,
      data: new Date().toISOString(),
      ultimaVerificacao: atualizacoes.ultimaVerificacao,
      quantidade: atualizacoes.legislacoes?.length || 0,
      fontes: atualizacoes.fontes,
      atualizacoes: atualizacoes.legislacoes || []
    });
  } catch (erro) {
    // Registrar erro
    logError('Erro ao consultar atualizações legais', erro instanceof Error ? erro : new Error(String(erro)));
    
    // Retornar erro 500
    res.status(500).json({ 
      sucesso: false,
      mensagem: 'Erro interno ao consultar atualizações legais',
      erro: erro instanceof Error ? erro.message : String(erro)
    });
  }
} 