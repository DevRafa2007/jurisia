import { createClient } from '@supabase/supabase-js';

// Garantir que as variáveis de ambiente estejam disponíveis
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se as chaves foram fornecidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL ou chave anônima não definidas. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Cria o cliente Supabase com opções persistentes para armazenamento de sessão
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'jurisia-auth-storage',
    autoRefreshToken: true,
    detectSessionInUrl: true 
  },
  global: {
    // Adicionar timeout para evitar requisições penduradas
    fetch: (...args) => {
      // @ts-ignore - args podem ser diferentes do que o TS espera
      return fetch(...args)
        .then(response => {
          // Adicionar log em caso de erro no servidor
          if (!response.ok) {
            console.warn(`[SUPABASE] Resposta do servidor não-ok: ${response.status} ${response.statusText}`);
          }
          return response;
        })
        .catch(error => {
          console.error('[SUPABASE] Erro de fetch:', error);
          throw error;
        });
    }
  }
});

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

// Interface para o perfil do usuário
export interface PerfilUsuario {
  id?: string;
  usuario_id: string;
  nome_completo?: string;
  url_foto?: string;
  criado_em?: string;
  atualizado_em?: string;
}

// Função para carregar conversas de um usuário
export async function carregarConversas(usuarioId: string): Promise<Conversa[]> {
  if (!supabase) {
    console.error('[SUPABASE] Cliente Supabase não inicializado');
    return [];
  }

  try {
    // Adicionar timeout de segurança
    const timeoutId = setTimeout(() => {
      console.warn('[SUPABASE] Timeout ao carregar conversas para usuário:', usuarioId);
    }, 5000);
    
    console.log('[SUPABASE] Carregando conversas para usuário:', usuarioId);
    
    const { data, error, status } = await supabase
      .from('conversas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('atualizado_em', { ascending: false });
    
    clearTimeout(timeoutId);
    
    // Log detalhado para debug
    console.log('[SUPABASE] Resposta ao carregar conversas:', { 
      status, 
      conversasRecebidas: data?.length || 0,
      temErro: !!error 
    });

    if (error) {
      console.error('[SUPABASE] Erro ao carregar conversas:', error, 'Status:', status);
      
      // Em produção, se o erro for de acesso à tabela, podemos tentar recarregar a sessão
      if (status === 401 || status === 403) {
        console.warn('[SUPABASE] Erro de permissão ao carregar conversas. Pode ser necessário recarregar a sessão.');
      }
      
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[SUPABASE] Erro inesperado ao carregar conversas:', error);
    return [];
  }
}

// Função para carregar mensagens de uma conversa
export async function carregarMensagens(conversaId: string | undefined): Promise<Mensagem[]> {
  if (!supabase) {
    console.error('[SUPABASE] Cliente Supabase não inicializado');
    return [];
  }

  if (!conversaId) {
    console.error('[SUPABASE] ID da conversa não definido');
    return [];
  }

  try {
    // Adicionar timeout de segurança
    const timeoutId = setTimeout(() => {
      console.warn('[SUPABASE] Timeout ao carregar mensagens para conversa:', conversaId);
    }, 5000);
    
    console.log('[SUPABASE] Carregando mensagens para conversa:', conversaId);
    
    const { data, error, status } = await supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('criado_em', { ascending: true });
    
    clearTimeout(timeoutId);
    
    // Log detalhado para debug
    console.log('[SUPABASE] Resposta ao carregar mensagens:', { 
      status, 
      mensagensRecebidas: data?.length || 0,
      temErro: !!error 
    });

    if (error) {
      console.error('[SUPABASE] Erro ao carregar mensagens:', error, 'Status:', status);
      
      // Em produção, se o erro for de acesso à tabela, podemos tentar recarregar a sessão
      if (status === 401 || status === 403) {
        console.warn('[SUPABASE] Erro de permissão ao carregar mensagens. Pode ser necessário recarregar a sessão.');
      }
      
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[SUPABASE] Erro inesperado ao carregar mensagens:', error);
    return [];
  }
}

// Função para criar uma nova conversa
export async function criarConversa(usuarioId: string, titulo: string): Promise<Conversa> {
  if (!supabase) {
    console.error('[SUPABASE] Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  try {
    console.log('[SUPABASE] Criando nova conversa para usuário:', usuarioId);
    
    const { data, error, status } = await supabase
      .from('conversas')
      .insert([{ usuario_id: usuarioId, titulo }])
      .select()
      .single();
    
    // Log detalhado para debug
    console.log('[SUPABASE] Resposta ao criar conversa:', { 
      status, 
      conversaCriada: !!data,
      temErro: !!error 
    });

    if (error) {
      console.error('[SUPABASE] Erro ao criar conversa:', error, 'Status:', status);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[SUPABASE] Erro inesperado ao criar conversa:', error);
    throw error;
  }
}

// Função para adicionar uma mensagem a uma conversa
export async function adicionarMensagem(
  conversaId: string | undefined,
  conteudo: string,
  tipo: 'usuario' | 'assistente'
): Promise<void> {
  if (!supabase) {
    console.error('[SUPABASE] Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  if (!conversaId) {
    console.error('[SUPABASE] ID da conversa não definido');
    throw new Error('ID da conversa não definido');
  }

  try {
    console.log(`[SUPABASE] Adicionando mensagem de ${tipo} à conversa:`, conversaId);
    
    const { error: errorInsert, status: statusInsert } = await supabase
      .from('mensagens')
      .insert([{ conversa_id: conversaId, conteudo, tipo }]);

    // Log detalhado para debug
    console.log('[SUPABASE] Resposta ao adicionar mensagem:', { 
      statusInsert, 
      temErro: !!errorInsert 
    });

    if (errorInsert) {
      console.error('[SUPABASE] Erro ao adicionar mensagem:', errorInsert, 'Status:', statusInsert);
      throw errorInsert;
    }

    // Atualiza o timestamp da conversa
    const { error: errorUpdate, status: statusUpdate } = await supabase
      .from('conversas')
      .update({ atualizado_em: new Date().toISOString() })
      .eq('id', conversaId);
    
    // Log detalhado para debug
    console.log('[SUPABASE] Resposta ao atualizar timestamp:', { 
      statusUpdate, 
      temErro: !!errorUpdate 
    });

    if (errorUpdate) {
      console.error('[SUPABASE] Erro ao atualizar timestamp da conversa:', errorUpdate);
      // Não lançar erro aqui, pois a mensagem já foi inserida
    }
  } catch (error) {
    console.error('[SUPABASE] Erro inesperado ao adicionar mensagem:', error);
    throw error;
  }
}

// Função para atualizar o título de uma conversa
export async function atualizarTituloConversa(conversaId: string | undefined, titulo: string): Promise<void> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  if (!conversaId) {
    console.error('ID da conversa não definido');
    throw new Error('ID da conversa não definido');
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
export async function excluirConversa(conversaId: string | undefined): Promise<void> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }
  
  if (!conversaId) {
    console.error('ID da conversa não definido');
    throw new Error('ID da conversa não definido');
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

// Função para obter o perfil do usuário
export async function obterPerfilUsuario(usuarioId: string): Promise<PerfilUsuario | null> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('usuario_id', usuarioId)
      .single();

    if (error) {
      // Se o erro for "no rows returned", pode ser que o usuário não tenha perfil ainda
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Erro ao carregar perfil do usuário:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro inesperado ao carregar perfil do usuário:', error);
    return null;
  }
}

// Função para criar ou atualizar o perfil do usuário
export async function atualizarPerfilUsuario(
  usuarioId: string,
  dados: { nome_completo?: string; url_foto?: string }
): Promise<PerfilUsuario | null> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return null;
  }

  try {
    // Verificar se o perfil já existe
    const perfilExistente = await obterPerfilUsuario(usuarioId);
    
    if (perfilExistente) {
      // Atualizar perfil existente
      const { data, error } = await supabase
        .from('perfis')
        .update({ 
          ...dados, 
          atualizado_em: new Date().toISOString() 
        })
        .eq('usuario_id', usuarioId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
      }

      return data;
    } else {
      // Criar novo perfil
      const { data, error } = await supabase
        .from('perfis')
        .insert([{ 
          usuario_id: usuarioId, 
          ...dados,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar perfil:', error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error('Erro inesperado ao atualizar perfil:', error);
    return null;
  }
}

// Função para fazer upload de uma imagem de perfil
export async function uploadImagemPerfil(
  usuarioId: string, 
  arquivo: File
): Promise<string | null> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return null;
  }

  try {
    // Definir o caminho do arquivo no storage
    const filePath = `perfis/${usuarioId}/${Date.now()}_${arquivo.name}`;
    
    // Upload do arquivo
    const { data, error } = await supabase
      .storage
      .from('uploads')
      .upload(filePath, arquivo, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }

    // Obter URL pública da imagem
    const { data: urlData } = await supabase
      .storage
      .from('uploads')
      .getPublicUrl(data.path);

    if (!urlData.publicUrl) {
      throw new Error('Não foi possível obter a URL pública da imagem');
    }

    // Atualizar o perfil do usuário com a URL da imagem
    await atualizarPerfilUsuario(usuarioId, { url_foto: urlData.publicUrl });

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro inesperado ao fazer upload da imagem:', error);
    return null;
  }
} 