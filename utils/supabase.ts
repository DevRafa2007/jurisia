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

// Inicialização otimizada do cliente Supabase
// Verificar se estamos no navegador e não no servidor
const isBrowser = typeof window !== 'undefined';

// Obter as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se as chaves foram fornecidas apenas em ambiente de desenvolvimento
if (isBrowser && process.env.NODE_ENV === 'development') {
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
  favorito?: boolean;
}

// Tipo para mensagem
export interface Mensagem {
  id?: string;
  conversa_id: string;
  conteudo: string;
  tipo: 'usuario' | 'assistente';
  criado_em?: string;
}

// Tipo para documento jurídico
export interface Documento {
  id?: string;
  usuario_id: string;
  titulo: string;
  tipo: string; // tipo do documento (petição, contrato, etc)
  conteudo: string;
  criado_em?: string;
  atualizado_em?: string;
  favorito?: boolean;
}

// Criar uma única instância do cliente Supabase
export const supabase = isBrowser && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      // Adicionar configurações para melhorar a performance
      global: {
        fetch: fetch.bind(globalThis),
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Função para carregar conversas de um usuário com caching
let cachedConversas: { [userId: string]: { data: Conversa[], timestamp: number } } = {};
const CACHE_DURATION = 60000; // 1 minuto em milissegundos

export async function carregarConversas(usuarioId: string, forceUpdate = false): Promise<Conversa[]> {
  // Extrair o ID do usuário sem o parâmetro nocache, se presente
  const userId = usuarioId.split('?')[0];
  
  // Verificar se devemos forçar a atualização
  forceUpdate = forceUpdate || usuarioId.includes('nocache');

  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return [];
  }

  try {
    // Verificar se temos cache válido
    const now = Date.now();
    const cached = cachedConversas[userId];
    if (!forceUpdate && cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log('Usando conversas em cache para o usuário', userId);
      return cached.data;
    }

    const { data, error } = await supabase
      .from('conversas')
      .select('*')
      .eq('usuario_id', userId)
      .order('atualizado_em', { ascending: false });

    if (error) {
      console.error('Erro ao carregar conversas:', error);
      throw error;
    }

    // Armazenar no cache
    cachedConversas[userId] = { data: data || [], timestamp: now };
    return data || [];
  } catch (error) {
    console.error('Erro inesperado ao carregar conversas:', error);
    
    // Retornar cache antigo se existir
    const cached = cachedConversas[userId];
    if (cached) {
      console.log('Usando cache antigo devido a erro');
      return cached.data;
    }
    
    return [];
  }
}

// Cache de mensagens por conversa
let cachedMensagens: { [conversaId: string]: { data: Mensagem[], timestamp: number } } = {};

// Função para carregar mensagens de uma conversa
export async function carregarMensagens(conversaId: string): Promise<Mensagem[]> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return [];
  }

  try {
    // Verificar se temos cache válido
    const now = Date.now();
    const cached = cachedMensagens[conversaId];
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log('Usando mensagens em cache para a conversa', conversaId);
      return cached.data;
    }

    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('criado_em', { ascending: true });

    if (error) {
      console.error('Erro ao carregar mensagens:', error);
      throw error;
    }

    // Armazenar no cache
    cachedMensagens[conversaId] = { data: data || [], timestamp: now };
    return data || [];
  } catch (error) {
    console.error('Erro inesperado ao carregar mensagens:', error);
    
    // Retornar cache antigo se existir
    const cached = cachedMensagens[conversaId];
    if (cached) {
      console.log('Usando cache antigo devido a erro');
      return cached.data;
    }
    
    return [];
  }
}

// Funções para limpar o cache
function limparCacheConversa(usuarioId: string) {
  if (cachedConversas[usuarioId]) {
    delete cachedConversas[usuarioId];
  }
}

function limparCacheMensagem(conversaId: string) {
  if (cachedMensagens[conversaId]) {
    delete cachedMensagens[conversaId];
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

    // Limpar cache de conversas para este usuário
    limparCacheConversa(usuarioId);
    
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
    const { data: conversaData } = await supabase
      .from('conversas')
      .update({ atualizado_em: new Date().toISOString() })
      .eq('id', conversaId)
      .select('usuario_id')
      .single();

    // Limpar caches
    limparCacheMensagem(conversaId);
    if (conversaData && conversaData.usuario_id) {
      limparCacheConversa(conversaData.usuario_id);
    }

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
    // Obter o usuário_id antes de excluir a conversa para limpar o cache depois
    const { data: conversaData } = await supabase
      .from('conversas')
      .select('usuario_id')
      .eq('id', conversaId)
      .single();
    
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
    
    // Limpar caches
    limparCacheMensagem(conversaId);
    if (conversaData && conversaData.usuario_id) {
      limparCacheConversa(conversaData.usuario_id);
    }
  } catch (error) {
    console.error('Erro inesperado ao excluir conversa:', error);
    throw error;
  }
}

// Função para marcar/desmarcar conversa como favorita (atalho)
export async function marcarComoFavorito(conversaId: string, favorito: boolean): Promise<void> {
  if (!conversaId) {
    throw new Error('ID da conversa não especificado');
  }

  try {
    const response = await fetch('/api/conversas/atalho', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversaId, favorito }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao atualizar conversa como favorita');
    }
    
    // Obter a conversa para limpar o cache
    const { data: conversaData } = await supabase
      .from('conversas')
      .select('usuario_id')
      .eq('id', conversaId)
      .single();
      
    // Limpar o cache
    if (conversaData && conversaData.usuario_id) {
      limparCacheConversa(conversaData.usuario_id);
    }
  } catch (error) {
    console.error('Erro ao marcar conversa como favorita:', error);
    throw error;
  }
}

// Função para exportar uma conversa específica
export async function exportarConversa(conversaId: string): Promise<{ conversa: Conversa, mensagens: Mensagem[] }> {
  if (!conversaId) {
    throw new Error('ID da conversa não especificado');
  }

  try {
    const response = await fetch(`/api/conversas/exportar?conversaId=${conversaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao exportar conversa');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao exportar conversa:', error);
    throw error;
  }
}

// Função para exportar todas as conversas de um usuário
export async function exportarTodasConversas(usuarioId: string): Promise<{ [conversaId: string]: { conversa: Conversa, mensagens: Mensagem[] } }> {
  if (!usuarioId) {
    throw new Error('ID do usuário não especificado');
  }

  try {
    const response = await fetch('/api/conversas/exportar', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao exportar conversas');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao exportar todas as conversas:', error);
    throw error;
  }
}

// Cache de documentos por usuário
let cachedDocumentos: { [userId: string]: { data: Documento[], timestamp: number } } = {};

// Função para limpar cache de documentos
function limparCacheDocumentos(usuarioId: string) {
  if (cachedDocumentos[usuarioId]) {
    delete cachedDocumentos[usuarioId];
  }
}

// Função para carregar documentos de um usuário
export async function carregarDocumentos(usuarioId: string, forceUpdate = false): Promise<Documento[]> {
  // Extrair o ID do usuário sem o parâmetro nocache, se presente
  const userId = usuarioId.split('?')[0];
  
  // Verificar se devemos forçar a atualização
  forceUpdate = forceUpdate || usuarioId.includes('nocache');

  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return [];
  }

  try {
    // Verificar se temos cache válido
    const now = Date.now();
    const cached = cachedDocumentos[userId];
    if (!forceUpdate && cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log('Usando documentos em cache para o usuário', userId);
      return cached.data;
    }

    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('usuario_id', userId)
      .order('atualizado_em', { ascending: false });

    if (error) {
      console.error('Erro ao carregar documentos:', error);
      throw error;
    }

    // Armazenar no cache
    cachedDocumentos[userId] = { data: data || [], timestamp: now };
    return data || [];
  } catch (error) {
    console.error('Erro inesperado ao carregar documentos:', error);
    
    // Retornar cache antigo se existir
    const cached = cachedDocumentos[userId];
    if (cached) {
      console.log('Usando cache antigo devido a erro');
      return cached.data;
    }
    
    return [];
  }
}

// Função para carregar um documento específico
export async function carregarDocumento(documentoId: string): Promise<Documento | null> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('id', documentoId)
      .single();

    if (error) {
      console.error('Erro ao carregar documento:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro inesperado ao carregar documento:', error);
    return null;
  }
}

// Função para criar um novo documento
export async function criarDocumento(
  usuarioId: string,
  titulo: string,
  tipo: string,
  conteudo: string
): Promise<Documento> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  try {
    const { data, error } = await supabase
      .from('documentos')
      .insert([{ 
        usuario_id: usuarioId, 
        titulo, 
        tipo, 
        conteudo 
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar documento:', error);
      throw error;
    }

    // Limpar cache de documentos para este usuário
    limparCacheDocumentos(usuarioId);
    
    return data;
  } catch (error) {
    console.error('Erro inesperado ao criar documento:', error);
    throw error;
  }
}

// Função para atualizar um documento existente
export async function atualizarDocumento(
  documentoId: string,
  atualizacoes: {
    titulo?: string;
    conteudo?: string;
  }
): Promise<void> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  try {
    // Obter o usuário_id antes de atualizar para limpar o cache depois
    const { data: documentoData } = await supabase
      .from('documentos')
      .select('usuario_id')
      .eq('id', documentoId)
      .single();
    
    const { error } = await supabase
      .from('documentos')
      .update({ 
        ...atualizacoes,
        atualizado_em: new Date().toISOString() 
      })
      .eq('id', documentoId);

    if (error) {
      console.error('Erro ao atualizar documento:', error);
      throw error;
    }
    
    // Limpar cache
    if (documentoData && documentoData.usuario_id) {
      limparCacheDocumentos(documentoData.usuario_id);
    }
  } catch (error) {
    console.error('Erro inesperado ao atualizar documento:', error);
    throw error;
  }
}

// Função para excluir um documento
export async function excluirDocumento(documentoId: string): Promise<void> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  try {
    // Obter o usuário_id antes de excluir para limpar o cache depois
    const { data: documentoData } = await supabase
      .from('documentos')
      .select('usuario_id')
      .eq('id', documentoId)
      .single();
    
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', documentoId);

    if (error) {
      console.error('Erro ao excluir documento:', error);
      throw error;
    }
    
    // Limpar cache
    if (documentoData && documentoData.usuario_id) {
      limparCacheDocumentos(documentoData.usuario_id);
    }
  } catch (error) {
    console.error('Erro inesperado ao excluir documento:', error);
    throw error;
  }
}

// Função para marcar/desmarcar documento como favorito
export async function marcarDocumentoComoFavorito(documentoId: string, favorito: boolean): Promise<void> {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    throw new Error('Cliente Supabase não inicializado');
  }

  try {
    // Obter o usuário_id antes de atualizar para limpar o cache depois
    const { data: documentoData } = await supabase
      .from('documentos')
      .select('usuario_id')
      .eq('id', documentoId)
      .single();
    
    const { error } = await supabase
      .from('documentos')
      .update({ 
        favorito, 
        atualizado_em: new Date().toISOString() 
      })
      .eq('id', documentoId);

    if (error) {
      console.error('Erro ao marcar documento como favorito:', error);
      throw error;
    }
    
    // Limpar cache
    if (documentoData && documentoData.usuario_id) {
      limparCacheDocumentos(documentoData.usuario_id);
    }
  } catch (error) {
    console.error('Erro inesperado ao marcar documento como favorito:', error);
    throw error;
  }
} 