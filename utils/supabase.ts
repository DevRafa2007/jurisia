import { createClient } from '@supabase/supabase-js';

// Declaração de tipo para resolver o erro "Cannot find name 'process'"
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      GROQ_API_KEY?: string;
    }
  }
}

// Garantir que as variáveis de ambiente estejam disponíveis apenas no cliente
const supabaseUrl = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  : '';
const supabaseAnonKey = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  : '';

// Verificar se as chaves foram fornecidas
if (typeof window !== 'undefined') {
  if (!supabaseUrl) {
    console.error('Supabase URL não definida. Configure a variável de ambiente NEXT_PUBLIC_SUPABASE_URL.');
  }
  
  if (!supabaseAnonKey) {
    console.error('Supabase chave anônima não definida. Configure a variável de ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

// Tipo para resposta da IA
export interface RespostaIA {
  conteudo: string;
  modeloUsado: string;
  tokens: {
    entrada: number;
    saida: number;
    total: number;
  };
}

// Tipo para conversa (chat)
export interface Conversa {
  id?: string;
  usuario_id: string;
  titulo: string;
  criado_em?: string;
  atualizado_em?: string;
}

// Tipo para mensagem
export interface Mensagem {
  id?: string;
  conversa_id: string;
  conteudo: string;
  tipo: 'usuario' | 'assistente';
  criado_em?: string;
}

// Cria o cliente Supabase somente no cliente
export const supabase = typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Função para carregar conversas de um usuário
export async function carregarConversas(usuarioId: string): Promise<Conversa[]> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('conversas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('atualizado_em', { ascending: false });

    if (error) {
      console.error('Erro ao carregar conversas:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro inesperado ao carregar conversas:', error);
    return [];
  }
}

// Função para carregar mensagens de uma conversa
export async function carregarMensagens(conversaId: string): Promise<Mensagem[]> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('criado_em', { ascending: true });

    if (error) {
      console.error('Erro ao carregar mensagens:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro inesperado ao carregar mensagens:', error);
    return [];
  }
}

// Função para criar uma nova conversa
export async function criarConversa(usuarioId: string, titulo: string): Promise<Conversa> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  try {
    const { data, error } = await supabase
      .from('conversas')
      .insert([{ usuario_id: usuarioId, titulo }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conversa:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro inesperado ao criar conversa:', error);
    throw error;
  }
}

// Função para adicionar uma mensagem
export async function adicionarMensagem(
  conversaId: string,
  conteudo: string,
  tipo: 'usuario' | 'assistente'
): Promise<Mensagem> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  try {
    // Primeiro, adiciona a mensagem
    const { data, error } = await supabase
      .from('mensagens')
      .insert([{ conversa_id: conversaId, conteudo, tipo }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar mensagem:', error);
      throw error;
    }

    // Depois, atualiza a data de atualização da conversa
    await supabase
      .from('conversas')
      .update({ atualizado_em: new Date().toISOString() })
      .eq('id', conversaId);

    return data;
  } catch (error) {
    console.error('Erro inesperado ao adicionar mensagem:', error);
    throw error;
  }
}

// Função para atualizar o título de uma conversa
export async function atualizarTituloConversa(conversaId: string, titulo: string): Promise<void> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  try {
    const { error } = await supabase
      .from('conversas')
      .update({ titulo })
      .eq('id', conversaId);

    if (error) {
      console.error('Erro ao atualizar título da conversa:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro inesperado ao atualizar título da conversa:', error);
    throw error;
  }
}

// Função para excluir uma conversa
export async function excluirConversa(conversaId: string): Promise<void> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  try {
    // Primeiro exclui todas as mensagens da conversa
    await supabase
      .from('mensagens')
      .delete()
      .eq('conversa_id', conversaId);

    // Depois exclui a conversa
    const { error } = await supabase
      .from('conversas')
      .delete()
      .eq('id', conversaId);

    if (error) {
      console.error('Erro ao excluir conversa:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro inesperado ao excluir conversa:', error);
    throw error;
  }
} 