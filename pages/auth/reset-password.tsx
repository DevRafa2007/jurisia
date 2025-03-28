import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase';
import AuthLayout from '../../components/AuthLayout';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verificar e processar o token assim que a página carregar
  useEffect(() => {
    if (!router.isReady) return;

    const processRecoveryToken = async () => {
      try {
        // Verificar se temos um token de acesso na URL
        const fullUrl = window.location.href;
        console.log('URL completa:', fullUrl);
        
        // Tentar extrair o token de diferentes lugares
        let accessToken = '';
        
        // Formato 1: No fragmento da URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('access_token')) {
          accessToken = hashParams.get('access_token') || '';
        }
        
        // Formato 2: Na query string
        if (!accessToken && router.query.access_token) {
          accessToken = router.query.access_token as string;
        }
        
        // Formato 3: No próprio caminho da URL
        if (!accessToken) {
          const matches = fullUrl.match(/reset-password[/-]([a-zA-Z0-9_-]+)/);
          if (matches && matches[1]) {
            accessToken = matches[1];
          }
        }

        console.log('Token de acesso encontrado:', accessToken);
        
        if (!accessToken) {
          setError('Link de recuperação inválido ou expirado. Token não encontrado.');
          return;
        }

        if (!supabase) {
          throw new Error('Cliente Supabase não inicializado');
        }

        // Tentar estabelecer uma sessão com o token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError);
          throw sessionError;
        }

        if (!session) {
          // Se não temos uma sessão, tentar criar uma com o token
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: ''
          });

          if (setSessionError) {
            console.error('Erro ao definir sessão:', setSessionError);
            throw setSessionError;
          }
        }

        // Se chegamos aqui, podemos prosseguir com a redefinição
        setMessage('Por favor, defina sua nova senha.');
      } catch (error) {
        console.error('Erro ao processar token:', error);
        setError('Erro ao processar o link de recuperação. Por favor, solicite um novo link.');
      }
    };

    processRecoveryToken();
  }, [router.isReady, router.asPath]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      // Validações básicas
      if (password !== confirmPassword) {
        throw new Error('As senhas não coincidem.');
      }

      if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      }

      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado');
      }

      // Verificar se temos uma sessão válida
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada. Por favor, solicite um novo link de recuperação.');
      }

      // Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        throw updateError;
      }

      // Sucesso
      setSuccess(true);
      setMessage('Senha atualizada com sucesso! Redirecionando para o login...');

      // Fazer logout e redirecionar
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <AuthLayout 
        title="Erro" 
        subtitle={error}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-red-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Voltar para o login
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout 
        title="Sucesso!" 
        subtitle={message}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-green-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Redefinir Senha" 
      subtitle={message || "Digite sua nova senha"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nova Senha
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirmar Nova Senha
          </label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              minLength={6}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Atualizar Senha'
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
} 