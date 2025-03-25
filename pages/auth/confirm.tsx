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

        // Extrair tipo e outros parâmetros
        // O parâmetro type pode vir como parte do hash no formato "confirm-[hash].js1"
        let type = router.query.type as string || '';
        const fullUrl = window.location.href;
        
        // Verificar se estamos em um fluxo de recuperação de senha
        // O Supabase pode enviar parâmetros de diferentes formas
        const isPasswordRecovery = 
          type === 'recovery' || 
          router.query.recovery === 'true' || 
          fullUrl.includes('recovery') ||
          fullUrl.includes('reset-password');

        // Extrair o token/hash de várias possíveis fontes
        const fragmentIdentifier = window.location.hash;
        let token = router.query.token_hash as string || 
                   router.query.token as string || 
                   '';
        
        // Se o token não está nos parâmetros, pode estar no próprio URL ou fragmento
        if (!token && fragmentIdentifier) {
          // Tentar extrair do fragmento (ex: #confirm-a466df9487ced0cb.jsi1)
          const fragments = fragmentIdentifier.substring(1).split('-');
          if (fragments.length > 1) {
            token = fragments[1];
            // Se não temos um tipo definido, usar o primeiro fragmento
            if (!type) {
              type = fragments[0];
            }
          }
        }
        
        // Também verificar no pathname (parte do URL após o domínio)
        const pathSegments = window.location.pathname.split('/');
        for (const segment of pathSegments) {
          if (segment.includes('confirm-') || segment.includes('recovery-')) {
            const parts = segment.split('-');
            if (parts.length > 1) {
              if (!token) token = parts[1];
              if (!type) type = parts[0];
            }
          }
        }

        console.log('Token detectado:', token);
        console.log('Type detectado:', type);
        
        // Se for recuperação de senha, ir direto para a página de redefinição
        if (isPasswordRecovery) {
          // Preparar todos os parâmetros possíveis para garantir que reset-password receba o necessário
          const params = {
            token: token,
            token_hash: token,
            access_token: token,
            type: 'recovery',
            recovery: 'true'
          };
          
          setStatus('success');
          setMessage('Link de recuperação detectado! Redirecionando para redefinição de senha...');
          
          setTimeout(() => {
            router.push({
              pathname: '/auth/reset-password',
              query: params
            });
          }, 1000);
          return;
        }

        // Continuamos com o fluxo normal de confirmação para outros tipos
        // Se não conseguimos detectar o token de forma alguma, mostrar erro
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
          const email = router.query.email as string || '';
          
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
            email: email
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