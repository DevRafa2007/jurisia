import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase';
import AuthLayout from '../../components/AuthLayout';

export default function RecoveryPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('Processando link de recuperação...');

  useEffect(() => {
    if (!router.isReady) return;

    const processRecoveryLink = async () => {
      try {
        // Capturar a URL completa e todos os parâmetros possíveis
        const fullUrl = window.location.href;
        console.log('URL completa:', fullUrl);

        // Tentar extrair o token de diferentes lugares
        let token = '';
        let type = '';

        // 1. Verificar fragmento da URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('token')) {
          token = hashParams.get('token') || '';
          type = hashParams.get('type') || '';
        }

        // 2. Verificar query string
        if (!token) {
          token = router.query.token as string || '';
          type = router.query.type as string || '';
        }

        // 3. Verificar no caminho da URL
        if (!token) {
          const matches = fullUrl.match(/recovery[/-]([a-zA-Z0-9_-]+)/);
          if (matches && matches[1]) {
            token = matches[1];
            type = 'recovery';
          }
        }

        console.log('Token encontrado:', token);
        console.log('Tipo:', type);

        if (!token) {
          throw new Error('Link de recuperação inválido ou expirado. Token não encontrado.');
        }

        if (!supabase) {
          throw new Error('Cliente Supabase não inicializado');
        }

        // Verificar o token com o Supabase
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token,
          type: 'recovery'
        });

        if (verifyError) {
          console.error('Erro ao verificar token:', verifyError);
          throw verifyError;
        }

        // Se chegamos aqui, o token é válido
        // Redirecionar para a página de redefinição de senha com o token
        router.push(`/auth/reset-password#access_token=${token}`);

      } catch (error) {
        console.error('Erro ao processar link:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erro ao processar o link de recuperação.');
      }
    };

    processRecoveryLink();
  }, [router.isReady, router.asPath]);

  if (status === 'error') {
    return (
      <AuthLayout 
        title="Erro" 
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

  return (
    <AuthLayout 
      title="Processando" 
      subtitle={message}
    >
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    </AuthLayout>
  );
} 