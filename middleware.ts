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
  const authCookie = req.cookies.get('sb-access-token');
  const hasToken = !!authCookie?.value;

  // Se a URL não for pública e não houver token, redirecionar para landing
  if (!isPublicUrl && !hasToken) {
    url.pathname = '/landing';
    return NextResponse.redirect(url);
  }

  // Se tiver token e tentar acessar landing, redirecionar para home
  if (pathname === '/landing' && hasToken) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configurar as rotas que o middleware deve executar
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}; 