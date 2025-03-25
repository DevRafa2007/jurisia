import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Se o usuário não estiver autenticado e tentar acessar rotas protegidas, 
  // redirecionar para landing page
  if (!session && req.nextUrl.pathname !== '/landing' && 
      req.nextUrl.pathname !== '/login' && 
      !req.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/landing', req.url));
  }

  // Se o usuário estiver autenticado e tentar acessar a landing page, 
  // redirecionar para página inicial
  if (session && req.nextUrl.pathname === '/landing') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

// Configurar as rotas que o middleware deve executar
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}; 