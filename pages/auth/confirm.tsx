import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase';
import AuthLayout from '../../components/AuthLayout';

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu email...');

  useEffect(() => {
    // Aguardar o router estar pronto
    if (!router.isReady) return;
    
    const handleEmailConfirmation = async () => {
      try {
        // Obter parâmetros da URL usando o router
        const token = router.query.token as string;
        const type = router.query.type as string;
        console.log('Token:', token, 'Type:', type);

        if (!token || !type) {
          setStatus('error');
          setMessage('Link inválido ou expirado.');
          return;
        }

        if (!supabase) {
          throw new Error('Cliente Supabase não inicializado');
        }

        if (type === 'signup') {
          // Para sign up, usar a API de confirmação
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          if (error) throw error;

          setStatus('success');
          setMessage('Email confirmado com sucesso! Redirecionando para o login...');
          
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else if (type === 'recovery') {
          // Para recovery, apenas redirecionar para a página de redefinição de senha
          setStatus('success');
          setMessage('Link de recuperação válido! Redirecionando para redefinição de senha...');
          
          setTimeout(() => {
            router.push({
              pathname: '/auth/reset-password',
              query: { token }
            });
          }, 2000);
        }
      } catch (error) {
        console.error('Erro na confirmação:', error);
        setStatus('error');
        setMessage('Erro ao confirmar email. Por favor, tente novamente.');
      }
    };

    handleEmailConfirmation();
  }, [router.isReady, router.query, router]);

  return (
    <AuthLayout 
      title={status === 'loading' ? 'Verificando...' : 
             status === 'success' ? 'Sucesso!' : 'Erro'}
      subtitle={message}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        )}
        
        {status === 'success' && (
          <div className="text-green-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-red-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 