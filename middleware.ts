import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // URLs que não requerem autenticação
  const publicUrls = ['/landing', '/login', '/auth'];
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // Verificar se a URL atual está na lista de URLs públicas
  const isPublicUrl = publicUrls.some(publicUrl => pathname.startsWith(publicUrl));
  
  // Verificar existência do token (simplificado)
  const authCookie = req.cookies.get('sb-access-token') || req.cookies.get('sb:token');
  const refreshToken = req.cookies.get('sb-refresh-token');
  const hasToken = !!authCookie?.value || !!refreshToken?.value;
  
  // Adicionar um cookie especial para evitar loops de redirecionamento
  const redirectAttempt = req.cookies.get('redirect_attempt');
  const redirectCount = redirectAttempt ? parseInt(redirectAttempt.value, 10) : 0;

  // Se já tentamos redirecionar muitas vezes, permitir o acesso para evitar loops
  if (redirectCount > 3) {
    // Resetar o contador de redirecionamentos
    const response = NextResponse.next();
    response.cookies.set('redirect_attempt', '0', { path: '/' });
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