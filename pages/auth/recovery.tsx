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
        // Verificar se temos um token de recuperação
        const token = router.query.token_hash as string;
        const type = router.query.type as string;

        if (!token || type !== 'recovery') {
          setStatus('error');
          setMessage('Link de recuperação inválido ou expirado.');
          return;
        }

        if (!supabase) {
          throw new Error('Cliente Supabase não inicializado');
        }

        // Verificar o token de recuperação
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });

        if (error) throw error;

        // Redirecionar para a página de redefinição de senha
        router.push('/auth/reset-password');
      } catch (error) {
        console.error('Erro ao processar link de recuperação:', error);
        setStatus('error');
        setMessage('Erro ao processar o link de recuperação. Por favor, solicite um novo link.');
      }
    };

    processRecoveryLink();
  }, [router.isReady, router.query]);

  return (
    <AuthLayout 
      title={status === 'loading' ? 'Processando...' : 'Erro'}
      subtitle={message}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {status === 'loading' ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </AuthLayout>
  );
} 