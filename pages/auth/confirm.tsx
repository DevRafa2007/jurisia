import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase';
import AuthLayout from '../../components/AuthLayout';

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [message, setMessage] = useState('Verificando seu link...');

  useEffect(() => {
    if (!router.isReady) return;

    const processConfirmation = async () => {
      try {
        // Capturar a URL completa para diagnóstico
        const fullUrl = window.location.href;
        console.log('URL completa da confirmação:', fullUrl);

        // Verificar se há erro na URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('error')) {
          const errorCode = hashParams.get('error_code');
          const errorDescription = hashParams.get('error_description');
          console.error('Erro na URL:', {
            error: hashParams.get('error'),
            errorCode,
            errorDescription
          });
          
          throw new Error(
            errorCode === 'otp_expired' 
              ? 'O link de confirmação expirou. Por favor, solicite um novo link.'
              : errorDescription || 'Link inválido ou expirado.'
          );
        }

        // Tentar extrair o token e o tipo
        let token = '';
        let type = 'signup';

        // 1. Verificar query params
        if (router.query.token) {
          token = router.query.token as string;
          type = (router.query.type as string) || 'signup';
        }

        // 2. Verificar hash fragment
        if (!token && hashParams.get('token')) {
          token = hashParams.get('token') || '';
          type = hashParams.get('type') || 'signup';
        }

        // 3. Se não encontrou o token, verificar parâmetros alternativos
        if (!token) {
          // Formato específico do Supabase
          if (router.query.token_hash) {
            token = router.query.token_hash as string;
            type = 'signup';
          }
        }

        console.log('Token encontrado:', token);
        console.log('Tipo:', type);

        if (!token) {
          throw new Error('Link de confirmação inválido. Token não encontrado.');
        }

        if (!supabase) {
          throw new Error('Cliente Supabase não inicializado');
        }

        // Verificar o token com o Supabase
        const { error } = await supabase.auth.verifyOtp({
          token,
          type: 'signup',
          email: router.query.email as string
        });

        if (error) {
          console.error('Erro ao verificar token:', error);
          throw error;
        }

        // Sucesso na confirmação
        setStatus('success');
        setMessage('Email confirmado com sucesso! Redirecionando para o login...');
        
        // Redirecionar para o login após 2 segundos
        setTimeout(() => {
          router.push('/login');
        }, 2000);

      } catch (error) {
        console.error('Erro na confirmação:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erro ao confirmar o email.');
      }
    };

    processConfirmation();
  }, [router.isReady, router.asPath]);

  if (status === 'error') {
    return (
      <AuthLayout 
        title="Erro na Confirmação" 
        subtitle={message}
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

  if (status === 'success') {
    return (
      <AuthLayout 
        title="Email Confirmado" 
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
      title="Confirmando Email" 
      subtitle={message}
    >
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    </AuthLayout>
  );
} 