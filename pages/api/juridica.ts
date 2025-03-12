import type { NextApiRequest, NextApiResponse } from 'next';
import { obterRespostaJuridica } from '../../utils/groq';

type ErrorResponse = {
  erro: string;
  codigo?: string;
};

type SuccessResponse = {
  conteudo: string;
  modeloUsado: string;
  tokens: {
    entrada: number;
    saida: number;
    total: number;
  }
};

// Configurações de limite da API
const LIMITE_CARACTERES_CONSULTA = 2000;
const TIMEOUT_API = 25000; // 25 segundos

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // Adicionar cabeçalhos para melhorar a solução de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Verificar se é uma requisição OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apenas aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido', codigo: 'METHOD_NOT_ALLOWED' });
  }
  
  // Controle de timeout
  let isTimeout = false;
  const timeoutId = setTimeout(() => {
    isTimeout = true;
    return res.status(504).json({ 
      erro: 'Tempo limite excedido ao processar a consulta. Por favor, tente novamente com uma consulta mais simples.', 
      codigo: 'TIMEOUT' 
    });
  }, TIMEOUT_API);
  
  try {
    console.log('[API] Recebendo consulta jurídica');
    const { consulta, historico } = req.body;

    // Log para debug
    console.log(`[API] Consulta recebida: ${consulta ? consulta.substring(0, 50) + (consulta.length > 50 ? '...' : '') : 'indefinida'}`);
    console.log(`[API] Histórico: ${historico ? `${historico.length} mensagens` : 'não fornecido'}`);

    // Valida a consulta
    if (!consulta || typeof consulta !== 'string') {
      clearTimeout(timeoutId);
      return res.status(400).json({ 
        erro: 'A consulta é obrigatória e deve ser uma string', 
        codigo: 'INVALID_QUERY' 
      });
    }
    
    // Verifica o tamanho da consulta
    if (consulta.length > LIMITE_CARACTERES_CONSULTA) {
      clearTimeout(timeoutId);
      return res.status(400).json({
        erro: `A consulta deve ter no máximo ${LIMITE_CARACTERES_CONSULTA} caracteres. Sua consulta tem ${consulta.length} caracteres.`,
        codigo: 'QUERY_TOO_LONG'
      });
    }

    // Valida o histórico se fornecido
    if (historico) {
      if (!Array.isArray(historico)) {
        clearTimeout(timeoutId);
        return res.status(400).json({ 
          erro: 'O histórico deve ser um array de mensagens', 
          codigo: 'INVALID_HISTORY' 
        });
      }
      
      // Verificar tamanho do histórico
      if (historico.length > 30) {
        clearTimeout(timeoutId);
        return res.status(400).json({ 
          erro: 'O histórico não pode ter mais de 30 mensagens. Considere iniciar uma nova conversa.',
          codigo: 'HISTORY_TOO_LONG'
        });
      }
    }
    
    // Verificar novamente se o timeout já foi acionado
    if (isTimeout) {
      console.log('[API] O timeout foi acionado durante a validação');
      return;
    }

    // Adicionar tempos para debug
    const inicioProcessamento = Date.now();

    try {
      // Processa a consulta jurídica
      console.log('[API] Enviando consulta para processamento');
      const resposta = await obterRespostaJuridica({ consulta, historico: historico || [] });
      
      // Se chegarmos aqui mas o timeout já foi acionado, não fazemos nada
      if (isTimeout) {
        console.log('[API] O timeout foi acionado durante o processamento');
        return;
      }
      
      const tempoProcessamento = Date.now() - inicioProcessamento;
      console.log(`[API] Consulta processada em ${tempoProcessamento}ms`);
      
      // Limpar o timeout pois a resposta chegou a tempo
      clearTimeout(timeoutId);
      
      // Retorna a resposta
      return res.status(200).json(resposta);
    } catch (erroProcessamento: any) {
      // Se chegarmos aqui mas o timeout já foi acionado, não fazemos nada
      if (isTimeout) {
        console.log('[API] O timeout foi acionado após um erro de processamento');
        return;
      }
      
      clearTimeout(timeoutId);
      console.error('[API] Erro específico ao processar a consulta jurídica:', erroProcessamento);
      
      // Pegar mensagem de erro mais específica do processamento
      let mensagemErro = 'Erro ao processar a consulta jurídica';
      let codigoErro = 'PROCESSING_ERROR';
      
      if (erroProcessamento.message) {
        if (erroProcessamento.message.includes('API do Groq')) {
          mensagemErro = 'Erro na comunicação com o serviço de IA. Por favor, tente novamente mais tarde.';
          codigoErro = 'GROQ_API_ERROR';
        } else if (erroProcessamento.message.includes('timed out') || erroProcessamento.message.includes('timeout')) {
          mensagemErro = 'Tempo limite excedido no serviço de IA. Por favor, tente uma consulta mais simples.';
          codigoErro = 'GROQ_TIMEOUT';
        } else {
          mensagemErro = erroProcessamento.message;
        }
      }
      
      return res.status(500).json({ erro: mensagemErro, codigo: codigoErro });
    }
  } catch (erro: any) {
    // Se chegarmos aqui mas o timeout já foi acionado, não fazemos nada
    if (isTimeout) {
      console.log('[API] O timeout foi acionado antes de capturar um erro geral');
      return;
    }
    
    clearTimeout(timeoutId);
    console.error('[API] Erro geral ao processar a consulta jurídica:', erro);
    return res.status(500).json({ 
      erro: erro.message || 'Erro interno ao processar a consulta jurídica', 
      codigo: 'INTERNAL_SERVER_ERROR' 
    });
  }
} 