import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // URLs que não requerem autenticação
  const publicUrls = ['/landing', '/login', '/auth'];
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // Verificar se a URL atual está na lista de URLs públicas
  const isPublicUrl = publicUrls.some(publicUrl => pathname.startsWith(publicUrl));
  
  // Verificar existência do token (verificação mais robusta)
  const possibleAuthCookies = [
    'sb-access-token',
    'sb:token',
    'sb-refresh-token',
    'supabase-auth-token'
  ];
  
  let hasToken = false;
  
  // Verificar todos os possíveis cookies de autenticação
  for (const cookieName of possibleAuthCookies) {
    const cookie = req.cookies.get(cookieName);
    if (cookie?.value) {
      hasToken = true;
      break;
    }
  }
  
  // Adicionar um cookie especial para evitar loops de redirecionamento
  const redirectAttempt = req.cookies.get('redirect_attempt');
  const redirectCount = redirectAttempt ? parseInt(redirectAttempt.value, 10) : 0;

  // Se já tentamos redirecionar muitas vezes, permitir o acesso para evitar loops
  if (redirectCount > 5) {
    // Resetar o contador de redirecionamentos
    const response = NextResponse.next();
    response.cookies.set('redirect_attempt', '0', { path: '/' });
    console.log('Limite de redirecionamentos atingido, permitindo acesso:', pathname);
    return response;
  }
  
  // Lógica de redirecionamento com contador
  if (!isPublicUrl && !hasToken) {
    const response = NextResponse.redirect(new URL('/landing', req.url));
    response.cookies.set('redirect_attempt', (redirectCount + 1).toString(), { path: '/' });
    return response;
  }

  if (pathname === '/landing' && hasToken) {
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.set('redirect_attempt', (redirectCount + 1).toString(), { path: '/' });
    return response;
  }

  // Resetar o contador de redirecionamentos quando não for necessário redirecionar
  const response = NextResponse.next();
  if (redirectCount > 0) {
    response.cookies.set('redirect_attempt', '0', { path: '/' });
  }
  return response;
}

// Configurar as rotas que o middleware deve executar
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}; 