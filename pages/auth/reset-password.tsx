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
  const [isTokenValid, setIsTokenValid] = useState(false);

  // Evitar que o usuário seja redirecionado se já estiver logado
  useEffect(() => {
    // Verificar se o usuário foi automaticamente logado com o token
    // e fazer logout para garantir que ele vá para a página de redefinição
    const checkAndLogout = async () => {
      if (!supabase) return;
      
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('Sessão detectada, fazendo logout para permitir redefinição de senha');
        await supabase.auth.signOut();
      }
    };
    
    checkAndLogout();
  }, []);

  useEffect(() => {
    // Só verificar o token quando o router estiver pronto
    if (!router.isReady) return;

    const checkToken = async () => {
      try {
        // Imprimir todos os parâmetros da URL para diagnóstico
        console.log('Todos os parâmetros da URL na página de redefinição:', router.query);
        
        // Verificar vários formatos possíveis do token
        const token = 
          router.query.token_hash || 
          router.query.token || 
          router.query.access_token || 
          '';
          
        console.log('Token encontrado:', token);
        
        // Verificar outros parâmetros que possam ser úteis
        const allParams = Object.keys(router.query).join(', ');
        console.log('Todos os nomes de parâmetros:', allParams);

        if (!token) {
          setError('Link inválido ou expirado. Token não encontrado.');
          return;
        }

        if (!supabase) {
          throw new Error('Cliente Supabase não inicializado');
        }

        // Não verificamos o token explicitamente para evitar login automático
        // Apenas permitimos que o usuário redefina a senha
        setIsTokenValid(true);
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        setError('Link inválido ou expirado.');
      }
    };

    checkToken();
  }, [router.isReady, router.query]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado');
      }

      // Buscar todos os possíveis formatos de token
      const token = 
        router.query.token_hash || 
        router.query.token || 
        router.query.access_token || 
        '';

      if (!token) {
        throw new Error('Token não encontrado na URL');
      }

      // Usar a API específica para redefinição de senha
      // Isso evita o login automático
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setMessage('Senha atualizada com sucesso! Redirecionando para o login...');

      // Fazer logout para garantir que o usuário tenha que fazer login novamente
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      setError('Erro ao atualizar senha. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !success) {
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

  if (!isTokenValid && !error) {
    return (
      <AuthLayout 
        title="Verificando..." 
        subtitle="Estamos verificando seu link de recuperação."
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Redefinir Senha" 
      subtitle="Digite sua nova senha"
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

        {message && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </div>
        )}

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