import { NextApiRequest } from 'next';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

/**
 * Obtém o usuário autenticado a partir da requisição da API
 * Extrai o token de autenticação do cookie ou cabeçalho Authorization
 */
export async function getUser(req: NextApiRequest): Promise<User | null> {
  try {
    // Inicializar cliente Supabase no servidor
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente do Supabase não configuradas');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Obter o token de autenticação
    let token = '';
    
    // Tentar obter do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Se não encontrou no cabeçalho, tenta obter dos cookies
    if (!token) {
      const cookies = parseCookies(req);
      const supaSession = cookies['supabase.auth.token'] || cookies['sb-access-token'];
      if (supaSession) {
        token = supaSession;
      }
    }
    
    // Se não encontrou token, retorna null
    if (!token) {
      return null;
    }
    
    // Verificar se o token é válido e obter o usuário
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data || !data.user) {
      console.error('Erro ao verificar sessão:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
}

/**
 * Parse cookies da requisição
 */
function parseCookies(req: NextApiRequest): Record<string, string> {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim() || '';
    const value = parts.join('=').trim();
    
    if (name) cookies[name] = decodeURIComponent(value);
  });
  
  return cookies;
} 