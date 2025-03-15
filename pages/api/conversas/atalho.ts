import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar se o método é PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido', message: 'Este endpoint aceita apenas requisições PUT' });
  }

  try {
    // Inicializar cliente Supabase no servidor
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente do Supabase não configuradas');
      return res.status(500).json({ error: 'Erro de configuração', message: 'O servidor não está configurado corretamente' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Verificar autenticação
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Não autorizado', message: 'Você precisa estar logado para acessar este recurso' });
    }

    // Obter os parâmetros da requisição
    const { conversaId, favorito } = req.body;

    if (!conversaId) {
      return res.status(400).json({ error: 'Parâmetros inválidos', message: 'O ID da conversa é obrigatório' });
    }

    // Verificar se o usuário é dono da conversa
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas')
      .select('usuario_id')
      .eq('id', conversaId)
      .single();

    if (conversaError) {
      return res.status(404).json({ error: 'Conversa não encontrada', message: 'A conversa especificada não foi encontrada' });
    }

    if (conversa.usuario_id !== user.id) {
      return res.status(403).json({ error: 'Acesso negado', message: 'Você não tem permissão para modificar esta conversa' });
    }

    // Atualizar o status de favorito
    const { error: updateError } = await supabase
      .from('conversas')
      .update({ favorito: favorito === undefined ? true : !!favorito })
      .eq('id', conversaId);

    if (updateError) {
      console.error('Erro ao atualizar status de favorito:', updateError);
      return res.status(500).json({ error: 'Erro interno', message: 'Não foi possível atualizar o status de favorito da conversa' });
    }

    // Responder com sucesso
    return res.status(200).json({ 
      success: true, 
      message: favorito ? 'Conversa adicionada aos atalhos' : 'Conversa removida dos atalhos'
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', message: 'Ocorreu um erro ao processar sua solicitação' });
  }
} 