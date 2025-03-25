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
        // Imprimir todos os parâmetros da URL para diagnóstico
        console.log('Todos os parâmetros da URL:', router.query);

        // Verificar se estamos em um fluxo de recuperação de senha
        const isPasswordRecovery = 
          router.query.type === 'recovery' || 
          router.query.recovery === 'true' || 
          window.location.href.includes('recovery');

        // Se for recuperação de senha, ir direto para a página de redefinição
        if (isPasswordRecovery) {
          // Direcionar para a página de redefinição de senha sem verificar o token
          // pois a verificação do token pode estar causando login automático
          setStatus('success');
          setMessage('Link de recuperação detectado! Redirecionando para redefinição de senha...');
          
          setTimeout(() => {
            router.push({
              pathname: '/auth/reset-password',
              query: router.query
            });
          }, 1000);
          return;
        }

        // Continuamos com o fluxo normal de confirmação para outros tipos
        // Analisar como o Supabase está enviando os parâmetros
        const token = router.query.token_hash || router.query.token || '';
        const type = router.query.type || '';
        const email = router.query.email || '';
        
        console.log('Token:', token);
        console.log('Type:', type);
        console.log('Email:', email);
        
        // Verificar também se existem outros parâmetros que podem conter o token
        const allParams = Object.keys(router.query).join(', ');
        console.log('Todos os nomes de parâmetros:', allParams);

        if (!token) {
          setStatus('error');
          setMessage('Link inválido ou expirado. Token não encontrado.');
          return;
        }

        if (!supabase) {
          throw new Error('Cliente Supabase não inicializado');
        }

        // Para sign up, usar a API de confirmação
        if (type === 'signup' || router.query.confirmation === 'true') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token as string,
            type: 'signup',
            email: email as string
          });

          if (error) throw error;

          setStatus('success');
          setMessage('Email confirmado com sucesso! Redirecionando para o login...');
          
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Tipo de confirmação não identificado. Por favor, verifique seu email e tente novamente.');
        }
      } catch (error) {
        console.error('Erro na confirmação:', error);
        setStatus('error');
        setMessage('Erro ao processar o link. Por favor, tente novamente ou solicite um novo link.');
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