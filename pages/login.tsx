import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Auth from '../components/Auth';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página inicial se o usuário já estiver logado
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <AuthLayout title="Carregando...">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Bem-vindo de volta" 
      subtitle="Entre com sua conta para continuar"
    >
      <Auth />
    </AuthLayout>
  );
} 