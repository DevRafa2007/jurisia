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
      router.push('/');
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