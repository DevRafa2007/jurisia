import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Temporariamente desabilitar todo o middleware para depuração
  console.log('Middleware desabilitado temporariamente');
  return NextResponse.next();
  
  /* Código original comentado
  // URLs que não requerem autenticação
  const publicUrls = ['/landing', '/login', '/auth'];
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // Ignorar requisições para arquivos de dados do Next.js
  if (pathname.includes('/_next/data/') || pathname.includes('.json')) {
    return NextResponse.next();
  }

  // Log para depuração
  console.log(`Middleware executando para: ${pathname}`);

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
  
  // Lógica de redirecionamento simplificada
  // Redirecionar para landing apenas se tentar acessar uma página protegida sem autenticação
  if (!isPublicUrl && !hasToken) {
    console.log('Redirecionando para landing (usuário não autenticado tentando acessar rota protegida)');
    return NextResponse.redirect(new URL('/landing', req.url));
  }

  // Remover redirecionamento de landing para home
  // if (pathname === '/landing' && hasToken) {
  //   return NextResponse.redirect(new URL('/', req.url));
  // }

  return NextResponse.next();
  */
}

// Configurar as rotas que o middleware deve executar
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|_next/data|favicon.ico|.*\\.svg).*)'],
}; 