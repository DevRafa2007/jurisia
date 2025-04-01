import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import logger from '../../utils/logger';
import { logError, logInfo, logWarning } from '../../utils/logger';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se as variáveis de ambiente existem
if (!supabaseUrl || !supabaseKey) {
  logger.error('Variáveis de ambiente do Supabase não definidas. Verifique o arquivo .env.local');
}

// Criar cliente com fallback para evitar falhas na inicialização
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Função alternativa para autenticação que pode ser usada se Clerk não estiver configurado
function getUsuarioIdAlternativo(req: NextApiRequest): string | null {
  // Para desenvolvimento, podemos verificar um header personalizado ou cookie
  // Em produção, isso deve ser substituído por uma autenticação adequada
  const usuarioId = req.headers['x-user-id'] as string || 
                   req.cookies?.usuario_id ||
                   req.query?.usuario_id as string ||
                   req.body?.usuarioId;
  
  if (usuarioId) {
    return usuarioId;
  }
  
  // Fallback para ambiente de desenvolvimento - NUNCA usar em produção!
  if (process.env.NODE_ENV === 'development') {
    return 'dev_user_' + Math.random().toString(36).substring(2, 9);
  }
  
  return null;
}

// Tipos de dados
interface ErrorResponse {
  erro: string;
  detalhes?: string;
}

interface HistoricoInteracao {
  id?: string;
  documento_id: string;
  usuario_id: string;
  tipo: 'pergunta' | 'analise' | 'sugestao' | 'correcao' | 'jurisprudencia';
  conteudo_enviado: string;
  resposta_assistente: string;
  metadata?: Record<string, any>;
  foi_util?: boolean;
  avaliacao?: number;
  comentario?: string;
  created_at?: string;
}

interface RespostaHistorico {
  interacoes: HistoricoInteracao[];
  total: number;
  proximo_offset?: number;
}

// Handler principal
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoricoInteracao | RespostaHistorico | { message: string } | ErrorResponse>
) {
  // Verificar método HTTP
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  // Verificar se o cliente foi inicializado
  if (!supabase) {
    logger.error('Cliente Supabase não inicializado. Verifique as variáveis de ambiente.');
    return res.status(500).json({ 
      error: 'Configuração do banco de dados indisponível',
      mensagem: 'Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.'
    });
  }

  // Verificar autenticação usando alternativa
  let userId: string | null = null;
  
  try {
    // Usar método alternativo para autenticação
    userId = getUsuarioIdAlternativo(req);
    if (userId) {
      logInfo(`Usuário autenticado via método alternativo: ${userId}`);
    }
  } catch (e) {
    logWarning('Autenticação alternativa falhou:', e);
  }
  
  // Se nenhum método de autenticação funcionou, retornar erro
  if (!userId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' });
  }

  try {
    // Roteamento com base no método HTTP
    switch (req.method) {
      case 'GET':
        return await getHistoricoDocumento(req, res, userId);
      case 'POST':
        return await salvarInteracao(req, res, userId);
      case 'PUT':
        return await atualizarFeedbackInteracao(req, res, userId);
      default:
        return res.status(405).json({ erro: 'Método não permitido' });
    }
  } catch (error) {
    const err = error as Error;
    logError('Erro ao processar solicitação de histórico de documento:', error);
    return res.status(500).json({
      erro: 'Erro ao processar solicitação',
      detalhes: err.message || 'Erro desconhecido'
    });
  }
}

// Obter histórico de interações para um documento específico
async function getHistoricoDocumento(
  req: NextApiRequest,
  res: NextApiResponse<RespostaHistorico | ErrorResponse>,
  userId: string
) {
  const { documento_id, limit = '20', offset = '0', tipo } = req.query;

  // Validar parâmetros obrigatórios
  if (!documento_id) {
    return res.status(400).json({ erro: 'ID do documento é obrigatório' });
  }

  const limitNum = parseInt(limit as string, 10);
  const offsetNum = parseInt(offset as string, 10);

  try {
    // Construir consulta base
    let query = supabase
      .from('documento_interacoes')
      .select('*', { count: 'exact' });
      
    // Em desenvolvimento, não filtramos por usuário para facilitar testes
    if (process.env.NODE_ENV !== 'development') {
      query = query.eq('usuario_id', userId);
    }
    
    query = query.eq('documento_id', documento_id);

    // Filtrar por tipo, se especificado
    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    // Obter dados paginados
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      logError('Erro na consulta ao Supabase:', error);
      throw new Error(error.message);
    }

    const proximo_offset = count && offsetNum + limitNum < count 
      ? offsetNum + limitNum 
      : undefined;

    logInfo(`Histórico recuperado para documento ${documento_id}: ${data?.length || 0} interações`);
    
    return res.status(200).json({
      interacoes: data as HistoricoInteracao[],
      total: count || 0,
      proximo_offset
    });
  } catch (error) {
    const err = error as Error;
    logError('Erro ao buscar histórico do documento:', error);
    return res.status(500).json({
      erro: 'Falha ao recuperar histórico',
      detalhes: err.message || 'Erro desconhecido'
    });
  }
}

// Salvar nova interação no histórico
async function salvarInteracao(
  req: NextApiRequest,
  res: NextApiResponse<HistoricoInteracao | ErrorResponse>,
  userId: string
) {
  const {
    documento_id,
    tipo,
    conteudo_enviado,
    resposta_assistente,
    metadata = {}
  } = req.body;

  // Validar campos obrigatórios
  if (!documento_id) {
    return res.status(400).json({ erro: 'ID do documento é obrigatório' });
  }

  if (!tipo || !['pergunta', 'analise', 'sugestao', 'correcao', 'jurisprudencia'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo de interação inválido ou ausente' });
  }

  if (!conteudo_enviado || !resposta_assistente) {
    return res.status(400).json({ erro: 'Conteúdo enviado e resposta do assistente são obrigatórios' });
  }

  try {
    // Em ambiente de desenvolvimento, não verificamos a propriedade do documento
    if (process.env.NODE_ENV !== 'development') {
      // Verificar se o documento pertence ao usuário
      const { data: documento, error: erroDocumento } = await supabase
        .from('documentos')
        .select('id')
        .eq('id', documento_id)
        .eq('usuario_id', userId)
        .single();

      if (erroDocumento || !documento) {
        return res.status(403).json({ erro: 'Documento não encontrado ou acesso negado' });
      }
    } else {
      logWarning('Pulando verificação de propriedade do documento em ambiente de desenvolvimento');
    }

    // Inserir a nova interação
    const { data, error } = await supabase
      .from('documento_interacoes')
      .insert({
        documento_id,
        usuario_id: userId,
        tipo,
        conteudo_enviado,
        resposta_assistente,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logError('Erro ao inserir no Supabase:', error);
      throw new Error(error.message);
    }

    logInfo(`Nova interação salva para o documento ${documento_id}`);
    return res.status(201).json(data as HistoricoInteracao);
  } catch (error) {
    const err = error as Error;
    logError('Erro ao salvar interação:', error);
    return res.status(500).json({
      erro: 'Falha ao salvar interação',
      detalhes: err.message || 'Erro desconhecido'
    });
  }
}

// Atualizar feedback de uma interação
async function atualizarFeedbackInteracao(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string } | ErrorResponse>,
  userId: string
) {
  const { interacao_id } = req.query;
  const { foi_util, avaliacao, comentario } = req.body;

  // Validar parâmetros
  if (!interacao_id) {
    return res.status(400).json({ erro: 'ID da interação é obrigatório' });
  }

  // Verificar se pelo menos um campo de feedback foi fornecido
  if (foi_util === undefined && avaliacao === undefined && !comentario) {
    return res.status(400).json({ erro: 'Pelo menos um campo de feedback deve ser fornecido' });
  }

  try {
    // Montar objeto com os campos a serem atualizados
    const camposAtualizados: Record<string, any> = {};
    
    if (foi_util !== undefined) camposAtualizados.foi_util = foi_util;
    if (avaliacao !== undefined) camposAtualizados.avaliacao = avaliacao;
    if (comentario !== undefined) camposAtualizados.comentario = comentario;
    
    // Adicionar data da atualização
    camposAtualizados.updated_at = new Date().toISOString();

    // Atualizar interação
    const { error } = await supabase
      .from('documento_interacoes')
      .update(camposAtualizados)
      .eq('id', interacao_id);
      
    // Em ambiente de produção, verificaríamos também o usuário
    if (process.env.NODE_ENV !== 'development') {
      supabase.eq('usuario_id', userId);
    }

    if (error) {
      logError('Erro ao atualizar no Supabase:', error);
      throw new Error(error.message);
    }

    logInfo(`Feedback atualizado para interação ${interacao_id}`);
    return res.status(200).json({ message: 'Feedback atualizado com sucesso' });
  } catch (error) {
    const err = error as Error;
    logError('Erro ao atualizar feedback:', error);
    return res.status(500).json({
      erro: 'Falha ao atualizar feedback',
      detalhes: err.message || 'Erro desconhecido'
    });
  }
} 