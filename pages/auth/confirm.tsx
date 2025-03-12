import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

export default function ConfirmEmail() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu email...');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Obter o token da URL
        const token = router.query.token;
        const type = router.query.type;

        if (!token || !type) {
          setStatus('error');
          setMessage('Link de confirmação inválido.');
          return;
        }

        if (type === 'signup') {
          // Confirmar o signup
          const { error } = await supabase.auth.verifyOtp({
            token: token as string,
            type: 'signup'
          });

          if (error) throw error;

          setStatus('success');
          setMessage('Email confirmado com sucesso! Você já pode fazer login.');
        } else if (type === 'recovery') {
          // Confirmar recuperação de senha
          const { error } = await supabase.auth.verifyOtp({
            token: token as string,
            type: 'recovery'
          });

          if (error) throw error;

          setStatus('success');
          setMessage('Email confirmado com sucesso! Você pode redefinir sua senha agora.');
        } else {
          throw new Error('Tipo de confirmação inválido');
        }
      } catch (error) {
        console.error('Erro na confirmação:', error);
        setStatus('error');
        setMessage('Ocorreu um erro ao confirmar seu email. Por favor, tente novamente.');
      }
    };

    if (router.isReady) {
      handleEmailConfirmation();
    }
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Confirmação de Email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            )}
            
            <p className={`mt-4 text-sm ${
              status === 'success' 
                ? 'text-green-600 dark:text-green-400' 
                : status === 'error' 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {message}
            </p>

            {status !== 'loading' && (
              <div className="mt-6">
                <Link 
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-800"
                >
                  Ir para o Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 