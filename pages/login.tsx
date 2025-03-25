import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Auth from '../components/Auth';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { user, isLoading, authChecked } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Login page auth check:', { isLoading, authChecked, hasUser: !!user });
    // Redirecionar para a página inicial se o usuário já estiver logado
    if (authChecked && !isLoading && user) {
      console.log('Redirecionando para homepage...');
      
      // Verificar se já estamos em um processo de redirecionamento para evitar ciclos
      const redirectsInProgress = sessionStorage.getItem('redirects_in_progress');
      const redirectCount = redirectsInProgress ? parseInt(redirectsInProgress, 10) : 0;
      
      if (redirectCount < 3) {
        // Incrementar o contador de redirecionamentos
        sessionStorage.setItem('redirects_in_progress', (redirectCount + 1).toString());
        router.push('/');
      } else {
        console.log('Limite de redirecionamentos atingido, permanecendo na página atual');
        // Resetar contador após alguns segundos
        setTimeout(() => {
          sessionStorage.setItem('redirects_in_progress', '0');
        }, 5000);
      }
    } else if (!user) {
      // Resetar contador quando o usuário não estiver autenticado
      sessionStorage.setItem('redirects_in_progress', '0');
    }
  }, [user, isLoading, authChecked, router]);

  return (
    <Layout
      title="Login | JurisIA - Assistente Jurídico com IA"
      description="Acesse sua conta no JurisIA, assistente jurídico inteligente para advogados brasileiros"
    >
      <div className="container-custom py-10">
        <div className="max-w-md mx-auto">
          <Auth />
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage; 