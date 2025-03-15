import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar se o método é GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido', message: 'Este endpoint aceita apenas requisições GET' });
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
    const { conversaId } = req.query;

    // Se não foi especificado um ID, exportar todas as conversas do usuário
    if (!conversaId) {
      // Buscar todas as conversas do usuário
      const { data: conversas, error: conversasError } = await supabase
        .from('conversas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('atualizado_em', { ascending: false });

      if (conversasError) {
        console.error('Erro ao buscar conversas:', conversasError);
        return res.status(500).json({ error: 'Erro interno', message: 'Não foi possível buscar as conversas' });
      }

      // Se o usuário não tiver conversas, retornar um array vazio
      if (!conversas || conversas.length === 0) {
        return res.status(200).json({ conversas: [] });
      }

      // Criar um objeto para armazenar os resultados
      const resultado: { [key: string]: { conversa: Conversa, mensagens: Mensagem[] } } = {};

      // Para cada conversa, buscar suas mensagens
      for (const conversa of conversas) {
        const { data: mensagens, error: mensagensError } = await supabase
          .from('mensagens')
          .select('*')
          .eq('conversa_id', conversa.id)
          .order('criado_em', { ascending: true });

        if (mensagensError) {
          console.error(`Erro ao buscar mensagens da conversa ${conversa.id}:`, mensagensError);
          continue;
        }

        resultado[conversa.id] = {
          conversa,
          mensagens: mensagens || []
        };
      }

      // Retornar todas as conversas com suas mensagens
      return res.status(200).json(resultado);
    } 
    // Se foi especificado um ID, exportar apenas essa conversa
    else {
      // Verificar se o usuário é dono da conversa
      const { data: conversa, error: conversaError } = await supabase
        .from('conversas')
        .select('*')
        .eq('id', conversaId)
        .eq('usuario_id', user.id)
        .single();

      if (conversaError) {
        return res.status(404).json({ error: 'Conversa não encontrada', message: 'A conversa especificada não foi encontrada ou você não tem permissão para acessá-la' });
      }

      // Buscar as mensagens da conversa
      const { data: mensagens, error: mensagensError } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversa.id)
        .order('criado_em', { ascending: true });

      if (mensagensError) {
        console.error('Erro ao buscar mensagens:', mensagensError);
        return res.status(500).json({ error: 'Erro interno', message: 'Não foi possível buscar as mensagens da conversa' });
      }

      // Retornar a conversa com suas mensagens
      return res.status(200).json({
        conversa,
        mensagens: mensagens || []
      });
    }
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', message: 'Ocorreu um erro ao processar sua solicitação' });
  }
} 